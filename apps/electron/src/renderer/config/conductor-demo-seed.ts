/**
 * Demo Seed Data
 *
 * Pre-loaded tasks and wins for a reliable 60-second demo.
 * Seeded on mount — no feature flag needed for hackathon.
 */

import type { ConductorTask, SharedWin } from '@craft-agent/core/types'

/** Create a deadline ~1 hour from now so the 90% threshold fires quickly */
function deadlineFromNow(minutes: number): { startedAt: number; deadline: number } {
  const now = Date.now()
  const totalDuration = minutes * 60 * 1000
  // Place startedAt so we're at ~89% progress
  const startedAt = now - totalDuration * 0.89
  const deadline = startedAt + totalDuration
  return { startedAt, deadline }
}

const { startedAt: metricsStart, deadline: metricsDeadline } = deadlineFromNow(60)

export const DEMO_SEED_TASK_ID = 'demo-metrics-dashboard'

export const DEMO_TASKS: ConductorTask[] = [
  {
    id: DEMO_SEED_TASK_ID,
    title: 'Onboarding metrics dashboard',
    description: 'Build a dashboard summarizing onboarding metrics for last quarter — signup rates, activation, drop-off points.',
    originalIntent: 'I need a dashboard showing our onboarding metrics for last quarter',
    requesterId: 'sarah',
    assigneeId: 'jordan',
    executionTier: 'human',
    routingReason: 'Data visualization task — Jordan has the best skill match with data, analysis, and visualization.',
    status: 'in_progress',
    priority: 'high',
    isAnonymous: true,
    requesterRevealed: false,
    createdAt: metricsStart,
    startedAt: metricsStart,
    deadline: metricsDeadline,
    estimatedMinutes: 60,
    requiredSkills: ['data', 'analysis', 'visualization'],
    escalationState: {
      checkedAt50: true,
      warnedAt75: true,
      reassignedAt90: false,
      previousAssigneeIds: [],
    },
  },
]

export const DEMO_WINS: SharedWin[] = [
  {
    id: 'demo-win-q4-report',
    taskId: 'demo-task-q4-report',
    taskTitle: 'Customer satisfaction report Q4',
    completedByName: 'Jordan Rivers',
    completedByRole: 'Data Analyst',
    executionTier: 'human',
    completedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    feedback: { quality: 'thumbs_up', kudos: true },
  },
]

/** Jordan's initial task IDs (the in-progress metrics dashboard) */
export const DEMO_JORDAN_TASK_IDS = [DEMO_SEED_TASK_ID]
