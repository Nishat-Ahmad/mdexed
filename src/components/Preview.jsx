import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Copy, Check, Calendar, Clock, List, ChevronLeft } from 'lucide-react';
import Resizer from './Resizer';

// Custom component for pre (block code wrapper) with copy button
const PreBlock = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef(null);

  const handleCopy = () => {
    if (preRef.current) {
      const codeText = preRef.current.innerText || '';
      navigator.clipboard.writeText(codeText.replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={handleCopy}
        className={`copy-btn ${copied ? 'copied' : ''}`}
        title="Copy code"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  );
};

function Preview({ 
  content, 
  frontmatter, 
  activeFileId, 
  headings = [], 
  activeHeadingId, 
  onHeadingClick, 
  onHeadingsChange 
}) {
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const tocPaneRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isTocOpen, setIsTocOpen] = useState(true);

  // TOC Resizing Logic (Lag-free: Direct DOM updates during drag, commit to React state on mouseup)
  const isTocDragging = useRef(false);
  const tocStartX = useRef(0);
  const tocStartWidth = useRef(240);
  const tocRafId = useRef(null);
  const [tocWidth, setTocWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('mdexed_toc_width');
      return saved ? Number(saved) : 220;
    } catch {
      return 220;
    }
  });
  const tocWidthRef = useRef(tocWidth);
  tocWidthRef.current = tocWidth;

  const startTocDragging = (e) => {
    e.preventDefault();
    isTocDragging.current = true;
    tocStartX.current = e.clientX;
    tocStartWidth.current = tocWidthRef.current;
    document.addEventListener('mousemove', onTocDrag);
    document.addEventListener('mouseup', stopTocDragging);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    if (previewRef.current) {
      previewRef.current.style.pointerEvents = 'none';
    }
  };

  const onTocDrag = (e) => {
    if (!isTocDragging.current) return;
    const clientX = e.clientX;

    if (tocRafId.current) {
      cancelAnimationFrame(tocRafId.current);
    }

    tocRafId.current = requestAnimationFrame(() => {
      if (!isTocDragging.current) return;
      const deltaX = clientX - tocStartX.current;
      const maxAllowed = containerRef.current 
        ? Math.max(140, Math.min(600, containerRef.current.clientWidth - 200))
        : 500;
      const newWidth = Math.min(Math.max(tocStartWidth.current + deltaX, 140), maxAllowed);
      tocWidthRef.current = newWidth;
      if (tocPaneRef.current) {
        tocPaneRef.current.style.width = `${newWidth}px`;
      }
    });
  };

  const stopTocDragging = () => {
    if (isTocDragging.current) {
      isTocDragging.current = false;
      if (tocRafId.current) {
        cancelAnimationFrame(tocRafId.current);
        tocRafId.current = null;
      }
      document.removeEventListener('mousemove', onTocDrag);
      document.removeEventListener('mouseup', stopTocDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (previewRef.current) {
        previewRef.current.style.pointerEvents = '';
      }
      const finalWidth = tocWidthRef.current;
      setTocWidth(finalWidth);
      try {
        localStorage.setItem('mdexed_toc_width', String(finalWidth));
      } catch {}
    }
  };

  const stopTocDraggingRef = useRef(stopTocDragging);
  stopTocDraggingRef.current = stopTocDragging;

  useEffect(() => {
    return () => {
      stopTocDraggingRef.current();
    };
  }, []);

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

    const extractedHeadings = headingElements.map(el => ({
      id: el.id,
      text: el.innerText,
      level: el.tagName.toLowerCase() === 'h2' ? 2 : 3,
      top: el.offsetTop
    }));
    
    if (onHeadingsChange) {
      onHeadingsChange(extractedHeadings);
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

  const handleHeadingClick = (e, headingId) => {
    e.preventDefault();
    if (onHeadingClick) {
      onHeadingClick(headingId);
    }
    const el = document.getElementById(headingId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasHeadings = headings && headings.length > 0;

  return (
    <div className="preview-container" ref={containerRef}>
      {/* TOC on Left Side of Live Viewer (Unboxed & Resizable) */}
      {hasHeadings && isTocOpen && (
        <>
          <aside className="preview-toc-pane" ref={tocPaneRef} style={{ width: `${tocWidth}px` }}>
            <div className="preview-toc-top">
              <span className="preview-toc-label">
                Table of Contents
              </span>
              <button
                onClick={() => setIsTocOpen(false)}
                className="preview-toc-collapse-btn"
                title="Collapse Table of Contents"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            <nav className="preview-toc-list">
              {headings.map(h => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => handleHeadingClick(e, h.id)}
                  className={`preview-toc-item ${activeHeadingId === h.id ? 'active' : ''}`}
                  style={{
                    paddingLeft: h.level === 3 ? '1.5rem' : '0.75rem',
                    fontSize: h.level === 3 ? '0.8rem' : '0.85rem'
                  }}
                  title={h.text}
                >
                  <span className="toc-item-indicator" />
                  <span className="toc-item-text">{h.text}</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* Resizer handle just like the Editor / Live Viewer resizer */}
          <Resizer onMouseDown={startTocDragging} />
        </>
      )}

      {/* Collapsed TOC toggle button */}
      {hasHeadings && !isTocOpen && (
        <button
          onClick={() => setIsTocOpen(true)}
          className="preview-toc-toggle-btn"
          title="Show Table of Contents"
        >
          <List size={14} style={{ color: 'var(--color-teal)' }} />
          <span>Contents</span>
        </button>
      )}

      {/* Main Preview Scrollable Content Pane */}
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
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              pre: PreBlock,
              code: ({ _node, className, children, ...props }) => {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              table: ({ _node, children, ...props }) => {
                return (
                  <div className="table-responsive">
                    <table {...props}>{children}</table>
                  </div>
                );
              },
              // Automatically add ids to headers rendered by markdown
              h2: ({ _node, children, ...props }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return <h2 id={id} {...props}>{children}</h2>;
              },
              h3: ({ _node, children, ...props }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return <h3 id={id} {...props}>{children}</h3>;
              },
              img: ({ _node, src, ...props }) => {
                const resolvedSrc = resolveImageSrc(src);
                return <img src={resolvedSrc} {...props} />;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Preview);
