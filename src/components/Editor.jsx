import React, { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

export default function Editor({ value, onChange, onImagePaste }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file && onImagePaste) {
          e.preventDefault();
          const uploadedFileName = await onImagePaste(file);
          if (uploadedFileName) {
            const selection = editorRef.current.getSelection();
            const range = {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn
            };
            const text = `![${uploadedFileName}](${uploadedFileName})`;
            const op = { range: range, text: text, forceMoveMarkers: true };
            editorRef.current.executeEdits("paste-image", [op]);
          }
        }
      }
    }
  };

  return (
    <div className="editor-pane" onPaste={handlePaste}>
      <div className="pane-header">
        <span>Markdown Editor</span>
      </div>
      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
        theme="vs-dark"
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
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
