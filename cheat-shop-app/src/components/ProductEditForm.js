'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit,
  Save,
  X,
  Shield,
  Plus
} from 'lucide-react';
import ProductImagesManagement from '@/components/ProductImagesManagement';
import ProductVariantsManagement from '@/components/ProductVariantsManagement';

export default function ProductEditForm({ 
  product, 
  onUpdateProduct,
  onCancel 
}) {
  const [editData, setEditData] = useState({
    ...product,
    variants: product.variants || []
  });

  const handleSave = async (e) => {
    e.preventDefault();
    await onUpdateProduct(editData);
  };

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <motion.form 
      onSubmit={handleSave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Product Info */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Основная информация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Название товара</label>
            <input
              type="text"
              required
              value={editData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-[#262626] border border-[#2E2F2F] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Цена</label>
            <input
              type="number"
              value={editData.price || ''}
              onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[#262626] border border-[#2E2F2F] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all text-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-semibold text-white mb-2">Описание</label>
          <textarea
            value={editData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-[#262626] border border-[#2E2F2F] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all text-sm"
          />
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Изображения товара</h3>
        <ProductImagesManagement
          productId={editData.id}
          images={editData.images || []}
          onAddImage={async (imageData) => {
            const newImage = {
              ...imageData,
              productId: editData.id
            };
            
            try {
              const response = await fetch(`/api/admin/products/${editData.id}/images`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(newImage),
              });

              const data = await response.json();
              if (data.success) {
                setEditData(prev => ({
                  ...prev,
                  images: [...(prev.images || []), data.image]
                }));
              }
            } catch (error) {
              console.error('Error adding image:', error);
            }
          }}
          onUpdateImage={async (imageData) => {
            try {
              const response = await fetch(`/api/admin/products/${editData.id}/images`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(imageData),
              });

              const data = await response.json();
              if (data.success) {
                setEditData(prev => ({
                  ...prev,
                  images: (prev.images || []).map(img => 
                    img.id === imageData.id ? { ...img, ...imageData } : img
                  )
                }));
              }
            } catch (error) {
              console.error('Error updating image:', error);
            }
          }}
          onDeleteImage={async (imageId) => {
            if (!confirm('Are you sure you want to delete this image?')) {
              return;
            }
            
            try {
              const response = await fetch(`/api/admin/products/${editData.id}/images`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ imageId }),
              });

              const data = await response.json();
              if (data.success) {
                setEditData(prev => ({
                  ...prev,
                  images: (prev.images || []).filter(img => img.id !== imageId)
                }));
              }
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          }}
          onReorderImages={async (updates) => {
            try {
              const response = await fetch(`/api/admin/products/${editData.id}/images/reorder`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ updates }),
              });

              const data = await response.json();
              if (data.success) {
                const reorderedImages = [...(editData.images || [])];
                updates.forEach(update => {
                  const index = reorderedImages.findIndex(img => img.id === update.id);
                  if (index !== -1) {
                    reorderedImages[index].sortOrder = update.sortOrder;
                  }
                });
                reorderedImages.sort((a, b) => a.sortOrder - b.sortOrder);
                setEditData(prev => ({ ...prev, images: reorderedImages }));
              }
            } catch (error) {
              console.error('Error reordering images:', error);
            }
          }}
        />
      </div>

      {/* Product Variants */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Варианты товара</h3>
        <ProductVariantsManagement
          variants={editData.variants || []}
          setVariants={(variants) => handleFieldChange('variants', variants)}
          isEditing={true}
        />
      </div>

      {/* Product Settings */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Настройки товара</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Статус</label>
            <select
              value={editData.status || 'undetected'}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="w-full px-4 py-3 bg-[#262626] border border-[#2E2F2F] rounded-xl text-white focus:outline-none focus:border-white transition-all text-sm"
            >
              <option value="undetected">Не обнаружен</option>
              <option value="detected">Обнаружен</option>
              <option value="useAtOwnRisk">Используйте на свой страх и риск</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Иконка</label>
            <input
              type="text"
              value={editData.icon || ''}
              onChange={(e) => handleFieldChange('icon', e.target.value)}
              className="w-full px-4 py-3 bg-[#262626] border border-[#2E2F2F] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all text-sm"
              placeholder="Иконка товара"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Порядок сортировки</label>
            <input
              type="number"
              value={editData.sortOrder || 0}
              onChange={(e) => handleFieldChange('sortOrder', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[#262626] border border-[#2E2F2F] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all text-sm"
              placeholder="0"
            />
          </div>
          <div className="flex items-center space-x-6 mt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={editData.isActive || false}
                onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-[#2E2F2F] bg-[#262626] text-white focus:ring-white"
              />
              <span className="text-sm text-white">Активен</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={editData.isNew || false}
                onChange={(e) => handleFieldChange('isNew', e.target.checked)}
                className="w-4 h-4 rounded border-[#2E2F2F] bg-[#262626] text-white focus:ring-white"
              />
              <span className="text-sm text-white">Пометить как новый</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4 pt-6 border-t border-[#2E2F2F]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-[#404040] hover:bg-[#525252] text-white rounded-xl transition-all duration-200 font-medium cursor-pointer text-sm focus:outline-none border border-[#2E2F2F] hover:border-[#404040]"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 text-[#171717] rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-medium cursor-pointer text-sm focus:outline-none shadow-lg hover:shadow-xl"
        >
          <Save className="h-5 w-5" />
          <span>Сохранить изменения</span>
        </button>
      </div>
    </motion.form>
  );
}