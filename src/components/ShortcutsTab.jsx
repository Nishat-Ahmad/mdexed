import React from 'react';

export default function ShortcutsTab() {
  const shortcuts = [
    { key: 'Ctrl + B', action: 'Bold Text (**text**)' },
    { key: 'Ctrl + I', action: 'Italic Text (*text*)' },
    { key: 'Ctrl + Shift + X', action: 'Strikethrough (~~text~~)' },
    { key: 'Ctrl + E', action: 'Inline Code (`text`)' },
    { key: 'Ctrl + Shift + C', action: 'Code Block (```)' },
    { key: 'Ctrl + K', action: 'Insert Link ([text](url))' },
    { key: 'Ctrl + H', action: 'Heading 2 (##)' },
    { key: 'Ctrl + Q', action: 'Blockquote (>)' },
    { key: 'Ctrl + L', action: 'Unordered List (-)' },
    { key: 'Ctrl + V', action: 'Paste Image (Auto-uploads)' }
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--color-zinc-800)', paddingBottom: '0.75rem', fontSize: '1.25rem' }}>Keyboard Shortcuts</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {shortcuts.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-zinc-800)' }}>
            <span style={{ color: 'var(--color-zinc-300)', fontSize: '0.875rem' }}>{s.action}</span>
            <kbd style={{ backgroundColor: '#27272a', color: '#2dd4bf', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', border: '1px solid #3f3f46', boxShadow: '0 2px 0 #18181b' }}>
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
