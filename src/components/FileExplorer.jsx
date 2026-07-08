import React, { useState, useRef } from 'react';
import { ChevronDown, Folder, FolderOpen, FileText, Image, Trash2, Edit2, Upload, FolderPlus, Plus } from 'lucide-react';

const buildExplorerTree = (files, emptyFolders, folderImages) => {
  const root = { name: 'root', path: '', type: 'folder', children: [], images: [] };

  const getOrCreateFolder = (pathParts) => {
    let current = root;
    let currentPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let nextNode = current.children.find(c => c.name === part && c.type === 'folder');
      if (!nextNode) {
        nextNode = {
          name: part,
          path: currentPath,
          type: 'folder',
          children: [],
          images: folderImages[currentPath] || []
        };
        current.children.push(nextNode);
      }
      current = nextNode;
    }
    return current;
  };

  // Add empty folders
  emptyFolders.forEach(folderPath => {
    const parts = folderPath.split('/');
    getOrCreateFolder(parts);
  });

  // Add files
  files.forEach(file => {
    if (file.id.includes('/')) {
      // Nested files go directly inside their parent folder
      const parts = file.id.split('/');
      const parentParts = parts.slice(0, -1);
      const fileName = `${parts[parts.length - 1]}.md`;
      
      const parentFolderNode = getOrCreateFolder(parentParts);
      parentFolderNode.children.push({
        name: fileName,
        path: file.id,
        type: 'file',
        file: file
      });
    } else {
      // Top-level files are folder-per-post
      const postFolderNode = getOrCreateFolder([file.id]);
      const fileName = `${file.id}.md`;
      postFolderNode.children.push({
        name: fileName,
        path: file.id,
        type: 'file',
        file: file
      });
    }
  });

  return root;
};

