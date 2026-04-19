'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Copy
} from 'lucide-react';

export default function ProductVariantsManagement({ 
  variants = [], 
  setVariants, 
  isEditing = true 
}) {
  const [editingVariant, setEditingVariant] = useState(null);
  const [newVariant, setNewVariant] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    isDefault: false
  });

  const handleAddVariant = (e) => {
    e.preventDefault();
    if (!newVariant.name.trim()) return;

    const variantToAdd = {
      ...newVariant,
      price: parseFloat(newVariant.price) || 0,
      stock: parseInt(newVariant.stock) || 0,
      id: Date.now() // временный ID для новых вариантов
    };

    if (variantToAdd.isDefault) {
      // Снимаем метку isDefault с других вариантов
      setVariants(prev => [
        ...prev.map(v => ({ ...v, isDefault: false })),
        variantToAdd
      ]);
    } else {
      setVariants(prev => [...prev, variantToAdd]);
    }

    setNewVariant({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      sku: '',
      isDefault: false
    });
  };

  const handleEditClick = (variant) => {
    setEditingVariant({ ...variant });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingVariant.name.trim()) return;

    const updatedVariant = {
      ...editingVariant,
      price: parseFloat(editingVariant.price) || 0,
      stock: parseInt(editingVariant.stock) || 0
    };

    if (updatedVariant.isDefault) {
      // Снимаем метку isDefault с других вариантов
      setVariants(prev => prev.map(variant => 
        variant.id === updatedVariant.id 
          ? updatedVariant 
          : { ...variant, isDefault: false }
      ));
    } else {
      setVariants(prev => prev.map(variant => 
        variant.id === updatedVariant.id 
          ? updatedVariant 
          : variant
      ));
    }

    setEditingVariant(null);
  };

  const handleCancelEdit = () => {
    setEditingVariant(null);
  };

  const handleDeleteVariant = (variantId) => {
    if (!confirm('Are you sure you want to delete this variant?')) {
      return;
    }

    setVariants(prev => prev.filter(variant => variant.id !== variantId));
  };

  const handleDuplicateVariant = (variant) => {
    const duplicatedVariant = {
      ...variant,
      id: Date.now() + Math.random(), // уникальный ID
      name: `${variant.name} (копия)`,
      isDefault: false // не делаем дубликат основным
    };

    setVariants(prev => [...prev, duplicatedVariant]);
  };

  return (
    <div className="space-y-6">
      {/* Add Variant Form */}
      {isEditing && (
        <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
          <h4 className="text-md font-semibold text-white mb-4">Добавить вариант</h4>
          <form onSubmit={handleAddVariant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Название варианта *
                </label>
                <input
                  type="text"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                  placeholder="Например, Стандартный"
                  className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Цена *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({...newVariant, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Артикул
                </label>
                <input
                  type="text"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                  placeholder="SKU123"
                  className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Остаток
                </label>
                <input
                  type="number"
                  min="0"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant({...newVariant, stock: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Описание
              </label>
              <textarea
                value={newVariant.description}
                onChange={(e) => setNewVariant({...newVariant, description: e.target.value})}
                placeholder="Описание этого варианта"
                rows={2}
                className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newVariant.isDefault}
                  onChange={(e) => setNewVariant({...newVariant, isDefault: e.target.checked})}
                  className="w-4 h-4 text-blue-500 bg-[#1a1a1a] border border-[#404040] rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Основной вариант</span>
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newVariant.name.trim() || !newVariant.price}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={16} />
                Добавить вариант
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Variants List */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#2E2F2F]">
          <h4 className="text-md font-semibold text-white">Варианты товаров ({variants.length})</h4>
        </div>
        <div className="p-6">
          {variants.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Варианты не добавлены</p>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <motion.div
                  key={variant.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#262626] rounded-xl p-4 hover:bg-[#2E2F2F] transition-colors"
                >
                  {editingVariant?.id === variant.id ? (
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            value={editingVariant.name}
                            onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                            className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingVariant.price}
                              onChange={(e) => setEditingVariant({ ...editingVariant, price: e.target.value })}
                              className="px-6 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500 w-24"
                              required
                            />
                          </div>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingVariant.isDefault}
                              onChange={(e) => setEditingVariant({ ...editingVariant, isDefault: e.target.checked })}
                              className="w-4 h-4 text-blue-500 bg-[#1a1a1a] border border-[#404040] rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">Основной</span>
                          </label>
                        </div>
                      </div>
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <h5 className="text-white font-medium">{variant.name}</h5>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>${variant.price}</span>
                              {variant.sku && <span>SKU: {variant.sku}</span>}
                              <span>Остаток: {variant.stock || 0}</span>
                              {variant.isDefault && (
                                <span className="text-yellow-400">● Основной</span>
                              )}
                            </div>
                            {variant.description && (
                              <p className="text-gray-400 text-sm mt-1">{variant.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {isEditing && (
                          <>
                            <button
                              onClick={() => handleEditClick(variant)}
                              className="p-2 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                              title="Редактировать"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDuplicateVariant(variant)}
                              className="p-2 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition-colors"
                              title="Дублировать"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteVariant(variant.id)}
                              className="p-2 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                              title="Удалить"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
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