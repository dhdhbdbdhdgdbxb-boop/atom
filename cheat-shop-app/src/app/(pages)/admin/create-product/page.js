'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, X, Plus, Trash2, ChevronDown, ChevronUp, Globe, Monitor, 
  Gamepad2, Settings, DollarSign, CreditCard, Upload, Image as ImageIcon,
  CheckCircle, AlertCircle, Clock, ArrowLeft, AlertTriangle,
  Key, Globe as GlobeIcon, Layers, List, Cpu, Shield, Laptop,
  Video, File, FileImage, Play, Eye, EyeOff, Star, Grid,
  Move, Image, HelpCircle, BookOpen
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNotification } from '@/components/NotificationComponent';
import SEOPreview from '@/components/SEOPreview';
import { getMediaUrl } from '@/lib/utils/imageUtils';

export default function CreateProductPage() {
  const { addNotification } = useNotification();
  const router = useRouter();
  const [activeLanguage, setActiveLanguage] = useState('ru');
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [productId, setProductId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalProductData, setOriginalProductData] = useState(null);
  
  // Основные данные
  const [productData, setProductData] = useState({
    slug: '',
    gameId: '',
    categoryId: '',
    status: 'undetected',
    regions: ['global'],
    subscriptionTypes: ['full'],
    screenshots: [],
    isActive: true,
    
    // Переводы
    translations: [
      { language: 'ru', name: '', description: '', metaTitle: '', metaDescription: '', metaKeywords: '' },
      { language: 'en', name: '', description: '', metaTitle: '', metaDescription: '', metaKeywords: '' }
    ],
    
    // Функционал
    features: {
      ru: [],
      en: []
    },
    
    // Системные требования
    systemRequirements: [
      { 
        language: 'ru', 
        gameClient: '', 
        supportedOS: [], 
        antiCheats: [], 
        processors: [], 
        spoofer: false, 
        gameMode: false 
      },
      { 
        language: 'en', 
        gameClient: '', 
        supportedOS: [], 
        antiCheats: [], 
        processors: [], 
        spoofer: false, 
        gameMode: false 
      }
    ],
    
    // Варианты
    variants: [],
    
    // Медиа-файлы
    media: []
  });
  
  // Состояние для временных данных
  const [tempOs, setTempOs] = useState('');
  const [tempAntiCheat, setTempAntiCheat] = useState('');
  const [tempProcessor, setTempProcessor] = useState('');
  const [tempKeys, setTempKeys] = useState('');
   const [selectedFiles, setSelectedFiles] = useState([]);
    const [systemRequirements, setSystemRequirements] = useState({
      ru: Array(6).fill().map((_, i) => ({ id: i + 1, title: '', text: '', icon: null })),
      en: Array(6).fill().map((_, i) => ({ id: i + 1, title: '', text: '', icon: null }))
    });
  
  // Tooltip состояние
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Функция для глубокого сравнения объектов
  const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  };

  // Функция для проверки наличия несохраненных изменений
  const checkForUnsavedChanges = () => {
    if (!originalProductData) {
      // Если это создание нового продукта, проверяем, есть ли какие-то данные
      const hasData = 
        productData.slug.trim() ||
        productData.translations.some(t => t.name.trim() || t.description.trim() || t.metaTitle.trim() || t.metaDescription.trim() || t.metaKeywords.trim()) ||
        productData.variants.length > 0 ||
        productData.media.length > 0 ||
        selectedFiles.length > 0 ||
        productData.features.ru.length > 0 ||
        productData.features.en.length > 0 ||
        systemRequirements.ru.some(req => req.title || req.text) ||
        systemRequirements.en.some(req => req.title || req.text);
      
      setHasUnsavedChanges(hasData);
    } else {
      // Если это редактирование, сравниваем с исходными данными
      const hasChanges = 
        !deepEqual(productData, originalProductData) ||
        selectedFiles.length > 0;
      
      setHasUnsavedChanges(hasChanges);
    }
  };

  // Загрузка игр и категорий
  useEffect(() => {
    fetchGames();
    
    // Проверяем, есть ли параметр id в URL (режим редактирования)
    // Используем только на клиенте
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (id) {
        setIsEditing(true);
        setProductId(parseInt(id));
        fetchProductData(parseInt(id));
      }
    }
  }, []);

  // Отслеживание изменений данных
  useEffect(() => {
    checkForUnsavedChanges();
  }, [productData, selectedFiles, systemRequirements, originalProductData]);

  // Предупреждение при попытке уйти со страницы с несохраненными данными
  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;
    
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
        return e.returnValue;
      }
    };
    
    const handleBeforeRouteChange = () => {
      if (hasUnsavedChanges && !window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?')) {
        if (router.events) {
          router.events.emit('routeChangeError');
        }
        throw 'Route change aborted';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    if (router.events) {
      router.events.on('routeChangeStart', handleBeforeRouteChange);
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (router.events) {
        router.events.off('routeChangeStart', handleBeforeRouteChange);
      }
    };
  }, [hasUnsavedChanges, router]);
  
  const fetchGames = async () => {
    try {
      const response = await fetch('/api/admin/games');
      const data = await response.json();
      if (data.success) {
        setGames(data.games);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      addNotification('Ошибка при загрузке списка игр', 'error');
    }
  };
  
  const fetchCategories = async (gameId) => {
    if (!gameId) return;
    
    try {
      const response = await fetch(`/api/admin/categories?gameId=${gameId}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      addNotification('Ошибка при загрузке категорий', 'error');
    }
  };
  
  const fetchProductData = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const product = data.product;
        
        // Восстанавливаем медиа только из БД
        const mergedMedia = product.media || [];
        
        // Преобразуем данные продукта в формат, совместимый с формой
        const formattedProduct = {
          slug: product.slug || '',
          gameId: product.gameId || '',
          categoryId: product.categoryId || '',
          status: product.status || 'undetected',
          regions: product.regions || ['global'],
          subscriptionTypes: product.subscriptionTypes || ['full'],
          screenshots: product.screenshots || [],
          isActive: product.isActive || true,
          translations: product.translations || [
            { language: 'ru', name: '', description: '', metaTitle: '', metaDescription: '', metaKeywords: '' },
            { language: 'en', name: '', description: '', metaTitle: '', metaDescription: '', metaKeywords: '' }
          ],
          features: {
            ru: [],
            en: []
          },
          systemRequirements: [
            {
              language: 'ru',
              gameClient: '',
              supportedOS: [],
              antiCheats: [],
              processors: [],
              spoofer: false,
              gameMode: false
            },
            {
              language: 'en',
              gameClient: '',
              supportedOS: [],
              antiCheats: [],
              processors: [],
              spoofer: false,
              gameMode: false
            }
          ],
          variants: product.variants ? product.variants.map(v => {
            // Разбираем инструкции в формате "RU: ... | EN: ..."
            let instructionsRu = '';
            let instructionsEn = '';
            
            if (v.instructions) {
              // Пытаемся разобрать формат "RU: ... | EN: ..."
              const ruMatch = v.instructions.match(/RU:\s*(.*?)\s*\|\s*EN:/);
              const enMatch = v.instructions.match(/EN:\s*(.*)$/);
              
              if (ruMatch && enMatch) {
                instructionsRu = ruMatch[1].trim();
                instructionsEn = enMatch[1].trim();
              } else {
                // Если формат не распознан, пытаемся разделить по "Привет! Hello" или подобному
                const helloIndex = Math.max(
                  v.instructions.lastIndexOf('Hello'),
                  v.instructions.lastIndexOf('hello'),
                  v.instructions.lastIndexOf('HELLO')
                );
                
                if (helloIndex !== -1) {
                  instructionsRu = v.instructions.substring(0, helloIndex).trim();
                  instructionsEn = v.instructions.substring(helloIndex).trim();
                } else {
                  // Если ничего не получилось, используем все как русский
                  instructionsRu = v.instructions;
                }
              }
            }
            
            // Загружаем ключи из базы данных
            const keysFromDb = v.keys ? (Array.isArray(v.keys) ? v.keys : JSON.parse(v.keys)) : [];
            
            return {
              ...v,
              keys: keysFromDb,  // Используем ключи из базы данных
              instructions: v.instructions || '',
              daysLabelRu: v.daysLabelRu || '',
              daysLabelEn: v.daysLabelEn || '',
              instructionsRu: instructionsRu,
              instructionsEn: instructionsEn,
              instructionLanguage: 'ru'
            };
          }) : [],
          media: mergedMedia
        };
        
        // Заполняем переводы
        product.translations?.forEach(trans => {
          const existingIndex = formattedProduct.translations.findIndex(t => t.language === trans.language);
          if (existingIndex !== -1) {
            formattedProduct.translations[existingIndex] = {
              language: trans.language,
              name: trans.name || '',
              description: trans.description || '',
              metaTitle: trans.metaTitle || '',
              metaDescription: trans.metaDescription || '',
              metaKeywords: trans.metaKeywords || ''
            };
          }
        });
        
        // Заполняем системные требования
        product.systemRequirements?.forEach(req => {
          const existingIndex = formattedProduct.systemRequirements.findIndex(sr => sr.language === req.language);
          if (existingIndex !== -1) {
            formattedProduct.systemRequirements[existingIndex] = {
              language: req.language,
              gameClient: req.gameClient || '',
              supportedOS: req.supportedOS || [],
              antiCheats: req.antiCheats || [],
              processors: req.processors || [],
              spoofer: req.spoofer || false,
              gameMode: req.gameMode || false
            };
          }
        });

        // Заполняем системные требования с иконками
        if (product.systemRequirements && product.systemRequirements.length > 0) {
          product.systemRequirements.forEach(req => {
            if (req.items && req.items.length > 0) {
              const language = req.language;
              const items = req.items.map((item, index) => ({
                id: index + 1,
                title: item.title || '',
                text: item.description || '',
                icon: item.icon || null
              }));
              
              // Обновляем состояние systemRequirements
              setSystemRequirements(prev => ({
                ...prev,
                [language]: items
              }));
            }
          });
        }
        
        // Заполняем фичи
        if (product.features && product.features.length > 0) {
          // Группируем фичи по языку и родительскому ID
          const featuresByLanguage = {
            ru: [],
            en: []
          };
          
          product.features.forEach(feature => {
            if (feature.parentId === null) {
              // Основной пункт
              featuresByLanguage[feature.language].push({
                id: feature.id || Date.now(),
                language: feature.language,
                title: feature.title || '',
                children: []
              });
            } else {
              // Подпункт - найдем родителя
              const parentFeature = featuresByLanguage[feature.language].find(f => f.id === feature.parentId);
              if (parentFeature) {
                parentFeature.children.push({
                  id: feature.id || Date.now(),
                  text: feature.title || ''
                });
              }
            }
          });
          
          formattedProduct.features = featuresByLanguage;
        }
        
        setProductData(formattedProduct);
        setOriginalProductData(JSON.parse(JSON.stringify(formattedProduct))); // Глубокая копия для сравнения
          
        // Загружаем категории для выбранной игры
        if (product.gameId) {
          fetchCategories(product.gameId);
        }
      } else {
        addNotification('Не удалось загрузить данные продукта', 'error');
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      addNotification('Ошибка при загрузке данных продукта', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчики изменений
  const handleGameChange = (gameId) => {
    setProductData({ ...productData, gameId, categoryId: '' });
    fetchCategories(gameId);
  };
  
  // Загрузка медиа-файлов
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Проверяем лимиты
    const currentImages = productData.media.filter(m => m.type === 'image').length;
    const currentVideos = productData.media.filter(m => m.type === 'video').length;
    
    let newImages = 0;
    let newVideos = 0;
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) newImages++;
      else if (file.type.startsWith('video/')) newVideos++;
    });
    
    if (currentImages + newImages > 10) {
      addNotification('Максимум 10 изображений', 'error');
      return;
    }

    if (currentVideos + newVideos > 10) {
      addNotification('Максимум 10 видео', 'error');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = ''; // Сброс input
  };
  
  const handleUploadMedia = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      setUploadingMedia(true);
      
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData
      });
      
      // Проверяем, что ответ успешный и содержит JSON
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload files');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Добавляем новые файлы к существующим
        const newMedia = data.files.map(file => ({
          ...file,
          sortOrder: productData.media.length
        }));
        
        const updatedProductData = {
          ...productData,
          media: [...productData.media, ...newMedia]
        };
        
        setProductData(updatedProductData);
        setSelectedFiles([]);
        
        if (data.files.length > 0) {
          addNotification(`Загружено ${data.files.length} файлов`, 'success');
        }
      } else {
        addNotification('Ошибка при загрузке файлов: ' + (data.error || data.message || 'Неизвестная ошибка'), 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      addNotification('Ошибка при загрузке файлов: ' + error.message, 'error');
    } finally {
      setUploadingMedia(false);
    }
  };
  
  const handleSetMainImage = (mediaIndex) => {
    const updatedMedia = productData.media.map((media, index) => ({
      ...media,
      isMainImage: index === mediaIndex && media.type === 'image'
    }));
    
    const updatedProductData = {
      ...productData,
      media: updatedMedia
    };
    
    setProductData(updatedProductData);
  };
  
  const handleRemoveMedia = (index) => {
    const updatedMedia = productData.media.filter((_, i) => i !== index);
    const updatedProductData = {
      ...productData,
      media: updatedMedia
    };
    
    setProductData(updatedProductData);
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(productData.media);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Обновляем порядок сортировки
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index
    }));
    
    const updatedProductData = {
      ...productData,
      media: updatedItems
    };
    
    setProductData(updatedProductData);
  };
  
  // Функционал
  const handleAddFeature = (language) => {
    const newFeature = {
      id: Date.now(),
      language,
      title: '',
      children: []
    };
    
    const updatedProductData = {
      ...productData,
      features: {
        ...productData.features,
        [language]: [...productData.features[language], newFeature]
      }
    };
    
    setProductData(updatedProductData);
  };
  
  
  const handleUpdateFeature = (language, featureId, field, value) => {
    const updatedFeatures = productData.features[language].map(feature => {
      if (feature.id === featureId) {
        return { ...feature, [field]: value };
      }
      return feature;
    });
    
    const updatedProductData = {
      ...productData,
      features: { ...productData.features, [language]: updatedFeatures }
    };
    
    setProductData(updatedProductData);
  };
  
  const handleUpdateSubFeature = (language, featureId, childId, value) => {
    const updatedFeatures = productData.features[language].map(feature => {
      if (feature.id === featureId) {
        return {
          ...feature,
          children: feature.children.map(child =>
            child.id === childId ? { ...child, text: value } : child
          )
        };
      }
      return feature;
    });
    
    const updatedProductData = {
      ...productData,
      features: { ...productData.features, [language]: updatedFeatures }
    };
    
    setProductData(updatedProductData);
  };
  
  const handleDeleteFeature = (language, featureId) => {
    const updatedFeatures = productData.features[language].filter(feature => feature.id !== featureId);
    const updatedProductData = {
      ...productData,
      features: { ...productData.features, [language]: updatedFeatures }
    };

    setProductData(updatedProductData);
  };

  const handleUpdateSystemRequirement = (language, id, field, value) => {
    const updatedRequirements = systemRequirements[language].map(req =>
      req.id === id ? { ...req, [field]: value } : req
    );
    setSystemRequirements({
      ...systemRequirements,
      [language]: updatedRequirements
    });
  };

 const handleUpdateSystemRequirements = (language, newRequirements) => {
   setSystemRequirements({
     ...systemRequirements,
     [language]: newRequirements
   });
 };

 const handleReorderSystemRequirements = (language, newOrder) => {
   setSystemRequirements({
     ...systemRequirements,
     [language]: newOrder
   });
 };

 const handleDeleteSystemRequirement = (language, id) => {
   const updatedRequirements = systemRequirements[language].filter(req => req.id !== id);
   setSystemRequirements({
     ...systemRequirements,
     [language]: updatedRequirements
   });
   
   // Также обновляем основные данные продукта
   const updatedProductSystemRequirements = productData.systemRequirements.map(req => {
     if (req.language === language) {
       return {
         ...req,
         items: req.items ? req.items.filter(item => item.id !== id) : []
       };
     }
     return req;
   });
   
   setProductData({
     ...productData,
     systemRequirements: updatedProductSystemRequirements
   });
 };
  
  const handleDeleteSubFeature = (language, featureId, childId) => {
    const updatedFeatures = productData.features[language].map(feature => {
      if (feature.id === featureId) {
        return {
          ...feature,
          children: feature.children.filter(child => child.id !== childId)
        };
      }
      return feature;
    });
    
    const updatedProductData = {
      ...productData,
      features: { ...productData.features, [language]: updatedFeatures }
    };
    
    setProductData(updatedProductData);
  };
  
  // Системные требования
  const handleAddOs = (language) => {
    if (!tempOs.trim()) return;
    
    const updatedRequirements = productData.systemRequirements.map(req => {
      if (req.language === language) {
        return {
          ...req,
          supportedOS: [...req.supportedOS, tempOs.trim()]
        };
      }
      return req;
    });
    
    const updatedProductData = {
      ...productData,
      systemRequirements: updatedRequirements
    };
    
    setProductData(updatedProductData);
    setTempOs('');
  };
  
  const handleRemoveOs = (language, osIndex) => {
    const updatedRequirements = productData.systemRequirements.map(req => {
      if (req.language === language) {
        return {
          ...req,
          supportedOS: req.supportedOS.filter((_, i) => i !== osIndex)
        };
      }
      return req;
    });
    
    const updatedProductData = {
      ...productData,
      systemRequirements: updatedRequirements
    };
    
    setProductData(updatedProductData);
  };
  
  const handleAddAntiCheat = (language) => {
    if (!tempAntiCheat.trim()) return;
    
    const updatedRequirements = productData.systemRequirements.map(req => {
      if (req.language === language) {
        return {
          ...req,
          antiCheats: [...req.antiCheats, tempAntiCheat.trim()]
        };
      }
      return req;
    });
    
    const updatedProductData = {
      ...productData,
      systemRequirements: updatedRequirements
    };
    
    setProductData(updatedProductData);
    setTempAntiCheat('');
  };
  
  const handleRemoveAntiCheat = (language, antiCheatIndex) => {
    const updatedRequirements = productData.systemRequirements.map(req => {
      if (req.language === language) {
        return {
          ...req,
          antiCheats: req.antiCheats.filter((_, i) => i !== antiCheatIndex)
        };
      }
      return req;
    });
    
    const updatedProductData = {
      ...productData,
      systemRequirements: updatedRequirements
    };
    
    setProductData(updatedProductData);
  };
  
  const handleAddProcessor = (language) => {
    if (!tempProcessor.trim()) return;
    
    const updatedRequirements = productData.systemRequirements.map(req => {
      if (req.language === language) {
        return {
          ...req,
          processors: [...req.processors, tempProcessor.trim()]
        };
      }
      return req;
    });
    
    const updatedProductData = {
      ...productData,
      systemRequirements: updatedRequirements
    };
    
    setProductData(updatedProductData);
    setTempProcessor('');
  };
  
  const handleRemoveProcessor = (language, processorIndex) => {
    const updatedRequirements = productData.systemRequirements.map(req => {
      if (req.language === language) {
        return {
          ...req,
          processors: req.processors.filter((_, i) => i !== processorIndex)
        };
      }
      return req;
    });
    
    const updatedProductData = {
      ...productData,
      systemRequirements: updatedRequirements
    };
    
    setProductData(updatedProductData);
  };
  
  // Варианты продукта
  const handleAddVariant = () => {
    const newVariant = {
      type: 'full',
      region: 'global',
      days: 1,
      priceUsd: 0,
      priceRub: 0,
      keys: [],
      isActive: true,
      stock: 0,
      sortOrder: productData.variants.length,
      instructions: '',
      instructionsRu: '',
      instructionsEn: '',
      instructionLanguage: 'ru' // По умолчанию русский язык
    };
    
    const updatedProductData = {
      ...productData,
      variants: [...productData.variants, newVariant]
    };
    
    setProductData(updatedProductData);
  };
  
  const handleUpdateVariant = (index, field, value) => {
    const updatedVariants = [...productData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    
    // Если обновляем ключи, пересчитываем stock
    if (field === 'keys') {
      updatedVariants[index].stock = Array.isArray(value) ? value.length : 0;
    }
    
    const updatedProductData = {
      ...productData,
      variants: updatedVariants
    };
    
    setProductData(updatedProductData);
  };
  
  const handleAddKeys = (index) => {
    if (!tempKeys.trim()) return;
    
    const keys = tempKeys.split('\n').map(key => key.trim()).filter(key => key);
    const updatedVariants = [...productData.variants];
    const currentKeys = Array.isArray(updatedVariants[index].keys) ? updatedVariants[index].keys : [];
    updatedVariants[index].keys = [...currentKeys, ...keys];
    updatedVariants[index].stock = updatedVariants[index].keys.length;
    
    const updatedProductData = {
      ...productData,
      variants: updatedVariants
    };
    
    setProductData(updatedProductData);
    setTempKeys('');
  };
  
  const handleRemoveKey = (variantIndex, keyIndex) => {
    const updatedVariants = [...productData.variants];
    const currentKeys = Array.isArray(updatedVariants[variantIndex].keys) ? updatedVariants[variantIndex].keys : [];
    updatedVariants[variantIndex].keys = currentKeys.filter((_, i) => i !== keyIndex);
    updatedVariants[variantIndex].stock = updatedVariants[variantIndex].keys.length;
    
    const updatedProductData = {
      ...productData,
      variants: updatedVariants
    };
    
    setProductData(updatedProductData);
  };
  
  const handleRemoveVariant = (index) => {
    const updatedVariants = productData.variants.filter((_, i) => i !== index);
    const updatedProductData = { 
      ...productData, 
      variants: updatedVariants 
    };
    
    setProductData(updatedProductData);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Валидация
      if (!productData.slug.trim()) {
        addNotification('Введите ссылку (slug)', 'error');
        return;
      }

      if (!productData.gameId) {
        addNotification('Выберите игру', 'error');
        return;
      }

      // Категория не обязательна, если товар создается под игрой
      if (!productData.categoryId) {
        // Проверяем, есть ли категории для выбранной игры
        if (categories.length > 0) {
          addNotification('Выберите категорию или оставьте пустым для создания товара под игрой', 'warning');
          // Не прерываем процесс, позволяем создать товар без категории
        }
      }

      // Проверяем названия на обоих языках
      const ruTranslation = productData.translations.find(t => t.language === 'ru');
      const enTranslation = productData.translations.find(t => t.language === 'en');

      if (!ruTranslation?.name?.trim()) {
        addNotification('Введите название на русском', 'error');
        return;
      }

      if (!enTranslation?.name?.trim()) {
        addNotification('Введите название на английском', 'error');
        return;
      }
      
      // Проверяем медиа
      const hasMainImage = productData.media.some(m => m.isMainImage);
      if (!hasMainImage && productData.media.filter(m => m.type === 'image').length > 0) {
        // Автоматически назначаем первое изображение как основное
        const firstImageIndex = productData.media.findIndex(m => m.type === 'image');
        if (firstImageIndex !== -1) {
          const updatedMedia = productData.media.map((media, index) => ({
            ...media,
            isMainImage: index === firstImageIndex
          }));
          productData.media = updatedMedia;
        }
      }
      
      // Подготовка данных для API
      const preparedData = {
        slug: productData.slug,
        gameId: parseInt(productData.gameId),
        categoryId: productData.categoryId ? parseInt(productData.categoryId) : null,
        status: productData.status,
        regions: productData.regions,
        subscriptionTypes: productData.subscriptionTypes,
        screenshots: productData.screenshots,
        isActive: productData.isActive,
        translations: productData.translations.map(trans => ({
          language: trans.language,
          name: trans.name.trim(),
          description: trans.description?.trim() || '',
          metaTitle: trans.metaTitle?.trim() || '',
          metaDescription: trans.metaDescription?.trim() || '',
          metaKeywords: trans.metaKeywords?.trim() || ''
        })),
        systemRequirements: productData.systemRequirements.map(req => ({
          language: req.language,
          gameClient: req.gameClient?.trim() || '',
          supportedOS: req.supportedOS || [],
          antiCheats: req.antiCheats || [],
          processors: req.processors || [],
          spoofer: req.spoofer || false,
          gameMode: req.gameMode || false,
          items: systemRequirements[req.language]?.filter(item => item.title || item.text).map(item => ({
            title: item.title,
            description: item.text,
            icon: item.icon,
            language: req.language,
            sortOrder: systemRequirements[req.language].findIndex(i => i.id === item.id)
          })) || []
        })),
        media: productData.media,
        variants: productData.variants.map(variant => {
          // Определяем количество дней на основе введённых названий
          let days = 0;
          const daysLabel = variant.daysLabelRu || variant.daysLabelEn || '';
          
          // Извлекаем число из названия
          const match = daysLabel.match(/\d+/);
          if (match) {
            const num = parseInt(match[0]);
            if ([1, 3, 7, 30].includes(num)) {
              days = num;
            }
          }
          
          return {
            type: variant.type,
            region: variant.region,
            days: days,
            daysLabelRu: variant.daysLabelRu || '',
            daysLabelEn: variant.daysLabelEn || '',
            priceUsd: parseFloat(variant.priceUsd) || 0,
            priceRub: parseFloat(variant.priceRub) || 0,
            keys: Array.isArray(variant.keys) ? variant.keys : [],
            isActive: variant.isActive,
            stock: Array.isArray(variant.keys) ? variant.keys.length : 0,
            sortOrder: variant.sortOrder || 0,
            instructions: formatInstructions(variant.instructionsRu, variant.instructionsEn) // Включаем инструкции
          };
        })
      };
      
      // Преобразование features в плоский массив для API
      const featuresArray = [];
      Object.entries(productData.features).forEach(([language, features]) => {
        features.forEach(feature => {
          // Проверяем, что у основного пункта есть название
          if (feature.title?.trim()) {
            // Основной пункт
            featuresArray.push({
              language,
              title: feature.title.trim(),
              parentId: null,
              sortOrder: features.indexOf(feature) * 10
            });
            
            // Подпункты
            feature.children.forEach((child, childIndex) => {
              if (child.text?.trim()) {
                featuresArray.push({
                  language,
                  title: child.text.trim(),
                  parentId: feature.id,
                  sortOrder: (features.indexOf(feature) * 10) + childIndex + 1
                });
              }
            });
          }
        });
      });
      
      preparedData.features = featuresArray;
      
      let response;
      
      if (isEditing && productId) {
        // Режим редактирования - используем PUT запрос
        response = await fetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preparedData)
        });
      } else {
        // Режим создания - используем POST запрос
        response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preparedData)
        });
      }
      
      console.log('📤 Sending request to API:', {
        method: isEditing ? 'PUT' : 'POST',
        url: isEditing ? `/api/admin/products/${productId}` : '/api/admin/products',
        dataSize: JSON.stringify(preparedData).length
      });
      
      const data = await response.json();
      
      console.log('📥 API Response:', {
        status: response.status,
        ok: response.ok,
        success: data.success,
        error: data.error
      });
      
      if (response.ok && data.success) {
        const successMessage = isEditing ? 'Товар успешно обновлен!' : 'Товар успешно создан!';
        addNotification(successMessage, 'success');
        setHasUnsavedChanges(false); // Сбрасываем флаг несохраненных изменений
        router.push('/admin/dashboard?tab=games-products');
      } else {
        // Если продукт создался, но API вернул ошибку
        if (!response.ok && response.status === 400 && !isEditing) {
          console.warn('⚠️ Got 400 error but product might be created. Checking...');
          // Показываем предупреждение вместо ошибки
          addNotification('Товар создан, но возникли проблемы с дополнительными данными. Проверьте результат в списке товаров.', 'warning');
          setHasUnsavedChanges(false);
          router.push('/admin/dashboard?tab=games-products');
        } else {
          const errorMessage = isEditing
            ? `Ошибка при обновлении товара: ${data.error || data.details || 'Неизвестная ошибка'}`
            : `Ошибка при создании товара: ${data.error || data.details || 'Неизвестная ошибка'}`;
          addNotification(errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = isEditing
        ? 'Ошибка при обновлении товара: ' + error.message
        : 'Ошибка при создании товара: ' + error.message;
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для форматирования инструкций в формат "RU: ... | EN: ..."
  const formatInstructions = (ruText = '', enText = '') => {
    const formattedRu = ruText?.trim() || '';
    const formattedEn = enText?.trim() || '';
    return `RU: ${formattedRu} | EN: ${formattedEn}`;
  };
  
  // Получение текущих данных для активного языка
  const getCurrentSystemRequirements = () => {
    return productData.systemRequirements.find(req => req.language === activeLanguage) || productData.systemRequirements[0];
  };
  
  const currentSystemRequirements = getCurrentSystemRequirements();
  
  // Функция для форматирования размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Функция для форматирования длительности видео
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Компонент Tooltip
  const Tooltip = ({ children, content, position = 'top' }) => {
    const [show, setShow] = useState(false);

    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className="inline-block"
        >
          {children}
        </div>
        {show && (
          <div
            className={`absolute z-50 ${positionClasses[position]} px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap`}
          >
            {content}
            <div className={`absolute w-2 h-2 bg-black/90 transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
              position === 'left' ? 'top-1/2 right-full -translate-y-1/2 -mr-1' :
              'top-1/2 left-full -translate-y-1/2 -ml-1'
            }`} />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-[#0B0B0B] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок и кнопка назад */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard?tab=games-products')}
              className="inline-flex items-center space-x-2 text-[#989898] hover:text-white transition-colors mb-4 font-light"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Назад к панели</span>
            </button>
            <h1 className="text-2xl font-regular text-white mb-2 flex items-center space-x-2">
              <span>{isEditing ? 'Редактирование товара' : 'Создание нового товара'}</span>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></div>
                  Несохранено
                </span>
              )}
            </h1>
            <p className="text-[#989898] font-light">
              {isEditing ? 'Редактируйте данные товара' : 'Заполните все необходимые поля для создания товара'}
              {hasUnsavedChanges && (
                <span className="text-yellow-400 ml-2">• Есть несохраненные изменения</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-black font-regular rounded-xl transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? (isEditing ? 'Сохранение...' : 'Создание...') : (isEditing ? 'Сохранить изменения' : 'Создать товар')}</span>
            </button>
          </div>
        </div>
        
        {/* Языковой переключатель */}
        <div className="mb-6">
          <div className="flex border-b border-[#383838]">
            <button
              onClick={() => setActiveLanguage('ru')}
              className={`px-6 py-3 font-regular text-sm transition-colors flex items-center space-x-2 ${
                activeLanguage === 'ru'
                  ? 'text-white border-b-2 border-white'
                  : 'text-[#989898] hover:text-white font-light'
              }`}
            >
              <GlobeIcon className="h-3 w-3" />
              <span>Русский</span>
            </button>
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-6 py-3 font-regular text-sm transition-colors flex items-center space-x-2 ${
                activeLanguage === 'en'
                  ? 'text-white border-b-2 border-white'
                  : 'text-[#989898] hover:text-white font-light'
              }`}
            >
              <GlobeIcon className="h-3 w-3" />
              <span>English</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Загрузка медиа */}
            <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-regular text-white flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5" />
                  <span>Медиа-файлы</span>
                </h3>
              </div>
              
              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#262626] border border-[#383838] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#989898] font-light">Изображения</p>
                      <p className="text-white text-lg font-regular">
                        {productData.media.filter(m => m.type === 'image').length}/10
                      </p>
                    </div>
                    <FileImage className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="bg-[#262626] border border-[#383838] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#989898] font-light">Видео</p>
                      <p className="text-white text-lg font-regular">
                        {productData.media.filter(m => m.type === 'video').length}/10
                      </p>
                    </div>
                    <Video className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Загрузка файлов */}
              <div className="mb-6">
                <label className="block text-sm font-regular text-[#989898] mb-2 font-light">
                  Выберите файлы (макс. 10 изображений + 10 видео)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-[#383838] rounded-xl p-6 text-center hover:border-[#525252] transition-colors">
                      <Upload className="h-8 w-8 text-[#989898] mx-auto mb-3" />
                      <p className="text-white font-regular">Перетащите файлы или кликните для выбора</p>
                      <p className="text-[#989898] text-sm mt-1 font-light">Поддерживаются изображения и видео</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={handleUploadMedia}
                    disabled={selectedFiles.length === 0 || uploadingMedia}
                    className="px-6 py-3 bg-white text-black font-regular rounded-xl transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingMedia ? 'Загрузка...' : `Загрузить (${selectedFiles.length})`}
                  </button>
                </div>
                
                {/* Выбранные файлы */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-[#989898] mb-2 font-light">Выбрано файлов: {selectedFiles.length}</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-[#262626] border border-[#383838] p-2 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="h-4 w-4 text-white" />
                            ) : (
                              <Video className="h-4 w-4 text-white" />
                            )}
                            <span className="text-white text-sm truncate font-regular">{file.name}</span>
                          </div>
                          <span className="text-[#989898] text-xs font-light">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Загруженные медиа */}
              {productData.media.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="media">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                      >
                        {productData.media.map((media, index) => (
                          <Draggable key={index} draggableId={`media-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative group border-2 rounded-xl overflow-hidden ${
                                  media.isMainImage 
                                    ? 'border-white ring-2 ring-white/20' 
                                    : 'border-[#383838]'
                                }`}
                              >
                                {/* Элемент для перетаскивания */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="absolute top-2 left-2 z-10 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Move className="h-4 w-4 text-white" />
                                </div>
                                
                                {/* Кнопка удаления */}
                                <button
                                  onClick={() => handleRemoveMedia(index)}
                                  className="absolute top-2 right-2 z-10 p-1 bg-[#262626] hover:bg-[#383838] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </button>
                                
                                {/* Контент */}
                                <div className="aspect-square overflow-hidden">
                                  {media.type === 'image' ? (
                                    <>
                                      <img
                                        src={getMediaUrl(media.url)}
                                        alt={media.fileName || `Image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      {media.isMainImage && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2">
                                          <Star className="h-5 w-5 text-black" />
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {media.thumbnail ? (
                                        <div className="relative w-full h-full">
                                          <img
                                            src={media.thumbnail}
                                            alt="Video thumbnail"
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <Play className="h-8 w-8 text-white/80" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-full h-full bg-[#262626] flex items-center justify-center">
                                          <Video className="h-12 w-12 text-[#989898]" />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                                
                                {/* Информация */}
                                <div className="p-2 bg-black/50 backdrop-blur-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {media.type === 'image' ? (
                                        <Image className="h-3 w-3 text-white" />
                                      ) : (
                                        <Video className="h-3 w-3 text-white" />
                                      )}
                                      <span className="text-white text-xs truncate font-regular">
                                        {media.type === 'image' ? 'Image' : 'Video'}
                                      </span>
                                    </div>
                                    {media.duration && (
                                      <span className="text-white text-xs font-light">
                                        {formatDuration(media.duration)}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Кнопка сделать основным (только для изображений) */}
                                  {media.type === 'image' && !media.isMainImage && (
                                    <button
                                      onClick={() => handleSetMainImage(index)}
                                      className="w-full mt-2 py-1 text-xs bg-white text-black font-regular rounded transition-colors hover:bg-gray-200"
                                    >
                                      Сделать основной
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 text-[#989898] mx-auto mb-3" />
                  <p className="text-[#989898] font-regular">Нет загруженных медиа-файлов</p>
                  <p className="text-[#989898] text-sm mt-1 font-light">Загрузите изображения или видео для этого товара</p>
                </div>
              )}
              
              {/* Инструкция */}
              <div className="mt-6 p-4 bg-[#262626] border border-[#383838] rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-white flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-regular mb-1">Как использовать медиа:</h4>
                    <ul className="text-[#989898] text-sm space-y-1 font-light">
                      <li>• Можно загрузить до 10 изображений и 10 видео</li>
                      <li>• Первое изображение автоматически становится основным</li>
                      <li>• Перетаскивайте элементы для изменения порядка</li>
                      <li>• Основное изображение будет отображаться в каталоге</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Основные поля */}
            <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
              <h3 className="text-lg font-regular text-white mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Основная информация</span>
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="block text-sm font-regular text-[#989898] font-light">
                        Ссылка (slug) *
                      </label>
                      <Tooltip content="Уникальный идентификатор для URL товара. Используется в адресе страницы товара.">
                        <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      value={productData.slug}
                      onChange={(e) => setProductData({...productData, slug: e.target.value})}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none"
                      placeholder="my-awesome-product"
                    />
                    <p className="text-xs text-[#989898] mt-1 font-light">Например: valorant-cheat, cs2-wh</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="block text-sm font-regular text-[#989898] font-light">
                        Статус *
                      </label>
                      <Tooltip content="Статус обнаружения античитом. Undetected - не обнаружен, Detected - обнаружен, Use at own risk - используйте на свой страх и риск, On update - в процессе обновления">
                        <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                      </Tooltip>
                    </div>
                    <select
                      value={productData.status}
                      onChange={(e) => setProductData({...productData, status: e.target.value})}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none"
                    >
                      <option value="undetected" className="bg-[#161616] text-white">Undetected</option>
                      <option value="detected" className="bg-[#161616] text-white">Detected</option>
                      <option value="useAtOwnRisk" className="bg-[#161616] text-white">Use at own risk</option>
                      <option value="onUpdate" className="bg-[#161616] text-white">On update</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2 font-light">
                      Игра *
                    </label>
                    <select
                      value={productData.gameId}
                      onChange={(e) => handleGameChange(e.target.value)}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none"
                    >
                      <option value="" className="text-[#A1A1A1]">Выберите игру</option>
                      {games.map(game => (
                        <option key={game.id} value={game.id} className="text-white bg-[#161616]">{game.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="block text-sm font-regular text-[#989898] font-light">
                        Категория
                      </label>
                      <Tooltip content="Категория внутри игры. Например: AIM, ESP, Rage, Legit и т.д.">
                        <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                      </Tooltip>
                    </div>
                    <select
                      value={productData.categoryId}
                      onChange={(e) => setProductData({...productData, categoryId: e.target.value})}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none"
                      disabled={!productData.gameId}
                    >
                      <option value="" className="text-[#A1A1A1]">Выберите категорию</option>
                      {categories.map(cat => {
                        // Ищем перевод для текущего языка или используем русский как fallback
                        const translation = cat.translations?.find(t => t.language === 'ru') || 
                                          cat.translations?.[0] || 
                                          { name: cat.name || cat.slug };
                        
                        return (
                          <option key={cat.id} value={cat.id} className="text-white bg-[#161616]">
                            {translation.name || cat.slug}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-regular text-[#989898] mb-2 font-light">
                    Название ({activeLanguage === 'ru' ? 'Русский' : 'English'}) *
                    <span className="text-white ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={productData.translations.find(t => t.language === activeLanguage)?.name || ''}
                    onChange={(e) => {
                      const updatedTranslations = productData.translations.map(t =>
                        t.language === activeLanguage ? { ...t, name: e.target.value } : t
                      );
                      setProductData({...productData, translations: updatedTranslations});
                    }}
                    className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none"
                    placeholder={activeLanguage === 'ru' ? 'Название товара' : 'Product name'}
                    required
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="block text-sm font-regular text-[#989898] font-light">
                      Описание ({activeLanguage === 'ru' ? 'Русский' : 'English'})
                    </label>
                    <Tooltip content="Подробное описание товара. Будет отображаться на странице товара под названием.">
                      <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                    </Tooltip>
                  </div>
                  <textarea
                    value={productData.translations.find(t => t.language === activeLanguage)?.description || ''}
                    onChange={(e) => {
                      const updatedTranslations = productData.translations.map(t =>
                        t.language === activeLanguage ? { ...t, description: e.target.value } : t
                      );
                      setProductData({...productData, translations: updatedTranslations});
                    }}
                    rows={4}
                    className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none"
                    placeholder="Подробное описание товара"
                  />
                </div>
                
                {/* SEO Fields */}
                <div className="space-y-4 border-t border-[#383838] pt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <h4 className="text-sm font-regular text-cyan-400">SEO настройки ({activeLanguage === 'ru' ? 'Русский' : 'English'})</h4>
                    <Tooltip content="Настройки для поисковых систем. Помогают улучшить видимость товара в поиске.">
                      <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                    </Tooltip>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="block text-sm font-regular text-[#989898] font-light">
                        Meta Title
                      </label>
                      <Tooltip content="Заголовок для поисковых систем. Отображается в результатах поиска Google.">
                        <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      value={productData.translations.find(t => t.language === activeLanguage)?.metaTitle || ''}
                      onChange={(e) => {
                        const updatedTranslations = productData.translations.map(t =>
                          t.language === activeLanguage ? { ...t, metaTitle: e.target.value } : t
                        );
                        setProductData({...productData, translations: updatedTranslations});
                      }}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none"
                      placeholder={activeLanguage === 'ru' ? 'Заголовок для поисковых систем' : 'Title for search engines'}
                    />
                    <p className="text-xs text-[#989898] mt-1 font-light">Рекомендуется до 60 символов</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="block text-sm font-regular text-[#989898] font-light">
                        Meta Description
                      </label>
                      <Tooltip content="Описание для поисковых систем. Отображается под заголовком в результатах поиска.">
                        <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                      </Tooltip>
                    </div>
                    <textarea
                      value={productData.translations.find(t => t.language === activeLanguage)?.metaDescription || ''}
                      onChange={(e) => {
                        const updatedTranslations = productData.translations.map(t =>
                          t.language === activeLanguage ? { ...t, metaDescription: e.target.value } : t
                        );
                        setProductData({...productData, translations: updatedTranslations});
                      }}
                      rows={2}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none"
                      placeholder={activeLanguage === 'ru' ? 'Описание для поисковых систем' : 'Description for search engines'}
                    />
                    <p className="text-xs text-[#989898] mt-1 font-light">Рекомендуется до 160 символов</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="block text-sm font-regular text-[#989898] font-light">
                        Meta Keywords
                      </label>
                      <Tooltip content="Ключевые слова для поисковых систем. Разделяйте запятыми.">
                        <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      value={productData.translations.find(t => t.language === activeLanguage)?.metaKeywords || ''}
                      onChange={(e) => {
                        const updatedTranslations = productData.translations.map(t =>
                          t.language === activeLanguage ? { ...t, metaKeywords: e.target.value } : t
                        );
                        setProductData({...productData, translations: updatedTranslations});
                      }}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none"
                      placeholder={activeLanguage === 'ru' ? 'ключевые, слова, через, запятую' : 'keywords, separated, by, commas'}
                    />
                    <p className="text-xs text-[#989898] mt-1 font-light">Ключевые слова через запятую</p>
                  </div>
                </div>
                
                {/* SEO Preview */}
                <SEOPreview 
                  translations={productData.translations}
                  productSlug={productData.slug}
                />
                
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productData.isActive}
                      onChange={(e) => setProductData({...productData, isActive: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
                      productData.isActive
                        ? 'bg-white border-white'
                        : 'bg-[#161616] border-[#383838]'
                    }`}>
                      {productData.isActive && (
                        <CheckCircle className="w-3 h-3 text-black" />
                      )}
                    </div>
                    <span className="text-white font-regular">Товар активен и отображается в каталоге</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Системные требования */}
            <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-regular text-white flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>Системные требования ({activeLanguage === 'ru' ? 'Русский' : 'English'})</span>
                  </h3>
                  <Tooltip content="Системные требования для игры. Можно добавить до 6 требований с иконками.">
                    <HelpCircle className="h-4 w-4 text-[#989898] cursor-help hover:text-white transition-colors" />
                  </Tooltip>
                </div>
              </div>

              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                const items = Array.from(systemRequirements[activeLanguage]);
                const [reorderedItem] = items.splice(result.source.index, 1);
                items.splice(result.destination.index, 0, reorderedItem);
                handleReorderSystemRequirements(activeLanguage, items);
              }}>
                <Droppable droppableId="system-requirements" direction="horizontal">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
                    >
                      {systemRequirements[activeLanguage].map((req, index) => (
                        <Draggable key={req.id} draggableId={`req-${req.id}`} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-[#262626] border border-[#383838] rounded-xl p-4 hover:border-[#4a4a4a] transition-colors group"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div
                                  {...provided.dragHandleProps}
                                  className="p-1.5 hover:bg-[#383838] rounded-lg cursor-move transition-colors opacity-70 group-hover:opacity-100"
                                  title="Перетащите для изменения порядка"
                                >
                                  <Move className="h-4 w-4 text-[#989898]" />
                                </div>
                                <button
                                  onClick={() => handleDeleteSystemRequirement(activeLanguage, req.id)}
                                  className="p-1.5 hover:bg-[#383838] rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                                  title="Удалить требование"
                                >
                                  <Trash2 className="h-4 w-4 text-[#989898]" />
                                </button>
                              </div>
                               
                              <div className="mb-3">
                                <label className="block text-xs text-[#989898] mb-1 font-light">Название</label>
                                <input
                                  type="text"
                                  value={req.title || ''}
                                  onChange={(e) => handleUpdateSystemRequirement(activeLanguage, req.id, 'title', e.target.value)}
                                  className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4a4a4a] transition-colors"
                                  placeholder={`Название требования ${req.id}`}
                                />
                              </div>
                               
                              <div className="mb-3">
                                <label className="block text-xs text-[#989898] mb-1 font-light">Иконка</label>
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={req.icon || ''}
                                    onChange={(e) => handleUpdateSystemRequirement(activeLanguage, req.id, 'icon', e.target.value)}
                                    className="flex-1 bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4a4a4a] transition-colors cursor-pointer"
                                  >
                                    <option value="">Без иконки</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                      <option key={num} value={num}>Иконка {num}</option>
                                    ))}
                                  </select>
                                  {req.icon && (
                                    <div className="flex items-center justify-center bg-[#161616] border border-[#383838] rounded-lg p-2">
                                      <img
                                        src={`/images/product/icons/${req.icon}.svg`}
                                        alt={`Icon ${req.icon}`}
                                        className="h-6 w-6"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                               
                              <div>
                                <label className="block text-xs text-[#989898] mb-1 font-light">Описание</label>
                                <textarea
                                  value={req.text}
                                  onChange={(e) => handleUpdateSystemRequirement(activeLanguage, req.id, 'text', e.target.value)}
                                  className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4a4a4a] transition-colors placeholder-[#5a5a5a] resize-none min-h-[100px] hover:border-[#4a4a4a]"
                                  placeholder={`Введите описание требования ${req.id}...`}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#383838]">
                <div className="text-xs text-[#989898] font-light">
                  <p>• Перетаскивайте элементы для изменения порядка</p>
                  <p>• Максимум 6 системных требований</p>
                </div>
                
                {systemRequirements[activeLanguage].length < 6 && (
                  <button
                    onClick={() => {
                      // Функция добавления нового требования
                      const newId = Math.max(...systemRequirements[activeLanguage].map(r => r.id), 0) + 1;
                      handleUpdateSystemRequirements(activeLanguage, [
                        ...systemRequirements[activeLanguage],
                        { id: newId, title: '', text: '', icon: '' }
                      ]);
                    }}
                    className="px-4 py-2 bg-[#262626] border border-[#383838] rounded-lg text-sm text-white hover:bg-[#2a2a2a] hover:border-[#4a4a4a] transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Добавить требование</span>
                  </button>
                )}
              </div>
            </div>

            {/* Функционал */}
            <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-regular text-white flex items-center space-x-2">
                    <List className="h-5 w-5" />
                    <span>Функционал ({activeLanguage === 'ru' ? 'Русский' : 'English'})</span>
                  </h3>
                  <Tooltip content="Список функций и возможностей читов. Можно добавлять основные пункты и подпункты.">
                    <HelpCircle className="h-4 w-4 text-[#989898] cursor-help" />
                  </Tooltip>
                </div>
                <button
                  onClick={() => handleAddFeature(activeLanguage)}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white text-black font-regular rounded-lg transition-colors hover:bg-gray-200"
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-sm">Добавить пункт</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {productData.features[activeLanguage]?.length === 0 && (
                  <div className="text-center py-8">
                    <List className="h-12 w-12 text-[#989898] mx-auto mb-3" />
                    <p className="text-[#989898] font-regular">Нет добавленных функций</p>
                    <p className="text-[#989898] text-sm mt-1 font-light">Добавьте функции для этого товара</p>
                  </div>
                )}
                
                {productData.features[activeLanguage]?.map((feature, index) => (
                  <div key={feature.id} className="border border-[#383838] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-6 h-6 bg-[#262626] text-white rounded-lg flex items-center justify-center">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => handleUpdateFeature(activeLanguage, feature.id, 'title', e.target.value)}
                          className="flex-1 bg-transparent border-none text-white focus:outline-none text-lg font-regular"
                          placeholder="Основной пункт функционала"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Tooltip content="Удалить этот пункт">
                          <button
                            onClick={() => handleDeleteFeature(activeLanguage, feature.id)}
                            className="p-1.5 hover:bg-[#262626] rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Подпункты */}
                    {feature.children.length > 0 && (
                      <div className="ml-10 mt-3 space-y-2">
                        {feature.children.map((child, childIndex) => (
                          <div key={child.id} className="flex items-center space-x-3 group">
                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                            <input
                              type="text"
                              value={child.text}
                              onChange={(e) => handleUpdateSubFeature(activeLanguage, feature.id, child.id, e.target.value)}
                              className="flex-1 bg-transparent border-none text-[#989898] focus:outline-none text-sm py-1 font-light"
                              placeholder="Подпункт"
                            />
                            <button
                              onClick={() => handleDeleteSubFeature(activeLanguage, feature.id, child.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#262626] rounded transition-colors"
                              title="Удалить подпункт"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
          </div>
          
          {/* Правая колонка - Настройки подписки и варианты */}
          <div className="space-y-6">
            {/* Настройки подписки */}
            <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
              <h3 className="text-lg font-regular text-white mb-4 flex items-center space-x-2">
                <Layers className="h-5 w-5" />
                <span>Настройки подписки</span>
              </h3>
              
              <div className="space-y-6">
                {/* Регионы */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <label className="block text-sm font-regular text-[#989898] flex items-center space-x-2 font-light">
                      <Globe className="h-4 w-4" />
                      <span>Регионы</span>
                    </label>
                    <Tooltip content="Регионы, для которых доступен этот читов. Global - международная версия, CIS - версия для стран СНГ.">
                      <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    {['global', 'cis'].map(region => (
                      <label key={region} className="flex items-center space-x-3 p-3 bg-[#262626] border border-[#383838] rounded-lg cursor-pointer hover:bg-[#2E2F2F] transition-colors">
                        <input
                          type="checkbox"
                          checked={productData.regions.includes(region)}
                          onChange={(e) => {
                            const newRegions = e.target.checked
                              ? [...productData.regions, region]
                              : productData.regions.filter(r => r !== region);
                            setProductData({...productData, regions: newRegions});
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
                          productData.regions.includes(region)
                            ? 'bg-white border-white'
                            : 'bg-transparent border-[#383838]'
                        }`}>
                          {productData.regions.includes(region) && (
                            <CheckCircle className="w-3 h-3 text-black" />
                          )}
                        </div>
                        <div>
                          <span className="text-white capitalize font-regular">{region}</span>
                          <p className="text-[#989898] text-xs font-light">
                            {region === 'global' ? 'Международная версия' : 'СНГ версия'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Типы подписок */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <label className="block text-sm font-regular text-[#989898] flex items-center space-x-2 font-light">
                      <Layers className="h-4 w-4" />
                      <span>Типы подписок</span>
                    </label>
                    <Tooltip content="Full - полная версия со всеми функциями, Lite - облегченная версия с ограниченными функциями.">
                      <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    {['full', 'lite'].map(type => (
                      <label key={type} className="flex items-center space-x-3 p-3 bg-[#262626] border border-[#383838] rounded-lg cursor-pointer hover:bg-[#2E2F2F] transition-colors">
                        <input
                          type="checkbox"
                          checked={productData.subscriptionTypes.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...productData.subscriptionTypes, type]
                              : productData.subscriptionTypes.filter(t => t !== type);
                            setProductData({...productData, subscriptionTypes: newTypes});
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
                          productData.subscriptionTypes.includes(type)
                            ? 'bg-white border-white'
                            : 'bg-transparent border-[#383838]'
                        }`}>
                          {productData.subscriptionTypes.includes(type) && (
                            <CheckCircle className="w-3 h-3 text-black" />
                          )}
                        </div>
                        <div>
                          <span className="text-white capitalize font-regular">{type}</span>
                          <p className="text-[#989898] text-xs font-light">
                            {type === 'full' ? 'Полная версия' : 'Облегченная версия'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Варианты продукта */}
            <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-regular text-white flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Варианты продукта</span>
                  </h3>
                  <Tooltip content="Разные варианты подписки с разной длительностью, регионом и типом. Клиенты смогут выбрать подходящий вариант.">
                    <HelpCircle className="h-4 w-4 text-[#989898] cursor-help" />
                  </Tooltip>
                </div>
                <button
                  onClick={handleAddVariant}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white text-black font-regular rounded-lg transition-colors hover:bg-gray-200"
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-sm">Добавить вариант</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {productData.variants.length === 0 && (
                  <div className="text-center py-6">
                    <DollarSign className="h-12 w-12 text-[#989898] mx-auto mb-3" />
                    <p className="text-[#989898] font-regular">Нет добавленных вариантов</p>
                    <p className="text-[#989898] text-sm mt-1 font-light">Добавьте варианты цены и подписки</p>
                  </div>
                )}
                
                {productData.variants.map((variant, index) => (
                  <div key={index} className="border border-[#383838] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-regular">
                          {variant.type === 'full' ? 'Full' : 'Lite'} - {variant.region === 'global' ? 'Global' : 'CIS'} - {variant.days} день
                        </h4>
                        <p className="text-[#989898] text-sm font-light">
                          Ключей: {Array.isArray(variant.keys) ? variant.keys.length : 0} | Цена: ${variant.priceUsd} / {variant.priceRub}₽
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveVariant(index)}
                        className="p-1 hover:bg-[#262626] rounded transition-colors"
                        title="Удалить вариант"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-[#989898] mb-1 block font-light">Тип</label>
                        <select
                          value={variant.type}
                          onChange={(e) => handleUpdateVariant(index, 'type', e.target.value)}
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                        >
                          <option value="full" className="bg-[#161616] text-white">Full</option>
                          <option value="lite" className="bg-[#161616] text-white">Lite</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-[#989898] mb-1 block font-light">Регион</label>
                        <select
                          value={variant.region}
                          onChange={(e) => handleUpdateVariant(index, 'region', e.target.value)}
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                        >
                          <option value="global" className="bg-[#161616] text-white">Global</option>
                          <option value="cis" className="bg-[#161616] text-white">CIS</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-[#989898] mb-1 block font-light">Название (RU)</label>
                        <input
                          type="text"
                          value={variant.daysLabelRu || ''}
                          onChange={(e) => handleUpdateVariant(index, 'daysLabelRu', e.target.value)}
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                          placeholder="Например: 7 дней"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-[#989898] mb-1 block font-light">Название (EN)</label>
                        <input
                          type="text"
                          value={variant.daysLabelEn || ''}
                          onChange={(e) => handleUpdateVariant(index, 'daysLabelEn', e.target.value)}
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                          placeholder="Например: 7 Days"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-[#989898] mb-1 block font-light">Активен</label>
                        <label className="flex items-center h-full">
                          <input
                            type="checkbox"
                            checked={variant.isActive}
                            onChange={(e) => handleUpdateVariant(index, 'isActive', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-6 h-6 border-2 rounded transition-colors flex items-center justify-center ${
                            variant.isActive
                              ? 'bg-white border-white'
                              : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {variant.isActive && (
                              <CheckCircle className="w-3 h-3 text-black" />
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center space-x-1 mb-1">
                          <label className="text-xs text-[#989898] block font-light">Цена USD</label>
                          <Tooltip content="Цена в долларах США для международных клиентов.">
                            <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                          </Tooltip>
                        </div>
                        <input
                          type="number"
                          value={variant.priceUsd}
                          onChange={(e) => handleUpdateVariant(index, 'priceUsd', e.target.value)}
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-1 mb-1">
                          <label className="text-xs text-[#989898] block font-light">Цена RUB</label>
                          <Tooltip content="Цена в рублях для клиентов из СНГ.">
                            <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                          </Tooltip>
                        </div>
                        <input
                          type="number"
                          value={variant.priceRub}
                          onChange={(e) => handleUpdateVariant(index, 'priceRub', e.target.value)}
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                          step="1"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* Инструкции для варианта */}
                    <div className="mt-4 mb-3 pt-3 border-t border-[#383838]">
                      <div className="flex items-center space-x-2 mb-2">
                        <label className="text-sm font-regular text-white flex items-center space-x-2">
                          <BookOpen className="h-3 w-3" />
                          <span>Инструкция по использованию</span>
                        </label>
                        <Tooltip content="Пошаговая инструкция по установке и использованию читов. Будет отправлена клиенту после покупки.">
                          <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                        </Tooltip>
                      </div>
                      
                      {/* Переключатель языка для инструкций */}
                      <div className="flex border-b border-[#383838] mb-3">
                        <button
                          onClick={() => {
                            const updatedVariants = [...productData.variants];
                            updatedVariants[index] = {
                              ...updatedVariants[index],
                              instructionLanguage: 'ru',
                              instructions: formatInstructions(updatedVariants[index].instructionsRu, updatedVariants[index].instructionsEn)
                            };
                            setProductData({ ...productData, variants: updatedVariants });
                          }}
                          className={`px-3 py-1.5 text-sm transition-colors flex items-center space-x-1 ${
                            variant.instructionLanguage === 'ru'
                              ? 'text-white border-b-2 border-white'
                              : 'text-[#989898] hover:text-white font-light'
                          }`}
                        >
                          <span>RU</span>
                        </button>
                        <button
                          onClick={() => {
                            const updatedVariants = [...productData.variants];
                            updatedVariants[index] = {
                              ...updatedVariants[index],
                              instructionLanguage: 'en',
                              instructions: formatInstructions(updatedVariants[index].instructionsRu, updatedVariants[index].instructionsEn)
                            };
                            setProductData({ ...productData, variants: updatedVariants });
                          }}
                          className={`px-3 py-1.5 text-sm transition-colors flex items-center space-x-1 ${
                            variant.instructionLanguage === 'en'
                              ? 'text-white border-b-2 border-white'
                              : 'text-[#989898] hover:text-white font-light'
                          }`}
                        >
                          <span>EN</span>
                        </button>
                      </div>
                      
                      {/* Поля для инструкций на разных языках */}
                      {variant.instructionLanguage === 'ru' ? (
                        <textarea
                          key={`instructions-ru-${index}`}
                          value={variant.instructionsRu || ''}
                          onChange={(e) => {
                            const updatedVariants = [...productData.variants];
                            updatedVariants[index] = {
                              ...updatedVariants[index],
                              instructionsRu: e.target.value,
                              instructions: formatInstructions(e.target.value, updatedVariants[index].instructionsEn)
                            };
                            setProductData({ ...productData, variants: updatedVariants });
                          }}
                          rows="4"
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none placeholder-[#A1A1A1]"
                          placeholder="Введите инструкцию на русском"
                        />
                      ) : (
                        <textarea
                          key={`instructions-en-${index}`}
                          value={variant.instructionsEn || ''}
                          onChange={(e) => {
                            const updatedVariants = [...productData.variants];
                            updatedVariants[index] = {
                              ...updatedVariants[index],
                              instructionsEn: e.target.value,
                              instructions: formatInstructions(updatedVariants[index].instructionsRu, e.target.value)
                            };
                            setProductData({ ...productData, variants: updatedVariants });
                          }}
                          rows="4"
                          className="w-full bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none placeholder-[#A1A1A1]"
                          placeholder="Введите инструкцию на английском"
                        />
                      )}
                      <p className="text-xs text-[#989898] mt-1 font-light">
                        Используйте Markdown для форматирования (# заголовок, **жирный**, *курсив*)
                      </p>
                    </div>
                    
                    {/* Управление ключами */}
                    <div className="mt-4 pt-4 border-t border-[#383838]">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-regular text-white flex items-center space-x-2">
                            <Key className="h-3 w-3" />
                            <span>Ключи ({Array.isArray(variant.keys) ? variant.keys.length : 0})</span>
                          </label>
                          <Tooltip content="Ключи активации для этого варианта. Каждый ключ - одна продажа. Ключи добавляются построчно.">
                            <HelpCircle className="h-3 w-3 text-[#989898] cursor-help" />
                          </Tooltip>
                        </div>
                        <span className="text-xs text-[#989898] font-light">Stock: {Array.isArray(variant.keys) ? variant.keys.length : 0}</span>
                      </div>
                      
                      <div className="flex space-x-2 mb-2">
                        <textarea
                          value={tempKeys}
                          onChange={(e) => setTempKeys(e.target.value)}
                          className="flex-1 bg-[#161616] border border-[#383838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none placeholder-[#A1A1A1]"
                          placeholder="Введите ключи (каждый с новой строки)"
                          rows="2"
                        />
                        <button
                          onClick={() => handleAddKeys(index)}
                          className="px-3 py-2 bg-white text-black font-regular rounded-lg transition-colors self-start hover:bg-gray-200"
                        >
                          Добавить
                        </button>
                      </div>
                      
                      <div className="max-h-32 overflow-y-auto">
                        {Array.isArray(variant.keys) && variant.keys.map((key, keyIndex) => (
                          <div key={keyIndex} className="flex items-center justify-between py-1 px-2 hover:bg-[#262626] rounded">
                            <code className="text-white text-sm font-mono font-regular">{key}</code>
                            <button
                              onClick={() => handleRemoveKey(index, keyIndex)}
                              className="p-1 hover:bg-[#383838] rounded"
                              title="Удалить ключ"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Предупреждение о несохраненных данных */}
            {hasUnsavedChanges && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-regular mb-1">Несохраненные изменения</h4>
                    <p className="text-[#989898] text-sm font-light">
                      У вас есть несохраненные изменения. Обязательно нажмите "{isEditing ? 'Сохранить изменения' : 'Создать товар'}" 
                      перед закрытием страницы, иначе все изменения будут потеряны.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}