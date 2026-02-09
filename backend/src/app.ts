import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createTodoRoutes } from './routes/todos';
import { DrizzleTodoRepository } from './repositories/drizzle-todo.repository';

export function createApp() {
  const app = new Hono();

  app.use('/*', cors());

  const todoRepo = new DrizzleTodoRepository();

  app.route('/api/todos', createTodoRoutes(todoRepo));

  return app;
}
