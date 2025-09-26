export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'writer' | 'editor' | 'agent' | 'viewer';
  isOnline: boolean;
  lastSeen: Date;
}

export interface ProjectMember {
  userId: string;
  user: User;
  projectId: string;
  role: 'owner' | 'admin' | 'writer' | 'editor' | 'agent' | 'viewer';
  permissions: Permission[];
  joinedAt: Date;
}

export interface Permission {
  action: 'read' | 'write' | 'comment' | 'assign' | 'manage_users' | 'delete';
  resource: 'project' | 'documents' | 'characters' | 'settings' | 'timeline';
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  user: User;
  content: string;
  position: {
    start: number;
    end: number;
  };
  thread: CommentReply[];
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReply {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  projectId: string;
  documentId?: string;
  assignedTo: string;
  assignedBy: string;
  assignee: User;
  assigner: User;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Version {
  id: string;
  documentId: string;
  content: string;
  title: string;
  authorId: string;
  author: User;
  changeType: 'create' | 'edit' | 'delete' | 'merge';
  summary: string;
  createdAt: Date;
}

export interface CollaborativeCursor {
  userId: string;
  user: User;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
}