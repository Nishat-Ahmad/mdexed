import React, { useState, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Resizer from './components/Resizer';
import { useFileSystem } from './hooks/useFileSystem';
import { useGitHubFileSystem } from './hooks/useGitHubFileSystem';
import './index.css';

function App() {
  const isProd = import.meta.env.PROD;
  const localFsManager = useFileSystem();
  const githubFsManager = useGitHubFileSystem();
  const fsManager = isProd ? githubFsManager : localFsManager;

  
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
           <Editor 
             value={fsManager.activeFile.body} 
             onChange={(body) => fsManager.updateActiveFile({ body })} 
             onImagePaste={handleImagePaste} 
           />
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
