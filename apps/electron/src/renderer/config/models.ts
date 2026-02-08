// AI Models configuration
export const MODELS = {
  'claude-sonnet-4-5': { name: 'Claude Sonnet 4.5', id: 'claude-sonnet-4-5-20250929', contextWindow: 200000 },
  'claude-opus-4-6': { name: 'Claude Opus 4.6', id: 'claude-opus-4-6', contextWindow: 200000 },
  'claude-haiku-4-5': { name: 'Claude Haiku 4.5', id: 'claude-haiku-4-5-20251001', contextWindow: 200000 },
}

export const models = MODELS

export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'

export function getModelShortName(modelId: string): string {
  const model = Object.values(MODELS).find(m => m.id === modelId)
  return model?.name || modelId
}

export function getModelContextWindow(modelId: string): number {
  const model = Object.values(MODELS).find(m => m.id === modelId)
  return model?.contextWindow || 200000
}

export function isClaudeModel(modelId: string): boolean {
  return modelId.includes('claude')
}
