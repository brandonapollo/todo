import type { Todo } from '../api/todos';
import TodoItem from './TodoItem';

interface Props {
  todos: Todo[];
}

export default function ChildTodoList({ todos }: Props) {
  return (
    <div>
      {todos.map(child => (
        <TodoItem key={child.id} todo={child} isChild />
      ))}
    </div>
  );
}
