'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { postsApi } from '../../lib/api';
import { Post, PaginatedResponse } from '@myblog/shared';

export default function PostsListPage() {
  const [data, setData] = useState<PaginatedResponse<Post> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPosts();
  }, [page]);

  async function loadPosts() {
    try {
      const result = await postsApi.getPosts({ page, limit: 10 });
      setData(result);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            My Blog
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              首页
            </Link>
            <Link href="/posts" className="text-sm text-gray-600 hover:text-gray-900">
              文章
            </Link>
            <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">
              搜索
            </Link>
            <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
              管理后台
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">所有文章</h1>

          {loading ? (
            <div className="text-center text-gray-500">加载中...</div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center text-gray-500">暂无文章</div>
          ) : (
            <>
              <ul className="space-y-8">
                {data.items.map((post) => (
                  <li key={post.id}>
                    <Link href={`/posts/${post.slug}`} className="block">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-gray-600 mb-3">{post.excerpt}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.readingTime && (
                          <span>{post.readingTime} 分钟阅读</span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="px-4 py-2">
                    {page} / {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} My Blog.</p>
        </div>
      </footer>
    </div>
  );
}
