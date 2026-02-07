import type { DispatchUser } from '@craft-agent/core/types'

export const DISPATCH_USERS: DispatchUser[] = [
  {
    id: 'sarah',
    name: 'Sarah Chen',
    role: 'Engineer',
    avatar: undefined,
    skills: ['code', 'typescript', 'react', 'api-design', 'testing'],
    mcpCapabilities: [],
    currentTaskIds: [],
    maxConcurrentTasks: 3,
  },
  {
    id: 'jordan',
    name: 'Jordan Rivers',
    role: 'Data Analyst',
    avatar: undefined,
    skills: ['data', 'analysis', 'sql', 'spreadsheets', 'visualization', 'python'],
    mcpCapabilities: [],
    currentTaskIds: [],
    maxConcurrentTasks: 3,
  },
  {
    id: 'alex',
    name: 'Alex Park',
    role: 'PM',
    avatar: undefined,
    skills: ['planning', 'writing', 'analysis', 'spreadsheets', 'user-research', 'roadmapping'],
    mcpCapabilities: [],
    currentTaskIds: [],
    maxConcurrentTasks: 3,
  },
]

export const DEFAULT_USER_ID = 'sarah'

/** Get user initials for avatar display */
export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

/** Avatar colors mapped by user ID */
export const USER_COLORS: Record<string, string> = {
  sarah: '#6366f1',  // indigo
  jordan: '#f59e0b', // amber
  alex: '#ec4899',   // pink
}
