import type { InferSelectModel } from 'drizzle-orm';
import type { users, tasks, messages } from '../db/schema';

// Database model types
export type User = InferSelectModel<typeof users>;
export type Task = InferSelectModel<typeof tasks>;
export type Message = InferSelectModel<typeof messages>;

// API request/response types
export interface ChatRequest {
  message: string;
  userId: string;
}

export interface CoordinatorResponse {
  executionTier: 'ai_direct' | 'ai_agent' | 'human';
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
  result?: string; // For ai_direct execution
}

export interface TaskWithMessages extends Task {
  messages: Message[];
}

// WebSocket message types
export type WebSocketMessageType =
  | 'subscribe:user'
  | 'task:created'
  | 'task:updated'
  | 'task:completed'
  | 'task:reassigned'
  | 'message:new';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  userId?: string;
  data?: any;
}
