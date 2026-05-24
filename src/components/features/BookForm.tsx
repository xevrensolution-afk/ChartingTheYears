'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Book, BookSchema } from '@/lib/schemas';
import { COUNTRIES } from '@/lib/countries';
import { KitInput, KitLabel, KitTextarea } from '@/components/ui/kit/Input';
import { KitSelect } from '@/components/ui/kit/Select';
import { KitButton } from '@/components/ui/kit/Button';
import { Card } from '@/components/ui/kit/Card';
import { ImageUploader } from '@/components/features/ImageUploader';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { getApiErrorMessage, showApiToast } from '@/components/ui/kit/Toast';
import { RichTextEditor } from '@/components/features/RichTextEditor';

interface BookFormProps {
  initialData?: Book;
  onSubmit?: (data: Book) => void;
}

const CATEGORIES = [
  'General History', 'Political History', 'Economic History', 'Social History',
  'Military History', 'Historical Novels', 'History of Art'
];

const LANGUAGES = ['English', 'French', 'German', 'Spanish', 'Italian', 'Russian'];

const TYPES = ['Fiction', 'Non-fiction'];

interface ApiTag {
  _id: string;
  name: string;
}

function getDefaultFormValues(initialData?: Book): Book {
  if (initialData) {
    return {
      _id: initialData._id,
      title: initialData.title,
      author: initialData.author,
      historicalYear: initialData.historicalYear,
      publicationYear: initialData.publicationYear,
      country: initialData.country,
      category: initialData.category,
      language: initialData.language,
      rating: initialData.rating,
      type: initialData.type,
      status: initialData.status,
      tags: initialData.tags || [],
      reviewText: initialData.reviewText || '',
    };
  }

  return {
    title: '',
    author: '',
    historicalYear: 1900,
    publicationYear: 1900,
    country: 'US',
    category: 'General History',
    language: 'English',
    rating: 3,
    type: 'Non-fiction',
    status: 'draft',
    tags: [],
    reviewText: '',
  };
}

