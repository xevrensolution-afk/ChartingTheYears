const fs = require('fs');
const path = require('path');

function listTitles() {
  const xmlPath = path.join(__dirname, '..', 'riflingthepages.WordPress.2026-04-11 (3) (1).xml');
  const content = fs.readFileSync(xmlPath, 'utf-8');

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let count = 0;
  const titles = [];

  while ((match = itemRegex.exec(content)) !== null && count < 50) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : 'No Title';
    titles.push(title);
    count++;
  }

  console.log(titles.join('\n'));
}

listTitles();
