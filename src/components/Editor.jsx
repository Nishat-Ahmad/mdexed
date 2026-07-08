import React, { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

export default function Editor({ value, onChange, onImagePaste }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    const formatText = (prefix, suffix) => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      const selectedText = model.getValueInRange(selection);
      const newText = `${prefix}${selectedText}${suffix}`;
      
      const op = {
        range: selection,
        text: newText,
        forceMoveMarkers: true
      };
      
      editor.executeEdits("format", [op]);
      
      if (selectedText.length === 0) {
        editor.setPosition({
          lineNumber: selection.startLineNumber,
          column: selection.startColumn + prefix.length
        });
      } else {
        editor.setSelection({
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn + prefix.length + suffix.length
        });
      }
      editor.focus();
    };

    // Bold (Ctrl+B)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      formatText('**', '**');
    });

    // Italic (Ctrl+I)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      formatText('*', '*');
    });

    // Strikethrough (Ctrl+Shift+X)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyX, () => {
      formatText('~~', '~~');
    });

    // Inline Code (Ctrl+E)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      formatText('`', '`');
    });

    // Link (Ctrl+K)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      const selectedText = model.getValueInRange(selection);
      const newText = `[${selectedText}](url)`;
      
      const op = {
        range: selection,
        text: newText,
        forceMoveMarkers: true
      };
      
      editor.executeEdits("format", [op]);
      
      if (selectedText.length === 0) {
        // Move inside the brackets if no text selected
        editor.setPosition({
          lineNumber: selection.startLineNumber,
          column: selection.startColumn + 1
        });
      } else {
        // Select 'url' so they can immediately paste the link
        editor.setSelection({
          startLineNumber: selection.endLineNumber,
          startColumn: selection.endColumn + 3,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn + 6
        });
      }
      editor.focus();
    });

    // Heading 2 (Ctrl+H)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      formatText('## ', '');
    });

    // Blockquote (Ctrl+Q)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyQ, () => {
      formatText('> ', '');
    });

    // Code Block (Ctrl+Shift+C)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
      formatText('\n```\n', '\n```\n');
    });

    // Unordered List (Ctrl+L)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      formatText('- ', '');
    });
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
