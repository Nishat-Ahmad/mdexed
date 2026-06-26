import React from 'react';
import MonacoEditor from '@monaco-editor/react';

export default function Editor({ value, onChange }) {
  return (
    <div className="editor-pane">
      <div className="pane-header">
        <span>Markdown Editor</span>
      </div>
      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
        theme="vs-dark"
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          padding: { top: 16 },
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 14,
        }}
      />
    </div>
  );
}
