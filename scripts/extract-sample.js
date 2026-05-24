const fs = require('fs');
const path = require('path');

function cleanHtml(html) {
  if (!html) return '';
  let text = html.replace(/<\/(p|h1|h2|h3|h4|h5|h6|div|li)>/gi, '\n\n');
  text = text.replace(/<(br\s*\/?)>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
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
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function guessCategory(title, tags) {
  const text = `${title} ${tags.join(' ')}`.toLowerCase();
  if (text.includes('military') || text.includes('war') || text.includes('army') || text.includes('navy') || text.includes('maritime') || text.includes('battle') || text.includes('soldier') || text.includes('fleet') || text.includes('procurement') || text.includes('tactics') || text.includes('defence') || text.includes('defense') || text.includes('guerre')) {
    return 'Military History';
  }
  if (text.includes('economic') || text.includes('trade') || text.includes('sugar') || text.includes('industry') || text.includes('industrial') || text.includes('finance') || text.includes('commercial') || text.includes('labor') || text.includes('labour')) {
    return 'Economic History';
  }
  if (text.includes('social') || text.includes('diaspora') || text.includes('society') || text.includes('housing') || text.includes('prostitution') || text.includes('prostitutes') || text.includes('peasant') || text.includes('nationalism') || text.includes('identity') || text.includes('identities')) {
    return 'Social History';
  }
  if (text.includes('art') || text.includes('music') || text.includes('science') || text.includes('translation') || text.includes('multilingual')) {
    return 'History of Art';
  }
  if (text.includes('novel') || text.includes('novels') || text.includes('fiction')) {
    return 'Historical Novels';
  }
  if (text.includes('political') || text.includes('crown') || text.includes('state') || text.includes('policy') || text.includes('regime') || text.includes('monarchy') || text.includes('politique')) {
    return 'Political History';
  }
  return 'General History';
}

function parseItem(itemContent) {
  // Title
  const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
  const rawTitle = titleMatch ? titleMatch[1].trim() : 'Unknown';
  
  // Try to extract quoted title
  let title = rawTitle;
  const quoteMatch = rawTitle.match(/"([^"]+)"/);
  if (quoteMatch) {
    title = quoteMatch[1];
  } else {
    // Strip prefixes/suffixes
    title = title
      .replace(/Book Review:\s*/i, '')
      .replace(/Book Review\s*:\s*/i, '')
      .replace(/A Review of\s*/i, '')
      .replace(/Review of\s*/i, '')
      .replace(/Review and Historical Analysis of\s*/i, '')
      .replace(/\s+Review$/i, '')
      .replace(/,\s+Review$/i, '')
      .replace(/\s+Book Review$/i, '');
  }

  // Author
  let author = 'Unknown';
  const byMatch = rawTitle.match(/by\s+([^,"]+)/i);
  if (byMatch) {
    author = byMatch[1].trim();
  } else {
    // Search in content
    const contentMatch = itemContent.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
    if (contentMatch) {
      const content = contentMatch[1];
      const byContentMatch = content.match(/by\s+([A-Z][a-zA-Z\s\.\-]+?)(?:,|\sis\b|\.|\n|<|\()/);
      if (byContentMatch) {
        author = byContentMatch[1].trim();
      }
    }
  }

  // Publication Year from post date
  let publicationYear = 1900;
  const dateMatch = itemContent.match(/<wp:post_date>(?:<!\[CDATA\[)?(\d{4})-\d{2}-\d{2}/);
  if (dateMatch) {
    publicationYear = parseInt(dateMatch[1]);
  }

  // Historical Year: search title for 4-digit number
  let historicalYear = 1900;
  const yearMatch = title.match(/(\b1\d{3}\b|\b20\d{2}\b)/);
  if (yearMatch) {
    historicalYear = parseInt(yearMatch[1]);
  } else {
    historicalYear = publicationYear; // fallback
  }

  // Categories/Tags
  const tags = [];
  const metaRegex = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(itemContent)) !== null) {
    const metaContent = metaMatch[1];
    const keyMatch = metaContent.match(/<wp:meta_key>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:meta_key>/);
    const valMatch = metaContent.match(/<wp:meta_value>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:meta_value>/);
    if (keyMatch && valMatch && keyMatch[1].trim() === 'reader_suggested_tags') {
      try {
        const parsedTags = JSON.parse(valMatch[1].trim());
        parsedTags.forEach(t => {
          if (t !== 'Non Classé' && t !== 'English') {
            tags.push(t);
          }
        });
      } catch (e) {}
    }
  }

  // Category
  const category = guessCategory(title, tags);

  // Country
  // Just a simple check for common country names
  let country = 'US';
  const textToSearch = `${title} ${tags.join(' ')}`.toLowerCase();
  if (textToSearch.includes('japan') || textToSearch.includes('japanese') || textToSearch.includes('tokugawa') || textToSearch.includes('meiji')) {
    country = 'JP';
  } else if (textToSearch.includes('france') || textToSearch.includes('french') || textToSearch.includes('paris') || textToSearch.includes('marne')) {
    country = 'FR';
  } else if (textToSearch.includes('russia') || textToSearch.includes('russian') || textToSearch.includes('prague')) {
    country = 'RU';
  } else if (textToSearch.includes('habsburg') || textToSearch.includes('austria')) {
    country = 'AT';
  } else if (textToSearch.includes('china') || textToSearch.includes('chinese')) {
    country = 'CN';
  } else if (textToSearch.includes('spain') || textToSearch.includes('barcelona')) {
    country = 'ES';
  } else if (textToSearch.includes('java') || textToSearch.includes('indonesia')) {
    country = 'ID';
  } else if (textToSearch.includes('senegal') || textToSearch.includes('senegalese')) {
    country = 'SN';
  }

  // Rating
  let rating = 4;
  const contentMatch = itemContent.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
  let content = '';
  if (contentMatch) {
    content = contentMatch[1];
    const ratingMatch = content.match(/(\d)\s*(?:stars?|out of 5|\/5)\b/i);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[1]);
    }
  }

  // Review Text
  const reviewText = cleanHtml(content).substring(0, 1000) + '...'; // Truncate for display

  // Image URL
  let imageUrl = '';
  if (content) {
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }

  // Language
  let language = 'English';
  if (textToSearch.includes('français') || textToSearch.includes('french') || textToSearch.includes('l\'etrange') || textToSearch.includes('premiere')) {
    language = 'French';
  }

  // Type
  let type = 'Non-fiction';
  if (textToSearch.includes('novel') || textToSearch.includes('fiction')) {
    type = 'Fiction';
  }

  // Status
  const statusMatch = itemContent.match(/<wp:status>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:status>/);
  const status = statusMatch && statusMatch[1].trim() === 'publish' ? 'published' : 'draft';

  return {
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
    imageUrl
  };
}

function test() {
  const xmlPath = path.join(__dirname, '..', 'riflingthepages.WordPress.2026-04-11 (3) (1).xml');
  const content = fs.readFileSync(xmlPath, 'utf-8');

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const firstItemMatch = itemRegex.exec(content);
  if (firstItemMatch) {
    const parsed = parseItem(firstItemMatch[1]);
    console.log('Successfully parsed 1 object matching DB schema:\n');
    console.log(JSON.stringify(parsed, null, 2));
  }
}

test();
