/**
 * DispatchContext
 *
 * Provides coordinator actions for the Dispatch task-native workplace.
 * Manages task lifecycle: submit intent → route → assign → execute → complete → feedback.
 */

import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import type { DispatchTask, DispatchUser, TaskFeedback, SharedWin } from '@craft-agent/core/types'
import {
  dispatchTasksAtom,
  activeUserIdAtom,
  dispatchUsersAtom,
  addTaskAtom,
  updateTaskAtom,
  addSharedWinAtom,
  updateUserTasksAtom,
  sharedWinsAtom,
} from '@/atoms/dispatch'
import { DEMO_TASKS, DEMO_WINS, DEMO_JORDAN_TASK_IDS, DEMO_SARAH_TASK_IDS, DEMO_ALEX_TASK_IDS } from '@/config/dispatch-demo-seed'

let taskIdCounter = 0
function generateTaskId(): string {
  return `task-${Date.now()}-${++taskIdCounter}`
}

function generateWinId(): string {
  return `win-${Date.now()}-${++taskIdCounter}`
}

export interface DispatchContextType {
  /** Submit a new task from parsed coordinator output */
  createTask: (task: Omit<DispatchTask, 'id' | 'createdAt' | 'status' | 'isAnonymous' | 'requesterRevealed'>) => DispatchTask
  /** Assign a task to a user */
  assignTask: (taskId: string, assigneeId: string) => void
  /** Start working on a task */
  startTask: (taskId: string) => void
  /** Complete a task with optional result */
  completeTask: (taskId: string, result?: string) => void
  /** Reassign a task to a different user */
  reassignTask: (taskId: string, newAssigneeId: string, reason?: string) => void
  /** Submit feedback on a completed task */
  submitFeedback: (taskId: string, feedback: TaskFeedback) => void
  /** Cancel a task */
  cancelTask: (taskId: string) => void
  /** Switch the active user */
  switchUser: (userId: string) => void
  /** Get a task by ID */
  getTask: (taskId: string) => DispatchTask | undefined
  /** Find the best assignee for required skills */
  findBestAssignee: (requiredSkills: string[], excludeIds?: string[]) => DispatchUser | null
  /** Task ID that triggered the 90% deadline check dialog (or null) */
  deadlineCheckTaskId: string | null
  /** Dismiss the deadline check dialog */
  dismissDeadlineCheck: () => void
}

const DispatchContext = createContext<DispatchContextType | null>(null)

export function useDispatch(): DispatchContextType {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useDispatch must be used within DispatchProvider')
  return ctx
}

