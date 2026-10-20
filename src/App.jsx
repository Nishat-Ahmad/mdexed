import React, { useState, useEffect, useRef } from 'react';
import { Menu, Files, Info, FileEdit, PanelRight, Save, Loader2, Check, AlertCircle, Keyboard, Palette, GitBranch } from 'lucide-react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Resizer from './components/Resizer';
import { useFileSystem } from './hooks/useFileSystem';
import { useGitHubFileSystem } from './hooks/useGitHubFileSystem';
import { applyThemeById } from './utils/theme';
import './index.css';

function MainApp({ fsManager }) {
  useEffect(() => {
    const savedThemeId = localStorage.getItem('mdexed-theme') || 'default';
    applyThemeById(savedThemeId);
  }, []);
  const [headings, setHeadings] = useState([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  
  const [editorWidth, setEditorWidth] = useState(50);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  
  const [isActivityBarExpanded, setIsActivityBarExpanded] = useState(false);

  const showSidebarRef = useRef(showSidebar);
  showSidebarRef.current = showSidebar;
  const activeSidebarTabRef = useRef(activeSidebarTab);
  activeSidebarTabRef.current = activeSidebarTab;

  const toggleEditor = () => setShowEditor((prev) => !prev);
  const togglePreview = () => setShowPreview((prev) => !prev);
  const toggleFileExplorer = () => {
    if (showSidebarRef.current && activeSidebarTabRef.current === 'explorer') {
      setShowSidebar(false);
    } else {
      setActiveSidebarTab('explorer');
      setShowSidebar(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;

      if (e.key === 'b' || e.key === 'B') {
        const isInsideMonaco = document.activeElement && document.activeElement.closest('.monaco-editor');
        if (isInsideMonaco) {
          return;
        }

        if (e.shiftKey && !e.altKey) {
          e.preventDefault();
          toggleFileExplorer();
        } else if (e.altKey && !e.shiftKey) {
          e.preventDefault();
          togglePreview();
        } else if (!e.altKey && !e.shiftKey) {
          e.preventDefault();
          toggleEditor();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSidebarTabClick = (tab) => {
    if (showSidebar && activeSidebarTab === tab) {
      setShowSidebar(false);
    } else {
      setActiveSidebarTab(tab);
      setShowSidebar(true);
    }
  };
  
  const mainContentRef = useRef(null);
  const editorPaneRef = useRef(null);
  const sidebarContainerRef = useRef(null);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(50);
  const currentEditorWidthRef = useRef(editorWidth);
  currentEditorWidthRef.current = editorWidth;
  const dragRafId = useRef(null);

  const isSidebarDragging = useRef(false);
  const sidebarStartX = useRef(0);
  const sidebarStartWidth = useRef(320);
  const currentSidebarWidthRef = useRef(sidebarWidth);
  currentSidebarWidthRef.current = sidebarWidth;
  const sidebarRafId = useRef(null);

  // Editor Resizer Logic (Lag-free: Direct DOM updates during drag, commit to React state on mouseup)
  const startDragging = (e) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentEditorWidthRef.current;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDragging);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    if (mainContentRef.current) {
      mainContentRef.current.style.pointerEvents = 'none';
    }
  };

  const onDrag = (e) => {
    if (!isDragging.current || !mainContentRef.current) return;
    const clientX = e.clientX;

    if (dragRafId.current) {
      cancelAnimationFrame(dragRafId.current);
    }

    dragRafId.current = requestAnimationFrame(() => {
      if (!isDragging.current || !mainContentRef.current) return;
      const rect = mainContentRef.current.getBoundingClientRect();
      if (rect.width === 0) return;
      const deltaX = clientX - dragStartX.current;
      const deltaPercent = (deltaX / rect.width) * 100;
      const newWidth = Math.min(Math.max(dragStartWidth.current + deltaPercent, 10), 90);
      currentEditorWidthRef.current = newWidth;
      if (editorPaneRef.current) {
        editorPaneRef.current.style.width = `${newWidth}%`;
      }
    });
  };

  const stopDragging = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragRafId.current) {
      cancelAnimationFrame(dragRafId.current);
      dragRafId.current = null;
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (mainContentRef.current) {
      mainContentRef.current.style.pointerEvents = '';
    }
    setEditorWidth(currentEditorWidthRef.current);
  };

  // Sidebar Resizer Logic (Lag-free: Direct DOM updates during drag, commit to React state on mouseup)
  const startSidebarDragging = (e) => {
    e.preventDefault();
    isSidebarDragging.current = true;
    sidebarStartX.current = e.clientX;
    sidebarStartWidth.current = currentSidebarWidthRef.current;
    document.addEventListener('mousemove', onSidebarDrag);
    document.addEventListener('mouseup', stopSidebarDragging);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    if (mainContentRef.current) {
      mainContentRef.current.style.pointerEvents = 'none';
    }
  };

  const onSidebarDrag = (e) => {
    if (!isSidebarDragging.current) return;
    const clientX = e.clientX;

    if (sidebarRafId.current) {
      cancelAnimationFrame(sidebarRafId.current);
    }

    sidebarRafId.current = requestAnimationFrame(() => {
      if (!isSidebarDragging.current) return;
      const deltaX = clientX - sidebarStartX.current;
      const newWidth = Math.min(Math.max(sidebarStartWidth.current + deltaX, 200), 800);
      currentSidebarWidthRef.current = newWidth;
      if (sidebarContainerRef.current) {
        sidebarContainerRef.current.style.width = `${newWidth}px`;
      }
    });
  };

  const stopSidebarDragging = () => {
    if (!isSidebarDragging.current) return;
    isSidebarDragging.current = false;
    if (sidebarRafId.current) {
      cancelAnimationFrame(sidebarRafId.current);
      sidebarRafId.current = null;
    }
    document.removeEventListener('mousemove', onSidebarDrag);
    document.removeEventListener('mouseup', stopSidebarDragging);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (mainContentRef.current) {
      mainContentRef.current.style.pointerEvents = '';
    }
    setSidebarWidth(currentSidebarWidthRef.current);
  };

  // Scrollspy logic
  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveHeadingId(entry.target.id);
      });
    }, { rootMargin: '0px 0px -80% 0px' });

    headings.forEach((h) => {
      const element = document.getElementById(h.id);
      if (element) observer.observe(element);
    });

    return () => {
      headings.forEach((h) => {
        const element = document.getElementById(h.id);
        if (element) observer.unobserve(element);
      });
    };
  }, [headings, fsManager.activeFile?.body]);

  const handleImagePaste = async (file) => {
    if (!fsManager.activeFile) return null;
    const slug = fsManager.activeFile.id;
    const targetFolder = slug.includes('/') ? slug.split('/').slice(0, -1).join('/') : slug;
    
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    const defaultName = `pasted-image-${timestamp}.png`;
    const fileName = prompt(`Paste clipboard image into post folder "${targetFolder}":\nEnter filename:`, defaultName);
    if (!fileName) return null;

    const cleanFileName = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.gif') || fileName.endsWith('.webp')
      ? fileName
      : `${fileName}.png`;

    const success = await fsManager.uploadImage(targetFolder, file, cleanFileName);
    if (success) {
      return cleanFileName;
    }
    return null;
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* ACTIVITY BAR */}
      <div style={{ width: isActivityBarExpanded ? '180px' : '48px', backgroundColor: 'var(--bg-color)', borderRight: '1px solid var(--color-zinc-800)', display: 'flex', flexDirection: 'column', padding: '1rem 0', flexShrink: 0, zIndex: 100, transition: 'width 0.2s ease', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button onClick={() => setIsActivityBarExpanded(!isActivityBarExpanded)} style={{ background: 'transparent', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', transition: 'color 0.2s, background-color 0.2s' }} title="Expand Menu" onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-zinc-400)'}>
            <Menu size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 600 }}>Menu</span>}
          </button>
          
          <div style={{ height: '1rem' }} /> {/* Spacer */}

          <button onClick={() => handleSidebarTabClick('explorer')} style={{ background: 'transparent', border: 'none', borderLeft: (showSidebar && activeSidebarTab === 'explorer') ? '2px solid var(--color-teal)' : '2px solid transparent', color: (showSidebar && activeSidebarTab === 'explorer') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? 'calc(1rem - 2px)' : '0', transition: 'all 0.2s' }} title="Explorer (Ctrl+Shift+B)">
            <Files size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Files</span>}
          </button>
          <button onClick={() => handleSidebarTabClick('settings')} style={{ background: 'transparent', border: 'none', borderLeft: (showSidebar && activeSidebarTab === 'settings') ? '2px solid var(--color-teal)' : '2px solid transparent', color: (showSidebar && activeSidebarTab === 'settings') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? 'calc(1rem - 2px)' : '0', transition: 'all 0.2s' }} title="Post Details">
            <Info size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Post Details</span>}
          </button>
          <button onClick={() => handleSidebarTabClick('themes')} style={{ background: 'transparent', border: 'none', borderLeft: (showSidebar && activeSidebarTab === 'themes') ? '2px solid var(--color-teal)' : '2px solid transparent', color: (showSidebar && activeSidebarTab === 'themes') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? 'calc(1rem - 2px)' : '0', transition: 'all 0.2s' }} title="Themes">
            <Palette size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Themes</span>}
          </button>
          <button onClick={() => handleSidebarTabClick('shortcuts')} style={{ background: 'transparent', border: 'none', borderLeft: (showSidebar && activeSidebarTab === 'shortcuts') ? '2px solid var(--color-teal)' : '2px solid transparent', color: (showSidebar && activeSidebarTab === 'shortcuts') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? 'calc(1rem - 2px)' : '0', transition: 'all 0.2s' }} title="Shortcuts">
            <Keyboard size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Shortcuts</span>}
          </button>
          
          <div style={{ height: '1rem' }} /> {/* Spacer */}
          
          <button onClick={toggleEditor} style={{ background: 'transparent', border: 'none', borderLeft: showEditor ? '2px solid var(--color-teal)' : '2px solid transparent', color: showEditor ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? 'calc(1rem - 2px)' : '0', transition: 'all 0.2s' }} title={showEditor ? "Hide Markdown Editor (Ctrl+B)" : "Show Markdown Editor (Ctrl+B)"}>
            <FileEdit size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Editor</span>}
          </button>
          <button onClick={togglePreview} style={{ background: 'transparent', border: 'none', borderLeft: showPreview ? '2px solid var(--color-teal)' : '2px solid transparent', color: showPreview ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? 'calc(1rem - 2px)' : '0', transition: 'all 0.2s' }} title={showPreview ? "Hide Live Viewer (Ctrl+Alt+B)" : "Show Live Viewer (Ctrl+Alt+B)"}>
            <PanelRight size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Live Viewer</span>}
          </button>
        </div>
        
        {/* ACTION BUTTONS AT BOTTOM OF ACTIVITY BAR */}
        <div style={{ paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* PUSH TO REPO BUTTON */}
          {(() => {
            switch (fsManager.pushStatus) {
              case 'pushing':
                return (
                  <button style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--color-teal)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'not-allowed', opacity: 0.8 }} title="Pushing Notes to Repo..." disabled>
                    <Loader2 size={22} className="animate-spin" style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Pushing...</span>}
                  </button>
                );
              case 'success':
                return (
                  <button onClick={fsManager.handlePushToRepo} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--color-teal)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'pointer', transition: 'color 0.2s' }} title={fsManager.pushMessage || "Notes Pushed Successfully!"}>
                    <Check size={22} style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Pushed!</span>}
                  </button>
                );
              case 'error':
                return (
                  <button onClick={fsManager.handlePushToRepo} style={{ width: '100%', background: 'transparent', border: 'none', color: '#ef4444', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'pointer', transition: 'color 0.2s' }} title={fsManager.pushMessage ? `Push Failed: ${fsManager.pushMessage} (Click to Retry)` : "Push Failed (Click to Retry)"}>
                    <AlertCircle size={22} style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Retry Push</span>}
                  </button>
                );
              case 'idle':
              default:
                return (
                  <button onClick={fsManager.handlePushToRepo} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--color-zinc-400)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'pointer', transition: 'color 0.2s' }} title="Push Updated Notes to Repo" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-teal)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-zinc-400)'}>
                    <GitBranch size={22} style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Push Notes</span>}
                  </button>
                );
            }
          })()}

          {/* SAVE INDICATOR */}
          {(() => {
            switch (fsManager.saveStatus) {
              case 'saving':
                return (
                  <button style={{ width: '100%', background: 'transparent', border: 'none', color: '#a1a1aa', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'not-allowed', opacity: 0.8 }} title="Saving to Disk..." disabled>
                    <Loader2 size={22} className="animate-spin" style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Saving...</span>}
                  </button>
                );
              case 'saved':
                return (
                  <button onClick={fsManager.handleSaveToDisk} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--color-teal)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'pointer', transition: 'color 0.2s' }} title="Saved to Disk">
                    <Check size={22} style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Saved</span>}
                  </button>
                );
              case 'error':
                return (
                  <button onClick={fsManager.handleSaveToDisk} style={{ width: '100%', background: 'transparent', border: 'none', color: '#ef4444', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'pointer', transition: 'color 0.2s' }} title="Save Failed (Click to Retry)">
                    <AlertCircle size={22} style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Retry Save</span>}
                  </button>
                );
              case 'unsaved':
              default:
                return (
                  <button onClick={fsManager.handleSaveToDisk} style={{ width: '100%', background: 'transparent', border: 'none', color: '#a1a1aa', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', cursor: 'pointer', transition: 'color 0.2s' }} title="Unsaved Changes (Click to Save)">
                    <Save size={22} style={{ minWidth: '22px' }} />
                    {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Save to Disk</span>}
                  </button>
                );
            }
          })()}
        </div>
      </div>

      {showSidebar && (
        <div ref={sidebarContainerRef} style={{ width: `${sidebarWidth}px`, height: '100%', flexShrink: 0, display: 'flex' }}>
          <Sidebar 
            width={sidebarWidth} 
            fsManager={fsManager} 
            activeSidebarTab={activeSidebarTab}
          />
        </div>
      )}
      
      {showSidebar && (showEditor || showPreview) && <Resizer onMouseDown={startSidebarDragging} />}

      {/* MAIN CONTENT AREA (EDITOR + PREVIEW) */}
      {(showEditor || showPreview) && (
        <div 
          ref={mainContentRef} 
          style={{ flex: 1, display: 'flex', minWidth: 0, height: '100%', overflow: 'hidden' }}
        >
          {showEditor && (
            <div ref={editorPaneRef} style={{ width: showPreview ? `${editorWidth}%` : '100%', flex: showPreview ? 'none' : 1, display: 'flex', flexDirection: 'column' }}>
              {fsManager.activeFile && (
                 <Editor 
                   value={fsManager.activeFile.body} 
                   onChange={(body) => fsManager.updateActiveFile({ body })} 
                   onImagePaste={handleImagePaste} 
                   onToggleEditor={toggleEditor}
                   onTogglePreview={togglePreview}
                   onToggleExplorer={toggleFileExplorer}
                 />
              )}
            </div>
          )}
          
          {showEditor && showPreview && <Resizer onMouseDown={startDragging} />}
          
          {showPreview && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {fsManager.activeFile && (
                 <Preview 
                   content={fsManager.activeFile.body} 
                   frontmatter={fsManager.activeFile.frontmatter} 
                   activeFileId={fsManager.activeFile.id}
                   headings={headings}
                   activeHeadingId={activeHeadingId}
                   onHeadingClick={setActiveHeadingId}
                   onHeadingsChange={setHeadings} 
                 />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LocalApp() {
  const fsManager = useFileSystem();
  return <MainApp fsManager={fsManager} />;
}

function CloudApp() {
  const fsManager = useGitHubFileSystem();
  return <MainApp fsManager={fsManager} />;
}

function App() {
  const isProd = import.meta.env.PROD;
  return isProd ? <CloudApp /> : <LocalApp />;
}

export default App;
