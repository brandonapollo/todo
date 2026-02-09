import type { Todo } from '../api/todos';
import TodoItem from './TodoItem';

interface Props {
  date: string;
  todos: Todo[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DateGroup({ date, todos }: Props) {
  const sorted = [...todos].sort((a, b) => {
    if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
    if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
    return 0;
  });

  return (
    <section className="mb-8">
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
        {formatDate(date)}
      </h2>
      <div className="space-y-0.5">
        {sorted.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </section>
  );
}
