// Mentions utilities
export interface Mention {
  type: 'source' | 'skill' | 'label'
  id: string
  display: string
}

export function parseMentions(text: string): Mention[] {
  return []
}

export function findMentionMatches(text: string, query: string): Mention[] {
  return []
}

export function extractBadges(text: string): any[] {
  return []
}
