/**
 * Demo Seed Data
 *
 * Pre-loaded tasks and wins for a reliable 60-second demo.
 * Seeded on mount — no feature flag needed for hackathon.
 */

import type { DispatchTask, SharedWin } from '@craft-agent/core/types'

const now = Date.now()
const ONE_DAY = 24 * 60 * 60 * 1000

/** Create a deadline ~1 hour from now so the 90% threshold fires quickly */
function deadlineFromNow(minutes: number): { startedAt: number; deadline: number } {
  const totalDuration = minutes * 60 * 1000
  // Place startedAt so we're at ~89% progress
  const startedAt = now - totalDuration * 0.89
  const deadline = startedAt + totalDuration
  return { startedAt, deadline }
}

const { startedAt: metricsStart, deadline: metricsDeadline } = deadlineFromNow(60)

export const DEMO_SEED_TASK_ID = 'demo-metrics-dashboard'

export const DEMO_TASKS: DispatchTask[] = [
  // ── Sarah's Todo (assigned to sarah, not completed) ──
  {
    id: 'demo-review-marketing',
    title: 'Review Q1 marketing copy',
    description: 'Final review pass on the Q1 campaign landing page copy before it goes live.',
    originalIntent: 'Can someone review the Q1 marketing copy before launch?',
    requesterId: 'alex',
    assigneeId: 'sarah',
    executionTier: 'human',
    routingReason: 'Writing review — Sarah has strong technical writing skills.',
    status: 'assigned',
    priority: 'high',
    isAnonymous: true,
    requesterRevealed: false,
    createdAt: now - 2 * ONE_DAY,
    deadline: now + 5 * ONE_DAY, // Next Friday-ish
    estimatedMinutes: 30,
    requiredSkills: ['code', 'react'],
  },
  {
    id: 'demo-fix-login',
    title: 'Fix login page responsiveness',
    description: 'The login form overflows on mobile viewports under 375px. Needs a CSS fix.',
    originalIntent: 'Login page is broken on small phones, can someone fix it?',
    requesterId: 'jordan',
    assigneeId: 'sarah',
    executionTier: 'human',
    routingReason: 'Frontend bug — Sarah is the best match for React and CSS work.',
    status: 'in_progress',
    priority: 'urgent',
    isAnonymous: true,
    requesterRevealed: false,
    createdAt: now - ONE_DAY,
    startedAt: now - 4 * 60 * 60 * 1000, // started 4h ago
    deadline: now + ONE_DAY, // Tomorrow
    estimatedMinutes: 45,
    requiredSkills: ['code', 'react'],
  },
  {
    id: 'demo-api-docs',
    title: 'Write API documentation for v2',
    description: 'Document the new v2 REST endpoints including auth, pagination, and error codes.',
    originalIntent: 'We need API docs for the v2 endpoints before developer preview',
    requesterId: 'alex',
    assigneeId: 'sarah',
    executionTier: 'human',
    routingReason: 'Technical writing — Sarah has API design experience.',
    status: 'assigned',
    priority: 'medium',
    isAnonymous: true,
    requesterRevealed: false,
    createdAt: now - 3 * ONE_DAY,
    estimatedMinutes: 120,
    requiredSkills: ['code', 'api-design'],
  },

  // ── Sarah's Sent (requested by sarah) ──
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
  {
    id: 'demo-investor-deck',
    title: 'Prepare investor deck slides',
    description: 'Update the pitch deck with latest traction numbers and product roadmap for the Series A meeting.',
    originalIntent: 'Need the investor deck updated with our latest numbers',
    requesterId: 'sarah',
    assigneeId: 'alex',
    executionTier: 'human',
    routingReason: 'Presentation task — Alex has planning and writing skills.',
    status: 'assigned',
    priority: 'high',
    isAnonymous: true,
    requesterRevealed: false,
    createdAt: now - ONE_DAY,
    deadline: now + 7 * ONE_DAY,
    estimatedMinutes: 90,
    requiredSkills: ['planning', 'writing'],
  },
  {
    id: 'demo-user-interviews',
    title: 'Run user interview analysis',
    description: 'Analyze transcripts from the last 8 user interviews and surface top pain points.',
    originalIntent: 'Can someone go through the user interview recordings and pull out themes?',
    requesterId: 'sarah',
    assigneeId: 'jordan',
    executionTier: 'human',
    routingReason: 'Analysis task — Jordan is best suited for qualitative data analysis.',
    status: 'in_progress',
    priority: 'medium',
    isAnonymous: true,
    requesterRevealed: false,
    createdAt: now - 2 * ONE_DAY,
    startedAt: now - ONE_DAY,
    estimatedMinutes: 60,
    requiredSkills: ['analysis'],
  },

  // ── Sarah's Done (completed, sarah is assignee or requester) ──
  {
    id: 'demo-onboarding-flow',
    title: 'Design new onboarding flow',
    description: 'Redesign the 5-step onboarding wizard to reduce drop-off at step 3.',
    originalIntent: 'Our onboarding drop-off is too high, can someone redesign the flow?',
    requesterId: 'alex',
    assigneeId: 'sarah',
    executionTier: 'human',
    routingReason: 'Frontend design — Sarah has React and UX experience.',
    status: 'completed',
    priority: 'high',
    isAnonymous: true,
    requesterRevealed: true,
    createdAt: now - 5 * ONE_DAY,
    startedAt: now - 4 * ONE_DAY,
    completedAt: now - 2 * ONE_DAY,
    result: 'Redesigned the flow from 5 steps to 3. Drop-off at step 3 reduced by 40% in A/B test.',
    estimatedMinutes: 180,
    requiredSkills: ['code', 'react'],
  },
  {
    id: 'demo-cicd-pipeline',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment to staging.',
    originalIntent: 'We need automated deploys to staging',
    requesterId: 'jordan',
    assigneeId: 'sarah',
    executionTier: 'human',
    routingReason: 'DevOps task — Sarah has the most infrastructure experience.',
    status: 'completed',
    priority: 'medium',
    isAnonymous: true,
    requesterRevealed: true,
    createdAt: now - 7 * ONE_DAY,
    startedAt: now - 6 * ONE_DAY,
    completedAt: now - 4 * ONE_DAY,
    result: 'Pipeline running on GitHub Actions — lint, test, build, deploy to staging on merge to main.',
    estimatedMinutes: 120,
    requiredSkills: ['code', 'testing'],
  },
  {
    id: 'demo-team-retro',
    title: 'Quarterly team retrospective',
    description: 'Facilitate the Q4 retro and compile action items for the team.',
    originalIntent: 'Can someone organize and run our quarterly retro?',
    requesterId: 'sarah',
    assigneeId: 'alex',
    executionTier: 'human',
    routingReason: 'Facilitation — Alex has planning and team coordination skills.',
    status: 'completed',
    priority: 'low',
    isAnonymous: true,
    requesterRevealed: true,
    createdAt: now - 10 * ONE_DAY,
    startedAt: now - 9 * ONE_DAY,
    completedAt: now - 7 * ONE_DAY,
    result: 'Retro completed. 12 action items captured, top 3 prioritized for Q1.',
    estimatedMinutes: 60,
    requiredSkills: ['planning'],
  },
]

