import { pgTable, uuid, text, timestamp, integer, date, pgEnum, index } from 'drizzle-orm/pg-core';

export const todoStatusEnum = pgEnum('todo_status', ['pending', 'done', 'cancelled', 'deleted']);

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  status: todoStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  parentId: uuid('parent_id'),
  position: integer('position').notNull().default(0),
  createdDate: date('created_date').notNull().defaultNow(),
}, (table) => [
  index('idx_todos_parent_id').on(table.parentId),
  index('idx_todos_created_date').on(table.createdDate),
  index('idx_todos_status').on(table.status),
]);
