import React, { useState, useEffect, useRef } from 'react';
import MetadataForm from './components/MetadataForm';
import Editor from './components/Editor';
import Preview from './components/Preview';
import { generateMarkdown, parseMarkdownFile } from './utils/markdown';
import { FileText, Plus, FolderOpen, ChevronDown, Upload } from 'lucide-react';
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
  const [files, setFiles] = useState([
    {
      id: 'default-1',
      frontmatter: {
        title: "Building Scalable RAG Architectures",
        date: "Sep 05, 2025",
        readTime: "8 min read",
        summary: "An in-depth guide to building scalable, production-ready retrieval-augmented generation pipelines.",
        tags: ["AI", "Vector DBs", "FastAPI"]
      },
      body: DEFAULT_BODY
    }
  ]);
  const [activeFileId, setActiveFileId] = useState('default-1');

  // Load files from the local filesystem API on mount
  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const loadedFiles = data.map(d => {
            const parsed = parseMarkdownFile(d.content);
            return {
              id: d.filename,
              frontmatter: parsed.frontmatter,
              body: parsed.body,
            };
          });
          setFiles(loadedFiles);
          setActiveFileId(loadedFiles[0].id);
        }
      })
      .catch(err => console.error("Could not load local files", err));
  }, []);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const updateActiveFile = (updates) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, ...updates } : f));
  };

  const createNewFile = () => {
    const newFile = {
      id: Date.now().toString(),
      frontmatter: {
        title: "Untitled Post",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        readTime: "5 min read",
        summary: "",
        tags: []
      },
      body: "# New Post\n\nStart writing here..."
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const parsed = parseMarkdownFile(content);
      
      const newFile = {
        id: Date.now().toString(),
        frontmatter: parsed.frontmatter,
        body: parsed.body
      };
      
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const [headings, setHeadings] = useState([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [editorWidth, setEditorWidth] = useState(50);
  const [activeSidebarTab, setActiveSidebarTab] = useState('settings');
  const isDragging = useRef(false);

  const startDragging = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDragging);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const onDrag = (e) => {
    if (!isDragging.current) return;
    const sidebarWidth = 320; // 320px for the single sidebar
    const availableWidth = window.innerWidth - sidebarWidth;
    const newWidth = ((e.clientX - sidebarWidth) / availableWidth) * 100;
    if (newWidth >= 10 && newWidth <= 90) {
      setEditorWidth(newWidth);
    }
  };

  const stopDragging = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

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
  }, [headings, activeFile.body]); // re-bind when markdown changes

  const handleSaveToDisk = async () => {
    const slug = activeFile.frontmatter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'untitled';
    const fullMarkdown = generateMarkdown(activeFile.frontmatter, activeFile.body);
    
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content: fullMarkdown })
      });
      if (res.ok) {
        // Update ID if title/slug changed
        if (activeFile.id !== slug) {
           updateActiveFile({ id: slug });
           setActiveFileId(slug);
        }
        alert(`Saved successfully to src/content/blog/${slug}/${slug}.md`);
      } else {
        alert('Failed to save file');
      }
    } catch (e) {
      alert("Error saving file: " + e.message);
    }
  };

  return (
    <div className="app-container">
      {/* SINGLE LEFT SIDEBAR */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '320px', backgroundColor: '#121214', borderRight: '1px solid var(--color-zinc-800)', flexShrink: 0 }}>
        
        {/* TABS HEADER */}
        <div style={{ display: 'flex', padding: '1rem', gap: '0.5rem', borderBottom: '1px solid var(--color-zinc-800)' }}>
          <button 
            className={`btn ${activeSidebarTab === 'settings' ? '' : 'btn-secondary'}`} 
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
            onClick={() => setActiveSidebarTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`btn ${activeSidebarTab === 'explorer' ? '' : 'btn-secondary'}`} 
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
            onClick={() => setActiveSidebarTab('explorer')}
          >
            Explorer
          </button>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {activeSidebarTab === 'explorer' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--color-zinc-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-zinc-400)', fontWeight: 700, letterSpacing: '0.05em' }}>FILES</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input 
                    type="file" 
                    accept=".md,.mdx" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload} 
                  />
                  <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: 0, display: 'flex' }} title="Open File">
                    <Upload size={16} />
                  </button>
                  <button onClick={createNewFile} style={{ background: 'none', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: 0, display: 'flex' }} title="New File">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1, padding: '0.75rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', marginBottom: '0.25rem' }}>
                  <ChevronDown size={14} style={{ color: 'var(--color-zinc-400)' }} /> 
                  <FolderOpen size={14} style={{ color: 'var(--color-teal)' }} />
                  src/content/blog
                </div>
                
                {files.map(f => {
                  const isActive = f.id === activeFileId;
                  const slug = f.frontmatter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'untitled';
                  return (
                    <div 
                      key={f.id} 
                      onClick={() => setActiveFileId(f.id)} 
                      className={`file-item ${isActive ? 'active' : ''}`}
                    >
                      <FileText size={14} style={{ minWidth: '14px' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slug}.md</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <MetadataForm key={activeFileId} data={activeFile.frontmatter} onChange={(fm) => updateActiveFile({ frontmatter: fm })} />
              
              <div style={{ flex: 1, padding: '0 1.5rem 1.5rem' }}>
                {headings.length > 0 && (
                  <div className="toc-container" style={{ marginTop: '1rem' }}>
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
            </div>
          )}
        </div>
        
        <div className="actions" style={{ padding: '1.5rem', borderTop: '1px solid var(--color-zinc-800)' }}>
          <button className="btn" onClick={handleSaveToDisk}>Save to Disk</button>
        </div>
      </div>

      {/* MIDDLE PANE - EDITOR */}
      <div style={{ width: `${editorWidth}%`, flex: 'none', display: 'flex', flexDirection: 'column' }}>
        <Editor value={activeFile.body} onChange={(body) => updateActiveFile({ body })} />
      </div>
      
      {/* RESIZER */}
      <div 
        onMouseDown={startDragging}
        style={{
          width: '6px',
          backgroundColor: '#121214',
          cursor: 'col-resize',
          zIndex: 10,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-teal)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#121214'}
      />
      
      {/* RIGHT PANE - PREVIEW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Preview content={activeFile.body} frontmatter={activeFile.frontmatter} onHeadingsChange={setHeadings} />
      </div>
    </div>
  );
}

export default App;
