import { useState, useRef, useEffect, type ReactNode, type FormEvent } from 'react';
import type { Todo } from '../api/todos';
import { useUpdateTodo, useDeleteTodo } from '../hooks/useTodos';
import ChildTodoList from './ChildTodoList';
import AddChildInput from './AddChildInput';
import NoteDialog from './NoteDialog';

interface Props {
  todo: Todo;
  isChild?: boolean;
}

export default function TodoItem({ todo, isChild = false }: Props) {
  const [showAddChild, setShowAddChild] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showNote, setShowNote] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const isDone = todo.status === 'done';
  const isCancelled = todo.status === 'cancelled';
  const hasNote = !!todo.note;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

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

  const handleNoteSave = (note: string) => {
    updateTodo.mutate({ id: todo.id, note: note || null });
    setShowNote(false);
  };

  return (
    <div className={isChild ? 'ml-6' : ''}>
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 group transition-colors">
        <button
          onClick={() =>
            updateTodo.mutate({
              id: todo.id,
              status: isDone || isCancelled ? 'pending' : 'done',
            })
          }
          className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer
            ${isDone
              ? 'bg-sky-500 border-sky-500 text-white'
              : isCancelled
                ? 'bg-gray-100 border-gray-300 hover:border-sky-400'
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

        {hasNote && (
          <div className="relative flex-shrink-0 group/note">
            <button
              onClick={() => setShowNote(true)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors cursor-pointer text-amber-500 hover:text-amber-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/note:block z-10 pointer-events-none">
              <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-pre-wrap max-w-xs shadow-lg">
                {todo.note}
              </div>
              <div className="w-2 h-2 bg-gray-800 rotate-45 mx-auto -mt-1" />
            </div>
          </div>
        )}

        {todo.completedAt && (
          <span
            className="text-xs text-gray-400"
            title={new Date(todo.completedAt).toLocaleString()}
          >
            {new Date(todo.completedAt).toLocaleDateString()}
          </span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Note */}
          {!hasNote && (
            <button
              onClick={() => setShowNote(true)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              title="Add note"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>
          )}
          {/* Edit */}
          <button
            onClick={() => { setEditTitle(todo.title); setEditing(true); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          {/* Add sub-todo */}
          {!isChild && todo.status === 'pending' && (
            <button
              onClick={() => setShowAddChild(true)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              title="Add sub-todo"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          )}
          {/* Cancel / Uncancel */}
          {todo.status === 'pending' && (
            <button
              onClick={() => updateTodo.mutate({ id: todo.id, status: 'cancelled' })}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              title="Cancel"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          )}
          {isCancelled && (
            <button
              onClick={() => updateTodo.mutate({ id: todo.id, status: 'pending' })}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              title="Restore"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
          )}
          {/* Delete */}
          <button
            onClick={() => deleteTodo.mutate(todo.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 transition-colors cursor-pointer text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {todo.children && todo.children.length > 0 && (
        <ChildTodoList todos={todo.children} />
      )}

      {showAddChild && (
        <AddChildInput parentId={todo.id} onClose={() => setShowAddChild(false)} />
      )}

      {showNote && (
        <NoteDialog
          note={todo.note ?? ''}
          onSave={handleNoteSave}
          onClose={() => setShowNote(false)}
        />
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
