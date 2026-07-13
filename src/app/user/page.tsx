'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BookCard } from '@/components/features/BookCard';
import { BookPopupModal } from '@/components/features/BookPopupModal';
import { useReadingList } from '@/hooks/useReadingList';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setYearRange } from '@/features/filters/filtersSlice';
import { selectFilterQuery } from '@/features/filters/selectors';
import { FULL_YEAR_MAX, FULL_YEAR_MIN } from '@/features/filters/types';
import { setCatalogLoading } from '@/features/ui/uiSlice';
import { selectBooksPerPage, selectDefaultEra } from '@/features/settings/selectors';
import apiClient from '@/lib/apiClient';
import './user.css';

// Dynamically import the heavy SVG map so it splits into its own JS chunk
const HistoricalMap = dynamic(
  () => import('@/components/features/HistoricalMap'),
  { ssr: false, loading: () => <div className="map-wrapper" style={{ backgroundColor: '#F5EEE4' }} /> },
);

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  language: string;
  type: string;
  rating: number;
  country: string;
  historicalYear: number;
  publicationYear: number;
  reviewText?: string;
  tags?: string[];
  imageUrl?: string;
}

const ERAS = ['All', 'Ancient', '1900-1920', '1940', '1980', '2000', '2026'];
const CATEGORIES = [
  'All',
  'Social History',
  'Economic History',
  'Military History',
  'Political History',
  'General History',
  'Historical Novels',
];

// Each era maps to the year range shown/used in the API filter
const ERA_YEAR_RANGES: Record<string, [number, number]> = {
  All:         [-1250, 2026],
  Ancient:     [-1250, 1899],
  '1900-1920': [1900, 1920],
  '1940':      [1921, 1960],
  '1980':      [1961, 1990],
  '2000':      [1991, 2010],
  '2026':      [2011, 2026],
};

