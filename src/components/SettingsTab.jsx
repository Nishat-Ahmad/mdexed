import React from 'react';
import MetadataForm from './MetadataForm';

export default function SettingsTab({ activeFile, activeFileId, updateActiveFile }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {activeFile && (
         <MetadataForm 
           key={activeFileId} 
           data={activeFile.frontmatter} 
           onChange={(fm) => updateActiveFile({ frontmatter: fm })} 
         />
      )}
    </div>
  );
}
