import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Using text for 'sarah', 'jordan', 'alex' IDs
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role'),
  skills: text('skills').array().notNull().default(sql`ARRAY[]::text[]`),
  currentCapacity: integer('current_capacity').notNull().default(0),
  maxCapacity: integer('max_capacity').notNull().default(5),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  deadline: timestamp('deadline').notNull(),
  priority: text('priority').notNull(), // 'low' | 'medium' | 'high' | 'urgent'
  requiredSkills: text('required_skills').array().default(sql`ARRAY[]::text[]`),
  status: text('status').notNull().default('pending'), // 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed'
  requesterId: text('requester_id').references(() => users.id).notNull(),
  assigneeId: text('assignee_id').references(() => users.id),
  assignedAt: timestamp('assigned_at'),
  completedAt: timestamp('completed_at'),
  aiCompleted: boolean('ai_completed').default(false).notNull(),
  aiResult: text('ai_result'), // For AI direct execution results
  progressPercentage: integer('progress_percentage').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Messages table (task-scoped chat threads)
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id),
  content: text('content').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant'
  taskId: uuid('task_id').references(() => tasks.id), // Links to task thread
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Assignment history table
export const assignmentHistory = pgTable('assignment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  fromUserId: text('from_user_id').references(() => users.id),
  toUserId: text('to_user_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Task check-ins table
export const taskCheckins = pgTable('task_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
  response: text('response'), // 'on_track' | 'blocked' | 'cant_do'
  notes: text('notes')
});

// Import sql for array defaults
import { sql } from 'drizzle-orm';
