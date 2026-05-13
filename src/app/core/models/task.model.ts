export interface TaskState {
  name: string;
  isCompletionState?: boolean;
  usageCount?: number;
  activeTaskCount?: number;
}

export interface TaskStateHistoryEntry {
  state: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  stateHistory: TaskStateHistoryEntry[];
  notes: string[];
}

export interface TaskPayload {
  title: string;
  description: string;
  dueDate: string;
  currentState: string;
  completed: boolean;
  notes: string[];
}

export interface CreateTaskStatePayload {
  name: string;
  isCompletionState?: boolean;
}

export interface DeleteTaskStatePayload {
  replacementState?: string;
}
