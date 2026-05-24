const fs = require('fs');
const path = require('path');

function analyzeTags() {
  const xmlPath = path.join(__dirname, '..', 'riflingthepages.WordPress.2026-04-11 (3) (1).xml');
  const content = fs.readFileSync(xmlPath, 'utf-8');

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  const domains = new Set();
  const sampleCategories = [];

  while ((match = itemRegex.exec(content)) !== null) {
    const itemContent = match[1];
    const catRegex = /<category domain="([^"]+)"/g;
    let catMatch;
    while ((catMatch = catRegex.exec(itemContent)) !== null) {
      domains.add(catMatch[1]);
    }
  }

  console.log('Unique category domains found:', Array.from(domains));
}

analyzeTags();
