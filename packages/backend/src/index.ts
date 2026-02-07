import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import tasksRouter from './routes/tasks';
import usersRouter from './routes/users';
import chatRouter from './routes/chat';
import { setupWebSocket } from './websocket';

const app = new Hono();

// CORS - allow Electron app
app.use('*', cors({
  origin: ['http://localhost:*', 'file://*'],
  credentials: true
}));

// Logger
app.use('*', logger());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.route('/api/tasks', tasksRouter);
app.route('/api/users', usersRouter);
app.route('/api/chat', chatRouter);

const port = parseInt(process.env.PORT || '3001');

// Start Bun server with WebSocket support
const server = Bun.serve({
  port,
  fetch(req, server) {
    // Upgrade WebSocket connections
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return undefined;
    }

    // Handle HTTP requests with Hono
    return app.fetch(req, { server });
  },
  websocket: setupWebSocket()
});

console.log('');
console.log('🚀 Backend server started!');
console.log(`   HTTP: http://localhost:${port}`);
console.log(`   WebSocket: ws://localhost:${port}/ws`);
console.log('');
console.log('Available endpoints:');
console.log('   GET  /health');
console.log('   POST /api/chat');
console.log('   GET  /api/tasks/my-tasks');
console.log('   GET  /api/tasks/sent');
console.log('   GET  /api/tasks/done');
console.log('   GET  /api/tasks/:id');
console.log('   POST /api/tasks/:id/complete');
console.log('   PATCH /api/tasks/:id/progress');
console.log('   POST /api/tasks/:id/reassign');
console.log('   GET  /api/users/me');
console.log('   GET  /api/users');
console.log('');
