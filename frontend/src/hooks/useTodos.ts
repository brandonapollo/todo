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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; status?: string }) =>
      api.updateTodo(id, data),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ['todos'] });
      const previous = qc.getQueriesData({ queryKey: ['todos'] });
      qc.setQueriesData<api.TodoGroups>({ queryKey: ['todos'] }, (old) => {
        if (!old) return old;
        const groups = { ...old.groups };
        for (const date in groups) {
          groups[date] = groups[date].map(todo => {
            if (todo.id === id) {
              return {
                ...todo,
                ...data,
                completedAt: data.status === 'done' ? new Date().toISOString() : todo.completedAt,
              };
            }
            if (todo.children) {
              return {
                ...todo,
                children: todo.children.map(child =>
                  child.id === id
                    ? { ...child, ...data, completedAt: data.status === 'done' ? new Date().toISOString() : child.completedAt }
                    : child
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
