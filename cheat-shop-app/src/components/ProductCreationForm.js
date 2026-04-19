'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  ExternalLink,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import ProductVariantsManagement from '@/components/ProductVariantsManagement';
import ProductImagesManagement from '@/components/ProductImagesManagement';

export default function ProductCreationForm({
  newProduct = {
    slug: '',
    status: 'undetected',
    link: '',
    categoryId: '',
    gameId: '',
    translations: {
      ru: {
        name: '',
        description: '',
        instructions: ''
      },
      en: {
        name: '',
        description: '',
        instructions: ''
      }
    },
    variants: [],
    images: []
  },
  setNewProduct,
  handleCreateProduct,
  handleEditSave,
  handleDelete
}) {
  const [editingProduct, setEditingProduct] = useState(null);

  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
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
        <form onSubmit={handleCreateProduct} className="space-y-6">
          {/* Basic Product Info */}
          {/* Product Translations */}
          <div className="space-y-6">
            <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Переводы товара</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Russian Translation */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">🇷🇺 Русский</span>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Название *
                    </label>
                    <input
                      type="text"
                      value={newProduct.translations?.ru?.name || ''}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        translations: {
                          ...newProduct.translations,
                          ru: {
                            ...newProduct.translations?.ru,
                            name: e.target.value
                          }
                        }
                      })}
                      className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Описание
                    </label>
                    <textarea
                      value={newProduct.translations?.ru?.description || ''}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        translations: {
                          ...newProduct.translations,
                          ru: {
                            ...newProduct.translations?.ru,
                            description: e.target.value
                          }
                        }
                      })}
                      rows={3}
                      className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {/* SEO Fields for Russian */}
                  <div className="space-y-4 border-t border-[#2E2F2F] pt-4">
                    <h5 className="text-sm font-medium text-cyan-400">SEO настройки</h5>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={newProduct.translations?.ru?.metaTitle || ''}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          translations: {
                            ...newProduct.translations,
                            ru: {
                              ...newProduct.translations?.ru,
                              metaTitle: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Заголовок для поисковых систем"
                      />
                      <p className="text-xs text-gray-400 mt-1">Рекомендуется до 60 символов</p>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Meta Description
                      </label>
                      <textarea
                        value={newProduct.translations?.ru?.metaDescription || ''}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          translations: {
                            ...newProduct.translations,
                            ru: {
                              ...newProduct.translations?.ru,
                              metaDescription: e.target.value
                            }
                          }
                        })}
                        rows={2}
                        className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Описание для поисковых систем"
                      />
                      <p className="text-xs text-gray-400 mt-1">Рекомендуется до 160 символов</p>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Meta Keywords
                      </label>
                      <input
                        type="text"
                        value={newProduct.translations?.ru?.metaKeywords || ''}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          translations: {
                            ...newProduct.translations,
                            ru: {
                              ...newProduct.translations?.ru,
                              metaKeywords: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="ключевые, слова, через, запятую"
                      />
                      <p className="text-xs text-gray-400 mt-1">Ключевые слова через запятую</p>
                    </div>
                  </div>
                </div>

                {/* English Translation */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">🇺🇸 English</span>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newProduct.translations?.en?.name || ''}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        translations: {
                          ...newProduct.translations,
                          en: {
                            ...newProduct.translations?.en,
                            name: e.target.value
                          }
                        }
                      })}
                      className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProduct.translations?.en?.description || ''}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        translations: {
                          ...newProduct.translations,
                          en: {
                            ...newProduct.translations?.en,
                            description: e.target.value
                          }
                        }
                      })}
                      rows={3}
                      className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {/* SEO Fields for English */}
                  <div className="space-y-4 border-t border-[#2E2F2F] pt-4">
                    <h5 className="text-sm font-medium text-cyan-400">SEO Settings</h5>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={newProduct.translations?.en?.metaTitle || ''}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          translations: {
                            ...newProduct.translations,
                            en: {
                              ...newProduct.translations?.en,
                              metaTitle: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Title for search engines"
                      />
                      <p className="text-xs text-gray-400 mt-1">Recommended up to 60 characters</p>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Meta Description
                      </label>
                      <textarea
                        value={newProduct.translations?.en?.metaDescription || ''}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          translations: {
                            ...newProduct.translations,
                            en: {
                              ...newProduct.translations?.en,
                              metaDescription: e.target.value
                            }
                          }
                        })}
                        rows={2}
                        className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Description for search engines"
                      />
                      <p className="text-xs text-gray-400 mt-1">Recommended up to 160 characters</p>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Meta Keywords
                      </label>
                      <input
                        type="text"
                        value={newProduct.translations?.en?.metaKeywords || ''}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          translations: {
                            ...newProduct.translations,
                            en: {
                              ...newProduct.translations?.en,
                              metaKeywords: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="keywords, separated, by, commas"
                      />
                      <p className="text-xs text-gray-400 mt-1">Keywords separated by commas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Игра *
              </label>
              <select
                value={newProduct.gameId || ''}
                onChange={(e) => setNewProduct && setNewProduct({ ...newProduct, gameId: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Выберите игру</option>
                {/* Options will be populated dynamically */}
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Категория *
              </label>
              <select
                value={newProduct.categoryId || ''}
                onChange={(e) => setNewProduct && setNewProduct({ ...newProduct, categoryId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Выберите категорию</option>
                {/* Options will be populated dynamically */}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Ссылка на товар *
              </label>
              <input
                type="text"
                value={newProduct.link}
                onChange={(e) => setNewProduct && setNewProduct({ ...newProduct, link: e.target.value })}
                placeholder="example"
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Введите латинское слово для ссылки (будет /product/example)
              </p>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Статус *
              </label>
              <select
                value={newProduct.status}
                onChange={(e) => setNewProduct && setNewProduct({ ...newProduct, status: e.target.value })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="undetected">Не обнаружен</option>
                <option value="detected">Обнаружен</option>
                <option value="useAtOwnRisk">Используйте на свой страх и риск</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={newProduct.isActive}
                  onChange={(e) => setNewProduct && setNewProduct({ ...newProduct, isActive: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  newProduct.isActive ? 'bg-cyan-500' : 'bg-gray-600'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    newProduct.isActive ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </div>
              <span className="text-sm text-white group-hover:text-cyan-300 transition-colors">Активен</span>
            </label>
          </div>

          {/* Product Images Management */}
          <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Изображения товара</h3>
            <p className="text-gray-400 text-sm mb-4">Добавьте хотя бы одну картинку для товара. Первая картинка будет отображаться на карточке товара.</p>
            <ProductImagesManagement
              productId={newProduct.id}
              images={newProduct.images || []}
              onAddImage={async (imageData) => {
                // For new products, we'll store images locally until product is created
                const newImage = {
                  id: Date.now(),
                  ...imageData,
                  productId: newProduct.id
                };
                setNewProduct && setNewProduct(prev => ({
                  ...prev,
                  images: [...(prev.images || []), newImage]
                }));
              }}
              onUpdateImage={async (imageData) => {
                // For new products, update locally - will be saved when product is created
                setNewProduct && setNewProduct(prev => ({
                  ...prev,
                  images: (prev.images || []).map(img =>
                    img.id === imageData.id ? { ...img, ...imageData } : img
                  )
                }));
              }}
              onDeleteImage={async (imageId) => {
                if (!confirm('Are you sure you want to delete this image?')) {
                  return;
                }
                // For new products, remove locally
                setNewProduct && setNewProduct(prev => ({
                  ...prev,
                  images: (prev.images || []).filter(img => img.id !== imageId)
                }));
              }}
              onReorderImages={async (updates) => {
                // For new products, reorder locally
                const reorderedImages = [...(newProduct.images || [])];
                updates.forEach(update => {
                  const index = reorderedImages.findIndex(img => img.id === update.id);
                  if (index !== -1) {
                    reorderedImages[index].sortOrder = update.sortOrder;
                  }
                });
                reorderedImages.sort((a, b) => a.sortOrder - b.sortOrder);
                setNewProduct && setNewProduct(prev => ({ ...prev, images: reorderedImages }));
              }}
            />
          </div>

          {/* Product Variants Management */}
          <ProductVariantsManagement
            variants={newProduct.variants}
            setVariants={(variants) => setNewProduct && setNewProduct({...newProduct, variants})}
            isEditing={false}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <span className="text-sm font-medium">Создать товар</span>
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
          {[] /* products */.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Товары не найдены</p>
          ) : (
            <div className="space-y-2">
              {[] /* products */.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-4 p-4 bg-[#262626] rounded-xl hover:bg-[#2E2F2F] transition-colors"
                >
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