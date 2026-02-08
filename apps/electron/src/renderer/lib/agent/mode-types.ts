// Agent mode types
export type AgentMode = 'ask' | 'chat' | 'plan'

export interface ModeConfig {
  name: string
  id: AgentMode
}

export const PERMISSION_MODE_CONFIG = {
  safe: { name: 'Explore', description: 'Read-only mode', icon: '🔍' },
  ask: { name: 'Ask to Edit', description: 'Prompts for approval', icon: '✋' },
  'allow-all': { name: 'Auto', description: 'Auto-approves all', icon: '⚡' },
}
