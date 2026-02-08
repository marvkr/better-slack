import { Hono } from 'hono';
import { db } from '../db/client';
import { tasks, messages, assignmentHistory } from '../db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { decrementUserCapacity, incrementUserCapacity } from '../services/task-assignment';
import { broadcastToUsers } from '../websocket';

const app = new Hono();

// Middleware to get userId from header
app.use('*', async (c, next) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'X-User-Id header is required' }, 401);
  }
  c.set('userId', userId);
  await next();
});

// GET /api/tasks/my-tasks - Get tasks assigned to current user
app.get('/my-tasks', async (c) => {
  const userId = c.get('userId');

  const myTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.assigneeId, userId),
        sql`${tasks.status} IN ('assigned', 'in_progress')`
      )
    )
    .orderBy(tasks.deadline);

  return c.json(myTasks);
});

// GET /api/tasks/sent - Get tasks requested by current user
app.get('/sent', async (c) => {
  const userId = c.get('userId');

  const sentTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.requesterId, userId))
    .orderBy(sql`${tasks.createdAt} DESC`);

  return c.json(sentTasks);
});

// GET /api/tasks/done - Get completed tasks
app.get('/done', async (c) => {
  const userId = c.get('userId');

  const doneTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        sql`${tasks.status} = 'completed'`,
        sql`(${tasks.assigneeId} = ${userId} OR ${tasks.requesterId} = ${userId})`
      )
    )
    .orderBy(sql`${tasks.completedAt} DESC`);

  return c.json(doneTasks);
});

// GET /api/tasks/:id - Get task details with messages
app.get('/:id', async (c) => {
  const taskId = c.param('id');
  const userId = c.get('userId');

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task[0]) {
    return c.json({ error: 'Task not found' }, 404);
  }

  // Check if user has access to this task
  if (task[0].assigneeId !== userId && task[0].requesterId !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Get messages for this task
  const taskMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.taskId, taskId))
    .orderBy(messages.createdAt);

  return c.json({
    ...task[0],
    messages: taskMessages
  });
});

// POST /api/tasks/:id/complete - Mark task as complete
app.post('/:id/complete', async (c) => {
  const taskId = c.param('id');
  const userId = c.get('userId');

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task[0]) {
    return c.json({ error: 'Task not found' }, 404);
  }

  // Only assignee can complete the task
  if (task[0].assigneeId !== userId) {
    return c.json({ error: 'Only the assignee can complete this task' }, 403);
  }

  // Update task status
  await db
    .update(tasks)
    .set({
      status: 'completed',
      completedAt: new Date(),
      progressPercentage: 100
    })
    .where(eq(tasks.id, taskId));

  // Decrement assignee capacity
  if (task[0].assigneeId) {
    await decrementUserCapacity(task[0].assigneeId);
  }

  // Add completion message to task thread
  await db.insert(messages).values({
    taskId,
    userId: null, // System message
    content: `Task completed by ${userId}`,
    role: 'assistant'
  });

  return c.json({ success: true });
});

// PATCH /api/tasks/:id/progress - Update task progress
app.patch('/:id/progress', async (c) => {
  const taskId = c.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task[0]) {
    return c.json({ error: 'Task not found' }, 404);
  }

  if (task[0].assigneeId !== userId) {
    return c.json({ error: 'Only the assignee can update progress' }, 403);
  }

  await db
    .update(tasks)
    .set({
      progressPercentage: body.progressPercentage,
      status: body.progressPercentage > 0 ? 'in_progress' : 'assigned'
    })
    .where(eq(tasks.id, taskId));

  return c.json({ success: true });
});

// POST /api/tasks/:id/reassign - Reassign task to another user
app.post('/:id/reassign', async (c) => {
  const taskId = c.param('id');
  const body = await c.req.json();
  const { newAssigneeId, reason } = body;

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task[0]) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const oldAssigneeId = task[0].assigneeId;

  // Update task
  await db
    .update(tasks)
    .set({
      assigneeId: newAssigneeId,
      assignedAt: new Date(),
      status: 'assigned',
      progressPercentage: 0
    })
    .where(eq(tasks.id, taskId));

  // Update capacities
  if (oldAssigneeId) {
    await decrementUserCapacity(oldAssigneeId);
  }
  await incrementUserCapacity(newAssigneeId);

  // Record reassignment
  await db.insert(assignmentHistory).values({
    taskId,
    fromUserId: oldAssigneeId || null,
    toUserId: newAssigneeId,
    reason: reason || 'Reassigned due to capacity'
  });

  // Add message to task thread
  await db.insert(messages).values({
    taskId,
    userId: null,
    content: `Task reassigned from ${oldAssigneeId} to ${newAssigneeId}: ${reason}`,
    role: 'assistant'
  });

  return c.json({ success: true });
});

// POST /api/tasks/:id/messages - Send a message to task thread
app.post('/:id/messages', async (c) => {
  const taskId = c.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return c.json({ error: 'Message content is required' }, 400);
  }

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task[0]) {
    return c.json({ error: 'Task not found' }, 404);
  }

  // Check if user has access to this task
  if (task[0].assigneeId !== userId && task[0].requesterId !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Insert message
  const [message] = await db.insert(messages).values({
    taskId,
    userId,
    content: content.trim(),
    role: 'user'
  }).returning();

  // Broadcast to assignee and requester
  const userIds = [task[0].assigneeId, task[0].requesterId].filter(Boolean) as string[];
  broadcastToUsers(userIds, {
    type: 'message:new',
    data: {
      message,
      taskId
    }
  });

  return c.json(message);
});

export default app;
