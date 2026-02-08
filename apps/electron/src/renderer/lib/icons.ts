// Icon types and constants

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ResolvedEntityIcon {
  kind: 'emoji' | 'file' | 'fallback'
  value: string
  colorable?: boolean
  rawSvg?: string
}

export const ICON_SIZE_CLASSES: Record<IconSize, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
}

export const ICON_EMOJI_SIZES: Record<IconSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}
