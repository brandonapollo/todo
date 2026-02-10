import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/todos';

export function useTodos(statusFilter?: string) {
  return useQuery({
    queryKey: ['todos', statusFilter],
    queryFn: () => api.fetchTodos(statusFilter),
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => api.createTodo(title),
    onMutate: async (title) => {
      await qc.cancelQueries({ queryKey: ['todos'] });
      const previous = qc.getQueriesData({ queryKey: ['todos'] });
      const today = new Date().toISOString().split('T')[0];
      const optimisticTodo: api.Todo = {
        id: `temp-${Date.now()}`,
        title,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
        parentId: null,
        position: 0,
        note: null,
        createdDate: today,
      };
      qc.setQueriesData<api.TodoGroups>({ queryKey: ['todos'] }, (old) => {
        if (!old) return { groups: { [today]: [optimisticTodo] } };
        const groups = { ...old.groups };
        groups[today] = [optimisticTodo, ...(groups[today] || [])];
        return { groups };
      });
      return { previous };
    },
    onSuccess: (newTodo) => {
      qc.setQueriesData<api.TodoGroups>({ queryKey: ['todos'] }, (old) => {
        if (!old) return old;
        const groups = { ...old.groups };
        const date = newTodo.createdDate;
        groups[date] = (groups[date] || []).map(todo =>
          todo.id.startsWith('temp-') ? newTodo : todo
        );
        return { groups };
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; status?: string; note?: string | null }) =>
      api.updateTodo(id, data),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ['todos'] });
      const previous = qc.getQueriesData({ queryKey: ['todos'] });
      const patch = data as Partial<api.Todo>;
      if (data.status === 'done') patch.completedAt = new Date().toISOString();
      else if (data.status === 'pending') patch.completedAt = null;
      qc.setQueriesData<api.TodoGroups>({ queryKey: ['todos'] }, (old) => {
        if (!old) return old;
        const groups = { ...old.groups };
        for (const date in groups) {
          groups[date] = groups[date].map(todo => {
            if (todo.id === id) return { ...todo, ...patch };
            if (todo.children) {
              return {
                ...todo,
                children: todo.children.map(child =>
                  child.id === id ? { ...child, ...patch } : child
                ),
              };
            }
            return todo;
          });
        }
        return { groups };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTodo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useCreateChildTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, title }: { parentId: string; title: string }) =>
      api.createChildTodo(parentId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}
