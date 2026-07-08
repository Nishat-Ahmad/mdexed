import React, { useRef, useEffect } from 'react';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';

export default function Editor({ value, onChange, onImagePaste }) {
  const editorRef = useRef(null);
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      // Define both transparent themes (light and dark)
      monaco.editor.defineTheme('transparent-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: { 'editor.background': '#00000000' }
      });
      monaco.editor.defineTheme('transparent-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: { 'editor.background': '#00000000' }
      });

      // Function to apply the correct theme based on localStorage
      const applyCurrentTheme = () => {
        const savedThemeId = localStorage.getItem('mdexed-theme');
        let isLight = false;
        if (savedThemeId === 'light' || savedThemeId === 'electric-chartreuse') {
          isLight = true;
        }
        monaco.editor.setTheme(isLight ? 'transparent-light' : 'transparent-dark');
      };

      // Apply initially
      applyCurrentTheme();

      // Listen for dynamic theme changes
      const handleThemeChange = (e) => {
        const theme = e.detail;
        monaco.editor.setTheme(theme.isLight ? 'transparent-light' : 'transparent-dark');
      };

      window.addEventListener('themeChanged', handleThemeChange);

      return () => {
        window.removeEventListener('themeChanged', handleThemeChange);
      };
    }
  }, [monaco]);

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

    // Image Syntax (Ctrl+Shift+K)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      const selectedText = model.getValueInRange(selection);
      const newText = `![${selectedText || 'image'}](/example.png)`;

      const op = {
        range: selection,
        text: newText,
        forceMoveMarkers: true
      };

      editor.executeEdits("format", [op]);

      if (selectedText.length === 0) {
        // Select 'example.png'
        editor.setSelection({
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn + 10,
          endLineNumber: selection.startLineNumber,
          endColumn: selection.startColumn + 21
        });
      } else {
        // Select 'example.png'
        editor.setSelection({
          startLineNumber: selection.endLineNumber,
          startColumn: selection.endColumn + 5,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn + 16
        });
      }
      editor.focus();
    });

    // Code Block (Ctrl+Shift+C)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
      formatText('\n```\n', '\n```\n');
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
    <div className="editor-pane" style={{ backgroundColor: 'var(--bg-color)' }} onPaste={handlePaste}>
      <div className="pane-header">
        <span>Markdown Editor</span>
      </div>
      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
        theme="transparent-dark"
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
