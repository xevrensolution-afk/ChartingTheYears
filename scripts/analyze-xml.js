const fs = require('fs');
const path = require('path');

function analyzeXml() {
  const xmlPath = path.join(__dirname, '..', 'riflingthepages.WordPress.2026-04-11 (3) (1).xml');
  console.log('Reading XML file from:', xmlPath);

  if (!fs.existsSync(xmlPath)) {
    console.error('XML file does not exist at:', xmlPath);
    return;
  }

  const content = fs.readFileSync(xmlPath, 'utf-8');
  console.log('File size:', content.length, 'characters');

  // Let's count items and extract their post types
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let totalItems = 0;
  const postTypes = new Map();
  const firstFewItems = [];

  while ((match = itemRegex.exec(content)) !== null) {
    totalItems++;
    const itemContent = match[1];
    
    const postTypeMatch = itemContent.match(/<wp:post_type>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:post_type>/);
    const postType = postTypeMatch ? postTypeMatch[1].trim() : 'unknown';
    
    postTypes.set(postType, (postTypes.get(postType) || 0) + 1);

    if (firstFewItems.length < 5 && postType === 'post') {
      firstFewItems.push(itemContent);
    }
  }

  console.log('Total items in XML:', totalItems);
  console.log('Post types count:', Object.fromEntries(postTypes));

  console.log('\n--- Analyzing first few "post" items ---');
  firstFewItems.forEach((item, index) => {
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : 'No Title';
    console.log(`\n[Post #${index + 1}] Title:`, title);

    // Extract all postmeta keys and values
    const postmetaRegex = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
    let metaMatch;
    console.log('  Metadata:');
    while ((metaMatch = postmetaRegex.exec(item)) !== null) {
      const metaContent = metaMatch[1];
      const keyMatch = metaContent.match(/<wp:meta_key>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:meta_key>/);
      const valMatch = metaContent.match(/<wp:meta_value>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:meta_value>/);
      if (keyMatch && valMatch) {
        console.log(`    - ${keyMatch[1].trim()}: ${valMatch[1].trim().substring(0, 100)}`);
      }
    }

    // Extract categories/tags
    const catRegex = /<category domain="([^"]+)" nicename="([^"]+)">(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/g;
    let catMatch;
    console.log('  Categories/Tags:');
    while ((catMatch = catRegex.exec(item)) !== null) {
      console.log(`    - [${catMatch[1]}]: ${catMatch[3].trim()} (nicename: ${catMatch[2]})`);
    }
  });
}

analyzeXml();
