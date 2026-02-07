/**
 * Dispatch Types
 *
 * Data model for the Dispatch task-native workplace.
 * Tasks wrap sessions — each task can create a CraftAgent session for AI execution.
 */

export interface DispatchUser {
  id: string
  name: string
  role: string
  avatar?: string
  skills: string[]
  mcpCapabilities?: string[]
  currentTaskIds: string[]
  maxConcurrentTasks: number
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskExecutionTier = 'ai_direct' | 'ai_agent' | 'human'
export type DispatchTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'reassigned' | 'cancelled'

export interface DispatchTask {
  id: string
  title: string
  description: string
  originalIntent: string
  requesterId: string
  assigneeId?: string
  executionTier: TaskExecutionTier
  routingReason?: string
  status: DispatchTaskStatus
  priority: TaskPriority
  isAnonymous: boolean
  requesterRevealed: boolean
  createdAt: number
  deadline?: number
  startedAt?: number
  completedAt?: number
  estimatedMinutes?: number
  escalationState?: {
    checkedAt50: boolean
    warnedAt75: boolean
    reassignedAt90: boolean
    previousAssigneeIds: string[]
  }
  sessionId?: string
  result?: string
  requiredSkills: string[]
  feedback?: TaskFeedback
  hasUnreadMessages?: boolean
}

export interface TaskFeedback {
  quality?: 'thumbs_up' | 'thumbs_down'
  kudos?: boolean
  feedbackById?: string
}

export interface SharedWin {
  id: string
  taskId: string
  taskTitle: string
  completedByName: string
  completedByRole: string
  executionTier: TaskExecutionTier
  completedAt: number
  feedback?: TaskFeedback
}
