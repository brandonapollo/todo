import { useState } from 'react';
import type { Todo } from '../api/todos';
import { useUpdateTodo, useDeleteTodo } from '../hooks/useTodos';
import ChildTodoList from './ChildTodoList';
import AddChildInput from './AddChildInput';

interface Props {
  todo: Todo;
  isChild?: boolean;
}

export default function TodoItem({ todo, isChild = false }: Props) {
  const [showAddChild, setShowAddChild] = useState(false);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const isDone = todo.status === 'done';
  const isCancelled = todo.status === 'cancelled';

  return (
    <div className={isChild ? 'ml-6' : ''}>
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 group transition-colors">
        <button
          onClick={() =>
            updateTodo.mutate({
              id: todo.id,
              status: isDone ? 'pending' : 'done',
            })
          }
          className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer
            ${isDone
              ? 'bg-sky-500 border-sky-500 text-white'
              : isCancelled
                ? 'bg-gray-100 border-gray-300'
                : 'border-gray-300 hover:border-sky-400'
            }`}
        >
          {isDone && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isCancelled && (
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        <span
          className={`flex-1 text-sm transition-colors
            ${isDone ? 'line-through text-gray-400' : ''}
            ${isCancelled ? 'line-through text-gray-400' : ''}
            ${!isDone && !isCancelled ? 'text-gray-700' : ''}
          `}
        >
          {todo.title}
        </span>

        {todo.completedAt && (
          <span
            className="text-xs text-gray-400"
            title={new Date(todo.completedAt).toLocaleString()}
          >
            done {new Date(todo.completedAt).toLocaleDateString()}
          </span>
        )}

        <div className="hidden group-hover:flex gap-1 items-center">
          {!isChild && todo.status === 'pending' && (
            <button
              onClick={() => setShowAddChild(!showAddChild)}
              className="text-xs text-gray-400 hover:text-sky-500 px-1.5 py-0.5 rounded hover:bg-sky-50 transition-colors cursor-pointer"
            >
              + sub
            </button>
          )}
          {todo.status === 'pending' && (
            <button
              onClick={() => updateTodo.mutate({ id: todo.id, status: 'cancelled' })}
              className="text-xs text-gray-400 hover:text-orange-500 px-1.5 py-0.5 rounded hover:bg-orange-50 transition-colors cursor-pointer"
            >
              cancel
            </button>
          )}
          <button
            onClick={() => deleteTodo.mutate(todo.id)}
            className="text-xs text-gray-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
          >
            delete
          </button>
        </div>
      </div>

      {todo.children && todo.children.length > 0 && (
        <ChildTodoList todos={todo.children} />
      )}

      {showAddChild && (
        <AddChildInput parentId={todo.id} onClose={() => setShowAddChild(false)} />
      )}
    </div>
  );
}
