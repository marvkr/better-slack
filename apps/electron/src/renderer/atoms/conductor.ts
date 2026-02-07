/**
 * Conductor Jotai Atoms
 *
 * In-memory state for the Conductor task-native workplace.
 * No persistence needed — this is a hackathon demo.
 */

import { atom } from 'jotai'
import type { ConductorUser, ConductorTask, SharedWin } from '@craft-agent/core/types'
import { CONDUCTOR_USERS, DEFAULT_USER_ID } from '@/config/conductor-users'

// ============================================
// User Atoms
// ============================================

/** All conductor users (hardcoded team) */
export const conductorUsersAtom = atom<ConductorUser[]>(CONDUCTOR_USERS)

/** Currently active user ID */
export const activeUserIdAtom = atom<string>(DEFAULT_USER_ID)

/** Derived: currently active user */
export const activeUserAtom = atom<ConductorUser>((get) => {
  const users = get(conductorUsersAtom)
  const activeId = get(activeUserIdAtom)
  return users.find(u => u.id === activeId) ?? users[0]
})

// ============================================
// Task Atoms
// ============================================

/** All conductor tasks */
export const conductorTasksAtom = atom<Map<string, ConductorTask>>(new Map())

/** Derived: tasks assigned to the active user */
export const myTasksAtom = atom<ConductorTask[]>((get) => {
  const tasks = get(conductorTasksAtom)
  const activeId = get(activeUserIdAtom)
  return Array.from(tasks.values())
    .filter(t => t.assigneeId === activeId && t.status !== 'cancelled')
    .sort((a, b) => {
      // Sort by priority (urgent first), then by creation date
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (pDiff !== 0) return pDiff
      return b.createdAt - a.createdAt
    })
})

/** Derived: tasks submitted by the active user */
export const submittedTasksAtom = atom<ConductorTask[]>((get) => {
  const tasks = get(conductorTasksAtom)
  const activeId = get(activeUserIdAtom)
  return Array.from(tasks.values())
    .filter(t => t.requesterId === activeId)
    .sort((a, b) => b.createdAt - a.createdAt)
})

/** Derived: completed tasks assigned to or submitted by the active user */
export const completedTasksAtom = atom<ConductorTask[]>((get) => {
  const tasks = get(conductorTasksAtom)
  const activeId = get(activeUserIdAtom)
  return Array.from(tasks.values())
    .filter(t => t.status === 'completed' && (t.assigneeId === activeId || t.requesterId === activeId))
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt))
})

/** Derived: all tasks (for admin view) */
export const allTasksAtom = atom<ConductorTask[]>((get) => {
  const tasks = get(conductorTasksAtom)
  return Array.from(tasks.values())
    .filter(t => t.status !== 'cancelled')
    .sort((a, b) => b.createdAt - a.createdAt)
})

// ============================================
// Shared Wins
// ============================================

/** Shared wins feed */
export const sharedWinsAtom = atom<SharedWin[]>([])

// ============================================
// Status Count Atoms
// ============================================

/** Counts of my tasks by status */
export const myTaskStatusCountsAtom = atom((get) => {
  const tasks = get(myTasksAtom)
  const counts: Record<string, number> = { assigned: 0, in_progress: 0, completed: 0, reassigned: 0 }
  for (const t of tasks) {
    counts[t.status] = (counts[t.status] ?? 0) + 1
  }
  return counts
})

/** Counts of submitted tasks by status */
export const submittedTaskStatusCountsAtom = atom((get) => {
  const tasks = get(submittedTasksAtom)
  const counts: Record<string, number> = { pending: 0, assigned: 0, in_progress: 0, completed: 0, reassigned: 0 }
  for (const t of tasks) {
    counts[t.status] = (counts[t.status] ?? 0) + 1
  }
  return counts
})

// ============================================
// Write Atoms (actions)
// ============================================

/** Add a task to the store */
export const addTaskAtom = atom(null, (get, set, task: ConductorTask) => {
  const tasks = new Map(get(conductorTasksAtom))
  tasks.set(task.id, task)
  set(conductorTasksAtom, tasks)
})

/** Update a task by ID */
export const updateTaskAtom = atom(null, (get, set, taskId: string, updates: Partial<ConductorTask>) => {
  const tasks = new Map(get(conductorTasksAtom))
  const existing = tasks.get(taskId)
  if (!existing) return
  tasks.set(taskId, { ...existing, ...updates })
  set(conductorTasksAtom, tasks)
})

/** Add a shared win */
export const addSharedWinAtom = atom(null, (get, set, win: SharedWin) => {
  set(sharedWinsAtom, [win, ...get(sharedWinsAtom)])
})

/** Update user's current task list */
export const updateUserTasksAtom = atom(null, (get, set, userId: string, taskIds: string[]) => {
  const users = get(conductorUsersAtom).map(u =>
    u.id === userId ? { ...u, currentTaskIds: taskIds } : u
  )
  set(conductorUsersAtom, users)
})
