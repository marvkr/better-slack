import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { tasks, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrementUserCapacity } from '@/lib/services/task-assignment';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await req.json();
    const taskId = params.id;

    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

    if (!task[0]) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task[0].assigneeId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.update(tasks).set({
      status: 'completed',
      completedAt: new Date(),
      progressPercentage: 100
    }).where(eq(tasks.id, taskId));

    if (task[0].assigneeId) {
      await decrementUserCapacity(task[0].assigneeId);
    }

    await db.insert(messages).values({
      taskId,
      userId: null,
      content: `Task completed by ${userId}`,
      role: 'assistant'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}
