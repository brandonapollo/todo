import type { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';

export interface TodoRepository {
  findAll(opts?: { status?: string }): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  findChildren(parentId: string): Promise<Todo[]>;
  create(input: CreateTodoInput): Promise<Todo>;
  update(id: string, input: UpdateTodoInput): Promise<Todo | null>;
  softDelete(id: string): Promise<Todo | null>;
}
