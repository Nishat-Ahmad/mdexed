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

export function parseMarkdownFile(fileText) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = fileText.match(frontmatterRegex);
  
  const defaultFrontmatter = { title: "Imported File", date: "", readTime: "", summary: "", tags: [] };
  
  if (match) {
    const yamlString = match[1];
    const body = match[2];
    
    const frontmatter = { ...defaultFrontmatter };
    const lines = yamlString.split('\n');
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.substring(0, colonIndex).trim();
        let val = line.substring(colonIndex + 1).trim();
        
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        
        if (key === 'tags' && val.startsWith('[') && val.endsWith(']')) {
          val = val.substring(1, val.length - 1).split(',').map(s => {
             let cleaned = s.trim();
             if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
               cleaned = cleaned.substring(1, cleaned.length - 1);
             } else if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
               cleaned = cleaned.substring(1, cleaned.length - 1);
             }
             return cleaned;
          }).filter(Boolean);
        }
        
        frontmatter[key] = val;
      }
    });
    
    if (!Array.isArray(frontmatter.tags)) frontmatter.tags = [];
    
    return { frontmatter, body };
  }
  
  return { frontmatter: defaultFrontmatter, body: fileText };
}
