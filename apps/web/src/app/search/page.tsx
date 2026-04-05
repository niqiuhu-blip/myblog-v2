'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { postsApi } from '../../lib/api';
import { Post, PaginatedResponse } from '@myblog/shared';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PaginatedResponse<Post> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  async function performSearch(searchQuery: string) {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await postsApi.searchPosts(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch(query);
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
          <h1 className="text-3xl font-bold mb-8">搜索文章</h1>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入搜索关键词..."
                className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '搜索中...' : '搜索'}
              </button>
            </div>
          </form>

          {hasSearched && (
            <div>
              {loading ? (
                <div className="text-center text-gray-500">搜索中...</div>
              ) : !results || results.items.length === 0 ? (
                <div className="text-center text-gray-500">
                  未找到与 "{query}" 相关的文章
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    找到 {results.total} 篇相关文章
                  </p>
                  <ul className="space-y-6">
                    {results.items.map((post) => (
                      <li key={post.id}>
                        <Link href={`/posts/${post.slug}`} className="block">
                          <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-gray-600 mb-2">{post.excerpt}</p>
                          )}
                          <div className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} My Blog.</p>
        </div>
      </footer>
    </div>
  );
}
