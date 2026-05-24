const fs = require('fs');
const path = require('path');

function listCategories() {
  const xmlPath = path.join(__dirname, '..', 'riflingthepages.WordPress.2026-04-11 (3) (1).xml');
  const content = fs.readFileSync(xmlPath, 'utf-8');

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  const categories = new Set();

  while ((match = itemRegex.exec(content)) !== null) {
    const itemContent = match[1];
    const catRegex = /<category domain="category"[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(itemContent)) !== null) {
      categories.add(catMatch[1].trim());
    }
  }

  console.log('Unique categories in XML:', Array.from(categories));
}

listCategories();
