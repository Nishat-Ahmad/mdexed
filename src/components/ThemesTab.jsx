import React, { useState } from 'react';
import { Plus, Trash2, X, Sparkles } from 'lucide-react';
import { BUILTIN_THEMES, getCustomThemes, saveCustomThemes, applyThemeById } from '../utils/theme';

export default function ThemesTab() {
  const [customThemes, setCustomThemes] = useState(() => getCustomThemes());
  const [activeThemeId, setActiveThemeId] = useState(() => localStorage.getItem('mdexed-theme') || 'default');
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState('');

  const [form, setForm] = useState({
    name: '',
    accent: '#2dd4bf',
    bg: '#09090b',
    panelBg: '#18181b',
    border: '#27272a',
    isLight: false
  });

  const handleSelectTheme = (themeId) => {
    applyThemeById(themeId);
    setActiveThemeId(themeId);
  };

  const handleModeChange = (isLight) => {
    setForm((prev) => ({
      ...prev,
      isLight,
      bg: isLight ? '#f8fafc' : '#09090b',
      panelBg: isLight ? '#ffffff' : '#18181b',
      border: isLight ? '#e2e8f0' : '#27272a',
      accent: isLight ? '#0ea5e9' : '#2dd4bf'
    }));
  };

  const handleSaveTheme = (e) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setNameError('Please enter a theme name');
      return;
    }
    setNameError('');

    const newId = `custom-${Date.now()}`;
    const createdTheme = {
      id: newId,
      name: trimmedName,
      accent: form.accent,
      bg: form.bg,
      panelBg: form.panelBg,
      border: form.border,
      isLight: form.isLight,
      isCustom: true
    };

    const updated = [...customThemes, createdTheme];
    saveCustomThemes(updated);
    setCustomThemes(updated);
    handleSelectTheme(newId);
    setIsCreating(false);
    setForm({
      name: '',
      accent: '#2dd4bf',
      bg: '#09090b',
      panelBg: '#18181b',
      border: '#27272a',
      isLight: false
    });
  };

  const handleDeleteTheme = (id) => {
    const updated = customThemes.filter((t) => t.id !== id);
    saveCustomThemes(updated);
    setCustomThemes(updated);
    if (activeThemeId === id) {
      handleSelectTheme('default');
    }
  };

  const renderThemeCard = (theme) => (
    <div
      key={theme.id}
      onClick={() => handleSelectTheme(theme.id)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: `2px solid ${activeThemeId === theme.id ? '#fff' : 'transparent'}`,
        boxShadow: activeThemeId === theme.id ? `0 0 0 2px ${theme.accent}` : '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.1s'
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {theme.isCustom && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTheme(theme.id);
          }}
          title="Delete custom theme"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; }}
        >
          <Trash2 size={12} />
        </button>
      )}
      <div style={{ height: '45px', backgroundColor: theme.accent }} />
      <div style={{ height: '35px', backgroundColor: theme.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: theme.isLight ? '#111' : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {theme.name}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-zinc-800)', paddingBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-color, #fff)', fontSize: '1.25rem' }}>Themes</h2>
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setNameError('');
          }}
          style={{
            background: isCreating ? 'var(--color-zinc-800)' : 'transparent',
            border: '1px solid var(--color-teal)',
            color: 'var(--color-teal)',
            borderRadius: '0.375rem',
            padding: '0.35rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isCreating) {
              e.currentTarget.style.backgroundColor = 'var(--color-teal)';
              e.currentTarget.style.color = '#000';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCreating) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-teal)';
            }
          }}
        >
          {isCreating ? <X size={14} /> : <Plus size={14} />}
          {isCreating ? 'Cancel' : 'Add Theme'}
        </button>
      </div>

      {/* CREATE CUSTOM THEME FORM */}
      {isCreating && (
        <form
          onSubmit={handleSaveTheme}
          style={{
            backgroundColor: 'var(--color-zinc-900)',
            border: '1px solid var(--color-zinc-800)',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-teal)', fontSize: '0.875rem', fontWeight: 600 }}>
            <Sparkles size={16} />
            <span>Create Custom Theme</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-zinc-400)', fontWeight: 500 }}>Theme Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (nameError) setNameError('');
              }}
              placeholder="e.g. Cyberpunk Neon"
              style={{
                backgroundColor: 'var(--bg-color)',
                border: nameError ? '1px solid #ef4444' : '1px solid var(--color-zinc-800)',
                color: 'var(--text-color, #fff)',
                borderRadius: '0.25rem',
                padding: '0.45rem 0.6rem',
                fontSize: '0.8125rem'
              }}
              autoFocus
            />
            {nameError && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{nameError}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-zinc-400)', fontWeight: 500 }}>Base Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleModeChange(false)}
                style={{
                  background: !form.isLight ? 'var(--color-teal)' : 'var(--bg-color)',
                  color: !form.isLight ? '#000' : 'var(--color-zinc-400)',
                  border: '1px solid var(--color-zinc-800)',
                  borderRadius: '0.25rem',
                  padding: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => handleModeChange(true)}
                style={{
                  background: form.isLight ? 'var(--color-teal)' : 'var(--bg-color)',
                  color: form.isLight ? '#000' : 'var(--color-zinc-400)',
                  border: '1px solid var(--color-zinc-800)',
                  borderRadius: '0.25rem',
                  padding: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Light
              </button>
            </div>
          </div>

          {/* Color Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Accent */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--color-zinc-400)' }}>Accent</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="color"
                  value={form.accent}
                  onChange={(e) => setForm({ ...form, accent: e.target.value })}
                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '0.25rem', padding: 0, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={form.accent}
                  onChange={(e) => setForm({ ...form, accent: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'var(--bg-color)', border: '1px solid var(--color-zinc-800)', color: 'var(--text-color, #fff)', borderRadius: '0.25rem', padding: '0.35rem 0.4rem', fontSize: '0.7rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* Panel Background */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--color-zinc-400)' }}>Panels / Sidebar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="color"
                  value={form.panelBg}
                  onChange={(e) => setForm({ ...form, panelBg: e.target.value })}
                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '0.25rem', padding: 0, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={form.panelBg}
                  onChange={(e) => setForm({ ...form, panelBg: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'var(--bg-color)', border: '1px solid var(--color-zinc-800)', color: 'var(--text-color, #fff)', borderRadius: '0.25rem', padding: '0.35rem 0.4rem', fontSize: '0.7rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* Main Background */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--color-zinc-400)' }}>Background</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="color"
                  value={form.bg}
                  onChange={(e) => setForm({ ...form, bg: e.target.value })}
                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '0.25rem', padding: 0, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={form.bg}
                  onChange={(e) => setForm({ ...form, bg: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'var(--bg-color)', border: '1px solid var(--color-zinc-800)', color: 'var(--text-color, #fff)', borderRadius: '0.25rem', padding: '0.35rem 0.4rem', fontSize: '0.7rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* Border */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--color-zinc-400)' }}>Borders</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="color"
                  value={form.border}
                  onChange={(e) => setForm({ ...form, border: e.target.value })}
                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '0.25rem', padding: 0, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={form.border}
                  onChange={(e) => setForm({ ...form, border: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'var(--bg-color)', border: '1px solid var(--color-zinc-800)', color: 'var(--text-color, #fff)', borderRadius: '0.25rem', padding: '0.35rem 0.4rem', fontSize: '0.7rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Mini Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-zinc-400)', fontWeight: 500 }}>Live Preview</span>
            <div style={{ borderRadius: '0.375rem', overflow: 'hidden', border: `1px solid ${form.border}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '32px', backgroundColor: form.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#000', opacity: 0.8 }}>Accent</span>
              </div>
              <div style={{ height: '28px', backgroundColor: form.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: form.isLight ? '#111' : '#fff' }}>{form.name || 'Theme Name'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                backgroundColor: 'var(--color-teal)',
                color: '#000',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Save Theme
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{
                backgroundColor: 'var(--bg-color)',
                color: 'var(--color-zinc-400)',
                border: '1px solid var(--color-zinc-800)',
                borderRadius: '0.25rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* CUSTOM THEMES SECTION */}
      {customThemes.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-teal)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Custom Themes ({customThemes.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {customThemes.map(renderThemeCard)}
          </div>
        </div>
      )}

      {/* PRESET THEMES SECTION */}
      <div>
        <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-zinc-400)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Preset Themes
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {BUILTIN_THEMES.map(renderThemeCard)}
        </div>
      </div>
    </div>
  );
}
