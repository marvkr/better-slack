// Simplified types for Dispatch - no workspaces, sessions, or complex permission modes

// Basic message type for Dispatch
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

// Generate a unique message ID
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Navigation types for Dispatch
export type ChatFilter = 'all' | 'active' | 'archived'
export type SourceFilter = 'all' | 'mcp' | 'api'
export type DispatchFilter = 'myTasks' | 'allTasks' | 'sent' | 'done'
export type SettingsSubpage = 'general' | 'appearance' | 'account' | 'advanced'
export type RightSidebarPanel = 'info' | 'history' | 'files'
export type ContentBadge = 'plan' | 'research' | 'code' | 'review'

// Deep link navigation types
export interface DeepLinkNavigation {
  type: string
  [key: string]: unknown
}

export interface Session {
  id: string
  name: string
  [key: string]: unknown
}

// Navigation state interface
export interface NavigationState {
  navigator: 'chats' | 'sources' | 'settings' | 'skills' | 'dispatch'
  filter?: ChatFilter | SourceFilter | DispatchFilter
  subpage?: SettingsSubpage | string
  details?: {
    type: 'chat' | 'source' | 'task' | 'skill'
    chatId?: string
    sourceSlug?: string
    taskId?: string
    skillSlug?: string
  }
  rightSidebar?: RightSidebarPanel
}

// Type guards
export function isChatsNavigation(nav: NavigationState): nav is NavigationState & { navigator: 'chats'; filter?: ChatFilter } {
  return nav.navigator === 'chats'
}

export function isSourcesNavigation(nav: NavigationState): nav is NavigationState & { navigator: 'sources'; filter?: SourceFilter } {
  return nav.navigator === 'sources'
}

export function isSettingsNavigation(nav: NavigationState): nav is NavigationState & { navigator: 'settings'; subpage?: SettingsSubpage } {
  return nav.navigator === 'settings'
}

export function isSkillsNavigation(nav: NavigationState): nav is NavigationState & { navigator: 'skills' } {
  return nav.navigator === 'skills'
}

export function isDispatchNavigation(nav: NavigationState): nav is NavigationState & { navigator: 'dispatch'; filter?: DispatchFilter } {
  return nav.navigator === 'dispatch'
}

// Default navigation state
export const DEFAULT_NAVIGATION_STATE: NavigationState = {
  navigator: 'dispatch',
  filter: 'myTasks' as DispatchFilter,
}

// Auto-update types
export interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion: string | null
  downloadState: 'idle' | 'downloading' | 'ready' | 'error'
  downloadProgress: number
}

// IPC channel constants
export const IPC_CHANNELS = {
  // App settings
  GET_APP_VERSION: 'get-app-version',
  GET_THEME: 'get-theme',
  SET_THEME: 'set-theme',

  // Window management
  CLOSE_WINDOW: 'close-window',
  MINIMIZE_WINDOW: 'minimize-window',
  MAXIMIZE_WINDOW: 'maximize-window',

  // External links
  OPEN_EXTERNAL: 'open-external',
} as const
