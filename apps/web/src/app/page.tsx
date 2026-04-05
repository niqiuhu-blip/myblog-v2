import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
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
            <Link href="/admin" className="btn-primary text-sm">
              管理后台
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              欢迎来到我的博客
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              这是一个正在建设中的现代化博客系统。
              使用 Next.js + Express + PostgreSQL 构建。
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/posts" className="btn-primary">
                浏览文章
              </Link>
              <Link href="/admin" className="btn-secondary">
                进入后台
              </Link>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-2xl mb-3">⚛️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Next.js 15</h3>
              <p className="text-sm text-gray-600">React 框架，SSR/SSG 支持</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-2">Express + TypeScript</h3>
              <p className="text-sm text-gray-600">类型安全的后端 API</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-2xl mb-3">🐘</div>
              <h3 className="font-semibold text-gray-900 mb-2">PostgreSQL</h3>
              <p className="text-sm text-gray-600">关系型数据库 + 全文搜索</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} My Blog. Built with ❤️</p>
        </div>
      </footer>
    </div>
  );
}
