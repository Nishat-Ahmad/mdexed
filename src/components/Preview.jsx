import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

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

export default function Preview({ content, onHeadingsChange }) {
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

  return (
    <div className="preview-pane" ref={previewRef}>
      <div className="progress-bar-container">
        <div id="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="preview-content prose-preview">
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
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
