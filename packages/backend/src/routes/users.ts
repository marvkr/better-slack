import { Hono } from 'hono';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

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

// GET /api/users/me - Get current user info
app.get('/me', async (c) => {
  const userId = c.get('userId');

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user[0]);
});

// GET /api/users - List all users
app.get('/', async (c) => {
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});

export default app;
