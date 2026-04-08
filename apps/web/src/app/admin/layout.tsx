'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: '仪表盘', href: '/admin' },
    { label: '文章', href: '/admin/posts' },
    { label: '分类', href: '/admin/categories' },
    { label: '标签', href: '/admin/tags' },
    { label: '媒体', href: '/admin/media' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                管理后台
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">欢迎, {user.username}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow min-h-screen">
          <nav className="mt-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 ${
                  pathname === item.href ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
