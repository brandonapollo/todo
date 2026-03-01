import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createTodoRoutes } from './routes/todos';
import { createSettingsRoutes } from './routes/settings';
import { createGleanRoutes } from './routes/glean';
import { DrizzleTodoRepository } from './repositories/drizzle-todo.repository';

export function createApp() {
  const app = new Hono();

  app.use('/*', cors());

  const todoRepo = new DrizzleTodoRepository();

  app.route('/api/todos', createTodoRoutes(todoRepo));
  app.route('/api/settings', createSettingsRoutes());
  app.route('/api/glean', createGleanRoutes());

  return app;
}
