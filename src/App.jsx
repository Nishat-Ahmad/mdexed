import React, { useState, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Resizer from './components/Resizer';
import { useFileSystem } from './hooks/useFileSystem';
import './index.css';

function App() {
  const fsManager = useFileSystem();
  
  const [headings, setHeadings] = useState([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  
  const [editorWidth, setEditorWidth] = useState(50);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  
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
    const availableWidth = window.innerWidth - sidebarWidth;
    const newWidth = ((e.clientX - sidebarWidth) / availableWidth) * 100;
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

  return (
    <div className="app-container">
      <Sidebar 
        width={sidebarWidth} 
        fsManager={fsManager} 
        headings={headings} 
        activeHeadingId={activeHeadingId} 
      />
      
      <Resizer onMouseDown={startSidebarDragging} />

      {/* MIDDLE PANE - EDITOR */}
      <div style={{ width: `${editorWidth}%`, flex: 'none', display: 'flex', flexDirection: 'column' }}>
        {fsManager.activeFile && (
           <Editor value={fsManager.activeFile.body} onChange={(body) => fsManager.updateActiveFile({ body })} />
        )}
      </div>
      
      <Resizer onMouseDown={startDragging} />
      
      {/* RIGHT PANE - PREVIEW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {fsManager.activeFile && (
           <Preview content={fsManager.activeFile.body} frontmatter={fsManager.activeFile.frontmatter} onHeadingsChange={setHeadings} />
        )}
      </div>
    </div>
  );
}

export default App;
