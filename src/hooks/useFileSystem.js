import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving', 'error'
  const [folderImages, setFolderImages] = useState({});
  
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  
  const filesRef = useRef(files);
  filesRef.current = files;

  const lastSavedContentRef = useRef({
    'default-1': generateMarkdown(
      {
        title: "Building Scalable RAG Architectures",
        date: "Sep 05, 2025",
        readTime: "8 min read",
        summary: "An in-depth guide to building scalable, production-ready retrieval-augmented generation pipelines.",
        tags: ["AI", "Vector DBs", "FastAPI"]
      },
      DEFAULT_BODY
    )
  });
  
  const prevActiveFileIdRef = useRef(activeFileId);

  const loadFiles = useCallback(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const loadedFiles = [];
          const loadedEmptyFolders = [];
          const savedMap = {};
          const loadedFolderImages = {};
          data.forEach(d => {
            if (d.isEmptyFolder) {
              loadedEmptyFolders.push(d.name);
              loadedFolderImages[d.name] = d.images || [];
            } else {
              const parsed = parseMarkdownFile(d.content);
              loadedFiles.push({ id: d.filename, frontmatter: parsed.frontmatter, body: parsed.body });
              savedMap[d.filename] = d.content;
              
              // Map images to the folder path rather than the file ID
              const folderPath = d.filename.includes('/') 
                ? d.filename.split('/').slice(0, -1).join('/') 
                : d.filename;
                
              if (!loadedFolderImages[folderPath]) {
                loadedFolderImages[folderPath] = [];
              }
              const imgs = d.images || [];
              imgs.forEach(img => {
                if (!loadedFolderImages[folderPath].includes(img)) {
                  loadedFolderImages[folderPath].push(img);
                }
              });
            }
          });
          lastSavedContentRef.current = savedMap;
          setFolderImages(loadedFolderImages);
          if (loadedFiles.length > 0) {
            setFiles(loadedFiles);
            setActiveFileId(currentId => {
              if (currentId && loadedFiles.some(f => f.id === currentId)) {
                prevActiveFileIdRef.current = currentId;
                return currentId;
              }
              prevActiveFileIdRef.current = loadedFiles[0].id;
              return loadedFiles[0].id;
            });
          }
          setEmptyFolders(loadedEmptyFolders);
        }
      })
      .catch(err => console.error("Could not load local files", err));
  }, []);

  // Load files from disk initially
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const saveFileContent = useCallback(async (slug, content) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content })
      });
      if (res.ok) {
        lastSavedContentRef.current[slug] = content;
        if (activeFileId === slug) {
          setSaveStatus('saved');
        }
        return true;
      } else {
        setSaveStatus('error');
        return false;
      }
    } catch (e) {
      console.error("Autosave error", e);
      setSaveStatus('error');
      return false;
    }
  }, [activeFileId]);

  // Debounced Autosave Effect
  useEffect(() => {
    if (!activeFile) return;

    const currentContent = generateMarkdown(activeFile.frontmatter, activeFile.body);
    const lastSaved = lastSavedContentRef.current[activeFile.id];

    // If activeFileId changed, save the previous file immediately if it was unsaved
    if (prevActiveFileIdRef.current !== activeFile.id) {
      const prevId = prevActiveFileIdRef.current;
      const prevFile = filesRef.current.find(f => f.id === prevId);
      if (prevFile) {
        const prevContent = generateMarkdown(prevFile.frontmatter, prevFile.body);
        const prevLastSaved = lastSavedContentRef.current[prevId];
        if (prevContent !== prevLastSaved) {
          saveFileContent(prevId, prevContent);
        }
      }
      prevActiveFileIdRef.current = activeFile.id;
      
      // Update status for the new file
      if (currentContent === lastSaved) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('unsaved');
      }
      return;
    }

    // If content is same as last saved, it's saved
    if (currentContent === lastSaved) {
      setSaveStatus('saved');
      return;
    }

    // Content is different, mark as unsaved and set up a debounce timer
    setSaveStatus('unsaved');

    const delayDebounceFn = setTimeout(() => {
      saveFileContent(activeFile.id, currentContent);
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(delayDebounceFn);
  }, [activeFileId, activeFile, saveFileContent]);

  const updateActiveFile = (updates) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, ...updates } : f));
  };

  const createNewFile = (parentFolder = '') => {
    let slug = prompt("Enter post URL slug (e.g., my-new-post):");
    if (!slug) return;
    slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const fullSlug = parentFolder ? `${parentFolder}/${slug}` : slug;
    if (files.find(f => f.id === fullSlug) || emptyFolders.includes(fullSlug)) {
       alert("That name already exists!"); return;
     }
    const newFile = {
      id: fullSlug,
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

  const createNewFolder = async (parentFolder = '') => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;
    const cleanFolderName = folderName.toLowerCase().replace(/[^a-z0-9/]+/g, '-').replace(/(^-|-$)+/g, '');
    const fullFolderName = parentFolder ? `${parentFolder}/${cleanFolderName}` : cleanFolderName;
    
    if (emptyFolders.includes(fullFolderName) || files.some(f => f.id.startsWith(fullFolderName + '/'))) {
      alert("A folder with that name already exists!");
      return;
    }
    
    setEmptyFolders(prev => [...prev, fullFolderName]);
    try {
      await fetch('/api/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: fullFolderName })
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
           delete lastSavedContentRef.current[targetId];
           if (activeFileId === targetId) {
             const remaining = files.filter(f => f.id !== targetId);
             setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
           }
        } else {
           setEmptyFolders(prev => prev.filter(f => f !== targetId && !f.startsWith(targetId + '/')));
           setFiles(prev => {
             const remaining = prev.filter(f => f.id !== targetId && !f.id.startsWith(targetId + '/'));
             
             // Check if active file was in the deleted folder
             if (activeFileId === targetId || activeFileId?.startsWith(targetId + '/')) {
                setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
             }
             
             return remaining;
           });
        }
      }
    } catch (err) { console.error(err); }
  };

  const renameItem = async (e, oldName, isFile) => {
    e.stopPropagation();
    const parts = oldName.split('/');
    const currentBaseName = parts[parts.length - 1];
    
    const newBaseName = prompt("Enter new name:", currentBaseName);
    if (!newBaseName || newBaseName === currentBaseName) return;
    
    const cleanBaseName = newBaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const parentPath = parts.slice(0, -1).join('/');
    const cleanName = parentPath ? `${parentPath}/${cleanBaseName}` : cleanBaseName;
    
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
           
           // Update refs for renaming
           lastSavedContentRef.current[cleanName] = lastSavedContentRef.current[oldName];
           delete lastSavedContentRef.current[oldName];
           if (prevActiveFileIdRef.current === oldName) {
             prevActiveFileIdRef.current = cleanName;
           }

           if (activeFileId === oldName) setActiveFileId(cleanName);
        } else {
           setEmptyFolders(prev => prev.map(f => f === oldName ? cleanName : f));
        }
        return { success: true, oldName, cleanName };
      } else { alert("Failed to rename on disk"); return null; }
    } catch (err) { console.error(err); return null; }
  };

  const handleSaveToDisk = async () => {
    if (!activeFile) return;
    const slug = activeFile.id;
    const currentContent = generateMarkdown(activeFile.frontmatter, activeFile.body);
    await saveFileContent(slug, currentContent);
  };

  const uploadImage = async (folderName, file, fileName) => {
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-Folder-Name': encodeURIComponent(folderName),
          'X-File-Name': encodeURIComponent(fileName)
        },
        body: file
      });
      if (res.ok) {
        await loadFiles();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const renameImage = async (folderName, oldImageName) => {
    const ext = oldImageName.substring(oldImageName.lastIndexOf('.'));
    const baseName = oldImageName.substring(0, oldImageName.lastIndexOf('.'));
    
    const newBaseName = prompt("Enter new name for image:", baseName);
    if (!newBaseName || newBaseName === baseName) return null;
    
    const cleanBaseName = newBaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const cleanNewName = `${cleanBaseName}${ext}`;
    
    try {
      const res = await fetch('/api/rename-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName, oldImageName, newImageName: cleanNewName })
      });
      if (res.ok) {
        const data = await res.json();
        const finalName = data.newName || cleanNewName;
        
        // Scan active file body and replace image reference
        if (activeFile && activeFile.body.includes(oldImageName)) {
          const updatedBody = activeFile.body.replaceAll(oldImageName, finalName);
          updateActiveFile({ body: updatedBody });
        }
        
        await loadFiles();
        return finalName;
      } else {
        const errText = await res.text();
        alert(`Failed to rename image: ${errText}`);
        return null;
      }
    } catch (err) {
      alert(`Failed to rename image: ${err.message}`);
      return null;
    }
  };

  return {
    files, emptyFolders, activeFileId, setActiveFileId, activeFile,
    updateActiveFile, createNewFile, handleFileUpload, createNewFolder,
    deleteItem, renameItem, handleSaveToDisk, saveStatus,
    folderImages, loadFiles, uploadImage, renameImage
  };
}