export function DispatchProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useAtom(dispatchTasksAtom)
  const users = useAtomValue(dispatchUsersAtom)
  const [, setActiveUserId] = useAtom(activeUserIdAtom)
  const addTask = useSetAtom(addTaskAtom)
  const updateTask = useSetAtom(updateTaskAtom)
  const addWin = useSetAtom(addSharedWinAtom)
  const updateUserTasks = useSetAtom(updateUserTasksAtom)
  const setWins = useSetAtom(sharedWinsAtom)

  const [deadlineCheckTaskId, setDeadlineCheckTaskId] = useState<string | null>(null)

  const tasksRef = useRef(tasks)
  useEffect(() => { tasksRef.current = tasks }, [tasks])

  const usersRef = useRef(users)
  useEffect(() => { usersRef.current = users }, [users])

  // Seed demo data on mount
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true

    // Seed tasks
    for (const task of DEMO_TASKS) {
      addTask(task)
    }

    // Seed wins
    setWins(DEMO_WINS)

    // Seed user task IDs
    updateUserTasks('jordan', DEMO_JORDAN_TASK_IDS)
    updateUserTasks('sarah', DEMO_SARAH_TASK_IDS)
    updateUserTasks('alex', DEMO_ALEX_TASK_IDS)
  }, [addTask, setWins, updateUserTasks])

  const findBestAssignee = useCallback((requiredSkills: string[], excludeIds: string[] = []): DispatchUser | null => {
    const candidates = usersRef.current.filter(u => !excludeIds.includes(u.id))

    // Score each candidate: skill match * availability
    let bestUser: DispatchUser | null = null
    let bestScore = -1

    for (const user of candidates) {
      // Check capacity
      if (user.currentTaskIds.length >= user.maxConcurrentTasks) continue

      // Skill match score
      const matchedSkills = requiredSkills.filter(s => user.skills.includes(s))
      const skillScore = requiredSkills.length > 0
        ? matchedSkills.length / requiredSkills.length
        : 0.5

      // Availability score (fewer current tasks = more available)
      const availabilityScore = 1 - (user.currentTaskIds.length / user.maxConcurrentTasks)

      const totalScore = (skillScore * 0.7) + (availabilityScore * 0.3)

      if (totalScore > bestScore) {
        bestScore = totalScore
        bestUser = user
      }
    }

    return bestUser
  }, [])

  const createTask = useCallback((
    input: Omit<DispatchTask, 'id' | 'createdAt' | 'status' | 'isAnonymous' | 'requesterRevealed'>
  ): DispatchTask => {
    const task: DispatchTask = {
      ...input,
      id: generateTaskId(),
      createdAt: Date.now(),
      status: input.assigneeId ? 'assigned' : 'pending',
      isAnonymous: true,
      requesterRevealed: false,
    }
    addTask(task)

    // Update assignee's task list
    if (task.assigneeId) {
      const assignee = usersRef.current.find(u => u.id === task.assigneeId)
      if (assignee) {
        updateUserTasks(task.assigneeId, [...assignee.currentTaskIds, task.id])
      }
    }

    return task
  }, [addTask, updateUserTasks])

  const assignTask = useCallback((taskId: string, assigneeId: string) => {
    const task = tasksRef.current.get(taskId)
    if (!task) return

    updateTask(taskId, {
      assigneeId,
      status: 'assigned',
    })

    // Update assignee's task list
    const assignee = usersRef.current.find(u => u.id === assigneeId)
    if (assignee) {
      updateUserTasks(assigneeId, [...assignee.currentTaskIds, taskId])
    }

    toast(`Task assigned to ${assignee?.name ?? assigneeId}`)
  }, [updateTask, updateUserTasks])

  const startTask = useCallback((taskId: string) => {
    updateTask(taskId, {
      status: 'in_progress',
      startedAt: Date.now(),
    })
  }, [updateTask])

  const completeTask = useCallback((taskId: string, result?: string) => {
    const task = tasksRef.current.get(taskId)
    if (!task) return

    updateTask(taskId, {
      status: 'completed',
      completedAt: Date.now(),
      result,
      requesterRevealed: true,
    })

    // Remove from assignee's current tasks
    if (task.assigneeId) {
      const assignee = usersRef.current.find(u => u.id === task.assigneeId)
      if (assignee) {
        updateUserTasks(task.assigneeId, assignee.currentTaskIds.filter(id => id !== taskId))
      }
    }

    // Add to shared wins
    const completedBy = task.assigneeId
      ? usersRef.current.find(u => u.id === task.assigneeId)
      : null

    const win: SharedWin = {
      id: generateWinId(),
      taskId: task.id,
      taskTitle: task.title,
      completedByName: completedBy?.name ?? 'AI',
      completedByRole: completedBy?.role ?? 'Assistant',
      executionTier: task.executionTier,
      completedAt: Date.now(),
    }
    addWin(win)

    toast.success(`Task completed: ${task.title}`)
  }, [updateTask, updateUserTasks, addWin])

  const reassignTask = useCallback((taskId: string, newAssigneeId: string, reason?: string) => {
    const task = tasksRef.current.get(taskId)
    if (!task) return

    // Remove from old assignee
    if (task.assigneeId) {
      const oldAssignee = usersRef.current.find(u => u.id === task.assigneeId)
      if (oldAssignee) {
        updateUserTasks(task.assigneeId, oldAssignee.currentTaskIds.filter(id => id !== taskId))
      }
    }

    // Update task
    const previousAssigneeIds = [
      ...(task.escalationState?.previousAssigneeIds ?? []),
      ...(task.assigneeId ? [task.assigneeId] : []),
    ]

    updateTask(taskId, {
      assigneeId: newAssigneeId,
      status: 'reassigned',
      escalationState: {
        ...(task.escalationState ?? { checkedAt50: false, warnedAt75: false, reassignedAt90: false, previousAssigneeIds: [] }),
        reassignedAt90: true,
        previousAssigneeIds,
      },
    })

    // Add to new assignee
    const newAssignee = usersRef.current.find(u => u.id === newAssigneeId)
    if (newAssignee) {
      updateUserTasks(newAssigneeId, [...newAssignee.currentTaskIds, taskId])
    }

    const newName = newAssignee?.name ?? newAssigneeId
    toast(`Task reassigned to ${newName}${reason ? `: ${reason}` : ''}`)
  }, [updateTask, updateUserTasks])

  const submitFeedback = useCallback((taskId: string, feedback: TaskFeedback) => {
    updateTask(taskId, { feedback })
  }, [updateTask])

  const cancelTask = useCallback((taskId: string) => {
    const task = tasksRef.current.get(taskId)
    if (!task) return

    // Remove from assignee
    if (task.assigneeId) {
      const assignee = usersRef.current.find(u => u.id === task.assigneeId)
      if (assignee) {
        updateUserTasks(task.assigneeId, assignee.currentTaskIds.filter(id => id !== taskId))
      }
    }

    updateTask(taskId, { status: 'cancelled' })
  }, [updateTask, updateUserTasks])

  const switchUser = useCallback((userId: string) => {
    setActiveUserId(userId)
  }, [setActiveUserId])

  const getTask = useCallback((taskId: string): DispatchTask | undefined => {
    return tasksRef.current.get(taskId)
  }, [])

  const dismissDeadlineCheck = useCallback(() => {
    setDeadlineCheckTaskId(null)
  }, [])

  // Deadline monitor: check tasks every 30 seconds
  // At 90%, instead of auto-reassigning, trigger the conversation dialog
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const currentTasks = tasksRef.current

      for (const [, task] of currentTasks) {
        if (!task.deadline || task.status === 'completed' || task.status === 'cancelled') continue
        if (!task.startedAt) continue

        const totalDuration = task.deadline - task.startedAt
        const elapsed = now - task.startedAt
        const progress = elapsed / totalDuration

        const escalation = task.escalationState ?? {
          checkedAt50: false,
          warnedAt75: false,
          reassignedAt90: false,
          previousAssigneeIds: [],
        }

        if (progress >= 0.9 && !escalation.reassignedAt90) {
          // Trigger the deadline conversation dialog instead of auto-reassigning
          setDeadlineCheckTaskId(task.id)
          // Mark as checked so we don't re-trigger
          updateTask(task.id, {
            escalationState: { ...escalation, reassignedAt90: true },
          })
        } else if (progress >= 0.75 && !escalation.warnedAt75) {
          updateTask(task.id, {
            escalationState: { ...escalation, warnedAt75: true },
          })
          toast.warning(`Deadline warning: "${task.title}" is at 75%`)
        } else if (progress >= 0.5 && !escalation.checkedAt50) {
          updateTask(task.id, {
            escalationState: { ...escalation, checkedAt50: true },
          })
          toast.info(`Progress check: "${task.title}" is at 50%`)
        }
      }
    }, 30_000)

    return () => clearInterval(interval)
  }, [updateTask])

  const contextValue: DispatchContextType = {
    createTask,
    assignTask,
    startTask,
    completeTask,
    reassignTask,
    submitFeedback,
    cancelTask,
    switchUser,
    getTask,
    findBestAssignee,
    deadlineCheckTaskId,
    dismissDeadlineCheck,
  }

  return (
    <DispatchContext.Provider value={contextValue}>
      {children}
    </DispatchContext.Provider>
  )
}
