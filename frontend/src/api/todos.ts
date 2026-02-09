const API_BASE = '/api/todos';

export interface Todo {
  id: string;
  title: string;
  status: 'pending' | 'done' | 'cancelled' | 'deleted';
  createdAt: string;
  completedAt: string | null;
  parentId: string | null;
  position: number;
  createdDate: string;
  children?: Todo[];
}

export interface TodoGroups {
  groups: Record<string, Todo[]>;
}

export async function fetchTodos(status?: string): Promise<TodoGroups> {
  const url = status ? `${API_BASE}?status=${status}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

export async function updateTodo(id: string, data: { title?: string; status?: string }): Promise<Todo> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function deleteTodo(id: string): Promise<Todo> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete todo');
  return res.json();
}

export async function createChildTodo(parentId: string, title: string): Promise<Todo> {
  const res = await fetch(`${API_BASE}/${parentId}/children`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create child todo');
  return res.json();
}
