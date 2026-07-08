import React from 'react';
import FileExplorer from './FileExplorer';
import SettingsTab from './SettingsTab';
import ShortcutsTab from './ShortcutsTab';
import ThemesTab from './ThemesTab';

export default function Sidebar({ width, fsManager, headings, activeHeadingId, activeSidebarTab }) {
  const { 
    activeFileId, activeFile, updateActiveFile 
  } = fsManager;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: `${width}px`, backgroundColor: 'var(--color-zinc-900)', borderRight: '1px solid var(--color-zinc-800)', flexShrink: 0 }}>


      {/* SCROLLABLE CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {activeSidebarTab === 'explorer' ? (
          <FileExplorer fsManager={fsManager} />
        ) : activeSidebarTab === 'shortcuts' ? (
          <ShortcutsTab />
        ) : activeSidebarTab === 'themes' ? (
          <ThemesTab />
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
      
    </div>
  );
}
