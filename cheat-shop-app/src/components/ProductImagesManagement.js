'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Save,
  X,
  Image as ImageIcon,
  Star,
  StarOff,
  Upload
} from 'lucide-react';
import Image from 'next/image';
import { addCacheBuster, refreshImagesOnPage, getMediaUrl } from '@/lib/utils/imageUtils';

export default function ProductImagesManagement({
  productId,
  images = [],
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onReorderImages
}) {
  const [editingImage, setEditingImage] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleEditClick = (image) => {
    setEditingImage({ ...image });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (editingImage) {
      await onUpdateImage(editingImage);
      
      // Обновляем изображения на странице
      refreshImagesOnPage(editingImage.imageUrl);
      
      setEditingImage(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    await onAddImage({
      imageUrl: newImageUrl.trim(),
      isPrimary: images.length === 0
    });

    setNewImageUrl('');
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'product');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // URL уже содержит cache-busting параметр
        setNewImageUrl(data.imageUrl);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    const imageToDelete = images.find(img => img.id === imageId);
    await onDeleteImage(imageId);
    
    // Обновляем изображения на странице после удаления
    if (imageToDelete) {
      refreshImagesOnPage(imageToDelete.imageUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Image Form */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Добавить картинку</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-white text-sm font-medium mb-2">
                URL картинки
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Введите URL картинки или загрузите файл"
                  className="w-full pl-10 pr-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Или загрузить
              </label>
              <label className="flex items-center gap-2 px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg cursor-pointer hover:bg-[#2E2F2F] transition-colors">
                <Upload size={16} />
                <span className="text-sm">Выбрать файл</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddImage}
              disabled={!newImageUrl.trim() || isUploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Добавить картинку
            </button>
          </div>
        </div>
      </div>

      {/* Images List */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#2E2F2F]">
          <h3 className="text-lg font-semibold text-white">
            Картинки товара ({images.length})
          </h3>
        </div>
        <div className="p-6">
          {images.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Картинки не добавлены</p>
          ) : (
            <div className="space-y-2">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  className="flex items-center space-x-4 p-4 bg-[#262626] rounded-xl hover:bg-[#2E2F2F] transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move flex-shrink-0" />

                  {editingImage?.id === image.id ? (
                    <form onSubmit={handleSaveEdit} className="flex-1 flex items-center space-x-4">
                      <input
                        type="url"
                        value={editingImage.imageUrl}
                        onChange={(e) =>
                          setEditingImage({ ...editingImage, imageUrl: e.target.value })
                        }
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      />

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingImage.isPrimary}
                          onChange={(e) =>
                            setEditingImage({ ...editingImage, isPrimary: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-500 bg-[#1a1a1a] border border-[#404040] rounded"
                        />
                        <span className="text-sm text-gray-300">Основная</span>
                      </label>

                      <button type="submit" className="p-2 text-green-400 hover:bg-green-400 hover:text-white rounded-lg transition-colors">
                        <Save size={16} />
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="p-2 text-gray-400 hover:bg-gray-600 hover:text-white rounded-lg transition-colors">
                        <X size={16} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center space-x-4">
                        <div className="w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-[#404040]">
                          <Image
                            src={getMediaUrl(addCacheBuster(image.imageUrl, true))}
                            alt={`Product image ${index + 1}`}
                            width={64}
                            height={48}
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {image.imageUrl}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Порядок: {image.sortOrder}
                          </p>
                        </div>

                        {image.isPrimary ? (
                          <Star className="h-4 w-4 text-yellow-400" title="Основная" />
                        ) : (
                          <StarOff className="h-4 w-4 text-gray-500" title="Не основная" />
                        )}
                      </div>

                      <button
                        onClick={() => handleEditClick(image)}
                        className="p-2 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-2 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
