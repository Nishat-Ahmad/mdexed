export const BUILTIN_THEMES = [
  { id: 'default', name: 'Default Dark', accent: '#2dd4bf', bg: '#09090b', panelBg: '#18181b', border: '#27272a', isLight: false },
  { id: 'light', name: 'Default Light', accent: '#0ea5e9', bg: '#f8fafc', panelBg: '#ffffff', border: '#e2e8f0', isLight: true },
  { id: 'icy-gunmetal', name: 'Icy Gunmetal', accent: '#A4D8FF', panelBg: '#35393C', bg: '#25282A', border: '#4A4F53', isLight: false },
  { id: 'shadow-clay', name: 'Shadow Clay', accent: '#D4AA7D', panelBg: '#272727', bg: '#1C1C1C', border: '#3C3C3C', isLight: false },
  { id: 'electric-chartreuse', name: 'Electric Chartreuse', accent: '#FE00AE', panelBg: '#C1FE1A', bg: '#9ECA10', border: '#D4FF4D', isLight: true },
  { id: 'lime-grape', name: 'Lime Grape', accent: '#DDEA78', panelBg: '#433455', bg: '#2D2339', border: '#5A4672', isLight: false },
  { id: 'celadon-plum', name: 'Celadon Plum', accent: '#A8D3A8', panelBg: '#553832', bg: '#3D2824', border: '#704A42', isLight: false },
  { id: 'cherry-twilight', name: 'Cherry Twilight', accent: '#F9A8BB', panelBg: '#1A1265', bg: '#100B42', border: '#2A1D9C', isLight: false }
];

export const getCustomThemes = () => {
  try {
    const raw = localStorage.getItem('mdexed-custom-themes');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load custom themes from localStorage', err);
    return [];
  }
};

export const saveCustomThemes = (themes) => {
  try {
    localStorage.setItem('mdexed-custom-themes', JSON.stringify(themes));
  } catch (err) {
    console.error('Failed to save custom themes to localStorage', err);
  }
};

export const getAllThemes = () => {
  return [...BUILTIN_THEMES, ...getCustomThemes()];
};

export const applyTheme = (theme) => {
  if (!theme) return;

  document.documentElement.style.setProperty('--color-teal', theme.accent);
  document.documentElement.style.setProperty('--color-zinc-900', theme.panelBg);
  document.documentElement.style.setProperty('--bg-color', theme.bg);
  document.documentElement.style.setProperty('--color-zinc-800', theme.border);

  if (theme.isLight) {
    document.documentElement.style.setProperty('--color-zinc-400', '#64748b');
    document.documentElement.style.setProperty('--text-color', '#0f172a');
  } else {
    document.documentElement.style.setProperty('--color-zinc-400', '#a1a1aa');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
  }

  localStorage.setItem('mdexed-theme', theme.id);
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
};

export const applyThemeById = (themeId) => {
  const allThemes = getAllThemes();
  const theme = allThemes.find((t) => t.id === themeId) || allThemes[0];
  applyTheme(theme);
  return theme;
};
