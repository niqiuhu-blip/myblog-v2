'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import { postsApi } from '../../../lib/api';
import { Post } from '@myblog/shared';

export default function PostDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [slug]);

  async function loadPost() {
    try {
      const loadedPost = await postsApi.getPostBySlug(slug);
      setPost(loadedPost);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900">
              My Blog
            </Link>
          </div>
        </header>
        <main className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold mb-4">文章不存在</h1>
            <Link href="/posts" className="text-blue-600 hover:underline">
              返回文章列表
            </Link>
          </div>
        </main>
      </div>
    );
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
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {post.readingTime && (
                <span>{post.readingTime} 分钟阅读</span>
              )}
              <span>{post.viewCount} 次阅读</span>
            </div>
          </header>

          <MarkdownRenderer content={post.content} />
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/posts" className="text-blue-600 hover:underline">
            ← 返回文章列表
          </Link>
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>© {new Date().getFullYear()} My Blog.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
