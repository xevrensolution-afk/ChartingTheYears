import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Book from '@/models/Book';
import Category from '@/models/Category';
import Tag from '@/models/Tag';

// Helper to preserve rich HTML tags but strip WordPress block comments & decode entities
function cleanHtml(html: string): string {
  if (!html) return '';
  // Strip WordPress Gutenberg block comments
  let text = html.replace(/<!-- [\s\S]*? -->/g, '');
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '--');
  return text.trim();
}

// Helper to fetch external image URL and convert to Base64 data URL
async function fetchImageAsBase64(url: string): Promise<string> {
  if (!url) return '';
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    if (!response.ok) return '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`[Importer] Failed to fetch image ${url}:`, error);
    return '';
  }
}

// Helper to guess category based on book title and tags keywords
function guessCategory(title: string, tags: string[]): string {
  const text = `${title} ${tags.join(' ')}`.toLowerCase();
  
  if (
    text.includes('military') || 
    text.includes('war') || 
    text.includes('army') || 
    text.includes('navy') || 
    text.includes('maritime') || 
    text.includes('battle') || 
    text.includes('soldier') || 
    text.includes('fleet') || 
    text.includes('procurement') || 
    text.includes('tactics') || 
    text.includes('defence') || 
    text.includes('defense') || 
    text.includes('guerre') ||
    text.includes('marne')
  ) {
    return 'Military History';
  }
  
  if (
    text.includes('economic') || 
    text.includes('trade') || 
    text.includes('sugar') || 
    text.includes('industry') || 
    text.includes('industrial') || 
    text.includes('finance') || 
    text.includes('commercial') || 
    text.includes('labor') || 
    text.includes('labour') ||
    text.includes('négriers')
  ) {
    return 'Economic History';
  }
  
  if (
    text.includes('political') || 
    text.includes('crown') || 
    text.includes('state') || 
    text.includes('policy') || 
    text.includes('regime') || 
    text.includes('monarchy') || 
    text.includes('politique') ||
    text.includes('republic') ||
    text.includes('vichy')
  ) {
    return 'Political History';
  }
  
  if (
    text.includes('social') || 
    text.includes('diaspora') || 
    text.includes('society') || 
    text.includes('housing') || 
    text.includes('prostitution') || 
    text.includes('prostitutes') || 
    text.includes('peasant') || 
    text.includes('nationalism') || 
    text.includes('identity') || 
    text.includes('identities') ||
    text.includes('migrants')
  ) {
    return 'Social History';
  }
  
  if (
    text.includes('art') || 
    text.includes('music') || 
    text.includes('science') || 
    text.includes('translation') || 
    text.includes('multilingual')
  ) {
    return 'History of Art';
  }
  
  if (
    text.includes('novel') || 
    text.includes('novels') || 
    text.includes('fiction')
  ) {
    return 'Historical Novels';
  }
  
  return 'General History';
}

