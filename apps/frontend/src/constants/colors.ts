/**
 * Color system following 100cims minimal approach
 * Only brand colors + rely on Tailwind/shadcn for everything else
 */

export const Colors = {
  light: {
    primary: '#3B82F6',    // Blue
    secondary: '#64748B',  // Slate
    accent: '#F59E0B',     // Amber
    success: '#10B981',    // Emerald
    error: '#EF4444',      // Red
    warning: '#F59E0B',    // Amber
  },
  dark: {
    primary: '#60A5FA',    // Blue-400
    secondary: '#94A3B8',  // Slate-400
    accent: '#FCD34D',     // Amber-300
    success: '#34D399',    // Emerald-400
    error: '#F87171',      // Red-400
    warning: '#FCD34D',    // Amber-300
  }
} as const;

// Export for convenience
export const { light, dark } = Colors;
