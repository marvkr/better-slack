import Anthropic from '@anthropic-ai/sdk';
import { findBestAssignee, getAssignmentInfo } from './task-assignment';
import type { ChatRequest, CoordinatorResponse } from '../types';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const COORDINATOR_SYSTEM_PROMPT = `You are a task coordination AI for a workplace task management system.

Your job is to analyze user requests and decide how to handle them:

1. **AI Direct Execution** (ai_direct): Tasks that are purely generative/analytical and can be completed by you immediately without human help.
   Examples: "Write a team update", "Summarize this document", "Draft an email", "Generate a report"

2. **Human Assignment** (human): Tasks that require human skills, domain knowledge, or human judgment.
   Examples: "Review this code", "Analyze metrics", "Create a dashboard", "Fix a bug"

3. **AI Agent Execution** (ai_agent): Complex tasks that require tool use/file access but can be done by an AI agent.
   Examples: "Run tests and fix errors", "Update documentation", "Refactor this code"

For user requests, extract:
- title: Short task title (5-10 words)
- description: Clear description of what needs to be done
- deadline: Parse natural language deadlines ("by Friday", "next week", "urgent") into ISO timestamps
- priority: low | medium | high | urgent
- requiredSkills: Array of skills needed (code, data, writing, design, testing, etc.)

Respond ONLY with valid JSON matching this schema:
{
  "executionTier": "ai_direct" | "human" | "ai_agent",
  "task": {
    "title": "string",
    "description": "string",
    "deadline": "ISO timestamp",
    "priority": "low" | "medium" | "high" | "urgent",
    "requiredSkills": ["skill1", "skill2"]
  },
  "result": "string (only if executionTier is ai_direct)"
}

Current time: ${new Date().toISOString()}

IMPORTANT: Respond with ONLY the JSON object, no markdown code blocks or extra text.`;

/**
 * Parse deadline from natural language
 */
function parseDeadline(input: string): Date {
  const now = new Date();
  const lowerInput = input.toLowerCase();

  // Urgent/ASAP = 4 hours
  if (lowerInput.includes('urgent') || lowerInput.includes('asap')) {
    return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  }

  // "by Friday" = next Friday at 5pm
  if (lowerInput.includes('friday')) {
    const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
    const friday = new Date(now);
    friday.setDate(now.getDate() + daysUntilFriday);
    friday.setHours(17, 0, 0, 0);
    return friday;
  }

  // "next week" = 7 days
  if (lowerInput.includes('next week')) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  // "tomorrow" = tomorrow at 5pm
  if (lowerInput.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow;
  }

  // Default: 2 days from now
  return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
}

/**
 * Coordinate a task - determine execution tier and handle accordingly
 */
export async function coordinateTask(request: ChatRequest): Promise<CoordinatorResponse> {
  // Call Claude API to analyze the request
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: COORDINATOR_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: request.message
    }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Parse JSON response
  let parsed: any;
  try {
    // Remove markdown code blocks if present
    const text = content.text.replace(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse Claude response:', content.text);
    throw new Error('Failed to parse AI response');
  }

  // Parse and fix deadline
  if (parsed.task?.deadline) {
    parsed.task.deadline = new Date(parsed.task.deadline);
  } else if (parsed.task) {
    // Fallback deadline parsing from original message
    parsed.task.deadline = parseDeadline(request.message);
  }

  const executionTier = parsed.executionTier;

  // Handle AI direct execution
  if (executionTier === 'ai_direct') {
    // For ai_direct, Claude should have generated the result already
    // Or we can call it again to generate the result
    let result = parsed.result;

    if (!result) {
      // Generate result if not provided
      const resultResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: request.message
        }]
      });

      const resultContent = resultResponse.content[0];
      result = resultContent.type === 'text' ? resultContent.text : 'Task completed';
    }

    return {
      executionTier: 'ai_direct',
      reasoning: "This doesn't require a human. Working on it...",
      task: parsed.task,
      result
    };
  }

  // Handle human assignment
  if (executionTier === 'human' || executionTier === 'ai_agent') {
    // Find best assignee
    const assignee = await findBestAssignee({
      requiredSkills: parsed.task.requiredSkills || [],
      priority: parsed.task.priority || 'medium'
    });

    if (!assignee) {
      throw new Error('No available users with required skills');
    }

    // Get assignment info with percentages
    const assignmentInfo = await getAssignmentInfo(assignee.id, {
      requiredSkills: parsed.task.requiredSkills || [],
      priority: parsed.task.priority || 'medium'
    });

    return {
      executionTier: 'human',
      reasoning: `Assigning to ${assignee.name} (${assignee.role}, ${assignmentInfo.skillMatch}% skill match, ${assignmentInfo.capacity}% capacity). ${assignee.name} won't know it's from you — keeping it anonymous to remove bias.`,
      task: parsed.task,
      assignedTo: assignmentInfo
    };
  }

  throw new Error(`Unknown execution tier: ${executionTier}`);
}