// Simple lookup to match countries mentioned in title/tags
function guessCountry(title: string, tags: string[]): string {
  const text = `${title} ${tags.join(' ')}`.toLowerCase();
  if (text.includes('japan') || text.includes('japanese') || text.includes('tokugawa') || text.includes('meiji')) return 'JP';
  if (text.includes('france') || text.includes('french') || text.includes('paris') || text.includes('marne')) return 'FR';
  if (text.includes('russia') || text.includes('russian') || text.includes('prague')) return 'RU';
  if (text.includes('habsburg') || text.includes('austria') || text.includes('vienna')) return 'AT';
  if (text.includes('china') || text.includes('chinese')) return 'CN';
  if (text.includes('spain') || text.includes('barcelona')) return 'ES';
  if (text.includes('java') || text.includes('indonesia')) return 'ID';
  if (text.includes('senegal') || text.includes('senegalese')) return 'SN';
  if (text.includes('germany') || text.includes('german')) return 'DE';
  if (text.includes('italy') || text.includes('italian')) return 'IT';
  if (text.includes('india') || text.includes('indian')) return 'IN';
  if (text.includes('united kingdom') || text.includes('british') || text.includes('london')) return 'GB';
  return 'US'; // Default fallback
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const duplicateMode = (formData.get('duplicateMode') as string) || 'skip';
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const xmlContent = await file.text();
    await connectDB();

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let importedCount = 0;
    let skippedCount = 0;
    let processedCount = 0;

    const itemsToProcess: string[] = [];

    // First, collect all items that are of post type 'post'
    while ((match = itemRegex.exec(xmlContent)) !== null) {
      const itemContent = match[1];
      const postTypeMatch = itemContent.match(/<wp:post_type>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:post_type>/);
      const postType = postTypeMatch ? postTypeMatch[1].trim() : '';
      
      if (postType === 'post') {
        itemsToProcess.push(itemContent);
      }
    }

    // Process each item sequentially to prevent hitting database locks
    for (const item of itemsToProcess) {
      processedCount++;
      
      // 1. Parse Title
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
      const rawTitle = titleMatch ? titleMatch[1].trim() : 'Unknown Book';
      
      let title = rawTitle;
      const quoteMatch = rawTitle.match(/"([^"]+)"/);
      if (quoteMatch) {
        title = quoteMatch[1];
      } else {
        title = title
          .replace(/Book Review:\s*/i, '')
          .replace(/Book Review\s*:\s*/i, '')
          .replace(/A Review of\s*/i, '')
          .replace(/Review of\s*/i, '')
          .replace(/Review and Historical Analysis of\s*/i, '')
          .replace(/\s+Review$/i, '')
          .replace(/,\s+Review$/i, '')
          .replace(/\s+Book Review$/i);
      }
      title = title.trim();

      // 2. Parse Author
      let author = 'Unknown';
      const byMatch = rawTitle.match(/by\s+([^,"]+)/i);
      if (byMatch) {
        author = byMatch[1].trim();
      } else {
        const contentMatch = item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
        if (contentMatch) {
          const content = contentMatch[1];
          const byContentMatch = content.match(/by\s+([A-Z][a-zA-Z\s\.\-]+?)(?:,|\sis\b|\.|\n|<|\()/);
          if (byContentMatch) {
            author = byContentMatch[1].trim();
          }
        }
      }

      // Check if duplicate already exists
      const existingBook = await Book.findOne({ title, author });
      
      // If it exists and we're in "skip" mode, we skip it
      if (existingBook && duplicateMode === 'skip') {
        skippedCount++;
        continue;
      }

      // 3. Parse Dates/Years
      let publicationYear = 2026; // Default
      const dateMatch = item.match(/<wp:post_date>(?:<!\[CDATA\[)?(\d{4})-\d{2}-\d{2}/);
      if (dateMatch) {
        publicationYear = parseInt(dateMatch[1]);
      }

      let historicalYear = 1900; // Default
      const yearMatch = title.match(/(\b1\d{3}\b|\b20\d{2}\b)/);
      if (yearMatch) {
        historicalYear = parseInt(yearMatch[1]);
      }

      // 4. Parse Tags from reader_suggested_tags
      const tags: string[] = [];
      const postmetaRegex = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
      let metaMatch;
      while ((metaMatch = postmetaRegex.exec(item)) !== null) {
        const metaContent = metaMatch[1];
        const keyMatch = metaContent.match(/<wp:meta_key>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:meta_key>/);
        const valMatch = metaContent.match(/<wp:meta_value>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:meta_value>/);
        if (keyMatch && valMatch && keyMatch[1].trim() === 'reader_suggested_tags') {
          try {
            const parsedTags = JSON.parse(valMatch[1].trim());
            if (Array.isArray(parsedTags)) {
              parsedTags.forEach((t: string) => {
                const cleanedTag = t.trim();
                if (cleanedTag && cleanedTag !== 'Non Classé' && cleanedTag !== 'English') {
                  tags.push(cleanedTag);
                }
              });
            }
          } catch (e) {
            // Silently ignore malformed tags
          }
        }
      }

      // 5. Categorization and Country
      const category = guessCategory(title, tags);
      const country = guessCountry(title, tags);

      // 6. Rating (extract from text, e.g. "5 stars" or "5/5")
      let rating = 4; // Default
      const contentMatch = item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
      const rawContent = contentMatch ? contentMatch[1] : '';
      if (rawContent) {
        const ratingMatch = rawContent.match(/(\d)\s*(?:stars?|out of 5|\/5)\b/i);
        if (ratingMatch) {
          const parsedRating = parseInt(ratingMatch[1]);
          if (parsedRating >= 1 && parsedRating <= 5) {
            rating = parsedRating;
          }
        }
      }

      // 7. Review Text (preserve HTML formatting, clean comments/entities)
      const reviewText = cleanHtml(rawContent);

      // 8. Cover Image (Base64 conversion)
      let imageUrl = existingBook ? existingBook.imageUrl : '';
      if (rawContent) {
        const imgMatch = rawContent.match(/<img[^>]+src="([^"]+)"/);
        if (imgMatch) {
          const externalImgUrl = imgMatch[1];
          const base64Img = await fetchImageAsBase64(externalImgUrl);
          if (base64Img) {
            imageUrl = base64Img;
          }
        }
      }

      // 9. Language and Type
      const searchContent = `${title} ${tags.join(' ')}`.toLowerCase();
      const language = searchContent.includes('français') || searchContent.includes('french') || searchContent.includes('l\'etrange') ? 'French' : 'English';
      const type = searchContent.includes('novel') || searchContent.includes('fiction') ? 'Fiction' : 'Non-fiction';

      // 10. Status
      const statusMatch = item.match(/<wp:status>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:status>/);
      const status = statusMatch && statusMatch[1].trim() === 'publish' ? 'published' : 'draft';

      const bookData = {
        title,
        author,
        historicalYear,
        publicationYear,
        country,
        category,
        language,
        rating,
        type,
        status,
        tags,
        reviewText,
        imageUrl,
      };

      if (existingBook && duplicateMode === 'replace') {
        // Update existing book
        await Book.updateOne({ _id: existingBook._id }, bookData);
      } else {
        // Create new book
        const newBook = new Book(bookData);
        await newBook.save();

        // Increment category counter (only for new creations)
        await Category.updateOne(
          { name: category },
          {
            $setOnInsert: { name: category },
            $inc: { bookCount: 1 },
          },
          { upsert: true }
        );

        // Increment tag counters (only for new creations)
        for (const tag of tags) {
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

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: itemsToProcess.length,
        imported: importedCount,
        skipped: skippedCount,
      }
    });

  } catch (error: any) {
    console.error('[Importer] API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
