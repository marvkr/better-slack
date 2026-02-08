import Anthropic from '@anthropic-ai/sdk';
import { findBestAssignee, getAssignmentInfo } from './task-assignment';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a task coordination AI. Analyze requests and decide:

1. **ai_direct**: Tasks you can complete immediately (writing, analysis, etc.)
2. **human**: Tasks requiring human skills

Extract task details and respond with ONLY JSON:
{
  "executionTier": "ai_direct" | "human",
  "task": {
    "title": "string",
    "description": "string",
    "deadline": "ISO timestamp",
    "priority": "low" | "medium" | "high" | "urgent",
    "requiredSkills": ["skill1", "skill2"]
  },
  "result": "string (only for ai_direct)"
}

Current time: ${new Date().toISOString()}`;

export interface CoordinatorResponse {
  executionTier: 'ai_direct' | 'human';
  reasoning: string;
  task?: {
    id?: string;
    title: string;
    description: string;
    deadline: Date;
    priority: string;
    requiredSkills: string[];
  };
  assignedTo?: {
    userId: string;
    name: string;
    role: string;
    skillMatch: number;
    capacity: number;
  };
  result?: string;
}

function parseDeadline(input: string): Date {
  const now = new Date();
  const lower = input.toLowerCase();

  if (lower.includes('urgent') || lower.includes('asap')) {
    return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  }
  if (lower.includes('friday')) {
    const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
    const friday = new Date(now);
    friday.setDate(now.getDate() + daysUntilFriday);
    friday.setHours(17, 0, 0, 0);
    return friday;
  }
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow;
  }
  return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
}

export async function coordinateTask(
  message: string,
  userId: string,
): Promise<CoordinatorResponse> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: message }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response');

  const text = content.text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(text);

  if (parsed.task) {
    parsed.task.deadline = parsed.task.deadline
      ? new Date(parsed.task.deadline)
      : parseDeadline(message);
  }

  if (parsed.executionTier === 'ai_direct') {
    let result = parsed.result;
    if (!result) {
      const resultResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: message }],
      });
      const resultContent = resultResponse.content[0];
      result =
        resultContent.type === 'text' ? resultContent.text : 'Task completed';
    }

    return {
      executionTier: 'ai_direct',
      reasoning: "This doesn't require a human. Working on it...",
      task: parsed.task,
      result,
    };
  }

  const assignee = await findBestAssignee({
    requiredSkills: parsed.task.requiredSkills || [],
    priority: parsed.task.priority || 'medium',
  });

  console.log({ assignee });

  if (!assignee) throw new Error('No available users');

  const assignmentInfo = await getAssignmentInfo(assignee.id, {
    requiredSkills: parsed.task.requiredSkills || [],
    priority: parsed.task.priority || 'medium',
  });

  return {
    executionTier: 'human',
    reasoning: `Assigning to ${assignee.name} (${assignee.role}, ${assignmentInfo.skillMatch}% skill match, ${assignmentInfo.capacity}% capacity). ${assignee.name} won't know it's from you — keeping it anonymous to remove bias.`,
    task: parsed.task,
    assignedTo: assignmentInfo,
  };
}
