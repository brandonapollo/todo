export interface Todo {
  id: string;
  title: string;
  status: 'pending' | 'done' | 'cancelled' | 'deleted';
  createdAt: Date;
  completedAt: Date | null;
  parentId: string | null;
  position: number;
  createdDate: string;
  children?: Todo[];
}

export interface CreateTodoInput {
  title: string;
  parentId?: string;
}

export interface UpdateTodoInput {
  title?: string;
  status?: 'pending' | 'done' | 'cancelled';
}
