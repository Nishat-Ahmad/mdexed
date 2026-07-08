import React, { useEffect, useState } from 'react';

const THEMES = [
  { id: 'default', name: 'Default Dark', accent: '#2dd4bf', bg: '#09090b', panelBg: '#18181b', border: '#27272a', isLight: false },
  { id: 'light', name: 'Default Light', accent: '#0ea5e9', bg: '#f8fafc', panelBg: '#ffffff', border: '#e2e8f0', isLight: true },
  { id: 'icy-gunmetal', name: 'Icy Gunmetal', accent: '#A4D8FF', panelBg: '#35393C', bg: '#25282A', border: '#4A4F53', isLight: false },
  { id: 'raspberry-space', name: 'Raspberry Space', accent: '#EE005A', panelBg: '#012641', bg: '#011A2D', border: '#023C66', isLight: false },
  { id: 'shadow-clay', name: 'Shadow Clay', accent: '#D4AA7D', panelBg: '#272727', bg: '#1C1C1C', border: '#3C3C3C', isLight: false },
  { id: 'electric-chartreuse', name: 'Electric Chartreuse', accent: '#FE00AE', panelBg: '#C1FE1A', bg: '#9ECA10', border: '#D4FF4D', isLight: true },
  { id: 'lime-grape', name: 'Lime Grape', accent: '#DDEA78', panelBg: '#433455', bg: '#2D2339', border: '#5A4672', isLight: false },
  { id: 'celadon-plum', name: 'Celadon Plum', accent: '#A8D3A8', panelBg: '#553832', bg: '#3D2824', border: '#704A42', isLight: false },
  { id: 'cherry-twilight', name: 'Cherry Twilight', accent: '#F9A8BB', panelBg: '#1A1265', bg: '#100B42', border: '#2A1D9C', isLight: false }
];

export default function ThemesTab() {
  const [activeThemeId, setActiveThemeId] = useState(localStorage.getItem('mdexed-theme') || 'default');

  const applyTheme = (themeId) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    
    document.documentElement.style.setProperty('--color-teal', theme.accent);
    document.documentElement.style.setProperty('--color-zinc-900', theme.panelBg);
    document.documentElement.style.setProperty('--bg-color', theme.bg);
    document.documentElement.style.setProperty('--color-zinc-800', theme.border);
    
    if (theme.isLight) {
       document.documentElement.style.setProperty('--color-zinc-400', '#64748b'); // slate-500
       document.documentElement.style.setProperty('--text-color', '#0f172a'); // slate-900
    } else {
       document.documentElement.style.setProperty('--color-zinc-400', '#a1a1aa');
       document.documentElement.style.setProperty('--text-color', '#ffffff');
    }

    setActiveThemeId(themeId);
    localStorage.setItem('mdexed-theme', themeId);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
  };

  useEffect(() => {
    applyTheme(activeThemeId);
  }, []);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ marginTop: 0, color: 'var(--text-color, #fff)', borderBottom: '1px solid var(--color-zinc-800)', paddingBottom: '0.75rem', fontSize: '1.25rem' }}>Themes</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {THEMES.map(theme => (
          <div 
            key={theme.id}
            onClick={() => applyTheme(theme.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              border: `2px solid ${activeThemeId === theme.id ? '#fff' : 'transparent'}`,
              boxShadow: activeThemeId === theme.id ? `0 0 0 2px ${theme.accent}` : '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ height: '45px', backgroundColor: theme.accent }} />
            <div style={{ height: '35px', backgroundColor: theme.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 700, color: theme.isLight ? '#111' : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                 {theme.name}
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
