export function generateMarkdown(frontmatter, body) {
  let tagsStr = '';
  if (frontmatter.tags && frontmatter.tags.length > 0) {
    // Escape any quotes in tags
    const escapedTags = frontmatter.tags.map(t => `"${t.trim().replace(/"/g, '\\"')}"`);
    tagsStr = `\ntags: [${escapedTags.join(', ')}]`;
  }
  
  const summaryStr = frontmatter.summary 
    ? `\nsummary: "${frontmatter.summary.replace(/"/g, '\\"')}"` 
    : '';

  return `---
title: "${frontmatter.title.replace(/"/g, '\\"')}"
date: "${frontmatter.date}"
readTime: "${frontmatter.readTime}"${summaryStr}${tagsStr}
---

${body}`;
}
