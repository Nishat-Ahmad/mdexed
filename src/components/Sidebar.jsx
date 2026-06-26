import React, { useState, useRef } from 'react';
import { FileText, Plus, FolderOpen, Folder, FolderPlus, ChevronDown, Upload, Trash2, Edit2 } from 'lucide-react';
import MetadataForm from './MetadataForm';

export default function Sidebar({ width, fsManager, headings, activeHeadingId }) {
  const [activeSidebarTab, setActiveSidebarTab] = useState('settings');
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const fileInputRef = useRef(null);

  const { 
    files, emptyFolders, activeFileId, setActiveFileId, activeFile, 
    updateActiveFile, createNewFile, handleFileUpload, createNewFolder, 
    deleteItem, renameItem, handleSaveToDisk 
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: `${width}px`, backgroundColor: '#121214', borderRight: '1px solid var(--color-zinc-800)', flexShrink: 0 }}>
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
                  onChange={(e) => {
                    handleFileUpload(e.target.files[0]);
                    e.target.value = '';
                  }} 
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
            
            <div style={{ flex: 1, padding: '0.75rem 0.5rem' }}>
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
                  </div>
                );
              })}
              
              {/* Render Files (and their folders) */}
              {!collapsedFolders['root'] && files.map(f => {
                const isActive = f.id === activeFileId;
                const slug = f.id;
                const isCollapsed = collapsedFolders[slug];
                
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
                    
                    {/* Markdown File */}
                    {!isCollapsed && (
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeFile && (
               <MetadataForm key={activeFileId} data={activeFile.frontmatter} onChange={(fm) => updateActiveFile({ frontmatter: fm })} />
            )}
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
  );
}
