export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
}

export interface Board {
  id: string;
  name: string;
  tasks: Task[];
}