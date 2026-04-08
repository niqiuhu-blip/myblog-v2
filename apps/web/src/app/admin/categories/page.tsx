'use client';

import React, { useEffect, useState } from 'react';
import { categoriesApi } from '../../../lib/api';
import { Category } from '@myblog/shared';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (err) {
      setError('加载分类失败');
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await categoriesApi.createCategory({
        name: newName,
        slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'),
        description: newDescription
      });
      setNewName('');
      setNewSlug('');
      setNewDescription('');
      loadCategories();
    } catch (err) {
      setError('创建分类失败');
      console.error('Failed to create category:', err);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    try {
      await categoriesApi.updateCategory(editingId, {
        name: editName,
        slug: editSlug,
        description: editDescription
      });
      setEditingId(null);
      loadCategories();
    } catch (err) {
      setError('更新分类失败');
      console.error('Failed to update category:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个分类吗？')) return;
    setError('');
    try {
      await categoriesApi.deleteCategory(id);
      loadCategories();
    } catch (err) {
      setError('删除分类失败');
      console.error('Failed to delete category:', err);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditDescription(category.description || '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">分类管理</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Category Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">新建分类</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="留空自动生成"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            创建分类
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无分类</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">名称</th>
                <th className="text-left p-4">Slug</th>
                <th className="text-left p-4">描述</th>
                <th className="text-left p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t">
                  {editingId === category.id ? (
                    <td colSpan={4} className="p-4">
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                            <input
                              type="text"
                              value={editSlug}
                              onChange={(e) => setEditSlug(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                          >
                            取消
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="p-4 font-medium">{category.name}</td>
                      <td className="p-4 text-sm text-gray-500">{category.slug}</td>
                      <td className="p-4 text-sm text-gray-600">{category.description || '-'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => startEdit(category)}
                          className="text-blue-600 hover:underline mr-3"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:underline"
                        >
                          删除
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
