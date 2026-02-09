interface Props {
  filter: 'all' | 'pending';
  onToggle: (filter: 'all' | 'pending') => void;
}

export default function ViewToggle({ filter, onToggle }: Props) {
  return (
    <div className="flex gap-2 mb-6">
      {(['all', 'pending'] as const).map(f => (
        <button
          key={f}
          onClick={() => onToggle(f)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer
            ${filter === f
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {f === 'all' ? 'All' : 'Undone'}
        </button>
      ))}
    </div>
  );
}