export function BookForm({ initialData }: BookFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags || []
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Book>({
    resolver: zodResolver(BookSchema),
    defaultValues: getDefaultFormValues(initialData),
  });

  const reviewTextValue = watch('reviewText') || '';

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    setSelectedTags(initialData?.tags || []);
  }, [initialData]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const response = await apiClient.get<{ data: ApiTag[] }>('/api/tags');
        setAvailableTags(response.data.data.map((tag) => tag.name));
      } catch (error) {
        console.error('[v0] Fetch tags error:', error);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const submitForm = async (data: Book, overrideStatus?: 'published' | 'draft') => {
    try {
      setIsSubmitting(true);
      const bookData = {
        title: data.title,
        author: data.author,
        historicalYear: data.historicalYear,
        publicationYear: data.publicationYear,
        country: data.country,
        category: data.category,
        language: data.language,
        rating: data.rating,
        type: data.type,
        tags: selectedTags,
        status: overrideStatus || data.status,
        reviewText: data.reviewText || '',
        imageUrl: imageUrl || '',
      };

      const method = initialData ? 'PATCH' : 'POST';
      const url = initialData
        ? `/api/books/${initialData._id}`
        : '/api/books';

      if (method === 'PATCH') {
        await apiClient.patch(url, bookData);
        showApiToast({
          variant: 'success',
          title: 'Book updated',
          message: `"${bookData.title}" was saved successfully.`,
        });
      } else {
        await apiClient.post(url, bookData);
        showApiToast({
          variant: 'success',
          title: 'Book added',
          message: `"${bookData.title}" was created successfully.`,
        });
      }

      router.push('/admin/books');
      router.refresh();
    } catch (error) {
      console.error('[v0] Book form submission error:', error);
      const message = getApiErrorMessage(error, 'Failed to save book');
      showApiToast({
        variant: 'error',
        title: 'Unable to save book',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit((d) => submitForm(d))} className="space-y-6">
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">{initialData ? 'Edit book' : 'New book'}</h2>
        </div>
        <div className="space-y-6">
          {/* Book Cover Image */}
          <div>
            <KitLabel>Book Cover Image</KitLabel>
            <div style={{ marginTop: '8px' }}>
              <ImageUploader value={imageUrl} onChange={setImageUrl} />
            </div>
          </div>
          {/* Title and Author */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <KitLabel>Title</KitLabel>
              <KitInput
                placeholder="Book title"
                {...register('title')}
              />
              {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
            </div>
            <div>
              <KitLabel>Author</KitLabel>
              <KitInput
                placeholder="Author name"
                {...register('author')}
              />
              {errors.author && <p className="mt-1 text-xs text-danger">{errors.author.message}</p>}
            </div>
          </div>

          {/* Years */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <KitLabel>Historical Year</KitLabel>
              <KitInput
                type="number"
                placeholder="1900"
                {...register('historicalYear', { valueAsNumber: true })}
              />
              {errors.historicalYear && <p className="mt-1 text-xs text-danger">{errors.historicalYear.message}</p>}
            </div>
            <div>
              <KitLabel>Publication Year</KitLabel>
              <KitInput
                type="number"
                placeholder="1920"
                {...register('publicationYear', { valueAsNumber: true })}
              />
              {errors.publicationYear && <p className="mt-1 text-xs text-danger">{errors.publicationYear.message}</p>}
            </div>
          </div>

          {/* Country and Category */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <KitLabel>Country</KitLabel>
              <KitSelect
                options={COUNTRIES}
                {...register('country')}
              />
              {errors.country && <p className="mt-1 text-xs text-danger">{errors.country.message}</p>}
            </div>
            <div>
              <KitLabel>Category</KitLabel>
              <KitSelect
                options={CATEGORIES.map((c) => ({ label: c, value: c }))}
                {...register('category')}
              />
              {errors.category && <p className="mt-1 text-xs text-danger">{errors.category.message}</p>}
            </div>
          </div>

          {/* Language and Rating */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <KitLabel>Language</KitLabel>
              <KitSelect
                options={LANGUAGES.map((l) => ({ label: l, value: l }))}
                {...register('language')}
              />
              {errors.language && <p className="mt-1 text-xs text-danger">{errors.language.message}</p>}
            </div>
            <div>
              <KitLabel>Rating</KitLabel>
              <KitSelect
                options={[1, 2, 3, 4, 5].map((r) => ({ label: `${r} ${'★'.repeat(r)}`, value: String(r) }))}
                {...register('rating', { valueAsNumber: true })}
              />
              {errors.rating && <p className="mt-1 text-xs text-danger">{errors.rating.message}</p>}
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <KitLabel>Type</KitLabel>
              <KitSelect
                options={TYPES.map((t) => ({ label: t, value: t }))}
                {...register('type')}
              />
              {errors.type && <p className="mt-1 text-xs text-danger">{errors.type.message}</p>}
            </div>
            <div>
              <KitLabel>Status</KitLabel>
              <KitSelect
                options={[
                  { label: 'Publish', value: 'published' },
                  { label: 'Draft', value: 'draft' },
                ]}
                {...register('status')}
              />
              {errors.status && <p className="mt-1 text-xs text-danger">{errors.status.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <KitLabel>Tags</KitLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {!tagsLoading && availableTags.length === 0 && (
                <p className="text-xs text-ink-mute">No tags available.</p>
              )}
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-coffee text-canvas'
                        : 'bg-coffee/20 text-ink hover:bg-coffee/30'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <KitLabel>Review Text</KitLabel>
            <RichTextEditor
              value={reviewTextValue}
              onChange={(val) => setValue('reviewText', val)}
              placeholder="Write your review here..."
            />
            {errors.reviewText && <p className="mt-1 text-xs text-danger">{errors.reviewText.message}</p>}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <KitButton
          type="button"
          variant="primary"
          onClick={() => handleSubmit((d) => submitForm(d, 'published'))()}
          disabled={isSubmitting}
        >
          {initialData ? 'Update book' : 'Publish book'}
        </KitButton>
        <KitButton
          type="button"
          variant="muted"
          onClick={() => handleSubmit((d) => submitForm(d, 'draft'))()}
          disabled={isSubmitting}
        >
          Save as draft
        </KitButton>
        <KitButton
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </KitButton>
      </div>
    </form>
  );
}
