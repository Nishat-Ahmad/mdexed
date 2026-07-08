import React, { useState, useEffect, useRef } from 'react';
import { Menu, Files, Info, FileEdit, PanelRight, Save, Loader2, Check, AlertCircle, Keyboard, Palette } from 'lucide-react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Resizer from './components/Resizer';
import { useFileSystem } from './hooks/useFileSystem';
import { useGitHubFileSystem } from './hooks/useGitHubFileSystem';
import './index.css';

function MainApp({ fsManager }) {
  const [headings, setHeadings] = useState([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  
  const [editorWidth, setEditorWidth] = useState(50);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  
  const [isActivityBarExpanded, setIsActivityBarExpanded] = useState(false);

  const handleSidebarTabClick = (tab) => {
    if (showSidebar && activeSidebarTab === tab) {
      setShowSidebar(false);
    } else {
      setActiveSidebarTab(tab);
      setShowSidebar(true);
    }
  };
  
  const isDragging = useRef(false);
  const isSidebarDragging = useRef(false);

  // Editor Resizer Logic
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
    const availableWidth = window.innerWidth - (showSidebar ? sidebarWidth : 0);
    const newWidth = ((e.clientX - (showSidebar ? sidebarWidth : 0)) / availableWidth) * 100;
    if (newWidth >= 10 && newWidth <= 90) setEditorWidth(newWidth);
  };

  const stopDragging = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Sidebar Resizer Logic
  const startSidebarDragging = (e) => {
    e.preventDefault();
    isSidebarDragging.current = true;
    document.addEventListener('mousemove', onSidebarDrag);
    document.addEventListener('mouseup', stopSidebarDragging);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const onSidebarDrag = (e) => {
    if (!isSidebarDragging.current) return;
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 800) setSidebarWidth(newWidth);
  };

  const stopSidebarDragging = () => {
    isSidebarDragging.current = false;
    document.removeEventListener('mousemove', onSidebarDrag);
    document.removeEventListener('mouseup', stopSidebarDragging);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
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

          <button onClick={() => handleSidebarTabClick('explorer')} style={{ background: 'transparent', border: 'none', color: (showSidebar && activeSidebarTab === 'explorer') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', transition: 'color 0.2s' }} title="Explorer">
            <Files size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Files</span>}
          </button>
          <button onClick={() => handleSidebarTabClick('settings')} style={{ background: 'transparent', border: 'none', color: (showSidebar && activeSidebarTab === 'settings') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', transition: 'color 0.2s' }} title="Post Details">
            <Info size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Post Details</span>}
          </button>
          <button onClick={() => handleSidebarTabClick('themes')} style={{ background: 'transparent', border: 'none', color: (showSidebar && activeSidebarTab === 'themes') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', transition: 'color 0.2s' }} title="Themes">
            <Palette size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Themes</span>}
          </button>
          <button onClick={() => handleSidebarTabClick('shortcuts')} style={{ background: 'transparent', border: 'none', color: (showSidebar && activeSidebarTab === 'shortcuts') ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', transition: 'color 0.2s' }} title="Shortcuts">
            <Keyboard size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Shortcuts</span>}
          </button>
          
          <div style={{ height: '1rem' }} /> {/* Spacer */}
          
          <button onClick={() => setShowEditor(!showEditor)} style={{ background: 'transparent', border: 'none', color: showEditor ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', transition: 'color 0.2s' }} title={showEditor ? "Hide Markdown Editor" : "Show Markdown Editor"}>
            <FileEdit size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Editor</span>}
          </button>
          <button onClick={() => setShowPreview(!showPreview)} style={{ background: 'transparent', border: 'none', color: showPreview ? 'var(--color-teal)' : 'var(--color-zinc-400)', cursor: 'pointer', padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: isActivityBarExpanded ? 'flex-start' : 'center', paddingLeft: isActivityBarExpanded ? '1rem' : '0', transition: 'color 0.2s' }} title={showPreview ? "Hide Live Viewer" : "Show Live Viewer"}>
            <PanelRight size={22} style={{ minWidth: '22px' }} />
            {isActivityBarExpanded && <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', fontWeight: 500 }}>Live Viewer</span>}
          </button>
        </div>
        
        {/* SAVE INDICATOR AT BOTTOM OF ACTIVITY BAR */}
        <div style={{ paddingBottom: '0.5rem' }}>
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
        <Sidebar 
          width={sidebarWidth} 
          fsManager={fsManager} 
          headings={headings} 
          activeHeadingId={activeHeadingId} 
          activeSidebarTab={activeSidebarTab}
        />
      )}
      
      {showSidebar && (showEditor || showPreview) && <Resizer onMouseDown={startSidebarDragging} />}

      {/* MIDDLE PANE - EDITOR */}
      {showEditor && (
        <div style={{ width: showPreview ? `${editorWidth}%` : 'auto', flex: showPreview ? 'none' : 1, display: 'flex', flexDirection: 'column' }}>
          {fsManager.activeFile && (
             <Editor 
               value={fsManager.activeFile.body} 
               onChange={(body) => fsManager.updateActiveFile({ body })} 
               onImagePaste={handleImagePaste} 
             />
          )}
        </div>
      )}
      
      {showEditor && showPreview && <Resizer onMouseDown={startDragging} />}
      
      {/* RIGHT PANE - PREVIEW */}
      {showPreview && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {fsManager.activeFile && (
             <Preview 
               content={fsManager.activeFile.body} 
               frontmatter={fsManager.activeFile.frontmatter} 
               onHeadingsChange={setHeadings} 
             />
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
