'use client';

import React, { useEffect, useState } from 'react';
import { mediaApi } from '../../../lib/api';
import { Media } from '@myblog/shared';
import { MediaUploader } from '../../../components/MediaUploader';

export default function AdminMediaPage() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadMedia();
  }, [page]);

  async function loadMedia() {
    try {
      setLoading(true);
      const result = await mediaApi.getMedia({ page, limit: 24 });
      setMediaItems(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError('加载媒体库失败');
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个文件吗？')) return;
    setError('');
    try {
      await mediaApi.deleteMedia(id);
      loadMedia();
    } catch (err) {
      setError('删除失败');
      console.error('Failed to delete media:', err);
    }
  }

  function handleUpload(media: Media) {
    setMediaItems((prev) => [media, ...prev]);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      alert('链接已复制到剪贴板');
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">媒体库</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-8">
        <MediaUploader onUpload={handleUpload} />
      </div>

      {/* Media Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center text-gray-500 py-8">加载中...</div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">暂无媒体文件</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {mediaItems.map((media) => (
                <div
                  key={media.id}
                  className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={media.url}
                    alt={media.altText || media.originalName}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate" title={media.originalName}>
                      {media.originalName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(media.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyUrl(media.url)}
                      className="bg-white text-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-100"
                    >
                      复制链接
                    </button>
                    <button
                      onClick={() => handleDelete(media.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
