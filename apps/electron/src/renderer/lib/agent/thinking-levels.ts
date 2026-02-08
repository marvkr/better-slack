// Thinking levels
export const DEFAULT_THINKING_LEVEL = 'normal'

export type ThinkingLevel = 'minimal' | 'normal' | 'extended'

export const THINKING_LEVELS = {
  minimal: { name: 'Minimal', description: 'Quick responses' },
  normal: { name: 'Normal', description: 'Balanced thinking' },
  extended: { name: 'Extended', description: 'Deep analysis' },
}

export function getThinkingLevelName(level: ThinkingLevel): string {
  return THINKING_LEVELS[level]?.name || level
}
