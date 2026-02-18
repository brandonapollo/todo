import { eq, and, ne, isNull, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { todos } from '../db/schema';
import type { TodoRepository } from './todo.repository';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';

export class DrizzleTodoRepository implements TodoRepository {
  async findAll(opts?: { status?: string }): Promise<Todo[]> {
    const conditions = [ne(todos.status, 'deleted'), isNull(todos.parentId)];
    if (opts?.status) {
      conditions.push(eq(todos.status, opts.status as any));
    }
    const results = await db.select().from(todos)
      .where(and(...conditions))
      .orderBy(desc(todos.createdDate), todos.position, todos.createdAt);
    return results as unknown as Todo[];
  }

  async findById(id: string): Promise<Todo | null> {
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));
    return (todo as unknown as Todo) ?? null;
  }

  async findChildren(parentId: string): Promise<Todo[]> {
    const results = await db.select().from(todos)
      .where(and(eq(todos.parentId, parentId), ne(todos.status, 'deleted')))
      .orderBy(todos.position);
    return results as unknown as Todo[];
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const values: Record<string, unknown> = {
      title: input.title,
      parentId: input.parentId ?? null,
    };
    if (input.createdDate) values.createdDate = input.createdDate;
    const [todo] = await db.insert(todos).values(values as any).returning();
    return todo as unknown as Todo;
  }

  async update(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    const values: Record<string, unknown> = {};
    if (input.title !== undefined) values.title = input.title;
    if (input.note !== undefined) values.note = input.note;
    if (input.createdDate !== undefined) {
      values.createdDate = input.createdDate;
      values.createdAt = new Date(`${input.createdDate}T12:00:00`);
    }
    if (input.status !== undefined) {
      values.status = input.status;
      if (input.status === 'done') {
        values.completedAt = new Date();
      } else {
        values.completedAt = null;
      }
    }
    const [todo] = await db.update(todos)
      .set(values)
      .where(eq(todos.id, id))
      .returning();
    return (todo as unknown as Todo) ?? null;
  }

  async softDelete(id: string): Promise<Todo | null> {
    await db.update(todos)
      .set({ status: 'deleted' })
      .where(eq(todos.parentId, id));
    const [todo] = await db.update(todos)
      .set({ status: 'deleted' })
      .where(eq(todos.id, id))
      .returning();
    return (todo as unknown as Todo) ?? null;
  }
}
