
export enum Priority {
  LOW = '低',
  MEDIUM = '中',
  HIGH = '高'
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  createdAt: number;
  subTasks?: SubTask[];
}

export interface AISuggestion {
  priority: Priority;
  category: string;
  reason: string;
}

export interface User {
  username: string;
}
