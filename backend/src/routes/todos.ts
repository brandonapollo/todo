import { Hono } from 'hono';
import type { TodoRepository } from '../repositories/todo.repository';

export function createTodoRoutes(repo: TodoRepository) {
  const app = new Hono();

  app.get('/', async (c) => {
    const status = c.req.query('status');
    const topLevel = await repo.findAll(status ? { status } : undefined);

    const todosWithChildren = await Promise.all(
      topLevel.map(async (todo) => ({
        ...todo,
        children: await repo.findChildren(todo.id),
      }))
    );

    const grouped: Record<string, typeof todosWithChildren[number][]> = {};
    for (const todo of todosWithChildren) {
      const date = todo.createdDate;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(todo);
    }

    return c.json({ groups: grouped });
  });

  app.post('/', async (c) => {
    const body = await c.req.json<{ title: string }>();
    if (!body.title?.trim()) {
      return c.json({ error: 'Title is required' }, 400);
    }
    const todo = await repo.create({ title: body.title.trim() });
    return c.json(todo, 201);
  });

  app.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{ title?: string; status?: string }>();
    const todo = await repo.update(id, body);
    if (!todo) return c.json({ error: 'Not found' }, 404);
    return c.json(todo);
  });

  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const todo = await repo.softDelete(id);
    if (!todo) return c.json({ error: 'Not found' }, 404);
    return c.json(todo);
  });

  app.post('/:id/children', async (c) => {
    const parentId = c.req.param('id');
    const body = await c.req.json<{ title: string }>();
    if (!body.title?.trim()) {
      return c.json({ error: 'Title is required' }, 400);
    }
    const parent = await repo.findById(parentId);
    if (!parent) return c.json({ error: 'Parent not found' }, 404);
    const child = await repo.create({ title: body.title.trim(), parentId });
    return c.json(child, 201);
  });

  return app;
}
