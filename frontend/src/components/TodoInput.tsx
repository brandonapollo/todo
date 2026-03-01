import { useState, type FormEvent } from 'react';
import { useCreateTodo } from '../hooks/useTodos';
import GleanModal from './GleanModal';

export default function TodoInput() {
  const [title, setTitle] = useState('');
  const [gleanOpen, setGleanOpen] = useState(false);
  const createTodo = useCreateTodo();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTodo.mutate(trimmed);
    setTitle('');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400 shadow-sm"
          autoFocus
        />
      </form>
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => setGleanOpen(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          Populate from Glean
        </button>
      </div>
      {gleanOpen && <GleanModal onClose={() => setGleanOpen(false)} />}
    </>
  );
}
