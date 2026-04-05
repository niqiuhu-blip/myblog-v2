'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { postsApi } from '../lib/api';
import { Post } from '@myblog/shared';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const result = await postsApi.getPosts({ limit: 6 });
      setPosts(result.items);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              欢迎来到我的博客
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              分享技术、生活与思考
            </p>
          </div>

          {/* Recent Posts */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">最新文章</h2>
            {loading ? (
              <div className="text-center text-gray-500">加载中...</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-gray-500">暂无文章</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.slug}`}
                    className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      {post.readingTime && (
                        <span>{post.readingTime} 分钟阅读</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {posts.length > 0 && (
            <div className="text-center">
              <Link
                href="/posts"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                查看更多文章
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} My Blog. Built with ❤️</p>
        </div>
      </footer>
    </div>
  );
}
