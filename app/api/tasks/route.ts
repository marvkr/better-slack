import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const view = searchParams.get('view'); // 'my-tasks', 'sent', 'done'

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    let result;

    if (view === 'my-tasks') {
      result = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.assigneeId, userId),
            sql`${tasks.status} IN ('assigned', 'in_progress')`
          )
        )
        .orderBy(tasks.deadline);
    } else if (view === 'sent') {
      result = await db
        .select()
        .from(tasks)
        .where(eq(tasks.requesterId, userId))
        .orderBy(sql`${tasks.createdAt} DESC`);
    } else if (view === 'done') {
      result = await db
        .select()
        .from(tasks)
        .where(
          and(
            sql`${tasks.status} = 'completed'`,
            sql`(${tasks.assigneeId} = ${userId} OR ${tasks.requesterId} = ${userId})`
          )
        )
        .orderBy(sql`${tasks.completedAt} DESC`);
    } else {
      // Default: all tasks for user
      result = await db
        .select()
        .from(tasks)
        .where(
          sql`${tasks.assigneeId} = ${userId} OR ${tasks.requesterId} = ${userId}`
        )
        .orderBy(tasks.createdAt);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
