import { ApiResponse, PaginatedResponse, SafeUser, LoginCredentials, AuthState, Post, Category, Tag, Media } from '@myblog/shared';

const API_BASE_URL = '/api';

let csrfToken: string | null = null;

// 获取 CSRF Token
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get CSRF token');
  }

  const data: ApiResponse<{ csrfToken: string }> = await response.json();
  if (data.success && data.data) {
    csrfToken = data.data.csrfToken;
    return csrfToken;
  }

  throw new Error('Failed to get CSRF token');
}

// 通用 fetch 封装
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  // 对于非 GET 请求，添加 CSRF token
  if (options.method && options.method !== 'GET') {
    const token = await getCsrfToken();
    headers['X-CSRF-Token'] = token;
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  const data = await response.json();

  // 如果 CSRF token 失效，刷新 token 并重试一次
  if (!response.ok && data.error?.includes('CSRF')) {
    csrfToken = null;
    return apiFetch<T>(endpoint, options);
  }

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth API
export const authApi = {
  async login(credentials: LoginCredentials): Promise<SafeUser> {
    const response = await apiFetch<{ user: SafeUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }
    return response.data.user;
  },

  async logout(): Promise<void> {
    await apiFetch('/auth/logout', {
      method: 'POST'
    });
    csrfToken = null;
  },

  async getMe(): Promise<SafeUser | null> {
    try {
      const response = await apiFetch<{ user: SafeUser }>('/auth/me');
      return response.success && response.data ? response.data.user : null;
    } catch {
      return null;
    }
  }
};

// Posts API
export const postsApi = {
  async getPosts(options?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    tagId?: string;
  }): Promise<PaginatedResponse<Post>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.status) params.set('status', options.status);
    if (options?.categoryId) params.set('categoryId', options.categoryId);
    if (options?.tagId) params.set('tagId', options.tagId);

    const response = await apiFetch<PaginatedResponse<Post>>(
      `/posts?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get posts');
    }
    return response.data;
  },

  async searchPosts(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Post>> {
    const params = new URLSearchParams({ q: query });
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());

    const response = await apiFetch<PaginatedResponse<Post>>(
      `/posts/search?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search posts');
    }
    return response.data;
  },

  async getPost(id: string): Promise<Post> {
    const response = await apiFetch<{ post: Post }>(`/posts/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get post');
    }
    return response.data.post;
  },

  async getPostBySlug(slug: string): Promise<Post> {
    const response = await apiFetch<{ post: Post }>(`/posts/slug/${slug}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get post');
    }
    return response.data.post;
  },

  async createPost(data: Partial<Post> & { categoryIds?: string[]; tagIds?: string[] }): Promise<Post> {
    const response = await apiFetch<{ post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create post');
    }
    return response.data.post;
  },

  async updatePost(id: string, data: Partial<Post> & { categoryIds?: string[]; tagIds?: string[] }): Promise<Post> {
    const response = await apiFetch<{ post: Post }>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update post');
    }
    return response.data.post;
  },

  async deletePost(id: string): Promise<void> {
    await apiFetch(`/posts/${id}`, {
      method: 'DELETE'
    });
  }
};

// Categories API
export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    const response = await apiFetch<{ categories: Category[] }>('/categories');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get categories');
    }
    return response.data.categories;
  },

  async getCategory(id: string): Promise<Category> {
    const response = await apiFetch<{ category: Category }>(`/categories/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get category');
    }
    return response.data.category;
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await apiFetch<{ category: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create category');
    }
    return response.data.category;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await apiFetch<{ category: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update category');
    }
    return response.data.category;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiFetch(`/categories/${id}`, {
      method: 'DELETE'
    });
  }
};

// Tags API
export const tagsApi = {
  async getTags(): Promise<Tag[]> {
    const response = await apiFetch<{ tags: Tag[] }>('/tags');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get tags');
    }
    return response.data.tags;
  },

  async getTag(id: string): Promise<Tag> {
    const response = await apiFetch<{ tag: Tag }>(`/tags/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get tag');
    }
    return response.data.tag;
  },

  async createTag(data: Partial<Tag>): Promise<Tag> {
    const response = await apiFetch<{ tag: Tag }>('/tags', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create tag');
    }
    return response.data.tag;
  },

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const response = await apiFetch<{ tag: Tag }>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update tag');
    }
    return response.data.tag;
  },

  async deleteTag(id: string): Promise<void> {
    await apiFetch(`/tags/${id}`, {
      method: 'DELETE'
    });
  }
};

// Media API
export const mediaApi = {
  async getMedia(options?: {
    page?: number;
    limit?: number;
    uploaderId?: string;
  }): Promise<PaginatedResponse<Media>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.uploaderId) params.set('uploaderId', options.uploaderId);

    const response = await apiFetch<PaginatedResponse<Media>>(
      `/media?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get media');
    }
    return response.data;
  },

  async getMediaItem(id: string): Promise<Media> {
    const response = await apiFetch<{ media: Media }>(`/media/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get media item');
    }
    return response.data.media;
  },

  async uploadMedia(file: File, altText?: string): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }

    const url = `${API_BASE_URL}/media/upload`;
    const token = await getCsrfToken();

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': token
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok && data.error?.includes('CSRF')) {
      csrfToken = null;
      return mediaApi.uploadMedia(file, altText);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data.media;
  },

  async updateMedia(id: string, data: { altText?: string }): Promise<Media> {
    const response = await apiFetch<{ media: Media }>(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update media');
    }
    return response.data.media;
  },

  async deleteMedia(id: string): Promise<void> {
    await apiFetch(`/media/${id}`, {
      method: 'DELETE'
    });
  }
};
