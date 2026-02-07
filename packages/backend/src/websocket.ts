import type { ServerWebSocket } from 'bun';
import type { WebSocketMessage } from './types';

// Store active WebSocket connections per user
const userConnections = new Map<string, Set<ServerWebSocket<any>>>();

/**
 * Setup WebSocket handlers for Bun server
 */
export function setupWebSocket() {
  return {
    message(ws: ServerWebSocket<any>, message: string | Buffer) {
      try {
        const msg: WebSocketMessage = JSON.parse(message.toString());

        // Handle subscription
        if (msg.type === 'subscribe:user' && msg.userId) {
          // Store connection
          if (!userConnections.has(msg.userId)) {
            userConnections.set(msg.userId, new Set());
          }
          userConnections.get(msg.userId)!.add(ws);

          // Store userId on WebSocket for later use
          ws.data = { userId: msg.userId };

          console.log(`User ${msg.userId} subscribed to WebSocket`);

          // Send confirmation
          ws.send(JSON.stringify({
            type: 'subscribed',
            userId: msg.userId
          }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    },

    close(ws: ServerWebSocket<any>) {
      // Remove connection from user connections
      if (ws.data?.userId) {
        const userId = ws.data.userId;
        const connections = userConnections.get(userId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            userConnections.delete(userId);
          }
        }
        console.log(`User ${userId} disconnected from WebSocket`);
      }
    }
  };
}

/**
 * Broadcast a message to all connections for a specific user
 */
export function broadcastToUser(userId: string, message: WebSocketMessage) {
  const connections = userConnections.get(userId);
  if (!connections) {
    return;
  }

  const messageStr = JSON.stringify(message);
  for (const ws of connections) {
    try {
      ws.send(messageStr);
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }
}

/**
 * Broadcast a message to multiple users
 */
export function broadcastToUsers(userIds: string[], message: WebSocketMessage) {
  for (const userId of userIds) {
    broadcastToUser(userId, message);
  }
}
