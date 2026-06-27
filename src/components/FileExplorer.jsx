import React, { useState, useRef } from 'react';
import { ChevronDown, Folder, FolderOpen, FileText, Image, Trash2, Edit2, Upload, FolderPlus, Plus } from 'lucide-react';

export default function FileExplorer({ fsManager }) {
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [uploadTargetFolder, setUploadTargetFolder] = useState(null);
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
    loadFiles
  } = fsManager;

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
          <button onClick={createNewFolder} style={{ background: 'none', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: 0, display: 'flex' }} title="New Folder">
            <FolderPlus size={16} />
          </button>
          <button onClick={createNewFile} style={{ background: 'none', border: 'none', color: 'var(--color-zinc-400)', cursor: 'pointer', padding: 0, display: 'flex' }} title="New File">
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
        
        {/* Render Empty Folders */}
        {!collapsedFolders['root'] && emptyFolders.map(folderName => {
          const isCollapsed = collapsedFolders[folderName];
          const images = folderImages[folderName] || [];
          return (
            <div key={folderName} style={{ marginBottom: '0.5rem' }}>
              <div 
                className="folder-row"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-zinc-300)', fontSize: '0.8125rem', padding: '0.25rem 0.5rem 0.25rem 1.5rem', cursor: 'pointer' }}
                onClick={() => toggleFolder(folderName)}
              >
                <div style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
                  <ChevronDown size={12} style={{ color: 'var(--color-zinc-500)' }} /> 
                </div>
                {isCollapsed ? (
                   <Folder size={12} style={{ color: 'var(--color-zinc-400)' }} />
                ) : (
                   <FolderOpen size={12} style={{ color: 'var(--color-zinc-400)' }} />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folderName}</span>
                <Image
                  size={12}
                  className="hover-trash"
                  onClick={(e) => handleImageUploadClick(e, folderName)}
                  style={{ marginRight: '0.25rem' }}
                  title="Upload Image"
                />
                <Edit2 
                  size={12} 
                  className="hover-trash"
                  onClick={(e) => handleRename(e, folderName, false)} 
                  style={{ marginRight: '0.25rem' }}
                />
                <Trash2 
                  size={12} 
                  className="hover-trash"
                  onClick={(e) => deleteItem(e, folderName, false)} 
                />
              </div>

              {/* Render folder images */}
              {!isCollapsed && images.map(img => (
                <div 
                  key={img} 
                  className="file-item"
                  style={{ paddingLeft: '2.75rem', marginTop: '0.125rem', display: 'flex', alignItems: 'center', cursor: 'default' }}
                >
                  <Image size={14} style={{ minWidth: '14px', marginRight: '0.375rem', color: 'var(--color-teal)' }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img}</span>
                  <Trash2 
                    size={12} 
                    className="hover-trash"
                    onClick={(e) => handleDeleteImage(e, folderName, img)} 
                  />
                </div>
              ))}
            </div>
          );
        })}
        
        {/* Render Files (and their folders) */}
        {!collapsedFolders['root'] && files.map(f => {
          const isActive = f.id === activeFileId;
          const slug = f.id;
          const isCollapsed = collapsedFolders[slug];
          const images = folderImages[slug] || [];
          
          return (
            <div key={f.id} style={{ marginBottom: '0.5rem' }}>
              {/* Nested Post Folder */}
              <div 
                className="folder-row"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-zinc-300)', fontSize: '0.8125rem', padding: '0.25rem 0.5rem 0.25rem 1.5rem', cursor: 'pointer' }}
                onClick={() => toggleFolder(slug)}
              >
                <div style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
                  <ChevronDown size={12} style={{ color: 'var(--color-zinc-500)' }} /> 
                </div>
                {isCollapsed ? (
                   <Folder size={12} style={{ color: 'var(--color-zinc-400)' }} />
                ) : (
                   <FolderOpen size={12} style={{ color: 'var(--color-zinc-400)' }} />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slug}</span>
                <Image
                  size={12}
                  className="hover-trash"
                  onClick={(e) => handleImageUploadClick(e, slug)}
                  style={{ marginRight: '0.25rem' }}
                  title="Upload Image"
                />
                <Edit2 
                  size={12} 
                  className="hover-trash"
                  onClick={(e) => handleRename(e, slug, true)} 
                  style={{ marginRight: '0.25rem' }}
                />
                <Trash2 
                  size={12} 
                  className="hover-trash"
                  onClick={(e) => deleteItem(e, slug, true)} 
                />
              </div>
              
              {/* Markdown File and Images */}
              {!isCollapsed && (
                <>
                  <div 
                    onClick={() => setActiveFileId(f.id)} 
                    className={`file-item ${isActive ? 'active' : ''}`}
                    style={{ paddingLeft: '2.75rem', marginTop: '0.125rem', display: 'flex', alignItems: 'center' }}
                  >
                    <FileText size={14} style={{ minWidth: '14px', marginRight: '0.375rem' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slug}.md</span>
                    <Edit2 
                      size={12} 
                      className="hover-trash"
                      onClick={(e) => handleRename(e, slug, true)} 
                      style={{ marginRight: '0.25rem' }}
                    />
                    <Trash2 
                      size={12} 
                      className="hover-trash"
                      onClick={(e) => deleteItem(e, slug, true)} 
                    />
                  </div>

                  {images.map(img => (
                    <div 
                      key={img} 
                      className="file-item"
                      style={{ paddingLeft: '2.75rem', marginTop: '0.125rem', display: 'flex', alignItems: 'center', cursor: 'default' }}
                    >
                      <Image size={14} style={{ minWidth: '14px', marginRight: '0.375rem', color: 'var(--color-teal)' }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img}</span>
                      <Trash2 
                        size={12} 
                        className="hover-trash"
                        onClick={(e) => handleDeleteImage(e, slug, img)} 
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
