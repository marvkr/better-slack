/**
 * API Client for Dispatch backend
 * Connects to the Hono backend running on localhost:3001
 */

const API_BASE_URL = 'http://localhost:3001/api'

/**
 * Backend task format (from database schema)
 */
export interface BackendTask {
  id: string
  title: string
  description: string
  deadline: string // ISO timestamp
  priority: string
  requiredSkills: string[] | null
  status: string
  requesterId: string
  assigneeId: string | null
  assignedAt: string | null
  completedAt: string | null
  aiCompleted: boolean
  aiResult: string | null
  progressPercentage: number
  createdAt: string
  updatedAt: string
}

/**
 * Helper to create headers with X-User-Id
 */
function createHeaders(userId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  }
}

/**
 * Fetch tasks assigned to the current user
 */
export async function getMyTasks(userId: string): Promise<BackendTask[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/my-tasks`, {
      headers: createHeaders(userId),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch my tasks: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('[API Client] Error fetching my tasks:', error)
    throw error
  }
}

/**
 * Fetch tasks sent by the current user
 */
export async function getSentTasks(userId: string): Promise<BackendTask[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/sent`, {
      headers: createHeaders(userId),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch sent tasks: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('[API Client] Error fetching sent tasks:', error)
    throw error
  }
}

/**
 * Fetch completed tasks
 */
export async function getDoneTasks(userId: string): Promise<BackendTask[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/done`, {
      headers: createHeaders(userId),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch done tasks: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('[API Client] Error fetching done tasks:', error)
    throw error
  }
}

/**
 * Mark a task as complete
 */
export async function completeTask(taskId: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: createHeaders(userId),
    })
    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.statusText}`)
    }
  } catch (error) {
    console.error('[API Client] Error completing task:', error)
    throw error
  }
}

/**
 * Reassign a task to another user
 */
export async function reassignTask(
  taskId: string,
  newAssigneeId: string,
  reason: string,
  userId: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/reassign`, {
      method: 'POST',
      headers: createHeaders(userId),
      body: JSON.stringify({
        newAssigneeId,
        reason,
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to reassign task: ${response.statusText}`)
    }
  } catch (error) {
    console.error('[API Client] Error reassigning task:', error)
    throw error
  }
}
