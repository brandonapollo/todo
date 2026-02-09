import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TodoInput from './components/TodoInput';
import ViewToggle from './components/ViewToggle';
import DateGroup from './components/DateGroup';
import { useTodos } from './hooks/useTodos';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function TodoApp() {
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const { data, isLoading } = useTodos(filter === 'pending' ? 'pending' : undefined);

  const sortedDates = data
    ? Object.keys(data.groups).sort((a, b) => b.localeCompare(a))
    : [];

  const isEmpty = sortedDates.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <TodoInput />
      <ViewToggle filter={filter} onToggle={setFilter} />
      {isLoading ? (
        <p className="text-gray-400 mt-12 text-center text-sm">Loading...</p>
      ) : isEmpty ? (
        <p className="text-gray-400 mt-12 text-center text-sm">
          {filter === 'pending' ? 'All done!' : 'No todos yet. Add one above.'}
        </p>
      ) : (
        sortedDates.map(date => (
          <DateGroup key={date} date={date} todos={data!.groups[date]} />
        ))
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoApp />
    </QueryClientProvider>
  );
}
