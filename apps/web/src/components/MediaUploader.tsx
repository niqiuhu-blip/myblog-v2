'use client';

import React, { useState } from 'react';
import { mediaApi } from '../lib/api';
import { Media } from '@myblog/shared';

interface MediaUploaderProps {
  onUpload?: (media: Media) => void;
  onSelect?: (media: Media) => void;
}

export function MediaUploader({ onUpload, onSelect }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    setError('');
    try {
      const media = await mediaApi.uploadMedia(file);
      setPreview(media.url);
      if (onUpload) {
        onUpload(media);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 mx-auto rounded"
          />
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="media-upload"
      />
      <label
        htmlFor="media-upload"
        className={`inline-block px-6 py-3 rounded-lg cursor-pointer ${
          uploading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {uploading ? '上传中...' : '选择图片上传'}
      </label>
      <p className="mt-2 text-sm text-gray-500">
        支持 JPG, PNG, GIF, WebP 格式，最大 10MB
      </p>
    </div>
  );
}
