export interface Todo {
  id: string;
  title: string;
  status: 'pending' | 'done' | 'cancelled' | 'deleted';
  createdAt: Date;
  completedAt: Date | null;
  parentId: string | null;
  position: number;
  note: string | null;
  createdDate: string;
  children?: Todo[];
}

export interface CreateTodoInput {
  title: string;
  parentId?: string;
  createdDate?: string;
}

export interface UpdateTodoInput {
  title?: string;
  status?: 'pending' | 'done' | 'cancelled';
  note?: string | null;
}
