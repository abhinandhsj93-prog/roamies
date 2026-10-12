// Design tokens from the README design system and design/canvas.

export const colors = {
  cream: '#FAF8F4',
  ink: '#12302C',
  turmeric: '#E8A33D',
  white: '#FFFFFF',

  // Soft card backgrounds
  mint: '#E4F0EC',
  sand: '#FBEBD3',
  clay: '#F3E4DC',
  sky: '#E2EEF3',
  leaf: '#E6F0DA',

  // Status
  green: '#1B6A45',
  warning: '#8C5000',
  red: '#B3261E',

  inkSubtle: 'rgba(18,48,44,0.06)',
} as const;

export const fonts = {
  medium: 'Figtree_500Medium',
  bold: 'Figtree_700Bold',
} as const;

export const fontSizes = {
  display: 32,
  title: 20,
  body: 16,
  caption: 13,
} as const;

// 8-pt grid
export const space = (n: number) => n * 8;
export const sideMargin = 24;

export const radii = {
  card: 24,
  cardSmall: 20,
  pill: 20,
  button: 28,
} as const;

// 0 1px 2px rgba(18,48,44,.06), 0 8px 24px rgba(18,48,44,.08)
export const cardShadow = {
  boxShadow: '0 1px 2px rgba(18,48,44,0.06), 0 8px 24px rgba(18,48,44,0.08)',
} as const;
