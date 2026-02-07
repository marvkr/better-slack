/**
 * Dispatch Jotai Atoms
 *
 * In-memory state for the Dispatch task-native workplace.
 * No persistence needed — this is a hackathon demo.
 */

import { atom } from 'jotai'
import type { DispatchUser, DispatchTask, SharedWin } from '@craft-agent/core/types'
import { DISPATCH_USERS, DEFAULT_USER_ID } from '@/config/dispatch-users'

// ============================================
// User Atoms
// ============================================

/** All dispatch users (hardcoded team) */
export const dispatchUsersAtom = atom<DispatchUser[]>(DISPATCH_USERS)

/** Currently active user ID */
export const activeUserIdAtom = atom<string>(DEFAULT_USER_ID)

/** Derived: currently active user */
export const activeUserAtom = atom<DispatchUser>((get) => {
  const users = get(dispatchUsersAtom)
  const activeId = get(activeUserIdAtom)
  return users.find(u => u.id === activeId) ?? users[0]
})

// ============================================
// Task Atoms
// ============================================

/** All dispatch tasks */
export const dispatchTasksAtom = atom<Map<string, DispatchTask>>(new Map())

/** Derived: tasks assigned to the active user */
export const myTasksAtom = atom<DispatchTask[]>((get) => {
  const tasks = get(dispatchTasksAtom)
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
export const submittedTasksAtom = atom<DispatchTask[]>((get) => {
  const tasks = get(dispatchTasksAtom)
  const activeId = get(activeUserIdAtom)
  return Array.from(tasks.values())
    .filter(t => t.requesterId === activeId)
    .sort((a, b) => b.createdAt - a.createdAt)
})

/** Derived: completed tasks assigned to or submitted by the active user */
export const completedTasksAtom = atom<DispatchTask[]>((get) => {
  const tasks = get(dispatchTasksAtom)
  const activeId = get(activeUserIdAtom)
  return Array.from(tasks.values())
    .filter(t => t.status === 'completed' && (t.assigneeId === activeId || t.requesterId === activeId))
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt))
})

/** Derived: all tasks (for admin view) */
export const allTasksAtom = atom<DispatchTask[]>((get) => {
  const tasks = get(dispatchTasksAtom)
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
export const addTaskAtom = atom(null, (get, set, task: DispatchTask) => {
  const tasks = new Map(get(dispatchTasksAtom))
  tasks.set(task.id, task)
  set(dispatchTasksAtom, tasks)
})

/** Update a task by ID */
export const updateTaskAtom = atom(null, (get, set, taskId: string, updates: Partial<DispatchTask>) => {
  const tasks = new Map(get(dispatchTasksAtom))
  const existing = tasks.get(taskId)
  if (!existing) return
  tasks.set(taskId, { ...existing, ...updates })
  set(dispatchTasksAtom, tasks)
})

/** Add a shared win */
export const addSharedWinAtom = atom(null, (get, set, win: SharedWin) => {
  set(sharedWinsAtom, [win, ...get(sharedWinsAtom)])
})

/** Update user's current task list */
export const updateUserTasksAtom = atom(null, (get, set, userId: string, taskIds: string[]) => {
  const users = get(dispatchUsersAtom).map(u =>
    u.id === userId ? { ...u, currentTaskIds: taskIds } : u
  )
  set(dispatchUsersAtom, users)
})
