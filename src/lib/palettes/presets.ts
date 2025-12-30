import { ColorPalette } from './types';

export const palettes: ColorPalette[] = [
  {
    id: 'corporate-light',
    name: 'Corporate Light',
    colors: {
      background: '#ffffff',
      text: '#1e293b',
      accent: '#2563eb',
      secondary: '#64748b',
      highlight: '#dbeafe',
    },
  },
  {
    id: 'corporate-dark',
    name: 'Corporate Dark',
    colors: {
      background: '#0f172a',
      text: '#f1f5f9',
      accent: '#3b82f6',
      secondary: '#94a3b8',
      highlight: '#1e3a5f',
    },
  },
  {
    id: 'academic-warm',
    name: 'Academic Warm',
    colors: {
      background: '#faf6f1',
      text: '#44403c',
      accent: '#92400e',
      secondary: '#78716c',
      highlight: '#fde68a',
    },
  },
  {
    id: 'academic-cool',
    name: 'Academic Cool',
    colors: {
      background: '#f8fafc',
      text: '#334155',
      accent: '#475569',
      secondary: '#94a3b8',
      highlight: '#e2e8f0',
    },
  },
  {
    id: 'vibrant-creative',
    name: 'Vibrant Creative',
    colors: {
      background: '#fefce8',
      text: '#581c87',
      accent: '#ea580c',
      secondary: '#0d9488',
      highlight: '#fbbf24',
    },
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    colors: {
      background: '#ffffff',
      text: '#171717',
      accent: '#171717',
      secondary: '#737373',
      highlight: '#e5e5e5',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      background: '#000000',
      text: '#ffffff',
      accent: '#ffff00',
      secondary: '#ffffff',
      highlight: '#ffff00',
    },
  },
  {
    id: 'color-blind-safe',
    name: 'Color Blind Safe',
    colors: {
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#0072b2',
      secondary: '#e69f00',
      highlight: '#56b4e9',
    },
  },
];

export const getPaletteById = (id: string): ColorPalette | undefined => {
  return palettes.find((palette) => palette.id === id);
};

export const DEFAULT_PALETTE_ID = 'modern-minimal';
