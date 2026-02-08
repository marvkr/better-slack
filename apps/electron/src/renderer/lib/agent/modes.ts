// Agent modes
export type PermissionMode = 'safe' | 'ask' | 'allow-all'

export const modes = {
  ask: { name: 'Ask', id: 'ask' },
  chat: { name: 'Chat', id: 'chat' },
  plan: { name: 'Plan', id: 'plan' },
}

export const PERMISSION_MODE_CONFIG = {
  safe: { name: 'Explore', description: 'Read-only mode', icon: '🔍' },
  ask: { name: 'Ask to Edit', description: 'Prompts for approval', icon: '✋' },
  'allow-all': { name: 'Auto', description: 'Auto-approves all', icon: '⚡' },
}

export const PERMISSION_MODE_ORDER: PermissionMode[] = ['safe', 'ask', 'allow-all']
