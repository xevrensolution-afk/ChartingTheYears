import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BookSchema } from '@/lib/schemas';
import Book from '@/models/Book';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import { isBase64DataUrl, saveDataUrlImage } from '@/lib/imageStorage';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    // Clamp limit and skip to safe values so malformed/large numbers never
    // cause a slow full-collection scan or a MongoDB skip-negative error.
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const rawSkip  = parseInt(searchParams.get('skip')  || '0');
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 20;
    const skip  = Number.isFinite(rawSkip)  ? Math.max(rawSkip, 0)                 : 0;
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    // User-side filters
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const era = searchParams.get('era');
    const lang = searchParams.get('lang');
    const type = searchParams.get('type');
    const yearMin = searchParams.get('yearMin');
    const yearMax = searchParams.get('yearMax');
    const rating = searchParams.get('rating');
    const tags = searchParams.get('tags');

    // Batch-by-IDs short-circuit (used by the reading list page + sidebar)
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      const books = await Book.find({ _id: { $in: ids } })
        .select('_id title author category language rating imageUrl publicationYear reviewText')
        .lean();
      return NextResponse.json({ success: true, data: books });
    }

    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (q) {
      // Escape special regex chars so arbitrary search strings can't break the
      // MongoDB regex engine (e.g. "*foo" or "(unclosed" would throw otherwise).
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safeQ, $options: 'i' } },
        { author: { $regex: safeQ, $options: 'i' } },
        { category: { $regex: safeQ, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (country) {
      filter.country = country;
    }
    if (era) {
      if (era === 'Ancient') {
        filter.publicationYear = { $lt: 1900 };
      } else if (era === '1900-1920') {
        filter.publicationYear = { $gte: 1900, $lte: 1920 };
      } else if (era === '1940') {
        filter.publicationYear = { $gt: 1920, $lte: 1960 };
      } else if (era === '1980') {
        filter.publicationYear = { $gt: 1960, $lte: 1990 };
      } else if (era === '2000') {
        filter.publicationYear = { $gt: 1990, $lte: 2010 };
      } else if (era === '2026') {
        filter.publicationYear = { $gt: 2010 };
      }
    }
    if (lang) {
      filter.language = { $in: lang.split(',') };
    }
    if (type) {
      filter.type = { $in: type.split(',') };
    }
    if (yearMin || yearMax) {
      const yearFilter: any = {};
      if (yearMin) yearFilter.$gte = parseInt(yearMin);
      if (yearMax) yearFilter.$lte = parseInt(yearMax);

      if (filter.publicationYear) {
        filter.publicationYear = { ...filter.publicationYear, ...yearFilter };
      } else {
        filter.publicationYear = yearFilter;
      }
    }
    if (rating) {
      filter.rating = { $gte: parseInt(rating) };
    }
    if (tags) {
      filter.tags = { $regex: tags, $options: 'i' };
    }

    // Pagination-only requests skip the two expensive aggregates
    const skipMap = searchParams.get('skip_map') === '1';
    const skipCount = searchParams.get('skip_count') === '1';

    const [books, total, mapStats] = await Promise.all([
      Book.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      skipCount ? Promise.resolve(0) : Book.countDocuments(filter),
      skipMap
        ? Promise.resolve([])
        : Book.aggregate([
            { $match: filter },
            { $group: { _id: '$country', count: { $sum: 1 } } },
          ]),
    ]);

    const bookCountByCountry = mapStats.reduce((acc: any, curr: any) => {
      if (curr._id) {
        acc[curr._id] = curr.count;
      }
      return acc;
    }, {});
    const highlightedCountries = mapStats.map((m: any) => m._id).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: books,
      total,
      limit,
      skip,
      highlightedCountries,
      bookCountByCountry,
    });
  } catch (error) {
    console.error('[v0] GET /api/books error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validated = BookSchema.parse(body);

    // Base64 images are no longer stored in the DB — persist them as files
    if (isBase64DataUrl(validated.imageUrl)) {
      validated.imageUrl = (await saveDataUrlImage(validated.imageUrl!)) || '';
    }

    await connectDB();

    // Create new book
    const newBook = new Book(validated);
    const savedBook = await newBook.save();

    // Update tags counts
    if (validated.tags.length > 0) {
      for (const tag of validated.tags) {
        await Tag.updateOne(
          { name: tag },
          {
            $setOnInsert: { name: tag },
            $inc: { bookCount: 1 },
          },
          { upsert: true }
        );
      }
    }

    // Update category count
    await Category.updateOne(
      { name: validated.category },
      {
        $setOnInsert: { name: validated.category },
        $inc: { bookCount: 1 },
      },
      { upsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: savedBook,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] POST /api/books error:', error);
    if (error.errors) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create book', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
