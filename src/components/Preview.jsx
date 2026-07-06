import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Calendar, Clock } from 'lucide-react';

// Custom component for copyable code blocks
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline) {
    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={handleCopy}
          className={`copy-btn ${copied ? 'copied' : ''}`}
          title="Copy code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <pre className={className} {...props}>
          <code className={match ? match[1] : ''}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default function Preview({ content, frontmatter, activeFileId, onHeadingsChange }) {
  const previewRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      const scrollHeight = target.scrollHeight - target.clientHeight;
      if (scrollHeight > 0) {
        setProgress((target.scrollTop / scrollHeight) * 100);
      } else {
        setProgress(0);
      }
    };

    const container = previewRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Effect to extract headings for TOC
  useEffect(() => {
    if (!previewRef.current) return;
    const headingElements = Array.from(previewRef.current.querySelectorAll('h2, h3'));
    
    // Assign IDs to headings for scrollspy if they don't have one
    headingElements.forEach(el => {
      if (!el.id) {
        el.id = el.innerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
    });

    const headings = headingElements.map(el => ({
      id: el.id,
      text: el.innerText,
      level: el.tagName.toLowerCase() === 'h2' ? 2 : 3,
      top: el.offsetTop
    }));
    
    if (onHeadingsChange) {
      onHeadingsChange(headings);
    }
  }, [content, onHeadingsChange]);

  // Helper to resolve relative image sources
  const resolveImageSrc = (src) => {
    if (!src) return src;
    // If it's absolute, external, or a data URI, keep it as is
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:')) {
      return src;
    }
    
    // Remove leading ./ if present
    const cleanSrc = src.startsWith('./') ? src.substring(2) : src;
    
    // Extract the folder path from activeFileId (e.g. "RAG/rag" -> "RAG")
    const folder = activeFileId && activeFileId.includes('/') 
      ? activeFileId.split('/').slice(0, -1).join('/') 
      : '';
      
    return folder 
      ? `/src/content/blog/${folder}/${cleanSrc}` 
      : `/src/content/blog/${cleanSrc}`;
  };

  return (
    <div className="preview-pane" ref={previewRef}>
      <div className="progress-bar-container">
        <div id="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="preview-content prose-preview">
        {/* Render Frontmatter Header */}
        {frontmatter && (
          <div className="preview-header">
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="tags-container">
                {frontmatter.tags.map(tag => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            )}
            <h1 className="post-title">{frontmatter.title}</h1>
            <div className="post-meta">
              {frontmatter.date && (
                <span className="meta-item">
                  <Calendar size={14} /> {frontmatter.date}
                </span>
              )}
              {frontmatter.readTime && (
                <span className="meta-item">
                  <Clock size={14} /> {frontmatter.readTime}
                </span>
              )}
            </div>
          </div>
        )}

        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeBlock,
            // Automatically add ids to headers rendered by markdown
            h2: ({node, children, ...props}) => {
              const text = String(children);
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              return <h2 id={id} {...props}>{children}</h2>;
            },
            h3: ({node, children, ...props}) => {
              const text = String(children);
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              return <h3 id={id} {...props}>{children}</h3>;
            },
            img: ({node, src, ...props}) => {
              const resolvedSrc = resolveImageSrc(src);
              return <img src={resolvedSrc} {...props} />;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
