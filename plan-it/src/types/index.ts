export interface UserSafe {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  orderIndex: number;
  assigneeId?: string | null;
  creatorId: string;
  assignee?: UserSafe | null;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnWithTasks {
  id: string;
  title: string;
  orderIndex: number;
  projectId: string;
  tasks: TaskItem[];
}

export interface ProjectWithDetails {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: UserSafe;
  members: {
    id: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER' | 'VIEWER';
    user: UserSafe;
  }[];
  columns: ColumnWithTasks[];
}

export interface CommentItem {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: UserSafe;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string;
  type: 'TASK_ASSIGNED' | 'TASK_MOVED' | 'COMMENT_ADDED';
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  actor: UserSafe;
}
