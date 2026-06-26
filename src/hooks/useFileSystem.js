import { useState, useEffect } from 'react';
import { generateMarkdown, parseMarkdownFile } from '../utils/markdown';

const DEFAULT_BODY = `
# Introduction
Your markdown content starts here...

## Key Challenges
More markdown elements...

### Data Indexing
Let's talk about vectors.
`;

export function useFileSystem() {
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
  const [emptyFolders, setEmptyFolders] = useState([]);
  
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const loadedFiles = [];
          const loadedEmptyFolders = [];
          data.forEach(d => {
            if (d.isEmptyFolder) {
              loadedEmptyFolders.push(d.name);
            } else {
              const parsed = parseMarkdownFile(d.content);
              loadedFiles.push({ id: d.filename, frontmatter: parsed.frontmatter, body: parsed.body });
            }
          });
          if (loadedFiles.length > 0) {
            setFiles(loadedFiles);
            setActiveFileId(loadedFiles[0].id);
          }
          setEmptyFolders(loadedEmptyFolders);
        }
      })
      .catch(err => console.error("Could not load local files", err));
  }, []);

  const updateActiveFile = (updates) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, ...updates } : f));
  };

  const createNewFile = () => {
    let slug = prompt("Enter post URL slug (e.g., my-new-post):");
    if (!slug) return;
    slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (files.find(f => f.id === slug) || emptyFolders.includes(slug)) {
       alert("That name already exists!"); return;
    }
    const newFile = {
      id: slug,
      frontmatter: {
        title: slug.replace(/-/g, ' '),
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

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = parseMarkdownFile(event.target.result);
      const newFile = { id: Date.now().toString(), frontmatter: parsed.frontmatter, body: parsed.body };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
    };
    reader.readAsText(file);
  };

  const createNewFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;
    setEmptyFolders(prev => [...prev, folderName]);
    try {
      await fetch('/api/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName })
      });
    } catch (e) { console.error(e); }
  };

  const deleteItem = async (e, targetId, isFile) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to completely delete "${targetId}"?`)) return;
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetId })
      });
      if (res.ok) {
        if (isFile) {
           setFiles(prev => prev.filter(f => f.id !== targetId));
           if (activeFileId === targetId) {
             const remaining = files.filter(f => f.id !== targetId);
             setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
           }
        } else {
           setEmptyFolders(prev => prev.filter(f => f !== targetId));
        }
      }
    } catch (err) { console.error(err); }
  };

  const renameItem = async (e, oldName, isFile) => {
    e.stopPropagation();
    const newName = prompt("Enter new name:", oldName);
    if (!newName || newName === oldName) return;
    const cleanName = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (files.find(f => f.id === cleanName) || emptyFolders.includes(cleanName)) {
      alert("A folder with that name already exists!"); return null;
    }
    try {
      const res = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: cleanName })
      });
      if (res.ok) {
        if (isFile) {
           setFiles(prev => prev.map(f => f.id === oldName ? { ...f, id: cleanName } : f));
           if (activeFileId === oldName) setActiveFileId(cleanName);
        } else {
           setEmptyFolders(prev => prev.map(f => f === oldName ? cleanName : f));
        }
        return { success: true, oldName, cleanName };
      } else { alert("Failed to rename on disk"); return null; }
    } catch (err) { console.error(err); return null; }
  };

  const handleSaveToDisk = async () => {
    const slug = activeFile.id;
    const fullMarkdown = generateMarkdown(activeFile.frontmatter, activeFile.body);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content: fullMarkdown })
      });
      if (res.ok) { alert(`Saved successfully to src/content/blog/${slug}/${slug}.md`); } 
      else { alert('Failed to save file'); }
    } catch (e) { alert("Error saving file: " + e.message); }
  };

  return {
    files, emptyFolders, activeFileId, setActiveFileId, activeFile,
    updateActiveFile, createNewFile, handleFileUpload, createNewFolder,
    deleteItem, renameItem, handleSaveToDisk
  };
}
