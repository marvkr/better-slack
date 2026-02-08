import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { tasks, messages } from '@/lib/db/schema';
import { coordinateTask } from '@/lib/services/ai-coordinator';
import { incrementUserCapacity } from '@/lib/services/task-assignment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await coordinateTask(message, userId);

    if (response.executionTier === 'ai_direct') {
      const [createdTask] = await db.insert(tasks).values({
        title: response.task!.title,
        description: response.task!.description,
        deadline: response.task!.deadline,
        priority: response.task!.priority,
        requiredSkills: response.task!.requiredSkills || [],
        status: 'completed',
        requesterId: userId,
        assigneeId: null,
        aiCompleted: true,
        aiResult: response.result,
        completedAt: new Date(),
        progressPercentage: 100
      }).returning();

      await db.insert(messages).values({
        taskId: createdTask.id,
        userId: null,
        content: response.result || 'Task completed by AI',
        role: 'assistant'
      });

      return NextResponse.json({
        ...response,
        task: { ...response.task, id: createdTask.id }
      });
    }

    if (response.executionTier === 'human' && response.assignedTo) {
      const [createdTask] = await db.insert(tasks).values({
        title: response.task!.title,
        description: response.task!.description,
        deadline: response.task!.deadline,
        priority: response.task!.priority,
        requiredSkills: response.task!.requiredSkills || [],
        status: 'assigned',
        requesterId: userId,
        assigneeId: response.assignedTo.userId,
        assignedAt: new Date(),
        aiCompleted: false,
        progressPercentage: 0
      }).returning();

      await incrementUserCapacity(response.assignedTo.userId);

      await db.insert(messages).values({
        taskId: createdTask.id,
        userId: null,
        content: `Assigned to ${response.assignedTo.name}`,
        role: 'assistant'
      });

      return NextResponse.json({
        ...response,
        task: { ...response.task, id: createdTask.id }
      });
    }

    return NextResponse.json({ error: 'Unknown execution tier' }, { status: 500 });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