export default function FileExplorer({ fsManager }) {
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploadTargetFolder, setUploadTargetFolder] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const {
    files,
    emptyFolders,
    activeFileId,
    setActiveFileId,
    createNewFolder,
    createNewFile,
    handleFileUpload,
    deleteItem,
    renameItem,
    folderImages,
    loadFiles,
    renameImage
  } = fsManager;

  // Auto-select folder when active file changes
  React.useEffect(() => {
    if (activeFileId) {
      if (activeFileId.includes('/')) {
        setSelectedFolder(activeFileId.split('/').slice(0, -1).join('/'));
      } else {
        setSelectedFolder(activeFileId);
      }
    }
  }, [activeFileId]);

  // Global paste handler to paste images directly into the selected folder
  React.useEffect(() => {
    const handlePaste = async (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if (!activeEl.classList.contains('inputarea')) {
          return;
        }
      }

      if (!selectedFolder) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      let imageFile = null;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          imageFile = item.getAsFile();
          break;
        }
      }

      if (!imageFile) return;

      e.preventDefault();

      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const defaultName = `pasted-image-${timestamp}.png`;
      const fileName = prompt(`Paste clipboard image into folder "${selectedFolder}":\nEnter filename:`, defaultName);
      if (!fileName) return;

      const cleanFileName = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.gif') || fileName.endsWith('.webp')
        ? fileName
        : `${fileName}.png`;

      const success = await fsManager.uploadImage(selectedFolder, imageFile, cleanFileName);
      if (success) {
        alert(`Successfully pasted and saved "${cleanFileName}" inside "${selectedFolder}"`);
      } else {
        alert(`Failed to save pasted image in "${selectedFolder}"`);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [selectedFolder, fsManager]);

  const toggleFolder = (folderName) => {
    setCollapsedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const handleRename = async (e, oldName, isFile) => {
    const res = await renameItem(e, oldName, isFile);
    if (res && res.success) {
      setCollapsedFolders(prev => {
        const updated = { ...prev, [res.cleanName]: prev[res.oldName] };
        delete updated[res.oldName];
        return updated;
      });
    }
  };

  const handleImageUploadClick = (e, folderName) => {
    e.stopPropagation();
    setUploadTargetFolder(folderName);
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadTargetFolder) return;
    
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-Folder-Name': encodeURIComponent(uploadTargetFolder),
          'X-File-Name': encodeURIComponent(file.name)
        },
        body: file
      });
      if (res.ok) {
        alert(`Successfully uploaded "${file.name}" to folder "${uploadTargetFolder}"`);
        await loadFiles();
      } else {
        const errText = await res.text();
        alert(`Failed to upload image: ${errText}`);
      }
    } catch (err) {
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      e.target.value = '';
      setUploadTargetFolder(null);
    }
  };

  const handleDeleteImage = async (e, folderName, imageName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the image "${imageName}"?`)) return;
    
    try {
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName, imageName })
      });
      if (res.ok) {
        await loadFiles();
      } else {
        const errText = await res.text();
        alert(`Failed to delete image: ${errText}`);
      }
    } catch (err) {
      alert(`Failed to delete image: ${err.message}`);
    }
  };

  const tree = buildExplorerTree(files, emptyFolders, folderImages);

  const renderNode = (node, level = 0) => {
    if (node.type === 'file') {
      const isActive = node.path === activeFileId;
      return (
        <div 
          key={node.path + '-file'}
          onClick={() => setActiveFileId(node.path)} 
          className={`file-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${level * 16 + 36}px`, marginTop: '0.125rem', display: 'flex', alignItems: 'center' }}
        >
          <FileText size={14} style={{ minWidth: '14px', marginRight: '0.375rem' }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          <Edit2 
            size={12} 
            className="action-btn btn-edit"
            onClick={(e) => handleRename(e, node.path, true)} 
            style={{ marginRight: '0.25rem' }}
          />
          <Trash2 
            size={12} 
            className="action-btn btn-danger"
            onClick={(e) => deleteItem(e, node.path, true)} 
          />
        </div>
      );
    }

    if (node.type === 'folder') {
      if (node.path === '') {
        const sortedChildren = [...node.children].sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
        });
        return sortedChildren.map(child => renderNode(child, level));
      }

      const isCollapsed = collapsedFolders[node.path];
      const images = folderImages[node.path] || [];
      const isSelected = selectedFolder === node.path;

      const sortedChildren = [...node.children].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });

      return (
        <div key={node.path} style={{ marginBottom: '0.25rem' }}>
          <div 
            className={`folder-row ${isSelected ? 'selected' : ''}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.375rem', 
              color: 'var(--color-zinc-300)', 
              fontSize: '0.8125rem', 
              padding: `0.25rem 0.5rem 0.25rem ${level * 16 + 24}px`, 
              cursor: 'pointer',
              borderLeft: isSelected ? '2px solid var(--color-teal)' : '2px solid transparent',
              backgroundColor: isSelected ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
              transition: 'background-color 0.15s ease, border-left 0.15s ease'
            }}
            onClick={(e) => {
              toggleFolder(node.path);
              setSelectedFolder(node.path);
            }}
          >
            <div style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
              <ChevronDown size={12} style={{ color: isSelected ? 'var(--color-teal)' : 'var(--color-zinc-500)' }} /> 
            </div>
            {isCollapsed ? (
               <Folder size={12} style={{ color: isSelected ? 'var(--color-teal)' : 'var(--color-zinc-400)' }} />
            ) : (
               <FolderOpen size={12} style={{ color: isSelected ? 'var(--color-teal)' : 'var(--color-zinc-400)' }} />
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSelected ? 700 : 400, color: isSelected ? 'var(--color-teal)' : 'inherit' }}>
              {node.name}
            </span>
            <Plus
              size={12}
              className="action-btn btn-create"
              onClick={(e) => {
                e.stopPropagation();
                createNewFile(node.path);
              }}
              style={{ marginRight: '0.25rem' }}
              title="Create Markdown under this folder"
            />
            <FolderPlus
              size={12}
              className="action-btn btn-create"
              onClick={(e) => {
                e.stopPropagation();
                createNewFolder(node.path);
              }}
              style={{ marginRight: '0.25rem' }}
              title="Create subfolder under this folder"
            />
            <Image
              size={12}
              className="action-btn btn-upload"
              onClick={(e) => handleImageUploadClick(e, node.path)}
              style={{ marginRight: '0.25rem' }}
              title="Upload Image"
            />
            <Edit2 
              size={12} 
              className="action-btn btn-edit"
              onClick={(e) => handleRename(e, node.path, false)} 
              style={{ marginRight: '0.25rem' }}
            />
            <Trash2 
              size={12} 
              className="action-btn btn-danger"
              onClick={(e) => deleteItem(e, node.path, false)} 
            />
          </div>

          {!isCollapsed && (
            <div>
              {/* Render subfolders & files */}
              {sortedChildren.map(child => renderNode(child, level + 1))}
              
              {/* Render images in this folder */}
              {images.map(img => (
                <div 
                  key={node.path + '/' + img} 
                  className="file-item"
                  style={{ paddingLeft: `${(level + 1) * 16 + 36}px`, marginTop: '0.125rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setViewingImage(img)}
                >
                  <Image size={14} style={{ minWidth: '14px', marginRight: '0.375rem', color: 'var(--color-teal)' }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img}</span>
                  <Edit2 
                    size={12} 
                    className="action-btn btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      renameImage(node.path, img);
                    }}
                    style={{ marginRight: '0.25rem' }}
                  />
                  <Trash2 
                    size={12} 
                    className="action-btn btn-danger"
                    onClick={(e) => handleDeleteImage(e, node.path, img)} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--color-zinc-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-zinc-400)', fontWeight: 700, letterSpacing: '0.05em' }}>FILES</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            type="file" 
            accept=".md,.mdx" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={(e) => {
              handleFileUpload(e.target.files[0]);
              e.target.value = '';
            }} 
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={imageInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImageFileChange} 
          />
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: 0, display: 'flex' }} title="Open File">
            <Upload size={16} />
          </button>
          <button onClick={() => createNewFolder('')} style={{ background: 'none', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: 0, display: 'flex' }} title="New Folder">
            <FolderPlus size={16} />
          </button>
          <button onClick={() => createNewFile('')} style={{ background: 'none', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: 0, display: 'flex' }} title="New File">
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}
          onClick={() => toggleFolder('root')}
        >
          <div style={{ transform: collapsedFolders['root'] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
            <ChevronDown size={14} style={{ color: 'var(--color-zinc-400)' }} /> 
          </div>
          {collapsedFolders['root'] ? (
            <Folder size={14} style={{ color: 'var(--color-teal)' }} />
          ) : (
            <FolderOpen size={14} style={{ color: 'var(--color-teal)' }} />
          )}
          src/content/blog
        </div>
        
        {!collapsedFolders['root'] && renderNode(tree)}
      </div>

      {selectedFolder && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-zinc-800)', fontSize: '0.7rem', color: 'var(--color-zinc-400)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-teal)' }} />
          <span>Active target: <strong>{selectedFolder}</strong>. Press <strong>Ctrl+V</strong> to paste image.</span>
        </div>
      )}

      {viewingImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
          onClick={() => setViewingImage(null)}
        >
          <img 
            src={`/${viewingImage}`} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }} 
            alt={viewingImage}
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--color-zinc-900)', border: '1px solid var(--color-zinc-800)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => setViewingImage(null)}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-zinc-800)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-zinc-900)'}
            title="Close Image"
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1, marginTop: '-2px' }}>&times;</span>
          </button>
        </div>
      )}
    </div>
  );
}
