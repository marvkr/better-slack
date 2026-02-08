// Theme configuration

export interface ThemeOverrides {
  mode?: 'light' | 'dark' | 'scenic'
  backgroundImage?: string
  [key: string]: any
}

export interface ShikiThemeConfig {
  light: string
  dark: string
}

export interface ThemeFile {
  supportedModes?: Array<'light' | 'dark'>
  shikiTheme?: ShikiThemeConfig
  [key: string]: any
}

export const DEFAULT_THEME: ThemeOverrides = {
  mode: 'light',
}

export const DEFAULT_SHIKI_THEME: ShikiThemeConfig = {
  light: 'github-light',
  dark: 'github-dark',
}

export function resolveTheme(preset?: ThemeFile): ThemeOverrides {
  if (!preset) return DEFAULT_THEME
  return { ...DEFAULT_THEME, ...preset }
}

export function themeToCSS(theme: ThemeOverrides, isDark: boolean): string {
  // Return empty string - CSS variables are defined in index.css
  return ''
}

export function getShikiTheme(config: ShikiThemeConfig, isDark: boolean): string {
  return isDark ? config.dark : config.light
}
