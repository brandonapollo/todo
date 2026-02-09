import { useState, useRef, useEffect, type ReactNode, type FormEvent } from 'react';
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
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const isDone = todo.status === 'done';
  const isCancelled = todo.status === 'cancelled';

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleEditSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      updateTodo.mutate({ id: todo.id, title: trimmed });
    }
    setEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(todo.title);
    setEditing(false);
  };

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

        {editing ? (
          <form onSubmit={handleEditSubmit} className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => e.key === 'Escape' && handleEditCancel()}
              className="w-full text-sm px-1 py-0.5 rounded border border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-400 text-gray-700"
            />
          </form>
        ) : (
          <span
            onDoubleClick={() => {
              setEditTitle(todo.title);
              setEditing(true);
            }}
            className={`flex-1 text-sm transition-colors cursor-text
              ${isDone ? 'line-through text-gray-400' : ''}
              ${isCancelled ? 'line-through text-gray-400' : ''}
              ${!isDone && !isCancelled ? 'text-gray-700' : ''}
            `}
          >
            <Linkify text={todo.title} />
          </span>
        )}

        {todo.completedAt && (
          <span
            className="text-xs text-gray-400"
            title={new Date(todo.completedAt).toLocaleString()}
          >
            {new Date(todo.completedAt).toLocaleDateString()}
          </span>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors cursor-pointer text-gray-400 hover:text-gray-600
              ${menuOpen ? 'bg-gray-200 text-gray-600' : 'opacity-0 group-hover:opacity-100'}
            `}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
              <button
                onClick={() => { setEditTitle(todo.title); setEditing(true); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Edit
              </button>
              {!isChild && todo.status === 'pending' && (
                <button
                  onClick={() => { setShowAddChild(true); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Add sub-todo
                </button>
              )}
              {todo.status === 'pending' && (
                <button
                  onClick={() => { updateTodo.mutate({ id: todo.id, status: 'cancelled' }); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => { deleteTodo.mutate(todo.id); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
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

const URL_RE = /(https?:\/\/[^\s]+)/g;

function Linkify({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-sky-600 hover:text-sky-800"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    lastIndex = URL_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
