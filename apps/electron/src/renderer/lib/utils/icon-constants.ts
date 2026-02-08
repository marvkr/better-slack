// Icon constants
export const DEFAULT_ICON = '📄'
export const FOLDER_ICON = '📁'
export const FILE_ICON = '📄'

export function isEmoji(str: string): boolean {
  if (!str) return false
  // Basic emoji detection
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u
  return emojiRegex.test(str)
}
