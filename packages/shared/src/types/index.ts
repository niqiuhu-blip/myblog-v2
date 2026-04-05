// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User types
export type UserRole = 'ADMIN' | 'AUTHOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser extends Omit<User, 'password' | 'loginAttempts' | 'lockedUntil'> {}

// Post types
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: PostStatus;
  isPinned: boolean;
  viewCount: number;
  readingTime?: number;
  coverImageId?: string;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

// Comment types
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId?: string;
  guestName?: string;
  guestEmail?: string;
  parentId?: string;
  path: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Media types
export type StorageType = 'LOCAL' | 'ALIYUN_OSS' | 'AWS_S3';
export type MediaStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  storageKey: string;
  hash?: string;
  altText?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  storageType: StorageType;
  uploaderId: string;
  status: MediaStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
}

export interface ReadyStatus {
  status: 'ready' | 'not_ready';
  issues?: string[];
}
