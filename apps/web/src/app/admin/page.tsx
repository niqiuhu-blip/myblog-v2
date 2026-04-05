'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { postsApi } from '../../lib/api';
import { Post } from '@myblog/shared';

export default function AdminDashboard() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentPosts();
  }, []);

  async function loadRecentPosts() {
    try {
      const result = await postsApi.getPosts({ limit: 5 });
      setRecentPosts(result.items);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <Link
          href="/admin/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新建文章
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">最近文章</h2>
        {loading ? (
          <div className="text-gray-500">加载中...</div>
        ) : recentPosts.length === 0 ? (
          <div className="text-gray-500">暂无文章</div>
        ) : (
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex justify-between items-center">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {post.title}
                </Link>
                <span className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
