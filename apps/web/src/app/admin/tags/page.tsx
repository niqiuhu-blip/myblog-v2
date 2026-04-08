'use client';

import React, { useEffect, useState } from 'react';
import { tagsApi } from '../../../lib/api';
import { Tag } from '@myblog/shared';

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      setLoading(true);
      const data = await tagsApi.getTags();
      setTags(data);
    } catch (err) {
      setError('加载标签失败');
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await tagsApi.createTag({
        name: newName,
        slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-')
      });
      setNewName('');
      setNewSlug('');
      loadTags();
    } catch (err) {
      setError('创建标签失败');
      console.error('Failed to create tag:', err);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    try {
      await tagsApi.updateTag(editingId, {
        name: editName,
        slug: editSlug
      });
      setEditingId(null);
      loadTags();
    } catch (err) {
      setError('更新标签失败');
      console.error('Failed to update tag:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个标签吗？')) return;
    setError('');
    try {
      await tagsApi.deleteTag(id);
      loadTags();
    } catch (err) {
      setError('删除标签失败');
      console.error('Failed to delete tag:', err);
    }
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditSlug(tag.slug);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Tag Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">新建标签</h2>
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
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            创建标签
          </button>
        </form>
      </div>

      {/* Tags List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无标签</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">名称</th>
                <th className="text-left p-4">Slug</th>
                <th className="text-left p-4">创建时间</th>
                <th className="text-left p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-t">
                  {editingId === tag.id ? (
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
                      <td className="p-4 font-medium">{tag.name}</td>
                      <td className="p-4 text-sm text-gray-500">{tag.slug}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(tag.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => startEdit(tag)}
                          className="text-blue-600 hover:underline mr-3"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
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
