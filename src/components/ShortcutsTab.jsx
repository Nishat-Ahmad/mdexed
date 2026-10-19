import React from 'react';

export default function ShortcutsTab() {
  const viewShortcuts = [
    { key: 'Ctrl + B', action: 'Toggle Markdown Editor' },
    { key: 'Ctrl + Alt + B', action: 'Toggle Live Viewer' }
  ];

  const historyShortcuts = [
    { key: 'Ctrl + Z', action: 'Undo' },
    { key: 'Ctrl + Y', action: 'Redo' }
  ];

  const editorShortcuts = [
    { key: 'Ctrl + B', action: 'Bold Selected Text (**text**)' },
    { key: 'Ctrl + I', action: 'Italic Text (*text*)' },
    { key: 'Ctrl + Shift + X', action: 'Strikethrough (~~text~~)' },
    { key: 'Ctrl + E', action: 'Inline Code (`text`)' },
    { key: 'Ctrl + Shift + C', action: 'Code Block (```)' },
    { key: 'Ctrl + K', action: 'Insert Link ([text](url))' },
    { key: 'Ctrl + Shift + K', action: 'Insert Image (![image](/example.png))' },
    { key: 'Ctrl + V', action: 'Paste Image (Auto-uploads)' }
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ marginTop: 0, color: 'var(--text-color, #fff)', borderBottom: '1px solid var(--color-zinc-800)', paddingBottom: '0.75rem', fontSize: '1.25rem' }}>Keyboard Shortcuts</h2>
      
      <div>
        <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-teal)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Views & Toggles</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {viewShortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-zinc-800)' }}>
              <span style={{ color: 'var(--text-color, #fff)', fontSize: '0.875rem' }}>{s.action}</span>
              <kbd style={{ backgroundColor: 'var(--color-zinc-800)', color: 'var(--color-teal)', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', border: '1px solid var(--color-zinc-800)', boxShadow: '0 2px 0 var(--color-zinc-900)', whiteSpace: 'nowrap' }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-teal)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {historyShortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-zinc-800)' }}>
              <span style={{ color: 'var(--text-color, #fff)', fontSize: '0.875rem' }}>{s.action}</span>
              <kbd style={{ backgroundColor: 'var(--color-zinc-800)', color: 'var(--color-teal)', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', border: '1px solid var(--color-zinc-800)', boxShadow: '0 2px 0 var(--color-zinc-900)', whiteSpace: 'nowrap' }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-teal)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Editor Formatting</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {editorShortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-zinc-800)' }}>
              <span style={{ color: 'var(--text-color, #fff)', fontSize: '0.875rem' }}>{s.action}</span>
              <kbd style={{ backgroundColor: 'var(--color-zinc-800)', color: 'var(--color-teal)', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', border: '1px solid var(--color-zinc-800)', boxShadow: '0 2px 0 var(--color-zinc-900)', whiteSpace: 'nowrap' }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
