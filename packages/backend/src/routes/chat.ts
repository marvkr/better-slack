import { Hono } from 'hono';
import { db } from '../db/client';
import { tasks, messages } from '../db/schema';
import { coordinateTask } from '../services/ai-coordinator';
import { incrementUserCapacity } from '../services/task-assignment';
import type { ChatRequest } from '../types';

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

// POST /api/chat - Send message to AI coordinator
app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const request: ChatRequest = {
    message: body.message,
    userId
  };

  try {
    // Coordinate the task with AI
    const response = await coordinateTask(request);

    // Handle AI direct execution
    if (response.executionTier === 'ai_direct') {
      // Create task record
      const [createdTask] = await db.insert(tasks).values({
        title: response.task!.title,
        description: response.task!.description,
        deadline: response.task!.deadline,
        priority: response.task!.priority,
        requiredSkills: response.task!.requiredSkills || [],
        status: 'completed',
        requesterId: userId,
        assigneeId: null, // No human assignee
        aiCompleted: true,
        aiResult: response.result,
        completedAt: new Date(),
        progressPercentage: 100
      }).returning();

      // Add AI result message to task thread
      await db.insert(messages).values({
        taskId: createdTask.id,
        userId: null,
        content: response.result || 'Task completed by AI',
        role: 'assistant'
      });

      return c.json({
        ...response,
        task: { ...response.task, id: createdTask.id }
      });
    }

    // Handle human assignment
    if (response.executionTier === 'human' && response.assignedTo) {
      // Create task record
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

      // Increment assignee capacity
      await incrementUserCapacity(response.assignedTo.userId);

      // Add assignment message to task thread
      await db.insert(messages).values({
        taskId: createdTask.id,
        userId: null,
        content: `Assigned to ${response.assignedTo.name}`,
        role: 'assistant'
      });

      return c.json({
        ...response,
        task: { ...response.task, id: createdTask.id }
      });
    }

    return c.json({ error: 'Unknown execution tier' }, 500);
  } catch (error) {
    console.error('Error coordinating task:', error);
    return c.json({
      error: 'Failed to coordinate task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