export const DEMO_WINS: SharedWin[] = [
  {
    id: 'demo-win-onboarding-flow',
    taskId: 'demo-onboarding-flow',
    taskTitle: 'Design new onboarding flow',
    completedByName: 'Sarah Chen',
    completedByRole: 'Engineer',
    executionTier: 'human',
    completedAt: now - 2 * ONE_DAY,
  },
  {
    id: 'demo-win-cicd',
    taskId: 'demo-cicd-pipeline',
    taskTitle: 'Set up CI/CD pipeline',
    completedByName: 'Sarah Chen',
    completedByRole: 'Engineer',
    executionTier: 'human',
    completedAt: now - 4 * ONE_DAY,
  },
  {
    id: 'demo-win-retro',
    taskId: 'demo-team-retro',
    taskTitle: 'Quarterly team retrospective',
    completedByName: 'Alex Park',
    completedByRole: 'PM',
    executionTier: 'human',
    completedAt: now - 7 * ONE_DAY,
    feedback: { quality: 'thumbs_up', kudos: true },
  },
]

/** Initial task IDs per user (in-progress or assigned tasks) */
export const DEMO_JORDAN_TASK_IDS = [DEMO_SEED_TASK_ID, 'demo-user-interviews']
export const DEMO_SARAH_TASK_IDS = ['demo-review-marketing', 'demo-fix-login', 'demo-api-docs']
export const DEMO_ALEX_TASK_IDS = ['demo-investor-deck']
