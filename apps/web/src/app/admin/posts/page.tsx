'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { postsApi } from '../../../lib/api';
import { Post, PostStatus } from '@myblog/shared';

export default function AdminPostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    loadPosts();
  }, [status]);

  async function loadPosts() {
    try {
      const result = await postsApi.getPosts({
        status: status || undefined
      });
      setPosts(result.items);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      await postsApi.deletePost(id);
      loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('删除失败');
    }
  }

  const statusLabels: Record<PostStatus, string> = {
    DRAFT: '草稿',
    SCHEDULED: '定时发布',
    PUBLISHED: '已发布',
    ARCHIVED: '已归档'
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新建文章
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="SCHEDULED">定时发布</option>
            <option value="PUBLISHED">已发布</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无文章</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">标题</th>
                <th className="text-left p-4">状态</th>
                <th className="text-left p-4">创建时间</th>
                <th className="text-left p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t">
                  <td className="p-4">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded bg-gray-100">
                      {statusLabels[post.status]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-600 hover:underline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
