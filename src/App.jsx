import React, { useState, useEffect } from 'react';
import MetadataForm from './components/MetadataForm';
import Editor from './components/Editor';
import Preview from './components/Preview';
import { generateMarkdown } from './utils/markdown';
import './index.css';

const DEFAULT_BODY = `
# Introduction
Your markdown content starts here...

## Key Challenges
More markdown elements...

### Data Indexing
Let's talk about vectors.
`;

function App() {
  const [frontmatter, setFrontmatter] = useState({
    title: "Building Scalable RAG Architectures",
    date: "Sep 05, 2025",
    readTime: "8 min read",
    summary: "An in-depth guide to building scalable, production-ready retrieval-augmented generation pipelines.",
    tags: ["AI", "Vector DBs", "FastAPI"]
  });
  
  const [markdownBody, setMarkdownBody] = useState(DEFAULT_BODY);
  const [headings, setHeadings] = useState([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [copyText, setCopyText] = useState('Copy to Clipboard');

  // Scrollspy logic
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) observer.unobserve(element);
      });
    };
  }, [headings, markdownBody]); // re-bind when markdown changes

  const handleDownload = () => {
    const fullMarkdown = generateMarkdown(frontmatter, markdownBody);
    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = frontmatter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    a.download = `${slug || 'blog-post'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const fullMarkdown = generateMarkdown(frontmatter, markdownBody);
    navigator.clipboard.writeText(fullMarkdown);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy to Clipboard'), 2000);
  };

  return (
    <div className="app-container">
      {/* LEFT PANE - SETTINGS & TOC */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '320px', backgroundColor: '#121214', borderRight: '1px solid var(--color-zinc-800)' }}>
        <MetadataForm data={frontmatter} onChange={setFrontmatter} />
        
        <div style={{ flex: 1, padding: '0 1.5rem', overflowY: 'auto' }}>
          {headings.length > 0 && (
            <div className="toc-container">
              <h3 style={{ fontSize: '0.875rem', color: 'var(--color-zinc-400)', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table of Contents</h3>
              {headings.map(h => (
                <a 
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`toc-item ${activeHeadingId === h.id ? 'active' : ''}`}
                  style={{ paddingLeft: h.level === 3 ? '1rem' : '0' }}
                >
                  {h.text}
                </a>
              ))}
            </div>
          )}
        </div>
        
        <div className="actions" style={{ padding: '1.5rem', borderTop: '1px solid var(--color-zinc-800)' }}>
          <button className="btn" onClick={handleDownload}>Download .md</button>
          <button className="btn btn-secondary" onClick={handleCopyToClipboard}>{copyText}</button>
        </div>
      </div>

      {/* MIDDLE PANE - EDITOR */}
      <Editor value={markdownBody} onChange={setMarkdownBody} />
      
      {/* RIGHT PANE - PREVIEW */}
      <Preview content={markdownBody} onHeadingsChange={setHeadings} />
    </div>
  );
}

export default App;
