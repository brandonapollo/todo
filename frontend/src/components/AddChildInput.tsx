import { useState, type FormEvent } from 'react';
import { useCreateChildTodo } from '../hooks/useTodos';

interface Props {
  parentId: string;
  onClose: () => void;
}

export default function AddChildInput({ parentId, onClose }: Props) {
  const [title, setTitle] = useState('');
  const createChild = useCreateChildTodo();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createChild.mutate({ parentId, title: trimmed });
    setTitle('');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="ml-6 py-1">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Add sub-todo..."
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 shadow-sm"
        autoFocus
        onBlur={() => {
          if (!title.trim()) onClose();
        }}
      />
    </form>
  );
}
