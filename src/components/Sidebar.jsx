import React, { useState } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import FileExplorer from './FileExplorer';
import SettingsTab from './SettingsTab';

export default function Sidebar({ width, fsManager, headings, activeHeadingId }) {
  const [activeSidebarTab, setActiveSidebarTab] = useState('settings');

  const { 
    activeFileId, activeFile, updateActiveFile, handleSaveToDisk, saveStatus 
  } = fsManager;

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
          <FileExplorer fsManager={fsManager} />
        ) : (
          <SettingsTab 
            activeFile={activeFile}
            activeFileId={activeFileId}
            updateActiveFile={updateActiveFile}
            headings={headings}
            activeHeadingId={activeHeadingId}
          />
        )}
      </div>
      
      {/* SAVE ACTIONS INDICATOR */}
      <div className="actions" style={{ padding: '1.5rem', borderTop: '1px solid var(--color-zinc-800)' }}>
        {(() => {
          switch (saveStatus) {
            case 'saving':
              return (
                <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', opacity: 0.8 }} disabled>
                  <Loader2 size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                  Saving...
                </button>
              );
            case 'saved':
              return (
                <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }} onClick={handleSaveToDisk}>
                  <Check size={16} style={{ color: 'var(--color-teal)', marginRight: '0.5rem' }} />
                  Saved to Disk
                </button>
              );
            case 'error':
              return (
                <button className="btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', color: '#fff' }} onClick={handleSaveToDisk}>
                  <AlertCircle size={16} style={{ marginRight: '0.5rem' }} />
                  Save Failed (Retry)
                </button>
              );
            case 'unsaved':
            default:
              return (
                <button className="btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleSaveToDisk}>
                  Save to Disk
                </button>
              );
          }
        })()}
      </div>
    </div>
  );
}
