import React from 'react';
import MetadataForm from './MetadataForm';

export default function SettingsTab({ activeFile, activeFileId, updateActiveFile, headings, activeHeadingId }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {activeFile && (
         <MetadataForm 
           key={activeFileId} 
           data={activeFile.frontmatter} 
           onChange={(fm) => updateActiveFile({ frontmatter: fm })} 
         />
      )}
      <div style={{ flex: 1, padding: '0 1.5rem 1.5rem' }}>
        {headings.length > 0 && (
          <div className="toc-container" style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--color-zinc-400)', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Table of Contents
            </h3>
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
  );
}