function HomeContent() {
  const dispatch = useAppDispatch();
  const defaultEra = useAppSelector(selectDefaultEra);
  const booksPerPage = useAppSelector(selectBooksPerPage);
  // Sidebar filters, pre-serialized as a memoized query-string fragment —
  // effects below depend on this single string, so unrelated store changes
  // (e.g. the mobile drawer opening) can never trigger a refetch.
  const filterQuery = useAppSelector(selectFilterQuery);
  const { isInList, toggleBook } = useReadingList();

  // Default to 'All' so all countries with books are highlighted immediately.
  // Override once with settings.defaultEra when admin has configured one.
  const [activeEra, setActiveEra] = useState<string | null>('All');
  const [eraInitialised, setEraInitialised] = useState(false);
  useEffect(() => {
    if (!eraInitialised && defaultEra) {
      setActiveEra(defaultEra);
      dispatch(setYearRange(ERA_YEAR_RANGES[defaultEra] ?? [FULL_YEAR_MIN, FULL_YEAR_MAX]));
      setEraInitialised(true);
    }
  }, [defaultEra, eraInitialised, dispatch]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [popupBook, setPopupBook] = useState<Book | null>(null);
  const [page, setPage] = useState(1);
  const [highlightedCountries, setHighlightedCountries] = useState<string[]>([]);
  const [bookCountByCountry, setBookCountByCountry] = useState<Record<string, number>>({});

  const observer = useRef<IntersectionObserver | null>(null);
  // Always-current books list for stable click handler (no re-creates on book changes)
  const booksRef = useRef<Book[]>([]);
  booksRef.current = books;

  const getQueryParams = useCallback((currentPage: number, extra?: Record<string, string>) => {
    // Sidebar filters (lang/type/year/rating/tags) come pre-serialized from
    // the memoized selectFilterQuery selector.
    const params = new URLSearchParams(filterQuery);
    params.set('status', 'published');

    params.set('limit', booksPerPage.toString());
    params.set('skip', ((currentPage - 1) * booksPerPage).toString());

    if (activeEra) params.set('era', activeEra);
    if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
    if (selectedCountry) params.set('country', selectedCountry);

    if (extra) {
      Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    }

    return params.toString();
  }, [activeEra, activeCategory, selectedCountry, filterQuery, booksPerPage]);

  // Initial load — AbortController cancels in-flight request when deps change
  useEffect(() => {
    if (activeEra === null) {
      setBooks([]);
      setTotal(0);
      setHighlightedCountries([]);
      setBookCountByCountry({});
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchInitialBooks = async () => {
      try {
        setLoading(true);
        dispatch(setCatalogLoading(true));
        const queryStr = getQueryParams(1);
        const response = await apiClient.get<{
          data: Book[];
          total: number;
          highlightedCountries: string[];
          bookCountByCountry: Record<string, number>;
        }>(`/api/books?${queryStr}`, { signal: controller.signal });

        setBooks(response.data.data);
        setTotal(response.data.total);
        setHighlightedCountries(response.data.highlightedCountries || []);
        setBookCountByCountry(response.data.bookCountByCountry || {});
        setPage(1);
      } catch (err: any) {
        if (err?.code !== 'ERR_CANCELED' && err?.name !== 'CanceledError') {
          console.error('Failed to fetch books', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          dispatch(setCatalogLoading(false));
        }
      }
    };

    fetchInitialBooks();
    return () => controller.abort();
  }, [activeEra, getQueryParams, dispatch]);

  const fetchNextPage = useCallback(async (nextPage: number) => {
    try {
      setLoadingNext(true);
      dispatch(setCatalogLoading(true));
      // skip_map skips the country aggregate; skip_count skips countDocuments
      const queryStr = getQueryParams(nextPage, { skip_map: '1', skip_count: '1' });
      const response = await apiClient.get<{ data: Book[] }>(`/api/books?${queryStr}`);
      setBooks((prev) => [...prev, ...response.data.data]);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load next page', err);
    } finally {
      setLoadingNext(false);
      dispatch(setCatalogLoading(false));
    }
  }, [getQueryParams, dispatch]);

  // Mutable ref so the stable IntersectionObserver callback always reads latest state
  const scrollStateRef = useRef({
    total,
    page,
    booksPerPage,
    loadingNext,
    fetchNextPage,
  });
  scrollStateRef.current = { total, page, booksPerPage, loadingNext, fetchNextPage };

  // Stable callback ref — never changes reference, so observer never disconnects/reconnects
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
    if (!node) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        const { total: t, page: p, booksPerPage: bpp, loadingNext: ln, fetchNextPage: fnp } =
          scrollStateRef.current;
        if (ln) return;
        const maxPages = Math.ceil(t / bpp);
        if (p + 1 <= maxPages) fnp(p + 1);
      },
      { threshold: 0.1, rootMargin: '100px' },
    );
    observer.current.observe(node);
  }, []); // empty deps — reads from scrollStateRef

  // Stable book card click — looks up the book from the always-current ref
  const handleBookCardClick = useCallback((id: string) => {
    const book = booksRef.current.find((b) => b._id === id);
    if (book) setPopupBook(book);
  }, []);

  const handleClosePopup = useCallback(() => setPopupBook(null), []);

  const handleAddToReadingList = useCallback((book: Book) => {
    toggleBook(book._id);
  }, [toggleBook]);

  // Stable country click — toggling the same code deselects
  const handleCountryClick = useCallback((code: string) => {
    setSelectedCountry((prev) => (prev === code ? null : code));
  }, []);

  // Stable era click — resets country + syncs the sidebar year-range slider
  const handleEraClick = useCallback((era: string) => {
    setActiveEra(era);
    setSelectedCountry(null);
    dispatch(setYearRange(ERA_YEAR_RANGES[era] ?? [FULL_YEAR_MIN, FULL_YEAR_MAX]));
  }, [dispatch]);

  // Only recalculate when the country selection or book list changes
  const booksInSelection = useMemo(
    () => (selectedCountry ? books.filter((b) => b.country === selectedCountry) : []),
    [selectedCountry, books],
  );

  return (
    <div className="user-page">
      {/* Header */}
      <div className="user-page-header">
        <div className="user-page-heading-group">
          <p className="user-page-eyebrow">Atlas Interaction</p>
          <h1 className="user-page-title">
            Countries {activeEra && <><span className="user-page-title-sep">•</span> {activeEra}</>}
          </h1>
          <p className="user-page-subtitle">
            Explore literature through time and geography. Select an era or click a country on the map.
          </p>
        </div>

        <div className="era-switcher">
          {ERAS.map((era) => (
            <button
              key={era}
              onClick={() => handleEraClick(era)}
              className={`era-btn${activeEra === era ? ' era-btn--active' : ''}`}
            >
              {era}
            </button>
          ))}
        </div>
      </div>

      {/* Map — all props are stable references; memo prevents re-renders during loading */}
      <HistoricalMap
        highlightedCountries={highlightedCountries}
        selectedCountryName={selectedCountry}
        activeEra={activeEra}
        booksInSelection={booksInSelection}
        bookCountByCountry={bookCountByCountry}
        onCountryClick={handleCountryClick}
      />

      {/* Categories + Books */}
      {activeEra === null ? (
        <div className="section-idle-state">
          <div className="section-idle-icon">
            <img src="/icon-svgs/books.svg" alt="" width="48" height="48" />
          </div>
          <p className="section-idle-title">Select an era to get started</p>
          <p className="section-idle-sub">Choose a time period above — the map and book collection will come to life.</p>
        </div>
      ) : (
        <div className="category-section">
          <div className="category-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cat-btn${activeCategory === cat ? ' cat-btn--active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="books-grid-wrap">
            {loading ? (
              <div className="skeleton-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="book-skeleton" />
                ))}
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="books-grid">
                  {books.map((book) => (
                    <BookCard
                      key={book._id}
                      _id={book._id}
                      title={book.title}
                      author={book.author}
                      category={book.category}
                      language={book.language}
                      rating={book.rating}
                      imageUrl={book.imageUrl}
                      onClickId={handleBookCardClick}
                    />
                  ))}
                </div>
                {books.length < total && (
                  <div ref={observerTarget} className="load-more-trigger">
                    <div className="spinner" />
                    <span>Loading more books...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="books-empty">
                <p>No books found for this selection.</p>
                <button
                  className="books-empty-clear"
                  onClick={() => { setSelectedCountry(null); setActiveCategory('All'); }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book Popup Modal */}
      <BookPopupModal
        book={popupBook}
        onClose={handleClosePopup}
        onAddToReadingList={handleAddToReadingList}
        isInReadingList={popupBook ? isInList(popupBook._id) : false}
      />
    </div>
  );
}

export default function UserHomePage() {
  return (
    <Suspense fallback={<div className="user-page">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
