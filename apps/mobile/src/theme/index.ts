// Monochromatic design tokens, modeled after Apple's Contacts app: pure black/white
// surfaces, a single gray ramp, and the system tint reduced to ink (black in light
// mode, white in dark mode). The only exceptions are the semantic status colors
// (success/danger), reserved for granted/denied signaling — never decoration.
import { useColorScheme } from 'react-native';

export type Theme = {
  scheme: 'light' | 'dark';
  colors: {
    /** Screen background (plain lists). */
    background: string;
    /** Grouped-list screen background. */
    groupedBackground: string;
    /** Cards / grouped rows surface. */
    card: string;
    /** Primary ink — also the tint for interactive elements. */
    text: string;
    /** Secondary labels (subtitles, values). */
    secondaryText: string;
    /** Tertiary labels (placeholders, timestamps). */
    tertiaryText: string;
    /** Hairline separators. */
    separator: string;
    /** Avatar circle fill. */
    avatar: string;
    /** Avatar initial letter. */
    avatarText: string;
    /** Destructive actions — kept grayscale on purpose. */
    destructive: string;
    /** Input fields background. */
    input: string;
    /** Semantic "granted/ok" status (iOS system green). */
    success: string;
    /** Semantic "denied/alert" status (iOS system red). */
    danger: string;
    /** Semantic "attention" status (iOS system orange). */
    warning: string;
  };
};

const light: Theme = {
  scheme: 'light',
  colors: {
    background: '#FFFFFF',
    groupedBackground: '#F2F2F2',
    card: '#FFFFFF',
    text: '#000000',
    secondaryText: '#6E6E73',
    tertiaryText: '#A1A1A6',
    separator: 'rgba(0, 0, 0, 0.12)',
    avatar: '#8E8E93',
    avatarText: '#FFFFFF',
    destructive: '#000000',
    input: '#F2F2F2',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#C93400',
  },
};

const dark: Theme = {
  scheme: 'dark',
  colors: {
    background: '#000000',
    groupedBackground: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    secondaryText: '#98989E',
    tertiaryText: '#68686E',
    separator: 'rgba(255, 255, 255, 0.15)',
    avatar: '#48484A',
    avatarText: '#FFFFFF',
    destructive: '#FFFFFF',
    input: '#1C1C1E',
    success: '#30D158',
    danger: '#FF453A',
    warning: '#FF9F0A',
  },
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
