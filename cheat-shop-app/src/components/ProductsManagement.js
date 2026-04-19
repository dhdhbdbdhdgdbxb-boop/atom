'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit,
  Trash2,
  GripVertical,
  Save,
  X,
  Image as ImageIcon,
  DollarSign,
  ExternalLink
} from 'lucide-react';

export default function ProductsManagement({
  products = [],
  newProduct,
  setNewProduct,
  handleCreateProduct,
  handleEdit,
  handleEditSave,
  handleDelete
}) {
  const [editingProduct, setEditingProduct] = useState(null);

  const handleEditClick = (product) => {
    // Переходим на страницу редактирования
    window.location.href = `/admin/edit-product/${product.id}`;
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await handleEditSave(editingProduct);
    setEditingProduct(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Create Product Form */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Создать новый товар</h3>
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Название товара *
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Описание
              </label>
              <input
                type="text"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Цена *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Ссылка на товар
              </label>
              <input
                type="text"
                value={newProduct.link}
                onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Категория
              </label>
              <select
                value={newProduct.categoryId || ''}
                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Выберите категорию</option>
                {/* This would be populated with actual categories */}
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Изображение
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="URL изображения"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Создать товар
            </button>
          </div>
        </form>
      </div>

      {/* Products List */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#2E2F2F]">
          <h3 className="text-lg font-semibold text-white">Список товаров</h3>
        </div>
        <div className="p-6">
          {products.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Товары не найдены</p>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-4 p-4 bg-[#262626] rounded-xl hover:bg-[#2E2F2F] transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  
                  {editingProduct?.id === product.id ? (
                    <form onSubmit={handleSaveEdit} className="flex-1 flex items-center space-x-4">
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        className="w-24 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="p-2 text-green-400 hover:bg-green-400 hover:text-white rounded-lg transition-colors"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-400 hover:bg-gray-600 hover:text-white rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{product.name}</h4>
                        {product.description && (
                          <p className="text-gray-400 text-sm">{product.description}</p>
                        )}
                      </div>
                      <div className="text-white font-medium">
                        ${product.price}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="p-2 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                          title="Редактировать товар"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                          className="p-2 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                          title="Посмотреть на сайте"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete('products', product.id)}
                          className="p-2 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                          title="Удалить товар"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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