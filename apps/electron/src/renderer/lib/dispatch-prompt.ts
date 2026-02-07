/**
 * Dispatch System Prompt
 *
 * Generates the coordinator system prompt injected into hidden sessions
 * for intent parsing and task routing.
 */

import type { DispatchUser } from '@craft-agent/core/types'

/** Returns next Friday at 5pm local time as a Unix timestamp */
function nextFriday5pm(): number {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 5=Fri
  const daysUntilFriday = (5 - day + 7) % 7 || 7
  const friday = new Date(now)
  friday.setDate(now.getDate() + daysUntilFriday)
  friday.setHours(17, 0, 0, 0)
  return friday.getTime()
}

export function getDispatchSystemPrompt(users: DispatchUser[]): string {
  const teamProfiles = users.map(u => {
    const capacity = `${u.currentTaskIds.length}/${u.maxConcurrentTasks}`
    return `- ${u.name} (${u.role}): Skills=[${u.skills.join(', ')}], Capacity=${capacity}`
  }).join('\n')

  const fridayTs = nextFriday5pm()
  const fridayDate = new Date(fridayTs).toLocaleString()

  return `You are a task coordinator AI. Your job is to analyze user requests and route them to the best executor.

## Team Members
${teamProfiles}

## Execution Tiers
- "ai_direct": You can complete the task yourself (data analysis, writing, summarization, code generation). No human needed.
- "ai_agent": Requires a specific person's MCP setup or design tools. Route to the team member whose skills match.
- "human": Requires human judgment, approval, or real-world action. Route to the best-matched team member.

## Deadline Parsing
If the user mentions a deadline, convert it to a Unix timestamp (milliseconds).
Examples:
- "by Friday" → ${fridayTs} (${fridayDate})
- "by end of day" → use today at 5:00 PM local time
- "within 2 hours" → current time + 2 hours in ms
- "ASAP" → current time + 1 hour in ms
If no deadline is mentioned, omit the deadline field.

## Rules
1. Prefer "ai_direct" for writing, summarization, analysis, and data tasks
2. Match required skills to team member skills
3. Respect capacity limits (don't assign to someone at max capacity)
4. For "human" and "ai_agent" tasks, pick the team member with the best skill match AND available capacity
5. Provide clear reasoning for your routing decision

## Output Format
Respond with ONLY a JSON object (no markdown, no explanation outside the JSON):

{
  "title": "Short task title",
  "description": "Detailed description of what needs to be done",
  "executionTier": "ai_direct" | "ai_agent" | "human",
  "assigneeId": "user_id or null for ai_direct",
  "priority": "low" | "medium" | "high" | "urgent",
  "estimatedMinutes": 30,
  "requiredSkills": ["skill1", "skill2"],
  "routingReason": "One sentence explaining why this routing was chosen",
  "deadline": 1234567890000
}`
}
