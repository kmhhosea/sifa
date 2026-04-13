export const colors = {
  // Primary palette - deep spiritual blues and golds
  primary: '#2D5A8E',
  primaryLight: '#4A7AB5',
  primaryDark: '#1A3A5C',
  
  // Accent - warm gold for highlights
  accent: '#D4A843',
  accentLight: '#E8C97A',
  accentDark: '#B08A2E',

  // Background colors
  background: '#F8F6F2',
  backgroundDark: '#1A1A2E',
  surface: '#FFFFFF',
  surfaceDark: '#252540',
  
  // Text colors
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#E5E7EB',
  
  // Semantic colors
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
  
  // Border and divider
  border: '#E5E7EB',
  borderDark: '#374151',
  divider: '#F3F4F6',
  
  // Book-specific colors
  tmw: '#2D5A8E',
  tzr: '#7C3AED',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Favorite
  favorite: '#EF4444',
  favoriteInactive: '#D1D5DB',
} as const;

export type ColorName = keyof typeof colors;
