'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/components/NotificationComponent';
import {
  Shield, Users, Settings, LogOut, User, Crown, Package, ShoppingCart, DollarSign,
  BarChart3, Plus, X, Eye, EyeOff, TrendingUp, Bell, Search, TrendingDown, Home,
  Database, MessageSquare, CreditCard, Folder, Server, Mail, Calendar, Flag, Zap,
  Palette, AlertTriangle, Edit, Trash2, GripVertical, ExternalLink, Save, Lock,
  RefreshCw, Check, XCircle, Key, ChevronRight, ChevronLeft, Gamepad2, Tag, Grid, ChevronDown,
  ChevronUp, Menu, ListFilter, Clock, Copy
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { getMediaUrl } from '@/lib/utils/imageUtils';
// Динамический импорт компонентов графиков (без SSR)
const PageVisitChart = dynamic(
  () => import('@/components/PageVisitChart'),
  { ssr: false }
);

const RevenueChart = dynamic(
  () => import('@/components/RevenueChart'),
  { ssr: false }
);

const RevenueAnalytics = dynamic(
  () => import('@/components/RevenueAnalytics'),
  { ssr: false }
);
import Admin2FAModal from '@/components/Admin2FAModal';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboard() {
  const { addNotification } = useNotification();
  const [adminInfo, setAdminInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  // Check if current admin has access to a specific tab
  const hasTabAccess = (tabId) => {
    if (!adminInfo) return false;
    if (adminInfo.owner) return true; // Owner has access to everything
    
    try {
      if (!adminInfo.permissions) return false;
      
      // adminInfo.permissions уже парсится в adminAuth.js, поэтому это должен быть массив
      let permissions = adminInfo.permissions;
      
      // Если это все еще строка (для совместимости), парсим ее
      if (typeof permissions === 'string') {
        permissions = JSON.parse(permissions);
      }
      
      if (!Array.isArray(permissions)) return false;
      
      // Check if it's the new format (array of tab IDs)
      if (permissions.length > 0) {
        // New format: direct tab IDs
        if (typeof permissions[0] === 'string' && !permissions[0].includes('.')) {
          return permissions.includes(tabId);
        }
        
        // Old format: permission strings like "admin.list", "products.all"
        if (typeof permissions[0] === 'string' && permissions[0].includes('.')) {
          const oldToNewMapping = {
            'admin.list': ['dashboard', 'admins'],
            'products.all': ['games-products'],
            'categories.all': ['games-products'],
            'games.all': ['games-products'],
            'statistics.all': ['dashboard'],
            'audit.all': ['activity-log'],
            'products.status': ['games-products'],
            'orders.all': ['order-logs'],
            'users.all': ['users'],
            'coupons.all': ['coupons'],
            'settings.all': ['settings']
          };
          
          // Check if any old permission maps to the requested tab
          for (const permission of permissions) {
            const mappedTabs = oldToNewMapping[permission] || [];
            if (mappedTabs.includes(tabId)) {
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking admin permissions:', error, 'adminInfo:', adminInfo);
      return false;
    }
  };
  
  // Order logs state
  const [orderLogs, setOrderLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    telegramToken: '',
    discordWebhook: ''
  });
  const [originalSettings, setOriginalSettings] = useState({
    telegramToken: '',
    discordWebhook: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  
  // Email testing state
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  
  // Manual order email state
  const [manualOrderId, setManualOrderId] = useState('');
  const [isSendingOrderEmail, setIsSendingOrderEmail] = useState(false);
  
  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    username: '',
    balanceUsd: 0,
    balanceRub: 0
  });

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [showEditCouponModal, setShowEditCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [newCouponData, setNewCouponData] = useState({
    code: '',
    discountPercent: 0,
    expiresAt: '',
    productIds: [],
    isActive: true,
    maxUses: null
  });
  const [editCouponData, setEditCouponData] = useState({
    code: '',
    discountPercent: 0,
    expiresAt: '',
    productIds: [],
    isActive: true,
    maxUses: null
  });
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Payment Fees state
  const [paymentFees, setPaymentFees] = useState([]);
  const [loadingPaymentFees, setLoadingPaymentFees] = useState(false);
  const [showCreatePaymentFeeModal, setShowCreatePaymentFeeModal] = useState(false);
  const [showEditPaymentFeeModal, setShowEditPaymentFeeModal] = useState(false);
  const [selectedPaymentFee, setSelectedPaymentFee] = useState(null);
  const [newPaymentFeeData, setNewPaymentFeeData] = useState({
    paymentMethod: '',
    percentageFee: 0,
    fixedFeeUsd: 0,
    fixedFeeRub: 0,
    isActive: true
  });
  const [editPaymentFeeData, setEditPaymentFeeData] = useState({
    paymentMethod: '',
    percentageFee: 0,
    fixedFeeUsd: 0,
    fixedFeeRub: 0,
    isActive: true
  });

  // Admins state
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [selected2FAAdmin, setSelected2FAAdmin] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [availableTabs, setAvailableTabs] = useState([]);
  const [newAdminData, setNewAdminData] = useState({
    login: '',
    password: '',
    allowedTabs: []
  });
  const [editAdminData, setEditAdminData] = useState({
    login: '',
    allowedTabs: [],
    frozen: false
  });

  // Games, Categories, Products states
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.translations?.[0]?.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.slug?.toLowerCase().includes(productSearchQuery.toLowerCase())
  );
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    users: 0,
    admins: 0,
    games: 0,
    revenue: 0.00,
    revenueRub: 0.00,
    completedOrders: 0,
    paymentMethods: [],
  });
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [revenueCurrency, setRevenueCurrency] = useState('usd'); // 'usd' or 'rub'

  // Modals states
  const [showCreateGameModal, setShowCreateGameModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  
  // Edit modals states
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form data
  const [newGameData, setNewGameData] = useState({
    name: '',
    description: '',
    image: '',
    icon: '',
    background: '',
    isActive: true,
    isNew: false
  });
  const [gameImageFile, setGameImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    background: '',
    image: '',
    imageFile: null,
    isActive: true,
    sortOrder: 0,
    isNew: false,
    gameId: '',
    translations: {
      ru: { name: '' },
      en: { name: '' }
    }
  });

  // Edit form data
  const [editGameData, setEditGameData] = useState({});
  const [editCategoryData, setEditCategoryData] = useState({
    translations: {
      ru: { name: '' },
      en: { name: '' }
    }
  });
  const [editCategoryImageFile, setEditCategoryImageFile] = useState(null);
  const [isEditingCategoryUploading, setIsEditingCategoryUploading] = useState(false);
  const [editGameImageFile, setEditGameImageFile] = useState(null);
  const [isEditingGameUploading, setIsEditingGameUploading] = useState(false);

  // UI states
  const [expandedSections, setExpandedSections] = useState({
    games: true,
    categories: true,
    products: true
  });

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsGlobal, setSearchResultsGlobal] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Filter states for games and categories
  const [gameFilter, setGameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Activity log states
  const [activityLog, setActivityLog] = useState([]);
  const [searchField, setSearchField] = useState('all');
  const [logSearchResults, setLogSearchResults] = useState([]);
  const [logRefs, setLogRefs] = useState({});

  // Load activity log from API
  const loadActivityLog = async () => {
    try {
      const response = await fetch('/api/admin/logs', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Преобразуем данные логов в формат, совместимый с текущим интерфейсом
        const formattedLogs = data.logs.map(log => {
          // Парсим описание для извлечения типа действия
          let type = 'system';
          let message = log.description;
          
          if (log.description.includes('Создание игры')) {
            type = 'game_created';
          } else if (log.description.includes('Создание категории')) {
            type = 'category_updated';
          } else if (log.description.includes('Создание аккаунта администратора')) {
            type = 'admin_created';
          } else if (log.description.includes('Создание аккаунта пользователя')) {
            type = 'user_registered';
          } else if (log.description.includes('Создание заказа')) {
            type = 'order_created';
          }
          
          // Конвертируем timestamp в читаемый формат
          const timestamp = new Date(Number(log.timestamp)).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          
          return {
            id: log.id,
            type: type,
            message: message,
            admin: log.user,
            timestamp: timestamp
          };
        });
        
        setActivityLog(formattedLogs);
      } else {
        addNotification('Ошибка при загрузке лога действий', 'error');
      }
    } catch (error) {
      console.error('Load activity log error:', error);
      addNotification('Ошибка при загрузке лога действий', 'error');
    }
  };

  // Load users from API
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        addNotification(data.error || 'Ошибка при загрузке пользователей', 'error');
      }
    } catch (error) {
      console.error('Load users error:', error);
      addNotification('Ошибка при загрузке пользователей', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load coupons from API
  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCoupons(data.coupons || []);
      } else {
        addNotification(data.error || 'Ошибка при загрузке купонов', 'error');
      }
    } catch (error) {
      console.error('Load coupons error:', error);
      addNotification('Ошибка при загрузке купонов', 'error');
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Handle create coupon
  const handleCreateCoupon = async () => {
    if (!newCouponData.code.trim()) {
      addNotification('Введите код купона', 'error');
      return;
    }

    if (newCouponData.discountPercent <= 0 || newCouponData.discountPercent > 100) {
      addNotification('Процент скидки должен быть от 1 до 100', 'error');
      return;
    }

    if (!newCouponData.expiresAt) {
      addNotification('Выберите дату истечения', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCouponData,
          discount: newCouponData.discountPercent
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateCouponModal(false);
        setNewCouponData({
          code: '',
          discountPercent: 0,
          expiresAt: '',
          productIds: [],
          isActive: true,
          maxUses: null
        });
        loadCoupons();
        addNotification('Купон успешно создан', 'success');
      } else {
        addNotification(data.error || 'Ошибка при создании купона', 'error');
      }
    } catch (error) {
      console.error('Create coupon error:', error);
      addNotification('Ошибка при создании купона', 'error');
    }
  };

  // Handle edit coupon
  const handleEditCoupon = async (coupon) => {
    // Only load data if not already loaded
    if (products.length === 0 && !loadingData) {
      await loadAllData();
    }
    setSelectedCoupon(coupon);
    setEditCouponData({
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discount,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().substring(0, 16) : '',
      productIds: coupon.games ? JSON.parse(coupon.games) : [],
      isActive: coupon.isActive,
      maxUses: coupon.maxUses
    });
    setShowEditCouponModal(true);
  };

  // Handle update coupon
  const handleUpdateCoupon = async () => {
    if (!editCouponData.code.trim()) {
      addNotification('Введите код купона', 'error');
      return;
    }

    if (editCouponData.discountPercent <= 0 || editCouponData.discountPercent > 100) {
      addNotification('Процент скидки должен быть от 1 до 100', 'error');
      return;
    }

    if (!editCouponData.expiresAt) {
      addNotification('Выберите дату истечения', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editCouponData,
          discount: editCouponData.discountPercent
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditCouponModal(false);
        setSelectedCoupon(null);
        loadCoupons();
        addNotification('Купон успешно обновлен', 'success');
      } else {
        addNotification(data.error || 'Ошибка при обновлении купона', 'error');
      }
    } catch (error) {
      console.error('Update coupon error:', error);
      addNotification('Ошибка при обновлении купона', 'error');
    }
  };

  // Handle delete coupon
  const handleDeleteCoupon = async (coupon) => {
    if (!confirm(`Вы уверены, что хотите удалить купон "${coupon.code}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadCoupons();
        addNotification('Купон успешно удален', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении купона', 'error');
      }
    } catch (error) {
      console.error('Delete coupon error:', error);
      addNotification('Ошибка при удалении купона', 'error');
    }
  };

  // Payment Fees functions
  // Load payment fees from API
  const loadPaymentFees = async () => {
    setLoadingPaymentFees(true);
    try {
      const response = await fetch('/api/admin/payment-fees', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentFees(data.paymentFees || []);
      } else {
        addNotification(data.error || 'Ошибка при загрузке комиссий', 'error');
      }
    } catch (error) {
      console.error('Load payment fees error:', error);
      addNotification('Ошибка при загрузке комиссий', 'error');
    } finally {
      setLoadingPaymentFees(false);
    }
  };

  // Handle create payment fee
  const handleCreatePaymentFee = async () => {
    if (!newPaymentFeeData.paymentMethod.trim()) {
      addNotification('Введите название платежного метода', 'error');
      return;
    }

    if (newPaymentFeeData.percentageFee < 0 || newPaymentFeeData.percentageFee > 100) {
      addNotification('Процентная комиссия должна быть от 0 до 100', 'error');
      return;
    }

    if (newPaymentFeeData.fixedFeeUsd < 0 || newPaymentFeeData.fixedFeeRub < 0) {
      addNotification('Фиксированная комиссия не может быть отрицательной', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/payment-fees', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPaymentFeeData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreatePaymentFeeModal(false);
        setNewPaymentFeeData({
          paymentMethod: '',
          percentageFee: 0,
          fixedFeeUsd: 0,
          fixedFeeRub: 0,
          isActive: true
        });
        loadPaymentFees();
        addNotification('Комиссия успешно создана', 'success');
      } else {
        addNotification(data.error || 'Ошибка при создании комиссии', 'error');
      }
    } catch (error) {
      console.error('Create payment fee error:', error);
      addNotification('Ошибка при создании комиссии', 'error');
    }
  };

  // Handle edit payment fee
  const handleEditPaymentFee = (paymentFee) => {
    setSelectedPaymentFee(paymentFee);
    setEditPaymentFeeData({
      id: paymentFee.id,
      paymentMethod: paymentFee.paymentMethod,
      percentageFee: parseFloat(paymentFee.percentageFee),
      fixedFeeUsd: parseFloat(paymentFee.fixedFeeUsd),
      fixedFeeRub: parseFloat(paymentFee.fixedFeeRub),
      isActive: paymentFee.isActive
    });
    setShowEditPaymentFeeModal(true);
  };

  // Handle update payment fee
  const handleUpdatePaymentFee = async () => {
    if (!editPaymentFeeData.paymentMethod.trim()) {
      addNotification('Введите название платежного метода', 'error');
      return;
    }

    if (editPaymentFeeData.percentageFee < 0 || editPaymentFeeData.percentageFee > 100) {
      addNotification('Процентная комиссия должна быть от 0 до 100', 'error');
      return;
    }

    if (editPaymentFeeData.fixedFeeUsd < 0 || editPaymentFeeData.fixedFeeRub < 0) {
      addNotification('Фиксированная комиссия не может быть отрицательной', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/payment-fees', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPaymentFeeData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditPaymentFeeModal(false);
        setSelectedPaymentFee(null);
        loadPaymentFees();
        addNotification('Комиссия успешно обновлена', 'success');
      } else {
        addNotification(data.error || 'Ошибка при обновлении комиссии', 'error');
      }
    } catch (error) {
      console.error('Update payment fee error:', error);
      addNotification('Ошибка при обновлении комиссии', 'error');
    }
  };

  // Handle delete payment fee
  const handleDeletePaymentFee = async (paymentFee) => {
    if (!confirm(`Вы уверены, что хотите удалить комиссию для "${paymentFee.paymentMethod}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/payment-fees?id=${paymentFee.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadPaymentFees();
        addNotification('Комиссия успешно удалена', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении комиссии', 'error');
      }
    } catch (error) {
      console.error('Delete payment fee error:', error);
      addNotification('Ошибка при удалении комиссии', 'error');
    }
  };

  // Load admins from API
  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdmins(data.admins || []);
        setAvailableTabs(data.availableTabs || []);
      } else {
        addNotification(data.error || 'Ошибка при загрузке администраторов', 'error');
      }
    } catch (error) {
      console.error('Load admins error:', error);
      addNotification('Ошибка при загрузке администраторов', 'error');
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Handle create admin
  const handleCreateAdmin = async () => {
    if (!newAdminData.login.trim()) {
      addNotification('Введите логин администратора', 'error');
      return;
    }

    if (!newAdminData.password.trim()) {
      addNotification('Введите пароль администратора', 'error');
      return;
    }

    if (newAdminData.password.length < 8) {
      addNotification('Пароль должен содержать минимум 8 символов', 'error');
      return;
    }

    if (newAdminData.allowedTabs.length === 0) {
      addNotification('Выберите хотя бы одну вкладку', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAdminData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateAdminModal(false);
        setNewAdminData({
          login: '',
          password: '',
          allowedTabs: []
        });
        loadAdmins();
        
        // Show 2FA QR code for new admin
        if (data.twoFaSecret) {
          const newAdmin = { 
            ...data.admin, 
            twoFaSecret: data.twoFaSecret,
            twoFaEnabled: true 
          };
          setSelected2FAAdmin(newAdmin);
          setShow2FAModal(true);
        }
        
        addNotification('Администратор успешно создан с включенным 2FA', 'success');
      } else {
        addNotification(data.error || 'Ошибка при создании администратора', 'error');
      }
    } catch (error) {
      console.error('Create admin error:', error);
      addNotification('Ошибка при создании администратора', 'error');
    }
  };

  // Handle edit admin
  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditAdminData({
      login: admin.login,
      allowedTabs: admin.allowedTabs || [],
      frozen: admin.frozen
    });
    setShowEditAdminModal(true);
  };

  // Handle update admin
  const handleUpdateAdmin = async () => {
    if (!editAdminData.login.trim()) {
      addNotification('Введите логин администратора', 'error');
      return;
    }

    if (editAdminData.allowedTabs.length === 0) {
      addNotification('Выберите хотя бы одну вкладку', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editAdminData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditAdminModal(false);
        setSelectedAdmin(null);
        loadAdmins();
        addNotification('Администратор успешно обновлен', 'success');
      } else {
        addNotification(data.error || 'Ошибка при обновлении администратора', 'error');
      }
    } catch (error) {
      console.error('Update admin error:', error);
      addNotification('Ошибка при обновлении администратора', 'error');
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async (admin) => {
    if (admin.owner) {
      addNotification('Нельзя удалить владельца системы', 'error');
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить администратора "${admin.login}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadAdmins();
        addNotification('Администратор успешно удален', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении администратора', 'error');
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      addNotification('Ошибка при удалении администратора', 'error');
    }
  };

  // Load settings from database
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setOriginalSettings(data.settings);
      } else {
        addNotification(data.error || 'Ошибка при загрузке настроек', 'error');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      addNotification('Ошибка при загрузке настроек', 'error');
    }
  };

  // Save settings to database
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveStatus(null);
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOriginalSettings(settings);
        setIsSaving(false);
        setSaveStatus({ success: true, message: 'Настройки успешно сохранены!' });
        addNotification('Настройки успешно сохранены!', 'success');
        
        // Clear status after 5 seconds
        setTimeout(() => {
          setSaveStatus(null);
        }, 5000);
      } else {
        setIsSaving(false);
        setSaveStatus({ success: false, message: data.error || 'Ошибка при сохранении настроек' });
        addNotification(data.error || 'Ошибка при сохранении настроек', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSaving(false);
      setSaveStatus({ success: false, message: 'Ошибка при сохранении настроек' });
      addNotification('Ошибка при сохранении настроек', 'error');
    }
  };

  // Handle test email
  const handleTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      addNotification('Введите email адрес для тестирования', 'error');
      return;
    }

    setIsTestingEmail(true);
    
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: testEmailAddress.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addNotification(`Тестовое письмо успешно отправлено на ${testEmailAddress}`, 'success');
        setTestEmailAddress(''); // Clear the input after successful send
      } else {
        addNotification(data.error || 'Ошибка при отправке тестового письма', 'error');
      }
    } catch (error) {
      console.error('Test email error:', error);
      addNotification('Ошибка при отправке тестового письма', 'error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Handle manual order email
  const handleSendOrderEmail = async () => {
    if (!manualOrderId.trim()) {
      addNotification('Введите ID заказа', 'error');
      return;
    }

    setIsSendingOrderEmail(true);
    
    try {
      const response = await fetch('/api/admin/send-order-email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: manualOrderId.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addNotification(`Письмо успешно отправлено на ${data.orderDetails.email}`, 'success');
        setManualOrderId(''); // Clear the input after successful send
      } else {
        addNotification(data.error || 'Ошибка при отправке письма', 'error');
      }
    } catch (error) {
      console.error('Send order email error:', error);
      addNotification('Ошибка при отправке письма', 'error');
    } finally {
      setIsSendingOrderEmail(false);
    }
  };

  // Load order logs from API
  const loadOrderLogs = async (page = 1, perPage = 20) => {
    try {
      // Получаем список всех заказов из базы данных
      const ordersResponse = await fetch('/api/orders', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
         
      const ordersData = await ordersResponse.json();
         
      if (ordersData.success && ordersData.orders) {
        // Преобразуем данные заказов
        const formattedOrderLogs = ordersData.orders.map(order => {
          // Конвертируем timestamp в читаемый формат
          const timestamp = new Date(order.createdAt).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
             
          // Форматируем дату отдельно для отображения
          const date = new Date(order.createdAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
             
          // Форматируем время отдельно для отображения
          const time = new Date(order.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
             
          return {
            id: order.id,
            orderId: order.id,
            product: order.productName || 'Unknown Product',
            variant: order.variantName || 'Unknown Variant',
            priceUsd: order.totalUsd?.toString() || '0',
            priceRub: order.totalRub?.toString() || '0',
            ip: order.ipAddress || 'Unknown',
            user: order.email || 'Unknown',
            timestamp: timestamp,
            date: date,
            time: time,
            status: order.status
          };
        });
           
        // Реализуем пагинацию
        const startIndex = (page - 1) * perPage;
        const paginatedLogs = formattedOrderLogs.slice(startIndex, startIndex + perPage);
        const totalPagesCount = Math.ceil(formattedOrderLogs.length / perPage);
          
        setOrderLogs(paginatedLogs);
        setCurrentPage(page);
        setItemsPerPage(perPage);
        setTotalPages(totalPagesCount);
        setSelectedOrders(new Set());
        setSelectAll(false);
      } else {
        addNotification('Ошибка при загрузке заказов', 'error');
      }
    } catch (error) {
      console.error('Load order logs error:', error);
      addNotification('Ошибка при загрузке заказов', 'error');
    }
  };

  // Auto-refresh order logs every 3 seconds when on order-logs tab
  useEffect(() => {
    let refreshInterval;
    
    if (activeTab === 'order-logs') {
      // Initial load
      loadOrderLogs(currentPage, itemsPerPage);
      
      // Set up auto-refresh every 3 seconds
      refreshInterval = setInterval(() => {
        loadOrderLogs(currentPage, itemsPerPage);
      }, 3000); // 3 seconds
    }
    
    return () => {
      // Clean up interval on component unmount or tab change
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [activeTab, currentPage, itemsPerPage]);
 
  // Handle complete order
  const handleCompleteOrder = async (orderLog) => {
    try {
      const response = await fetch(`/api/orders/${orderLog.orderId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Обновляем статус заказа в локальном состоянии
        setOrderLogs(prevLogs =>
          prevLogs.map(log =>
            log.id === orderLog.id
              ? { ...log, status: 'completed' }
              : log
          )
        );
        // Сбрасываем выбор после обновления
        setSelectedOrders(new Set());
        setSelectAll(false);
        addNotification('Заказ успешно завершен', 'success');
      } else {
        addNotification(data.error || 'Ошибка при завершении заказа', 'error');
      }
    } catch (error) {
      console.error('Complete order error:', error);
      addNotification('Ошибка при завершении заказа', 'error');
    }
  };

  // Handle order selection
  const handleOrderSelect = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders(new Set());
    } else {
      const allOrderIds = new Set(orderLogs.map(log => log.orderId));
      setSelectedOrders(allOrderIds);
    }
    setSelectAll(!selectAll);
  };

  // Handle delete order
  const handleDeleteOrder = async (orderLog) => {
    if (!confirm(`Вы уверены, что хотите удалить заказ #${orderLog.orderId}?`)) {
      return;
    }
  
    try {
      const response = await fetch(`/api/orders/${orderLog.orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const data = await response.json();
      if (data.success) {
        // Обновляем список заказов после удаления
        loadOrderLogs(currentPage, itemsPerPage);
        // Сбрасываем выбор после удаления
        setSelectedOrders(new Set());
        setSelectAll(false);
        addNotification('Заказ успешно удален', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении заказа', 'error');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      addNotification('Ошибка при удалении заказа', 'error');
    }
  };

  // Handle bulk delete orders
  const handleBulkDeleteOrders = async () => {
    if (selectedOrders.size === 0) {
      addNotification('Выберите хотя бы один заказ для удаления', 'info');
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить ${selectedOrders.size} выбранных заказов?`)) {
      return;
    }

    try {
      // Удаляем каждый выбранный заказ
      const deletePromises = Array.from(selectedOrders).map(orderId =>
        fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(res => res.json()));

      // Проверяем результаты
      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        // Обновляем список заказов после удаления
        loadOrderLogs(currentPage, itemsPerPage);
        setSelectedOrders(new Set());
        setSelectAll(false);
        addNotification(`${selectedOrders.size} заказов успешно удалено`, 'success');
      } else {
        const errorCount = results.filter(result => !result.success).length;
        addNotification(`${errorCount} заказов не удалось удалить`, 'error');
      }
    } catch (error) {
      console.error('Bulk delete orders error:', error);
      addNotification('Ошибка при массовом удалении заказов', 'error');
    }
  };
 
  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      username: user.username,
      balanceUsd: user.balanceUsd,
      balanceRub: user.balanceRub
    });
    setShowEditUserModal(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editUserData.username.trim()) {
      addNotification('Введите имя пользователя', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUserData),
      });

      const data = await response.json();
      if (data.success) {
        setShowEditUserModal(false);
        setSelectedUser(null);
        loadUsers();
        addNotification('Пользователь успешно обновлен', 'success');
      } else {
        addNotification(data.error || 'Ошибка при обновлении пользователя', 'error');
      }
    } catch (error) {
      console.error('Update user error:', error);
      addNotification('Ошибка при обновлении пользователя', 'error');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        loadUsers();
        addNotification('Пользователь успешно удален', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении пользователя', 'error');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      addNotification('Ошибка при удалении пользователя', 'error');
    }
  };

  // Advanced search function
  const handleAdvancedSearch = async () => {
    if (!searchQuery.trim()) {
      setLogSearchResults([]);
      addNotification('Введите поисковый запрос', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/logs/search', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          field: searchField
        })
      });

      const data = await response.json();

      if (data.success) {
        // Преобразуем данные логов в формат, совместимый с текущим интерфейсом
        const formattedResults = data.logs.map(log => {
          // Парсим описание для извлечения типа действия
          let type = 'system';
          let message = log.description;

          if (log.description.includes('Создание игры')) {
            type = 'game_created';
          } else if (log.description.includes('Создание категории')) {
            type = 'category_updated';
          } else if (log.description.includes('Создание аккаунта администратора')) {
            type = 'admin_created';
          } else if (log.description.includes('Создание аккаунта пользователя')) {
            type = 'user_registered';
          } else if (log.description.includes('Создание заказа')) {
            type = 'order_created';
          }

          // Конвертируем timestamp в читаемый формат
          const timestamp = new Date(Number(log.timestamp)).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return {
            id: log.id,
            type: type,
            message: message,
            admin: log.user,
            timestamp: timestamp
          };
        });

        setLogSearchResults(formattedResults);
        addNotification(`Найдено ${formattedResults.length} записей`, 'success');
      } else {
        addNotification(data.error || 'Ошибка при поиске', 'error');
      }
    } catch (error) {
      console.error('Advanced search error:', error);
      addNotification('Ошибка при поиске по логам', 'error');
    }
  };

  // Scroll to specific log function
  const scrollToLog = (logId) => {
    if (logRefs[logId]) {
      logRefs[logId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      logRefs[logId].classList.add('bg-[#262626]');
      setTimeout(() => {
        logRefs[logId].classList.remove('bg-[#262626]');
      }, 3000);
    }
  };

  // Mock search function
  const handleGlobalSearch = (query) => {
    if (!query.trim()) {
      setSearchResultsGlobal([]);
      setShowSearchResults(false);
      return;
    }

    // Mock search results
    const results = [
      { id: 1, type: 'game', title: 'CS2', description: 'Игра Counter-Strike 2', url: '/admin/dashboard?tab=games-products', section: 'games' },
      { id: 2, type: 'category', title: 'Читы', description: 'Категория читов для CS2', url: '/admin/dashboard?tab=games-products', section: 'categories' },
      { id: 3, type: 'page', title: 'Панель управления', description: 'Главная страница админ-панели', url: '/admin/dashboard?tab=dashboard', section: 'dashboard' },
      { id: 4, type: 'page', title: 'Лог действий', description: 'История действий в системе', url: '/admin/dashboard?tab=activity-log', section: 'activity-log' },
      { id: 5, type: 'game', title: 'Dota 2', description: 'Игра Dota 2', url: '/admin/dashboard?tab=games-products', section: 'games' },
    ].filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResultsGlobal(results);
    setShowSearchResults(results.length > 0);
  };

  // Filter games and categories
  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(gameFilter.toLowerCase()) ||
    game.slug.toLowerCase().includes(gameFilter.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    (category.translations?.find(t => t.language === 'ru')?.name || category.name).toLowerCase().includes(categoryFilter.toLowerCase()) ||
    (category.translations?.find(t => t.language === 'en')?.name || category.name).toLowerCase().includes(categoryFilter.toLowerCase()) ||
    category.slug.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  // Auth check function
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setAdminInfo(data.admin);
        setIsLoading(false);
      } else {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin');
    }
  }, [router]);

  // Load all data with caching and optimization
  const loadAllData = async () => {
    // Check if data is already loaded
    if (games.length > 0 && categories.length > 0 && products.length > 0) {
      return;
    }

    setLoadingData(true);
    
    // Set timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Превышено время ожидания загрузки данных'));
      }, 30000); // 30 seconds timeout
    });

    try {
      // Load games with timeout
      const gamesPromise = fetch('/api/admin/games', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const gamesResponse = await Promise.race([gamesPromise, timeoutPromise]);
      const gamesData = await gamesResponse.json();
      if (gamesData.success) {
        setGames(gamesData.games || []);
      } else {
        addNotification('Ошибка при загрузке игр', 'error');
      }

      // Load categories with timeout
      const categoriesPromise = fetch('/api/admin/categories', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const categoriesResponse = await Promise.race([categoriesPromise, timeoutPromise]);
      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success) {
        setCategories(categoriesData.categories || []);
      } else {
        addNotification('Ошибка при загрузке категорий', 'error');
      }

      // Load products with pagination and only necessary fields
      const productsPromise = fetch('/api/admin/products?limit=1000&fields=id,slug,translations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const productsResponse = await Promise.race([productsPromise, timeoutPromise]);
      const productsData = await productsResponse.json();
      console.log('Products API response:', productsData);
      if (productsData.success) {
        setProducts(productsData.products || []);
      } else {
        console.error('Products API error:', productsData);
        addNotification(`Ошибка при загрузке товаров: ${JSON.stringify(productsData)}`, 'error');
      }

    } catch (error) {
      console.error('Load data error:', error);
      addNotification(error.message.includes('Превышено время ожидания')
        ? 'Превышено время ожидания загрузки данных'
        : 'Ошибка при загрузке данных', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    setLoadingStatistics(true);
    try {
      const response = await fetch('/api/admin/statistics', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      } else {
        addNotification('Ошибка при загрузке статистики', 'error');
      }
    } catch (error) {
      console.error('Load statistics error:', error);
      addNotification('Ошибка при загрузке статистики', 'error');
    } finally {
      setLoadingStatistics(false);
    }
  };

  // Generate slug from name with transliteration
  const generateSlug = (name) => {
    // Transliteration map for Russian characters
    const translitMap = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
      'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
      'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
      'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
      'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
      'Я': 'Ya'
    };

    return name
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Game functions
  const handleCreateGame = async () => {
    if (!newGameData.name.trim()) {
      addNotification('Введите название игры', 'error');
      return;
    }

    try {
      let imageUrl = newGameData.image;
      
      // Если выбран файл для загрузки
      if (gameImageFile) {
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('file', gameImageFile);
        formData.append('type', 'game');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        
        if (!uploadData.success) {
          addNotification(uploadData.error || 'Ошибка при загрузке изображения', 'error');
          setIsUploading(false);
          return;
        }
        
        imageUrl = uploadData.url;
        setIsUploading(false);
      }

      const gameData = {
        ...newGameData,
        image: imageUrl,
        icon: newGameData.icon,
        background: newGameData.background
      };

      const response = await fetch('/api/admin/games', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateGameModal(false);
        setNewGameData({
          name: '',
          description: '',
          image: '',
          isActive: true,
          isNew: false
        });
        setGameImageFile(null);
        loadAllData();
        addNotification('Игра успешно создана', 'success');
      } else {
        addNotification(data.error || 'Ошибка при создании игры', 'error');
      }
    } catch (error) {
      console.error('Create game error:', error);
      addNotification('Ошибка при создании игры', 'error');
    }
  };

  // Function to upload game image during editing
  const uploadGameImage = async () => {
    if (!editGameImageFile) {
      return editGameData.image; // Return existing image URL if no new file
    }

    try {
      setIsEditingGameUploading(true);
      
      const formData = new FormData();
      formData.append('file', editGameImageFile);
      formData.append('type', 'game');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        addNotification(uploadData.error || 'Ошибка при загрузке изображения', 'error');
        setIsEditingGameUploading(false);
        return null;
      }
      
      setIsEditingGameUploading(false);
      return uploadData.url;
    } catch (error) {
      console.error('Upload game image error:', error);
      addNotification('Ошибка при загрузке изображения', 'error');
      setIsEditingGameUploading(false);
      return null;
    }
  };

  const handleEditGame = (game) => {
    setSelectedGame(game);
    setEditGameData({
      id: game.id,
      name: game.name,
      description: game.description || '',
      image: game.image || '',
      icon: game.icon || '',
      background: game.background || '',
      isActive: game.isActive,
      isNew: game.isNew
    });
    setShowEditGameModal(true);
  };

  const handleUpdateGame = async () => {
    if (!editGameData.name.trim()) {
      addNotification('Введите название игры', 'error');
      return;
    }

    try {
      // Upload image if a new file is selected
      let imageUrl = editGameData.image;
      if (editGameImageFile) {
        imageUrl = await uploadGameImage();
        if (imageUrl === null) {
          return; // Upload failed, don't proceed
        }
      }

      const response = await fetch('/api/admin/games', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editGameData,
          image: imageUrl
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowEditGameModal(false);
        setSelectedGame(null);
        setEditGameData({});
        setEditGameImageFile(null); // Clear the file state
        loadAllData();
        // Force refresh the page to update the image
        window.location.reload();
        addNotification('Игра успешно обновлена', 'success');
      } else {
        addNotification(data.error || 'Ошибка при обновлении игры', 'error');
      }
    } catch (error) {
      console.error('Update game error:', error);
      addNotification('Ошибка при обновлении игры', 'error');
    }
  };

  const handleDeleteGame = async (game) => {
    if (!confirm(`Вы уверены, что хотите удалить игру "${game.name}"? Все связанные категории и товары также будут удалены.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/games?id=${game.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        loadAllData();
        addNotification('Игра успешно удалена', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении игры', 'error');
      }
    } catch (error) {
      console.error('Delete game error:', error);
      addNotification('Ошибка при удалении игры', 'error');
    }
  };

  // Category functions
  // Category functions
  const handleCreateCategory = async () => {
    // Проверяем, что заполнены переводы
    if (!newCategoryData.translations.ru.name.trim() && !newCategoryData.translations.en.name.trim()) {
      addNotification('Введите название категории хотя бы на одном языке', 'error');
      return;
    }

    if (!newCategoryData.gameId) {
      addNotification('Выберите игру', 'error');
      return;
    }

    // Генерируем slug из русского названия, если есть, иначе из английского
    const nameForSlug = newCategoryData.translations.ru.name.trim() || newCategoryData.translations.en.name.trim();
    const slug = generateSlug(nameForSlug);

    try {
      let imageUrl = newCategoryData.image;
      
      // Если выбран файл для загрузки
      if (newCategoryData.imageFile) {
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('file', newCategoryData.imageFile);
        formData.append('type', 'category');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        
        if (!uploadData.success) {
          addNotification(uploadData.error || 'Ошибка при загрузке изображения', 'error');
          setIsUploading(false);
          return;
        }
        
        imageUrl = uploadData.url;
        setIsUploading(false);
      }

      // Подготавливаем переводы для отправки
      const translations = [];
      if (newCategoryData.translations.ru.name.trim()) {
        translations.push({
          language: 'ru',
          name: newCategoryData.translations.ru.name.trim()
        });
      }
      if (newCategoryData.translations.en.name.trim()) {
        translations.push({
          language: 'en',
          name: newCategoryData.translations.en.name.trim()
        });
      }

      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameForSlug, // Используем для обратной совместимости
          slug,
          description: newCategoryData.description,
          image: imageUrl,
          isActive: newCategoryData.isActive,
          sortOrder: newCategoryData.sortOrder,
          isNew: newCategoryData.isNew,
          gameId: parseInt(newCategoryData.gameId),
          translations: translations
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateCategoryModal(false);
        setNewCategoryData({
          name: '',
          slug: '',
          description: '',
          icon: '',
          background: '',
          image: '',
          imageFile: null,
          isActive: true,
          sortOrder: 0,
          isNew: false,
          gameId: '',
          translations: {
            ru: { name: '' },
            en: { name: '' }
          }
        });
        await loadAllData();
        addNotification('Категория успешно создана', 'success');
      } else {
        addNotification(data.error || 'Ошибка при создании категории', 'error');
      }
    } catch (error) {
      console.error('Create category error:', error);
      addNotification('Ошибка при создании категории', 'error');
    }
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setEditCategoryData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      background: category.background || '',
      image: category.image || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      isNew: category.isNew,
      gameId: category.gameId,
      translations: {
        ru: {
          name: category.translations?.find(t => t.language === 'ru')?.name || category.name
        },
        en: {
          name: category.translations?.find(t => t.language === 'en')?.name || category.name
        }
      }
    });
    setShowEditCategoryModal(true);
  };

  // Function to upload category image during editing
  const uploadCategoryImage = async () => {
    if (!editCategoryImageFile) {
      return editCategoryData.image; // Return existing image URL if no new file
    }

    try {
      setIsEditingCategoryUploading(true);
      
      const formData = new FormData();
      formData.append('file', editCategoryImageFile);
      formData.append('type', 'category');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        addNotification(uploadData.error || 'Ошибка при загрузке изображения', 'error');
        setIsEditingCategoryUploading(false);
        return null;
      }
      
      setIsEditingCategoryUploading(false);
      return uploadData.url;
    } catch (error) {
      console.error('Upload category image error:', error);
      addNotification('Ошибка при загрузке изображения', 'error');
      setIsEditingCategoryUploading(false);
      return null;
    }
  };

  const handleUpdateCategory = async () => {
    // Проверяем, что заполнены переводы
    if (!editCategoryData.translations.ru.name.trim() && !editCategoryData.translations.en.name.trim()) {
      addNotification('Введите название категории хотя бы на одном языке', 'error');
      return;
    }

    try {
      // Upload image if a new file is selected
      let imageUrl = editCategoryData.image;
      if (editCategoryImageFile) {
        imageUrl = await uploadCategoryImage();
        if (imageUrl === null) {
          return; // Upload failed, don't proceed
        }
      }

      // Генерируем slug из русского названия, если есть, иначе из английского
      const nameForSlug = editCategoryData.translations.ru.name.trim() || editCategoryData.translations.en.name.trim();
      const slug = generateSlug(nameForSlug);

      // Подготавливаем переводы для отправки
      const translations = [];
      if (editCategoryData.translations.ru.name.trim()) {
        translations.push({
          language: 'ru',
          name: editCategoryData.translations.ru.name.trim()
        });
      }
      if (editCategoryData.translations.en.name.trim()) {
        translations.push({
          language: 'en',
          name: editCategoryData.translations.en.name.trim()
        });
      }

      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editCategoryData.id,
          name: nameForSlug, // Используем для обратной совместимости
          slug: slug,
          description: editCategoryData.description,
          icon: editCategoryData.icon,
          background: editCategoryData.background,
          image: imageUrl,
          isActive: editCategoryData.isActive,
          sortOrder: editCategoryData.sortOrder,
          isNew: editCategoryData.isNew,
          translations: translations
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowEditCategoryModal(false);
        setSelectedCategory(null);
        setEditCategoryData({
          translations: {
            ru: { name: '' },
            en: { name: '' }
          }
        });
        setEditCategoryImageFile(null); // Clear the file state
        loadAllData();
        addNotification('Категория успешно обновлена', 'success');
      } else {
        addNotification(data.error || 'Ошибка при обновлении категории', 'error');
      }
    } catch (error) {
      console.error('Update category error:', error);
      addNotification('Ошибка при обновлении категории', 'error');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        loadAllData();
        addNotification('Категория успешно удалена', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении категории', 'error');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      addNotification('Ошибка при удалении категории', 'error');
    }
  };

  // Reorder functions
  const handleReorderGame = async (gameId, direction) => {
    const gameIndex = games.findIndex(g => g.id === gameId);
    if (gameIndex === -1) return;

    const newGames = [...games];
    if (direction === 'up' && gameIndex > 0) {
      const temp = newGames[gameIndex];
      newGames[gameIndex] = newGames[gameIndex - 1];
      newGames[gameIndex - 1] = temp;
    } else if (direction === 'down' && gameIndex < games.length - 1) {
      const temp = newGames[gameIndex];
      newGames[gameIndex] = newGames[gameIndex + 1];
      newGames[gameIndex + 1] = temp;
    } else {
      return;
    }

    // Update sort orders
    const updates = newGames.map((game, index) => ({
      id: game.id,
      sortOrder: index
    }));

    try {
      const response = await fetch('/api/admin/games/reorder', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();
      if (data.success) {
        setGames(newGames);
        addNotification('Порядок игр обновлен', 'success');
      } else {
        addNotification('Ошибка при обновлении порядка', 'error');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      addNotification('Ошибка при обновлении порядка', 'error');
    }
  };

  // Product functions
  const handleDeleteProduct = async (product) => {
    if (!confirm(`Вы уверены, что хотите удалить товар "${product.translations?.[0]?.name || product.slug}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        loadAllData();
        addNotification('Товар успешно удален', 'success');
      } else {
        addNotification(data.error || 'Ошибка при удалении товара', 'error');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      addNotification('Ошибка при удалении товара', 'error');
    }
  };

  const handleReorderProduct = async (productId, direction) => {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const newProducts = [...products];
    if (direction === 'up' && productIndex > 0) {
      const temp = newProducts[productIndex];
      newProducts[productIndex] = newProducts[productIndex - 1];
      newProducts[productIndex - 1] = temp;
    } else if (direction === 'down' && productIndex < products.length - 1) {
      const temp = newProducts[productIndex];
      newProducts[productIndex] = newProducts[productIndex + 1];
      newProducts[productIndex + 1] = temp;
    } else {
      return;
    }

    // Update sort orders
    const updates = newProducts.map((product, index) => ({
      id: product.id,
      sortOrder: index
    }));

    try {
      const response = await fetch('/api/admin/products/reorder', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();
      if (data.success) {
        setProducts(newProducts);
        addNotification('Порядок товаров обновлен', 'success');
      } else {
        addNotification('Ошибка при обновлении порядка', 'error');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      addNotification('Ошибка при обновлении порядка', 'error');
    }
  };

  const handleReorderCategory = async (categoryId, direction) => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    const newCategories = [...categories];
    if (direction === 'up' && categoryIndex > 0) {
      const temp = newCategories[categoryIndex];
      newCategories[categoryIndex] = newCategories[categoryIndex - 1];
      newCategories[categoryIndex - 1] = temp;
    } else if (direction === 'down' && categoryIndex < categories.length - 1) {
      const temp = newCategories[categoryIndex];
      newCategories[categoryIndex] = newCategories[categoryIndex + 1];
      newCategories[categoryIndex + 1] = temp;
    } else {
      return;
    }

    // Update sort orders
    const updates = newCategories.map((category, index) => ({
      id: category.id,
      sortOrder: index
    }));

    try {
      const response = await fetch('/api/admin/categories/reorder', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories(newCategories);
        addNotification('Порядок категорий обновлен', 'success');
      } else {
        addNotification('Ошибка при обновлении порядка', 'error');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      addNotification('Ошибка при обновлении порядка', 'error');
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setAdminInfo(null);
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    setSearchQuery('');
    setShowSearchResults(false);
    setActiveTab(result.section);
    router.push(result.url);
    
    // Подсветка найденного элемента (упрощенная версия)
    addNotification(`Переход к: ${result.title}`, 'info');
  };

  useEffect(() => {
    checkAuth();
    loadActivityLog();
    loadSettings();
  }, [checkAuth]);


  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'coupons') {
      loadCoupons();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'payment-fees') {
      loadPaymentFees();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdmins();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStatistics();
    }
  }, [activeTab]);

  // Handle URL tab parameter
  useEffect(() => {
    // Only run this effect once when adminInfo is loaded
    if (!adminInfo) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam && ['dashboard', 'games-products', 'activity-log', 'order-logs', 'users', 'coupons', 'admins', 'settings'].includes(tabParam)) {
      // Check if admin has access to this tab
      if (hasTabAccess(tabParam)) {
        setActiveTab(tabParam);
      } else {
        // Redirect to first available tab
        const availableTabs = ['dashboard', 'games-products', 'order-logs', 'users', 'coupons', 'admins', 'activity-log', 'settings', 'payment-fees'];
        const firstAvailableTab = availableTabs.find(tab => hasTabAccess(tab));
        if (firstAvailableTab) {
          setActiveTab(firstAvailableTab);
          router.push(`/admin/dashboard?tab=${firstAvailableTab}`);
        }
      }
    } else {
      // No tab specified, redirect to first available tab
      const availableTabs = ['dashboard', 'games-products', 'order-logs', 'users', 'coupons', 'admins', 'activity-log', 'settings', 'payment-fees'];
      const firstAvailableTab = availableTabs.find(tab => hasTabAccess(tab));
      if (firstAvailableTab) {
        setActiveTab(firstAvailableTab);
        router.push(`/admin/dashboard?tab=${firstAvailableTab}`);
      }
    }
  }, [adminInfo]); // Only depend on adminInfo

  useEffect(() => {
    if (activeTab === 'games-products') {
      loadAllData();
    }
  }, [activeTab]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Render Games & Products tab
  const renderGamesProductsTab = () => (
    <div className="space-y-8">
      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Game Card */}
        <div 
          onClick={() => setShowCreateGameModal(true)}
          className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#262626] rounded-xl">
              <Gamepad2 className="h-6 w-6 text-white" />
            </div>
            <div className="p-1">
              <Plus className="h-4 w-4 text-[#989898] group-hover:text-white transition-colors" />
            </div>
          </div>
          <h4 className="text-white font-regular text-lg mb-2">Создать игру</h4>
          <p className="text-[#989898] text-sm font-light">
            Добавьте новую игру для вашего магазина
          </p>
        </div>

        {/* Create Category Card */}
        <div 
          onClick={() => setShowCreateCategoryModal(true)}
          className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#262626] rounded-xl">
              <Folder className="h-6 w-6 text-white" />
            </div>
            <div className="p-1">
              <Plus className="h-4 w-4 text-[#989898] group-hover:text-white transition-colors" />
            </div>
          </div>
          <h4 className="text-white font-regular text-lg mb-2">Создать категорию</h4>
          <p className="text-[#989898] text-sm font-light">
            Добавьте новую категорию к существующим играм
          </p>
        </div>

       {/* Create Product Card */}
       <div
         onClick={() => router.push('/admin/create-product')}
         className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer group"
       >
         <div className="flex items-center justify-between mb-4">
           <div className="p-3 bg-[#262626] rounded-xl">
             <Package className="h-6 w-6 text-white" />
           </div>
           <div className="p-1">
             <Plus className="h-4 w-4 text-[#989898] group-hover:text-white transition-colors" />
           </div>
         </div>
         <h4 className="text-white font-regular text-lg mb-2">Создать товар</h4>
         <p className="text-[#989898] text-sm font-light">
           Добавьте новый товар в существующие категории
         </p>
       </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Games Filter */}
          <div>
            <label className="block text-sm font-regular text-[#989898] mb-2">
              Поиск по играм
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
              <input
                type="text"
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                placeholder="Название игры..."
              />
              {gameFilter && (
                <button
                  onClick={() => setGameFilter('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3 text-[#A1A1A1]" />
                </button>
              )}
            </div>
            <p className="text-xs text-[#989898] mt-2 font-light">
              Найдено: {filteredGames.length} игр
            </p>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="block text-sm font-regular text-[#989898] mb-2">
              Поиск по категориям
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
              <input
                type="text"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                placeholder="Название категории..."
              />
              {categoryFilter && (
                <button
                  onClick={() => setCategoryFilter('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3 text-[#A1A1A1]" />
                </button>
              )}
            </div>
            <p className="text-xs text-[#989898] mt-2 font-light">
              Найдено: {filteredCategories.length} категорий
            </p>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div 
          className="p-6 border-b border-[#383838] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          onClick={() => toggleSection('games')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {expandedSections.games ? (
                <ChevronDown className="h-5 w-5 text-white" />
              ) : (
                <ChevronRight className="h-5 w-5 text-white" />
              )}
              <Gamepad2 className="h-5 w-5 text-white" />
              <h3 className="text-lg font-regular text-white">Игры</h3>
              {gameFilter && (
                <span className="text-xs bg-[#262626] text-white px-2 py-0.5 rounded font-light">
                  Фильтр: {gameFilter}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#989898] font-light">
                {filteredGames.length} из {games.length} игр
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateGameModal(true);
                }}
                className="p-2 hover:bg-[#262626] rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {expandedSections.games && (
          <div className="overflow-x-auto">
            {filteredGames.length === 0 ? (
              <div className="p-8 text-center">
                <Gamepad2 className="h-12 w-12 text-[#989898] mx-auto mb-4" />
                <p className="text-[#989898] font-regular">
                  {games.length === 0 ? 'Нет игр' : 'Игры не найдены'}
                </p>
                <p className="text-[#989898] text-sm mt-1 font-light">
                  {games.length === 0 ? 'Создайте первую игру' : 'Попробуйте другой запрос'}
                </p>
                {games.length === 0 && (
                  <button
                    onClick={() => setShowCreateGameModal(true)}
                    className="mt-4 px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors hover:bg-gray-200"
                  >
                    Создать игру
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#383838]">
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Порядок</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Название</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">URL Slug</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Категории</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Статус</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game, index) => {
                    const gameCategories = categories.filter(cat => cat.gameId === game.id);
                    return (
                      <tr key={game.id} className="border-b border-[#383838] hover:bg-[#1a1a1a]">
                        <td className="p-4">
                          <div className="flex flex-col items-center space-y-1">
                            <button
                              onClick={() => handleReorderGame(game.id, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#262626] cursor-pointer'}`}
                            >
                              <ChevronUp className="h-4 w-4 text-[#989898]" />
                            </button>
                            <span className="text-sm text-white font-regular">{index + 1}</span>
                            <button
                              onClick={() => handleReorderGame(game.id, 'down')}
                              disabled={index === filteredGames.length - 1}
                              className={`p-1 rounded ${index === filteredGames.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#262626] cursor-pointer'}`}
                            >
                              <ChevronDown className="h-4 w-4 text-[#989898]" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {game.image ? (
                              <div className="h-8 w-8 rounded-lg bg-[#262626] flex items-center justify-center">
                                <img src={getMediaUrl(game.image)} alt={game.name} className="h-8 w-8 object-cover rounded-lg" />
                              </div>
                            ) : game.icon ? (
                              <div className="h-8 w-8 rounded-lg bg-[#262626] flex items-center justify-center">
                                <span className="text-white text-sm">{game.icon}</span>
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-[#262626] rounded-lg flex items-center justify-center">
                                <Gamepad2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="text-white text-sm font-regular">{game.name}</p>
                              {game.isNew && (
                                <span className="text-xs bg-[#262626] text-white px-2 py-0.5 rounded font-light">Новинка</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="text-white text-sm bg-[#262626] px-2 py-1 rounded font-regular">
                            {game.slug}
                          </code>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                            {gameCategories.length} категорий
                          </span>
                        </td>
                        <td className="p-4">
                          {game.isActive ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Активна
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                              <XCircle className="h-3 w-3 mr-1" />
                              Неактивна
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditGame(game)}
                              className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteGame(game)}
                              className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div 
          className="p-6 border-b border-[#383838] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          onClick={() => toggleSection('categories')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {expandedSections.categories ? (
                <ChevronDown className="h-5 w-5 text-white" />
              ) : (
                <ChevronRight className="h-5 w-5 text-white" />
              )}
              <Folder className="h-5 w-5 text-white" />
              <h3 className="text-lg font-regular text-white">Категории</h3>
              {categoryFilter && (
                <span className="text-xs bg-[#262626] text-white px-2 py-0.5 rounded font-light">
                  Фильтр: {categoryFilter}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#989898] font-light">
                {filteredCategories.length} из {categories.length} категорий
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateCategoryModal(true);
                }}
                className="p-2 hover:bg-[#262626] rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {expandedSections.categories && (
          <div className="overflow-x-auto">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center">
                <Folder className="h-12 w-12 text-[#989898] mx-auto mb-4" />
                <p className="text-[#989898] font-regular">
                  {categories.length === 0 ? 'Нет категорий' : 'Категории не найдены'}
                </p>
                <p className="text-[#989898] text-sm mt-1 font-light">
                  {categories.length === 0 ? 'Создайте первую категорию' : 'Попробуйте другой запрос'}
                </p>
                {categories.length === 0 && (
                  <button
                    onClick={() => setShowCreateCategoryModal(true)}
                    className="mt-4 px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors hover:bg-gray-200"
                  >
                    Создать категорию
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#383838]">
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Порядок</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Название</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">URL Slug</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Игра</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Родительская</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Товары</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Статус</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category, index) => {
                    const game = games.find(g => g.id === category.gameId);
                    const parentCategory = category.parentId ? categories.find(c => c.id === category.parentId) : null;
                    const categoryProducts = products.filter(p => p.categoryId === category.id);
                    
                    return (
                      <tr key={category.id} className="border-b border-[#383838] hover:bg-[#1a1a1a]">
                        <td className="p-4">
                          <div className="flex flex-col items-center space-y-1">
                            <button
                              onClick={() => handleReorderCategory(category.id, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#262626] cursor-pointer'}`}
                            >
                              <ChevronUp className="h-4 w-4 text-[#989898]" />
                            </button>
                            <span className="text-sm text-white font-regular">{index + 1}</span>
                            <button
                              onClick={() => handleReorderCategory(category.id, 'down')}
                              disabled={index === filteredCategories.length - 1}
                              className={`p-1 rounded ${index === filteredCategories.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#262626] cursor-pointer'}`}
                            >
                              <ChevronDown className="h-4 w-4 text-[#989898]" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {category.icon ? (
                              <div className="h-8 w-8 rounded-lg bg-[#262626] flex items-center justify-center">
                                <span className="text-white text-sm">{category.icon}</span>
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-[#262626] rounded-lg flex items-center justify-center">
                                <Folder className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="text-white text-sm font-regular">
                                🇷🇺 {category.translations?.find(t => t.language === 'ru')?.name || 'Не указано'}
                              </p>
                              <p className="text-gray-400 text-xs font-light">
                                🇺🇸 {category.translations?.find(t => t.language === 'en')?.name || 'Не указано'}
                              </p>
                              {category.isNew && (
                                <span className="text-xs bg-[#262626] text-white px-2 py-0.5 rounded font-light">Новая</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="text-white text-sm bg-[#262626] px-2 py-1 rounded font-regular">
                            {category.slug}
                          </code>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {game?.icon && (
                              <span className="text-sm text-white">{game.icon}</span>
                            )}
                            <span className="text-white text-sm font-regular">
                              {game?.name || 'Игра не найдена'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white text-sm font-regular">
                            {parentCategory?.name || 'Нет'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                            {categoryProducts.length} товаров
                          </span>
                        </td>
                        <td className="p-4">
                          {category.isActive ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Активна
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                              <XCircle className="h-3 w-3 mr-1" />
                              Неактивна
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div
          className="p-6 border-b border-[#383838] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          onClick={() => toggleSection('products')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {expandedSections.products ? (
                <ChevronDown className="h-5 w-5 text-white" />
              ) : (
                <ChevronRight className="h-5 w-5 text-white" />
              )}
              <Package className="h-5 w-5 text-white" />
              <h3 className="text-lg font-regular text-white">Товары</h3>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#989898] font-light">
                {products.length} товаров
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/admin/create-product');
                }}
                className="p-2 hover:bg-[#262626] rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {expandedSections.products && (
          <div className="overflow-x-auto">
            {products.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 text-[#989898] mx-auto mb-4" />
                <h4 className="text-white font-regular text-lg mb-2">Нет товаров</h4>
                <p className="text-[#989898] mb-6 font-light">Создайте первый товар</p>
                <button
                  onClick={() => router.push('/admin/create-product')}
                  className="mt-4 px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors hover:bg-gray-200"
                >
                  Создать товар
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#383838]">
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Порядок</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Название</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Игра</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Категория</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Цена</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Статус</th>
                    <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const game = games.find(g => g.id === product.gameId);
                    const category = categories.find(c => c.id === product.categoryId);
                    const ruTranslation = product.translations?.find(t => t.language === 'ru');
                    const enTranslation = product.translations?.find(t => t.language === 'en');
                    const translation = ruTranslation || enTranslation || product.translations?.[0];
                    const variant = product.variants?.[0];
                    
                    return (
                      <tr key={product.id} className="border-b border-[#383838] hover:bg-[#1a1a1a]">
                        <td className="p-4">
                          <div className="flex flex-col items-center space-y-1">
                            <button
                              onClick={() => handleReorderProduct(product.id, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#262626] cursor-pointer'}`}
                            >
                              <ChevronUp className="h-4 w-4 text-[#989898]" />
                            </button>
                            <span className="text-sm text-white font-regular">{index + 1}</span>
                            <button
                              onClick={() => handleReorderProduct(product.id, 'down')}
                              disabled={index === products.length - 1}
                              className={`p-1 rounded ${index === products.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#262626] cursor-pointer'}`}
                            >
                              <ChevronDown className="h-4 w-4 text-[#989898]" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {product.media?.filter(m => m.isMainImage)?.length > 0 ? (
                              <div className="h-8 w-8 rounded-lg bg-[#262626] flex items-center justify-center">
                                <img src={getMediaUrl(product.media.filter(m => m.isMainImage)[0].url)} alt={translation?.name} className="h-8 w-8 object-cover rounded-lg" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-[#262626] rounded-lg flex items-center justify-center">
                                <Package className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="text-white text-sm font-regular">{ruTranslation?.name || enTranslation?.name || 'Без названия'}</p>
                              <p className="text-[#989898] text-xs font-light">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white text-sm font-regular">{game?.name || product.category?.game?.name || 'Нет игры'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white text-sm font-regular">{category?.name || product.category?.name || 'Нет категории'}</span>
                        </td>
                        <td className="p-4">
                          {variant ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-white text-sm font-regular">${variant.priceUsd}</span>
                              <span className="text-[#989898] text-sm font-light">{variant.priceRub}₽</span>
                            </div>
                          ) : (
                            <span className="text-[#989898] text-sm font-light">Нет цены</span>
                          )}
                        </td>
                        <td className="p-4">
                          {product.isActive ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Активен
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                              <XCircle className="h-3 w-3 mr-1" />
                              Неактивен
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/admin/create-product?id=${product.id}`)}
                              className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render Activity Log tab
  const renderActivityLogTab = () => (
    <div className="space-y-8">
      {/* Advanced Search Section */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-regular text-white mb-2">Продвинутый поиск по логам</h3>
            <p className="text-[#989898] text-sm font-light">
              Поиск по всем записям лога без привязки к странице
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-2 text-white focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all" className="text-white">Все поля</option>
              <option value="id" className="text-white">ID</option>
              <option value="user" className="text-white">Пользователь</option>
              <option value="timestamp" className="text-white">Временная метка</option>
              <option value="description" className="text-white">Описание</option>
            </select>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAdvancedSearch();
                  }
                }}
                className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl pl-10 pr-4 py-2 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                placeholder={`Поиск по ${searchField === 'all' ? 'всем полям' : searchField === 'id' ? 'ID' : searchField === 'user' ? 'пользователю' : searchField === 'timestamp' ? 'дате' : 'описанию'}...`}
              />
            </div>
            <button
              onClick={handleAdvancedSearch}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
            >
              <Search className="h-4 w-4" />
              <span>Поиск</span>
            </button>
          </div>
        </div>

        {logSearchResults.length > 0 && (
          <div className="mt-4">
            <h4 className="text-white font-regular text-sm mb-3">Результаты поиска ({logSearchResults.length}):</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {logSearchResults.map((result) => (
                <div key={result.id} className="p-4 bg-[#0B0B0B] border border-[#383838] rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs px-2 py-1 rounded-full font-regular bg-[#262626] text-white">
                          {result.type}
                        </span>
                        <span className="text-xs text-[#989898] font-light">
                          ID: {result.id}
                        </span>
                      </div>
                      <p className="text-white text-sm font-regular mb-1">{result.message}</p>
                      <p className="text-[#989898] text-xs font-light">
                        Пользователь: {result.admin} | {result.timestamp}
                      </p>
                    </div>
                    <button
                      onClick={() => scrollToLog(result.id)}
                      className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer ml-2"
                      title="Перейти к записи"
                    >
                      <ChevronRight className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity Log List */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#383838]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-white" />
              <h3 className="text-lg font-regular text-white">История действий</h3>
            </div>
            <span className="text-sm text-[#989898] font-light">
              {activityLog.length} записей
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#383838]">
          {activityLog.map((activity) => (
            <div
              key={activity.id}
              ref={el => logRefs[activity.id] = el}
              className="p-6 hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-regular text-sm">{activity.message}</h4>
                    <span className="text-xs text-[#989898] font-light">{activity.timestamp}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-regular ${
                      activity.type === 'game_created' ? 'bg-green-500/20 text-green-500' :
                      activity.type === 'category_updated' ? 'bg-blue-500/20 text-blue-500' :
                      activity.type === 'order_created' ? 'bg-orange-500/20 text-orange-500' :
                      activity.type === 'login' ? 'bg-purple-500/20 text-purple-500' :
                      activity.type === 'settings_updated' ? 'bg-yellow-500/20 text-yellow-500' :
                      activity.type === 'backup' ? 'bg-indigo-500/20 text-indigo-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {activity.type}
                    </span>
                    <span className="text-xs text-[#989898] font-light">
                      {activity.admin}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-[#383838]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#989898] font-light">
              Показано {activityLog.length} записей
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-[#262626] text-white text-sm rounded-lg hover:bg-[#383838] transition-colors">
                ← Назад
              </button>
              <span className="px-3 py-1 bg-white text-black text-sm rounded-lg font-regular">
                1
              </span>
              <button className="px-3 py-1 bg-[#262626] text-white text-sm rounded-lg hover:bg-[#383838] transition-colors">
                Вперед →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Users tab
  const renderUsersTab = () => (
    <div className="space-y-8">
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#383838]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-lg font-regular text-white">Пользователи</h3>
                <p className="text-[#989898] text-sm font-light">Управление пользователями системы</p>
              </div>
            </div>
            <span className="text-sm text-[#989898] font-light">
              {users.length} пользователей
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#383838]">
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">ID</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Имя пользователя</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Email</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Баланс</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Последний вход</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#383838] hover:bg-[#1a1a1a]">
                  <td className="p-4">
                    <span className="text-white text-sm font-regular">#{user.id}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-white text-sm font-regular">{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm font-regular">{user.email}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm font-regular">${user.balanceUsd}</span>
                      <span className="text-[#989898] text-sm font-light">{user.balanceRub}₽</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm font-regular">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Никогда'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-[#383838]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#989898] font-light">
              Показано {users.length} пользователей
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Coupons tab
  const renderCouponsTab = () => (
    <div className="space-y-8">
      {/* Coupons Header */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#383838]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Tag className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-lg font-regular text-white">Купоны</h3>
                <p className="text-[#989898] text-sm font-light">Управление купонами и промокодами</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#989898] font-light">
                {coupons.length} купонов
              </span>
              <button
                onClick={async () => {
                  // Only load data if not already loaded and not currently loading
                  if (products.length === 0 && !loadingData) {
                    await loadAllData();
                  }
                  setShowCreateCouponModal(true);
                }}
                className="p-2 hover:bg-[#262626] rounded-xl transition-colors"
                title="Создать купон"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#383838]">
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Код</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Скидка</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Истекает</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Товары</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Использований</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Статус</th>
                <th className="text-left p-4 text-sm font-regular text-[#989898] font-light">Действия</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const productIds = coupon.games ? JSON.parse(coupon.games) : [];
                const productNames = productIds.length > 0 ? productIds.map(productId => {
                  const product = products.find(p => p.id === productId);
                  return product?.translations?.[0]?.name || product?.slug || '';
                }).filter(name => name).join(', ') : 'Все товары';
                const displayProductNames = productNames || (productIds.length > 0 ? 'Товары выбраны' : 'Все товары');
                
                return (
                  <tr key={coupon.id} className="border-b border-[#383838] hover:bg-[#1a1a1a]">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-regular">{coupon.code}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            addNotification('Код купона скопирован в буфер обмена!', 'success');
                          }}
                          className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                          title="Скопировать код купона"
                        >
                          <Copy className="h-3 w-3 text-[#989898]" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm font-regular">{coupon.discount}%</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm font-regular">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('ru-RU') : 'Никогда'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm font-regular" title={displayProductNames}>
                        {displayProductNames.length > 30 ? `${displayProductNames.substring(0, 30)}...` : displayProductNames}
                      </span>
                    </td>
                    <td className="p-4">
                      {coupon.maxUses !== null ? (
                        <span className="text-white text-sm font-regular">
                          {coupon.currentUses || 0}/{coupon.maxUses}
                        </span>
                      ) : (
                        <span className="text-white text-sm font-regular">∞</span>
                      )}
                    </td>
                    <td className="p-4">
                      {coupon.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                          <Check className="h-3 w-3 mr-1" />
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-regular bg-[#262626] text-white">
                          <XCircle className="h-3 w-3 mr-1" />
                          Неактивен
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon)}
                          className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {coupons.length === 0 && (
          <div className="p-8 text-center">
            <Tag className="h-12 w-12 text-[#989898] mx-auto mb-4" />
            <p className="text-[#989898] font-regular">Нет купонов</p>
            <p className="text-[#989898] text-sm mt-1 font-light">Создайте первый купон</p>
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="mt-4 px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors hover:bg-gray-200"
            >
              Создать купон
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render Admins Tab
  const renderAdminsTab = () => (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-regular text-white mb-2">Администраторы системы</h3>
          <p className="text-[#989898] text-sm font-light">
            Управление администраторами и их правами доступа
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            <span>Создать администратора</span>
          </button>
        </div>
      </div>

      {/* Admins List */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        {loadingAdmins ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#989898] font-light">Загрузка администраторов...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-[#989898] mx-auto mb-4" />
            <p className="text-[#989898] font-light">Нет администраторов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#383838]">
                  <th className="text-left p-4 text-[#989898] font-regular text-sm">Логин</th>
                  <th className="text-left p-4 text-[#989898] font-regular text-sm">Доступные вкладки</th>
                  <th className="text-left p-4 text-[#989898] font-regular text-sm">Статус</th>
                  <th className="text-left p-4 text-[#989898] font-regular text-sm">Создан</th>
                  <th className="text-left p-4 text-[#989898] font-regular text-sm">Последний вход</th>
                  <th className="text-right p-4 text-[#989898] font-regular text-sm">Действия</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-[#383838] hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#262626] rounded-lg">
                          {admin.owner ? (
                            <Crown className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <User className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-regular text-sm">{admin.login}</p>
                          {admin.owner && (
                            <p className="text-yellow-400 text-xs font-light">Владелец</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {admin.allowedTabs && admin.allowedTabs.length > 0 ? (
                          admin.allowedTabs.slice(0, 3).map((tab) => {
                            const tabInfo = availableTabs.find(t => t.id === tab);
                            return (
                              <span key={tab} className="px-2 py-1 bg-[#262626] text-white text-xs rounded-lg font-regular">
                                {tabInfo?.name || tab}
                              </span>
                            );
                          })
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg font-regular">
                            Нет доступа
                          </span>
                        )}
                        {admin.allowedTabs && admin.allowedTabs.length > 3 && (
                          <span className="px-2 py-1 bg-[#383838] text-[#989898] text-xs rounded-lg font-regular">
                            +{admin.allowedTabs.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-lg font-regular ${
                        admin.frozen 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {admin.frozen ? 'Заблокирован' : 'Активен'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-[#989898] text-sm font-light">
                        {new Date(admin.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-[#989898] text-sm font-light">
                        {admin.lastLogin 
                          ? new Date(admin.lastLogin).toLocaleDateString('ru-RU')
                          : 'Никогда'
                        }
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelected2FAAdmin(admin);
                            setShow2FAModal(true);
                          }}
                          className="p-2 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                          title="View 2FA QR Code (Always Enabled)"
                        >
                          <Shield className="h-4 w-4 text-green-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="p-2 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4 text-[#989898] hover:text-white" />
                        </button>
                        {!admin.owner && (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            className="p-2 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4 text-[#989898] hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      <AnimatePresence>
        {showCreateAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">Создать администратора</h3>
                  <button
                    onClick={() => setShowCreateAdminModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-white mb-2">
                      Логин
                    </label>
                    <input
                      type="text"
                      value={newAdminData.login}
                      onChange={(e) => setNewAdminData({ ...newAdminData, login: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#525252]"
                      placeholder="Введите логин"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-white mb-2">
                      Пароль
                    </label>
                    <input
                      type="password"
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#525252]"
                      placeholder="Введите пароль (минимум 8 символов)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-white mb-2">
                      Доступные вкладки
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-[#161616] border border-[#383838] rounded-xl p-3">
                      {availableTabs.map((tab) => (
                        <label key={tab.id} className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAdminData.allowedTabs.includes(tab.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAdminData({ 
                                  ...newAdminData, 
                                  allowedTabs: [...newAdminData.allowedTabs, tab.id] 
                                });
                              } else {
                                setNewAdminData({ 
                                  ...newAdminData, 
                                  allowedTabs: newAdminData.allowedTabs.filter(t => t !== tab.id) 
                                });
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded transition-colors flex items-center justify-center cursor-pointer mt-0.5 ${
                            newAdminData.allowedTabs.includes(tab.id)
                              ? 'bg-white border-white'
                              : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {newAdminData.allowedTabs.includes(tab.id) && (
                              <Check className="w-3 h-3 text-[#0B0B0B]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-white font-regular cursor-pointer block">
                              {tab.name}
                            </span>
                            <span className="text-xs text-[#989898] font-light cursor-pointer block">
                              {tab.description}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateAdminModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreateAdmin}
                      className="px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
                    >
                      Создать
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {showEditAdminModal && selectedAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">
                    Редактировать: {selectedAdmin.login}
                  </h3>
                  <button
                    onClick={() => setShowEditAdminModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-white mb-2">
                      Логин
                    </label>
                    <input
                      type="text"
                      value={editAdminData.login}
                      onChange={(e) => setEditAdminData({ ...editAdminData, login: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#525252]"
                      disabled={selectedAdmin.owner}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-white mb-2">
                      Доступные вкладки
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-[#161616] border border-[#383838] rounded-xl p-3">
                      {availableTabs.map((tab) => (
                        <label key={tab.id} className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editAdminData.allowedTabs.includes(tab.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditAdminData({ 
                                  ...editAdminData, 
                                  allowedTabs: [...editAdminData.allowedTabs, tab.id] 
                                });
                              } else {
                                setEditAdminData({ 
                                  ...editAdminData, 
                                  allowedTabs: editAdminData.allowedTabs.filter(t => t !== tab.id) 
                                });
                              }
                            }}
                            className="sr-only"
                            disabled={selectedAdmin.owner}
                          />
                          <div className={`w-4 h-4 border-2 rounded transition-colors flex items-center justify-center cursor-pointer mt-0.5 ${
                            editAdminData.allowedTabs.includes(tab.id)
                              ? 'bg-white border-white'
                              : 'bg-[#161616] border-[#383838]'
                          } ${selectedAdmin.owner ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {editAdminData.allowedTabs.includes(tab.id) && (
                              <Check className="w-3 h-3 text-[#0B0B0B]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-regular cursor-pointer block ${
                              selectedAdmin.owner ? 'text-[#989898]' : 'text-white'
                            }`}>
                              {tab.name}
                            </span>
                            <span className="text-xs text-[#989898] font-light cursor-pointer block">
                              {tab.description}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {!selectedAdmin.owner && (
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAdminData.frozen}
                          onChange={(e) => setEditAdminData({ ...editAdminData, frozen: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          editAdminData.frozen
                            ? 'bg-red-500 border-red-500'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {editAdminData.frozen && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Заблокировать аккаунт
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditAdminModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdateAdmin}
                      className="px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render Settings tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* System Settings */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#383838]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-lg font-regular text-white">Системные параметры</h3>
                <p className="text-[#989898] text-sm font-light">Настройки системы и интеграции</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Settings Fields in Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Telegram Token Field */}
            <div className="space-y-2">
              <label className="block text-sm font-regular text-white">Telegram Token</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={settings.telegramToken}
                    onChange={(e) => setSettings({...settings, telegramToken: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular pr-10"
                    placeholder="Введите Telegram Token"
                    autoComplete="off"
                  />
                </div>
                <button
                  onClick={saveSettings}
                  disabled={isSaving || (settings.telegramToken === originalSettings.telegramToken && settings.discordWebhook === originalSettings.discordWebhook)}
                  className={`flex items-center justify-center space-x-1 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-regular whitespace-nowrap ${
                    isSaving || (settings.telegramToken === originalSettings.telegramToken && settings.discordWebhook === originalSettings.discordWebhook)
                      ? 'bg-[#262626] text-[#989898] cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Сохранить</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#989898] font-light">
                Токен для интеграции с Telegram API
              </p>
            </div>
            
            {/* Discord Webhook Field */}
            <div className="space-y-2">
              <label className="block text-sm font-regular text-white">Discord Webhook</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={settings.discordWebhook}
                    onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                    placeholder="Введите Discord Webhook URL"
                    autoComplete="off"
                  />
                </div>
                <button
                  onClick={saveSettings}
                  disabled={isSaving || (settings.telegramToken === originalSettings.telegramToken && settings.discordWebhook === originalSettings.discordWebhook)}
                  className={`flex items-center justify-center space-x-1 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-regular whitespace-nowrap ${
                    isSaving || (settings.telegramToken === originalSettings.telegramToken && settings.discordWebhook === originalSettings.discordWebhook)
                      ? 'bg-[#262626] text-[#989898] cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Сохранить</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#989898] font-light">
                URL вебхука для интеграции с Discord
              </p>
            </div>
          </div>

          {/* Email Testing Section */}
          <div className="mt-6 pt-6 border-t border-[#383838]">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Mail className="h-5 w-5 text-white" />
                <div>
                  <h4 className="text-lg font-regular text-white">Email Configuration</h4>
                  <p className="text-[#989898] text-sm font-light">Test SMTP connection and send test emails</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SMTP Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-regular text-white">SMTP Status</label>
                  <div className="bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-white">smtp.go2.unisender.ru:587</span>
                    </div>
                    <p className="text-xs text-[#989898] mt-1">TLS Encryption, User: 7990866</p>
                  </div>
                </div>

                {/* Test Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-regular text-white">Test Email</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={testEmailAddress || ''}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="flex-1 bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                      placeholder="Enter email to test"
                    />
                    <button
                      onClick={handleTestEmail}
                      disabled={isTestingEmail || !testEmailAddress}
                      className={`flex items-center justify-center space-x-1 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-regular whitespace-nowrap ${
                        isTestingEmail || !testEmailAddress
                          ? 'bg-[#262626] text-[#989898] cursor-not-allowed'
                          : 'bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer'
                      }`}
                    >
                      {isTestingEmail ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>Test</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#989898] font-light">
                    Send a test order completion email
                  </p>
                </div>
              </div>

              {/* Manual Order Email */}
              <div className="mt-6 pt-6 border-t border-[#383838]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Mail className="h-5 w-5 text-white" />
                    <div>
                      <h4 className="text-lg font-regular text-white">Manual Order Email</h4>
                      <p className="text-[#989898] text-sm font-light">Send email for completed orders that didn't receive it</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-regular text-white">Order ID</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={manualOrderId}
                        onChange={(e) => setManualOrderId(e.target.value)}
                        className="flex-1 bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                        placeholder="Enter order ID (e.g., 98831a84-af02-452b-9355-4e27f78c9e5c)"
                      />
                      <button
                        onClick={handleSendOrderEmail}
                        disabled={isSendingOrderEmail || !manualOrderId}
                        className={`flex items-center justify-center space-x-1 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-regular whitespace-nowrap ${
                          isSendingOrderEmail || !manualOrderId
                            ? 'bg-[#262626] text-[#989898] cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                        }`}
                      >
                        {isSendingOrderEmail ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            <span>Send Email</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-[#989898] font-light">
                      Send order completion email with keys to customer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Payment Fees tab
  const renderPaymentFeesTab = () => (
    <div className="space-y-6">
      {/* Payment Fees Header */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#383838]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-lg font-regular text-white">Комиссии платежных модулей</h3>
                <p className="text-[#989898] text-sm font-light">Управление комиссиями для различных методов оплаты</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreatePaymentFeeModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors cursor-pointer font-regular"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить метод</span>
            </button>
          </div>
        </div>

        {/* Payment Fees List */}
        <div className="p-6">
          {loadingPaymentFees ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : paymentFees.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-[#989898] mx-auto mb-4" />
              <p className="text-[#989898] text-sm font-light">Нет настроенных комиссий</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentFees.map((paymentFee) => (
                <div
                  key={paymentFee.id}
                  className="bg-[#0B0B0B] border border-[#383838] rounded-xl p-4 hover:border-[#525252] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${paymentFee.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <div>
                          <h4 className="text-white font-regular">{paymentFee.paymentMethod}</h4>
                          <p className="text-[#989898] text-sm font-light">
                            {paymentFee.percentageFee}% + ${paymentFee.fixedFeeUsd} / ₽{paymentFee.fixedFeeRub}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditPaymentFee(paymentFee)}
                        className="p-2 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4 text-[#989898] hover:text-white" />
                      </button>
                      <button
                        onClick={() => handleDeletePaymentFee(paymentFee)}
                        className="p-2 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-[#989898] hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Example calculation */}
                  <div className="mt-3 pt-3 border-t border-[#383838]">
                    <p className="text-[#989898] text-xs font-light mb-2">Пример расчета:</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#989898]">$100 товар:</span>
                        <span className="text-white ml-2">
                          ${(100 + (100 * parseFloat(paymentFee.percentageFee) / 100) + parseFloat(paymentFee.fixedFeeUsd)).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#989898]">₽100 товар:</span>
                        <span className="text-white ml-2">
                          ₽{(100 + (100 * parseFloat(paymentFee.percentageFee) / 100) + parseFloat(paymentFee.fixedFeeRub)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Order Logs tab
  const renderOrderLogsTab = () => (
    <div className="space-y-8">
      {/* Order Logs List */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#383838]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-5 w-5 text-white" />
              <h3 className="text-lg font-regular text-white">Заказы</h3>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#989898] font-light">
                {orderLogs.length} записей
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-[#0B0B0B] border border-[#383838] rounded-xl pl-10 pr-4 py-2 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                  placeholder="Поиск по заказам..."
                />
              </div>
              {selectedOrders.size > 0 && (
                <button
                  onClick={handleBulkDeleteOrders}
                  className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                  title="Удалить выбранные заказы"
                >
                  Удалить выбранные ({selectedOrders.size})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#383838]">
          {orderLogs.filter(log =>
            log.orderId.toString().includes(searchQuery) ||
            log.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.variant.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.toLowerCase().includes(searchQuery.toLowerCase())
          ).length > 0 ? (
            <div className="p-4 bg-[#161616] border-b border-[#383838]">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-2 border-[#525252] bg-[#0B0B0B] text-cyan-400 focus:ring-0 cursor-pointer hover:border-cyan-400 transition-colors"
                  />
                  <span className="text-sm text-white font-regular cursor-pointer hover:text-cyan-400 transition-colors">Выбрать все</span>
                </label>
              </div>
            </div>
          ) : null}
          {orderLogs.filter(log =>
            log.orderId.toString().includes(searchQuery) ||
            log.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.variant.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.toLowerCase().includes(searchQuery.toLowerCase())
          ).length > 0 ? (
            orderLogs.filter(log =>
              log.orderId.toString().includes(searchQuery) ||
              log.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
              log.variant.toLowerCase().includes(searchQuery.toLowerCase()) ||
              log.user.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((orderLog) => (
              <div
                key={orderLog.id}
                className={`p-4 hover:bg-[#1a1a1a] transition-colors ${selectedOrders.has(orderLog.orderId) ? 'bg-[#1a1a1a]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(orderLog.orderId)}
                        onChange={() => handleOrderSelect(orderLog.orderId)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-2 border-[#525252] bg-[#0B0B0B] text-cyan-400 focus:ring-0 cursor-pointer hover:border-cyan-400 transition-colors"
                      />
                    </label>
                    <span className="text-white text-sm font-regular">#{orderLog.orderId}</span>
                    <span className="text-white text-sm font-regular">{orderLog.product}</span>
                    <span className="text-[#989898] text-sm font-light">{orderLog.user}</span>
                    <div className="flex items-center space-x-1">
                      {orderLog.status === 'completed' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className={`text-xs ${orderLog.status === 'completed' ? 'text-green-500' : 'text-yellow-500'} font-regular`}>
                        {orderLog.status === 'completed' ? 'Завершен' : 'В процессе'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-[#989898] font-light">{orderLog.date}</span>
                      <span className="text-xs text-[#989898] font-light">{orderLog.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteOrder(orderLog)}
                      className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                      title="Удалить заказ"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleCompleteOrder(orderLog)}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        orderLog.status === 'completed'
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-[#262626] cursor-pointer'
                      }`}
                      title={orderLog.status === 'completed' ? 'Заказ уже завершен' : 'Завершить заказ'}
                      disabled={orderLog.status === 'completed'}
                    >
                      <Check className={`h-4 w-4 ${orderLog.status === 'completed' ? 'text-gray-500' : 'text-white'}`} />
                    </button>
                    <button
                      className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                      title="Редактировать заказ"
                    >
                      <Edit className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-[#989898] mx-auto mb-4" />
              <p className="text-[#989898] font-regular">Нет заказов</p>
              <p className="text-[#989898] text-sm mt-1 font-light">Заказы будут отображаться здесь</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#383838]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#989898] font-light">
              Показано {orderLogs.length} записей из {totalPages * itemsPerPage}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadOrderLogs(Math.max(1, currentPage - 1), itemsPerPage)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 font-regular ${
                  currentPage === 1
                    ? 'bg-[#262626] text-[#989898] cursor-not-allowed'
                    : 'bg-[#262626] text-white hover:bg-[#383838]'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Назад</span>
              </button>
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  if (pageNumber === currentPage) {
                    return (
                      <span key={pageNumber} className="px-3 py-1 bg-white text-black text-sm rounded-lg font-regular">
                        {pageNumber}
                      </span>
                    );
                  }
                  if (pageNumber <= totalPages) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => loadOrderLogs(pageNumber, itemsPerPage)}
                        className="px-3 py-1 bg-[#262626] text-white text-sm rounded-lg hover:bg-[#383838] transition-colors font-regular"
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                  return null;
                })}
                {totalPages > 5 && (
                  <span className="px-3 py-1 text-[#989898] text-sm font-regular">...
                    <button
                      onClick={() => loadOrderLogs(totalPages, itemsPerPage)}
                      className="ml-1 text-white hover:underline font-regular"
                    >
                      {totalPages}
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={() => loadOrderLogs(Math.min(totalPages, currentPage + 1), itemsPerPage)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 font-regular ${
                  currentPage === totalPages
                    ? 'bg-[#262626] text-[#989898] cursor-not-allowed'
                    : 'bg-[#262626] text-white hover:bg-[#383838]'
                }`}
              >
                <span>Вперед</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm text-[#989898] font-light">Записей на странице:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newPerPage = parseInt(e.target.value);
                    setItemsPerPage(newPerPage);
                    loadOrderLogs(1, newPerPage);
                  }}
                  className="bg-[#161616] border border-[#383838] rounded-lg px-2 py-1 text-white text-sm focus:outline-none transition-colors cursor-pointer font-regular"
                >
                  <option value="10" className="text-white">10</option>
                  <option value="20" className="text-white">20</option>
                  <option value="50" className="text-white">50</option>
                  <option value="100" className="text-white">100</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg font-regular">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex font-geist">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-[#161616] border-r border-[#383838] flex flex-col fixed left-0 top-0 h-screen z-40">
        <div className="p-6 border-b border-[#383838]">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer focus:outline-none hover:opacity-80 transition-opacity w-full"
          >
            <div className="h-8 w-8 flex items-center justify-center">
              <Image src="/images/logo.svg" alt="Logo" width={32} height={32} className="h-5 w-5 filter brightness-0 invert" />
            </div>
            <h1 className="text-lg font-regular text-white">AtomCheats</h1>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {hasTabAccess('dashboard') && (
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  router.push('/admin/dashboard?tab=dashboard');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'dashboard'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <Home className="h-4 w-4" />
                <span className="font-regular text-sm">Панель управления</span>
              </button>
            )}
               
            {hasTabAccess('games-products') && (
              <button
                onClick={() => {
                  setActiveTab('games-products');
                  router.push('/admin/dashboard?tab=games-products');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'games-products'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <Gamepad2 className="h-4 w-4" />
                <span className="font-regular text-sm">Игры и товары</span>
              </button>
            )}

            {hasTabAccess('order-logs') && (
              <button
                onClick={() => {
                  setActiveTab('order-logs');
                  router.push('/admin/dashboard?tab=order-logs');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'order-logs'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="font-regular text-sm">Заказы</span>
              </button>
            )}

            {hasTabAccess('users') && (
              <button
                onClick={() => {
                  setActiveTab('users');
                  router.push('/admin/dashboard?tab=users');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'users'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="font-regular text-sm">Пользователи</span>
              </button>
            )}

            {hasTabAccess('coupons') && (
              <button
                onClick={() => {
                  setActiveTab('coupons');
                  router.push('/admin/dashboard?tab=coupons');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'coupons'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <Tag className="h-4 w-4" />
                <span className="font-regular text-sm">Купоны</span>
              </button>
            )}

            {hasTabAccess('admins') && (
              <button
                onClick={() => {
                  setActiveTab('admins');
                  router.push('/admin/dashboard?tab=admins');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'admins'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="font-regular text-sm">Администраторы</span>
              </button>
            )}

            {hasTabAccess('activity-log') && (
              <button
                onClick={() => {
                  setActiveTab('activity-log');
                  router.push('/admin/dashboard?tab=activity-log');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'activity-log'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span className="font-regular text-sm">Лог действий</span>
              </button>
            )}

            {hasTabAccess('settings') && (
              <button
                onClick={() => {
                  setActiveTab('settings');
                  router.push('/admin/dashboard?tab=settings');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'settings'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="font-regular text-sm">Параметры</span>
              </button>
            )}

            {hasTabAccess('payment-fees') && (
              <button
                onClick={() => {
                  setActiveTab('payment-fees');
                  router.push('/admin/dashboard?tab=payment-fees');
                }}
                className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  activeTab === 'payment-fees'
                    ? 'bg-[#262626]'
                    : 'hover:bg-[#262626]'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span className="font-regular text-sm">Комиссии платежей</span>
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-[#383838] space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-[#161616]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-regular text-white truncate">{adminInfo?.login}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/catalog')}
            className="w-full flex items-center space-x-3 p-3 text-white hover:bg-[#262626] rounded-xl transition-colors cursor-pointer focus:outline-none"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="font-regular text-sm">Перейти в магазин</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 text-white hover:bg-[#262626] rounded-xl transition-colors cursor-pointer focus:outline-none"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-regular text-sm">Выйти</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div>
                <h2 className="text-xl font-regular text-white">
                  {activeTab === 'dashboard' && 'Панель управления'}
                  {activeTab === 'games-products' && 'Игры и товары'}
                  {activeTab === 'activity-log' && 'Лог действий'}
                  {activeTab === 'order-logs' && 'Заказы'}
                  {activeTab === 'users' && 'Пользователи'}
                  {activeTab === 'coupons' && 'Купоны'}
                  {activeTab === 'admins' && 'Администраторы'}
                  {activeTab === 'settings' && 'Параметры'}
                  {activeTab === 'payment-fees' && 'Комиссии платежей'}
                </h2>
                <p className="text-[#989898] text-sm mt-1 font-light opacity-70">
                  {activeTab === 'games-products' && 'Управление играми, категориями и товарами'}
                  {activeTab === 'activity-log' && 'История действий в системе'}
                  {activeTab === 'order-logs' && 'Управление заказами'}
                  {activeTab === 'dashboard' && 'Обзор системы'}
                  {activeTab === 'users' && 'Управление пользователями системы'}
                  {activeTab === 'coupons' && 'Управление купонами и промокодами'}
                  {activeTab === 'admins' && 'Управление администраторами и их правами доступа'}
                  {activeTab === 'settings' && 'Настройки системы и параметры'}
                  {activeTab === 'payment-fees' && 'Управление комиссиями платежных модулей'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              
              <button
                onClick={() => {
                  const currentUrl = `${window.location.origin}/admin/dashboard?tab=${activeTab}`;
                  navigator.clipboard.writeText(currentUrl);
                  addNotification('Ссылка на текущую вкладку скопирована в буфер обмена!', 'success');
                }}
                className="p-2 hover:bg-[#262626] rounded-xl transition-colors cursor-pointer"
                title="Скопировать ссылку на эту вкладку"
              >
                <ExternalLink className="h-4 w-4 text-white" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-[#161616]" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-regular text-white">{adminInfo?.login}</p>
                  <p className="text-xs text-[#989898] font-light">Администратор</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {hasTabAccess('games-products') && activeTab === 'games-products' && (
              <motion.div
                key="games-products"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderGamesProductsTab()}
              </motion.div>
            )}
            
            {hasTabAccess('activity-log') && activeTab === 'activity-log' && (
              <motion.div
                key="activity-log"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderActivityLogTab()}
              </motion.div>
            )}
            
            {hasTabAccess('order-logs') && activeTab === 'order-logs' && (
              <motion.div
                key="order-logs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderOrderLogsTab()}
              </motion.div>
            )}
            
            {hasTabAccess('users') && activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderUsersTab()}
              </motion.div>
            )}
            
            {hasTabAccess('coupons') && activeTab === 'coupons' && (
              <motion.div
                key="coupons"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCouponsTab()}
              </motion.div>
            )}
            
            {hasTabAccess('admins') && activeTab === 'admins' && (
              <motion.div
                key="admins"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderAdminsTab()}
              </motion.div>
            )}
            
            {hasTabAccess('dashboard') && activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
             {/* Statistics Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {/* Users Card */}
               <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] transition-all duration-300">
                 <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-[#262626] rounded-xl">
                     <Users className="h-6 w-6 text-white" />
                   </div>
                 </div>
                 <h4 className="text-white font-regular text-lg mb-2">Пользователи:</h4>
                 <p className="text-white text-3xl font-bold mb-2">{loadingStatistics ? '...' : statistics.users}</p>
                 <p className="text-[#989898] text-sm font-light">Общее количество всех пользователей</p>
               </div>

               {/* Admins Card */}
               <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] transition-all duration-300">
                 <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-[#262626] rounded-xl">
                     <Crown className="h-6 w-6 text-white" />
                   </div>
                 </div>
                 <h4 className="text-white font-regular text-lg mb-2">Администраторы:</h4>
                 <p className="text-white text-3xl font-bold mb-2">{loadingStatistics ? '...' : statistics.admins}</p>
                 <p className="text-[#989898] text-sm font-light">Общее количество администраторов</p>
               </div>

               {/* Games Card */}
               <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] transition-all duration-300">
                 <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-[#262626] rounded-xl">
                     <Gamepad2 className="h-6 w-6 text-white" />
                   </div>
                 </div>
                 <h4 className="text-white font-regular text-lg mb-2">Игры:</h4>
                 <p className="text-white text-3xl font-bold mb-2">{loadingStatistics ? '...' : statistics.games}</p>
                 <p className="text-[#989898] text-sm font-light">Общее количество всех игр</p>
               </div>

               {/* Revenue Card */}
               <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] transition-all duration-300">
                 <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-[#262626] rounded-xl">
                     <DollarSign className="h-6 w-6 text-white" />
                   </div>
                   <div className="flex items-center space-x-2">
                     <button
                       onClick={() => setRevenueCurrency('usd')}
                       className={`px-3 py-1 rounded-lg text-sm font-regular transition-colors cursor-pointer ${
                         revenueCurrency === 'usd' ? 'bg-white text-black' : 'bg-[#262626] text-white hover:bg-[#383838]'
                       }`}
                     >
                       $
                     </button>
                     <button
                       onClick={() => setRevenueCurrency('rub')}
                       className={`px-3 py-1 rounded-lg text-sm font-regular transition-colors cursor-pointer ${
                         revenueCurrency === 'rub' ? 'bg-white text-black' : 'bg-[#262626] text-white hover:bg-[#383838]'
                       }`}
                     >
                       ₽
                     </button>
                   </div>
                 </div>
                 <h4 className="text-white font-regular text-lg mb-2">Доход:</h4>
                 <p className="text-white text-3xl font-bold mb-2">
                   {loadingStatistics ? '...' : (
                     revenueCurrency === 'usd' ? `$${parseFloat(statistics.revenue).toFixed(2)}` : `${parseFloat(statistics.revenueRub).toFixed(2)}₽`
                   )}
                 </p>
                 <p className="text-[#989898] text-sm font-light">Доход за последние 7 дней</p>
               </div>

             </div>

             {/* Orders & Payment Methods Section */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Completed Orders Card */}
               <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] transition-all duration-300">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-3 bg-[#262626] rounded-xl">
                     <Check className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <h4 className="text-white font-regular text-lg">Завершённые заказы</h4>
                     <p className="text-[#989898] text-sm font-light">За всё время</p>
                   </div>
                 </div>
                 <p className="text-white text-3xl font-bold">
                   {loadingStatistics ? '...' : statistics.completedOrders}
                 </p>
               </div>

               {/* Payment Methods Breakdown */}
               <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6 hover:border-[#525252] transition-all duration-300">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-3 bg-[#262626] rounded-xl">
                     <CreditCard className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <h4 className="text-white font-regular text-lg">Методы оплаты</h4>
                     <p className="text-[#989898] text-sm font-light">Завершённые заказы по методам</p>
                   </div>
                 </div>
                 {loadingStatistics ? (
                   <p className="text-[#989898] text-sm">...</p>
                 ) : statistics.paymentMethods.length === 0 ? (
                   <p className="text-[#989898] text-sm">Нет данных</p>
                 ) : (
                   <div className="space-y-2">
                     {statistics.paymentMethods.map(m => (
                       <div key={m.method} className="flex items-center justify-between">
                         <div className="flex items-center gap-2 min-w-0">
                           <span className="text-white text-sm truncate">{m.method}</span>
                         </div>
                         <div className="flex items-center gap-3 shrink-0">
                           <span className="text-[#989898] text-xs">{m.count} шт.</span>
                           <span className="text-white text-sm font-medium">
                             {revenueCurrency === 'usd'
                               ? `$${m.totalUsd.toFixed(2)}`
                               : `${m.totalRub.toFixed(2)}₽`}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>

             {/* Charts Section */}
             <div className="mt-8 space-y-8">
               {/* Page Visit Chart */}
               <div>
                 <PageVisitChart />
               </div>
               {/* Revenue Analytics */}
               <div>
                 <RevenueAnalytics />
               </div>
             </div>
              </motion.div>
            )}
            
            {hasTabAccess('settings') && activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderSettingsTab()}
              </motion.div>
            )}

            {hasTabAccess('payment-fees') && activeTab === 'payment-fees' && (
              <motion.div
                key="payment-fees"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderPaymentFeesTab()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Create Game Modal */}
      <AnimatePresence>
        {showCreateGameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">Создать игру</h3>
                  <button
                    onClick={() => setShowCreateGameModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Название игры *
                      </label>
                      <input
                        type="text"
                        value={newGameData.name}
                        onChange={(e) => setNewGameData({ ...newGameData, name: e.target.value })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                        placeholder="Например: CS2"
                      />
                    </div>
                  </div>


                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Изображение игры
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gameImageType"
                            checked={!gameImageFile}
                            onChange={() => setGameImageFile(null)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            !gameImageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {!gameImageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">URL</span>
                        </label>
                      </div>
                      {!gameImageFile ? (
                        <input
                          type="text"
                          value={newGameData.image}
                          onChange={(e) => setNewGameData({ ...newGameData, image: e.target.value })}
                          className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                          placeholder="https://example.com/image.jpg"
                        />
                      ) : (
                        <div className="p-4 bg-[#161616] border border-[#383838] rounded-xl text-center">
                          <p className="text-[#989898] text-sm mb-2 font-light">Файл выбран: {gameImageFile.name}</p>
                          <button
                            onClick={() => setGameImageFile(null)}
                            className="text-white text-sm hover:underline font-regular"
                          >
                            Удалить файл
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gameImageType"
                            checked={!!gameImageFile}
                            onChange={() => document.getElementById('gameImageUpload').click()}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            gameImageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {gameImageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">Загрузить файл</span>
                        </label>
                      </div>
                      <input
                        id="gameImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setGameImageFile(e.target.files[0]);
                            setNewGameData({ ...newGameData, image: '' });
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newGameData.isActive}
                          onChange={(e) => setNewGameData({ ...newGameData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          newGameData.isActive
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {newGameData.isActive && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Активна
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newGameData.isNew}
                          onChange={(e) => setNewGameData({ ...newGameData, isNew: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          newGameData.isNew
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {newGameData.isNew && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Новая игра
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateGameModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreateGame}
                      disabled={isUploading}
                      className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-2 font-regular ${
                        isUploading
                          ? 'bg-[#262626] cursor-not-allowed'
                          : 'bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Загрузка...</span>
                        </>
                      ) : (
                        <span>Создать игру</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Game Modal */}
      <AnimatePresence>
        {showEditGameModal && selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">
                    Редактировать игру: {selectedGame.name}
                  </h3>
                  <button
                    onClick={() => setShowEditGameModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Название игры *
                      </label>
                      <input
                        type="text"
                        value={editGameData.name}
                        onChange={(e) => setEditGameData({ ...editGameData, name: e.target.value })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>


                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Изображение игры
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editGameImageType"
                            checked={!editGameImageFile}
                            onChange={() => setEditGameImageFile(null)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            !editGameImageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {!editGameImageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">URL</span>
                        </label>
                      </div>
                      {!editGameImageFile ? (
                        <input
                          type="text"
                          value={editGameData.image}
                          onChange={(e) => setEditGameData({ ...editGameData, image: e.target.value })}
                          className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                          placeholder="https://example.com/image.jpg"
                        />
                      ) : (
                        <div className="p-4 bg-[#161616] border border-[#383838] rounded-xl text-center">
                          <p className="text-[#989898] text-sm mb-2 font-light">Файл выбран: {editGameImageFile?.name}</p>
                          <button
                            onClick={() => setEditGameImageFile(null)}
                            className="text-white text-sm hover:underline font-regular"
                          >
                            Удалить файл
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editGameImageType"
                            checked={!!editGameImageFile}
                            onChange={() => document.getElementById('editGameImageUpload').click()}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            editGameImageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {editGameImageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">Загрузить файл</span>
                        </label>
                      </div>
                      <input
                        id="editGameImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditGameImageFile(e.target.files[0]);
                            setEditGameData({ ...editGameData, image: '' });
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editGameData.isActive}
                          onChange={(e) => setEditGameData({ ...editGameData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          editGameData.isActive
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {editGameData.isActive && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Активна
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editGameData.isNew}
                          onChange={(e) => setEditGameData({ ...editGameData, isNew: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          editGameData.isNew
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {editGameData.isNew && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Новая игра
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditGameModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdateGame}
                      disabled={isEditingGameUploading}
                      className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-2 font-regular ${
                        isEditingGameUploading
                          ? 'bg-[#262626] cursor-not-allowed'
                          : 'bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      {isEditingGameUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Загрузка...</span>
                        </>
                      ) : (
                        <span>Сохранить изменения</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Category Modal */}
      <AnimatePresence>
        {showCreateCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">Создать категорию</h3>
                  <button
                    onClick={() => setShowCreateCategoryModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Translations Section */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-[#161616] border border-[#383838] rounded-xl p-4">
                      <h4 className="text-white font-regular text-sm mb-3">Переводы названия категории</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-regular text-[#989898] mb-2">
                            🇷🇺 Название (Русский) *
                          </label>
                          <input
                            type="text"
                            value={newCategoryData.translations.ru.name}
                            onChange={(e) => setNewCategoryData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                ru: { ...prev.translations.ru, name: e.target.value }
                              }
                            }))}
                            className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                            placeholder="Например: Читы"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-regular text-[#989898] mb-2">
                            🇺🇸 Название (Английский) *
                          </label>
                          <input
                            type="text"
                            value={newCategoryData.translations.en.name}
                            onChange={(e) => setNewCategoryData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                en: { ...prev.translations.en, name: e.target.value }
                              }
                            }))}
                            className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                            placeholder="Например: Cheats"
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Игра *
                      </label>
                      <select
                        value={newCategoryData.gameId}
                        onChange={(e) => setNewCategoryData({ ...newCategoryData, gameId: e.target.value })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="" className="text-[#A1A1A1]">Выберите игру</option>
                        {games.map((game) => (
                          <option key={game.id} value={game.id} className="text-white">
                            {game.name} ({game.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Порядок
                    </label>
                    <input
                      type="number"
                      value={newCategoryData.sortOrder}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Изображение категории
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryImageType"
                            checked={!newCategoryData.imageFile}
                            onChange={() => setNewCategoryData(prev => ({ ...prev, imageFile: null }))}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            !newCategoryData.imageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {!newCategoryData.imageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">URL</span>
                        </label>
                      </div>
                      {!newCategoryData.imageFile ? (
                        <input
                          type="text"
                          value={newCategoryData.image}
                          onChange={(e) => setNewCategoryData({ ...newCategoryData, image: e.target.value })}
                          className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                          placeholder="https://example.com/image.jpg"
                        />
                      ) : (
                        <div className="p-4 bg-[#161616] border border-[#383838] rounded-xl text-center">
                          <p className="text-[#989898] text-sm mb-2 font-light">Файл выбран: {newCategoryData.imageFile?.name}</p>
                          <button
                            onClick={() => setNewCategoryData(prev => ({ ...prev, imageFile: null }))}
                            className="text-white text-sm hover:underline font-regular"
                          >
                            Удалить файл
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryImageType"
                            checked={!!newCategoryData.imageFile}
                            onChange={() => document.getElementById('categoryImageUpload').click()}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            newCategoryData.imageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {newCategoryData.imageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">Загрузить файл</span>
                        </label>
                      </div>
                      <input
                        id="categoryImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewCategoryData(prev => ({ ...prev, imageFile: e.target.files[0], image: '' }));
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCategoryData.isActive}
                          onChange={(e) => setNewCategoryData({ ...newCategoryData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          newCategoryData.isActive
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {newCategoryData.isActive && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Активна
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCategoryData.isNew}
                          onChange={(e) => setNewCategoryData({ ...newCategoryData, isNew: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          newCategoryData.isNew
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {newCategoryData.isNew && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Новая категория
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateCategoryModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreateCategory}
                      className="px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
                    >
                      Создать категорию
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {showEditCategoryModal && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">
                    Редактировать категорию: {selectedCategory.name}
                  </h3>
                  <button
                    onClick={() => setShowEditCategoryModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Translations Section */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-[#161616] border border-[#383838] rounded-xl p-4">
                      <h4 className="text-white font-regular text-sm mb-3">Переводы названия категории</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-regular text-[#989898] mb-2">
                            🇷🇺 Название (Русский) *
                          </label>
                          <input
                            type="text"
                            value={editCategoryData.translations?.ru?.name || ''}
                            onChange={(e) => setEditCategoryData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                ru: { ...prev.translations?.ru, name: e.target.value }
                              }
                            }))}
                            className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                            placeholder="Например: Читы"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-regular text-[#989898] mb-2">
                            🇺🇸 Название (Английский) *
                          </label>
                          <input
                            type="text"
                            value={editCategoryData.translations?.en?.name || ''}
                            onChange={(e) => setEditCategoryData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                en: { ...prev.translations?.en, name: e.target.value }
                              }
                            }))}
                            className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                            placeholder="Например: Cheats"
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Игра
                      </label>
                      <select
                        value={editCategoryData.gameId}
                        onChange={(e) => setEditCategoryData({ ...editCategoryData, gameId: e.target.value })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white focus:outline-none transition-colors cursor-pointer"
                      >
                        {games.map((game) => (
                          <option key={game.id} value={game.id} className="text-white">
                            {game.name} ({game.slug})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Изображение категории
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editCategoryImageType"
                            checked={!editCategoryImageFile}
                            onChange={() => setEditCategoryImageFile(null)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            !editCategoryImageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {!editCategoryImageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">URL</span>
                        </label>
                      </div>
                      {!editCategoryImageFile ? (
                        <input
                          type="text"
                          value={editCategoryData.image}
                          onChange={(e) => setEditCategoryData({ ...editCategoryData, image: e.target.value })}
                          className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                          placeholder="https://example.com/image.jpg"
                        />
                      ) : (
                        <div className="p-4 bg-[#161616] border border-[#383838] rounded-xl text-center">
                          <p className="text-[#989898] text-sm mb-2 font-light">Файл выбран: {editCategoryImageFile?.name}</p>
                          <button
                            onClick={() => setEditCategoryImageFile(null)}
                            className="text-white text-sm hover:underline font-regular"
                          >
                            Удалить файл
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editCategoryImageType"
                            checked={!!editCategoryImageFile}
                            onChange={() => document.getElementById('editCategoryImageUpload').click()}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                            editCategoryImageFile ? 'bg-white border-white' : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {editCategoryImageFile && <div className="w-2 h-2 bg-[#0B0B0B] rounded-full"></div>}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">Загрузить файл</span>
                        </label>
                      </div>
                      <input
                        id="editCategoryImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditCategoryImageFile(e.target.files[0]);
                            setEditCategoryData({ ...editCategoryData, image: '' });
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editCategoryData.isActive}
                          onChange={(e) => setEditCategoryData({ ...editCategoryData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          editCategoryData.isActive
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {editCategoryData.isActive && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Активна
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editCategoryData.isNew}
                          onChange={(e) => setEditCategoryData({ ...editCategoryData, isNew: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                          editCategoryData.isNew
                            ? 'bg-white border-white'
                            : 'bg-[#161616] border-[#383838]'
                        }`}>
                          {editCategoryData.isNew && (
                            <Check className="w-3 h-3 text-[#0B0B0B]" />
                          )}
                        </div>
                        <span className="text-sm text-white font-regular cursor-pointer">
                          Новая категория
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditCategoryModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdateCategory}
                      disabled={isEditingCategoryUploading}
                      className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-2 font-regular ${
                        isEditingCategoryUploading
                          ? 'bg-[#262626] cursor-not-allowed'
                          : 'bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      {isEditingCategoryUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Загрузка...</span>
                        </>
                      ) : (
                        <span>Сохранить изменения</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">
                    Редактировать пользователя: {selectedUser.username}
                  </h3>
                  <button
                    onClick={() => setShowEditUserModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Имя пользователя *
                    </label>
                    <input
                      type="text"
                      value={editUserData.username}
                      onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="Имя пользователя"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Баланс USD
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUserData.balanceUsd}
                        onChange={(e) => setEditUserData({ ...editUserData, balanceUsd: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Баланс RUB
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUserData.balanceRub}
                        onChange={(e) => setEditUserData({ ...editUserData, balanceRub: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditUserModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdateUser}
                      className="px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Coupon Modal */}
      <AnimatePresence>
        {showCreateCouponModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">Создать купон</h3>
                  <button
                    onClick={() => {
                      setShowCreateCouponModal(false);
                      setProductSearchQuery('');
                    }}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>
                {/* Загрузить данные о товарах если они еще не загружены */}
                {products.length === 0 && loadingData && (
                  <div className="mb-4 p-4 bg-[#161616] border border-[#383838] rounded-xl text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white text-sm font-regular">Загрузка товаров...</span>
                    </div>
                    <p className="text-[#989898] text-xs font-light">Пожалуйста, подождите</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Код купона *
                    </label>
                    <input
                      type="text"
                      value={newCouponData.code}
                      onChange={(e) => setNewCouponData({ ...newCouponData, code: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="Например: EXAMPLE2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Процент скидки *
                    </label>
                    <input
                      type="number"
                      value={newCouponData.discountPercent}
                      onChange={(e) => setNewCouponData({ ...newCouponData, discountPercent: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="10"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Дата истечения *
                    </label>
                    <input
                      type="datetime-local"
                      value={newCouponData.expiresAt}
                      onChange={(e) => setNewCouponData({ ...newCouponData, expiresAt: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Максимальное количество использований
                    </label>
                    <input
                      type="number"
                      value={newCouponData.maxUses || ''}
                      onChange={(e) => setNewCouponData({ ...newCouponData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="Оставьте пустым для неограниченного количества"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Товары
                    </label>
                    <div className="bg-[#161616] border border-[#383838] rounded-xl p-3 max-h-48 overflow-y-auto">
                      <div className="mb-3">
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
                          <input
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl pl-10 pr-4 py-2 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                            placeholder="Поиск по товарам..."
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCouponData.productIds.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCouponData({ ...newCouponData, productIds: filteredProducts.map(product => product.id) });
                              } else {
                                setNewCouponData({ ...newCouponData, productIds: [] });
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                            newCouponData.productIds.length === filteredProducts.length && filteredProducts.length > 0
                              ? 'bg-white border-white'
                              : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {newCouponData.productIds.length === filteredProducts.length && filteredProducts.length > 0 && (
                              <Check className="w-3 h-3 text-[#0B0B0B]" />
                            )}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">
                            Выбрать все
                          </span>
                        </label>
                      </div>
                      {loadingData ? (
                        <div className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white text-sm font-regular">Загрузка товаров...</span>
                          </div>
                          <p className="text-[#989898] text-xs font-light">Пожалуйста, подождите</p>
                        </div>
                      ) : filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <div key={product.id} className="flex items-center space-x-2 mb-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newCouponData.productIds.includes(product.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewCouponData({ ...newCouponData, productIds: [...newCouponData.productIds, product.id] });
                                  } else {
                                    setNewCouponData({ ...newCouponData, productIds: newCouponData.productIds.filter(id => id !== product.id) });
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                                newCouponData.productIds.includes(product.id)
                                  ? 'bg-white border-white'
                                  : 'bg-[#161616] border-[#383838]'
                              }`}>
                                {newCouponData.productIds.includes(product.id) && (
                                  <Check className="w-3 h-3 text-[#0B0B0B]" />
                                )}
                              </div>
                              <span className="text-sm text-white font-regular cursor-pointer">
                                {product.translations?.[0]?.name || product.slug}
                              </span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-[#989898] text-sm font-light">
                            {products.length === 0 ? 'Нет товаров' : 'Товары не найдены'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCouponData.isActive}
                        onChange={(e) => setNewCouponData({ ...newCouponData, isActive: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                        newCouponData.isActive
                          ? 'bg-white border-white'
                          : 'bg-[#161616] border-[#383838]'
                      }`}>
                        {newCouponData.isActive && (
                          <Check className="w-3 h-3 text-[#0B0B0B]" />
                        )}
                      </div>
                      <span className="text-sm text-white font-regular cursor-pointer">
                        Активен
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateCouponModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreateCoupon}
                      className="px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
                    >
                      Создать купон
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Coupon Modal */}
      <AnimatePresence>
        {showEditCouponModal && selectedCoupon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">
                    Редактировать купон: {selectedCoupon.code}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditCouponModal(false);
                      setProductSearchQuery('');
                    }}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>
                {/* Показываем индикатор загрузки если данные еще загружаются */}
                {loadingData && (
                  <div className="mb-4 p-4 bg-[#161616] border border-[#383838] rounded-xl text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white text-sm font-regular">Загрузка данных...</span>
                    </div>
                    <p className="text-[#989898] text-xs font-light">Пожалуйста, подождите</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Код купона *
                    </label>
                    <input
                      type="text"
                      value={editCouponData.code}
                      onChange={(e) => setEditCouponData({ ...editCouponData, code: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Процент скидки *
                    </label>
                    <input
                      type="number"
                      value={editCouponData.discountPercent}
                      onChange={(e) => setEditCouponData({ ...editCouponData, discountPercent: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Дата истечения *
                    </label>
                    <input
                      type="datetime-local"
                      value={editCouponData.expiresAt}
                      onChange={(e) => setEditCouponData({ ...editCouponData, expiresAt: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Максимальное количество использований
                    </label>
                    <input
                      type="number"
                      value={editCouponData.maxUses || ''}
                      onChange={(e) => setEditCouponData({ ...editCouponData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="Оставьте пустым для неограниченного количества"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Товары
                    </label>
                    <div className="bg-[#161616] border border-[#383838] rounded-xl p-3 max-h-48 overflow-y-auto">
                      <div className="mb-3">
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A1A1]" />
                          <input
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className="w-full bg-[#0B0B0B] border border-[#383838] rounded-xl pl-10 pr-4 py-2 text-white placeholder-[#A1A1A1] focus:outline-none focus:border-white transition-all text-sm font-regular"
                            placeholder="Поиск по товарам..."
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editCouponData.productIds.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditCouponData({ ...editCouponData, productIds: filteredProducts.map(product => product.id) });
                              } else {
                                setEditCouponData({ ...editCouponData, productIds: [] });
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                            editCouponData.productIds.length === filteredProducts.length && filteredProducts.length > 0
                              ? 'bg-white border-white'
                              : 'bg-[#161616] border-[#383838]'
                          }`}>
                            {editCouponData.productIds.length === filteredProducts.length && filteredProducts.length > 0 && (
                              <Check className="w-3 h-3 text-[#0B0B0B]" />
                            )}
                          </div>
                          <span className="text-sm text-white font-regular cursor-pointer">
                            Выбрать все
                          </span>
                        </label>
                      </div>
                      {loadingData ? (
                        <div className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white text-sm font-regular">Загрузка товаров...</span>
                          </div>
                          <p className="text-[#989898] text-xs font-light">Пожалуйста, подождите</p>
                        </div>
                      ) : filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <div key={product.id} className="flex items-center space-x-2 mb-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editCouponData.productIds.includes(product.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditCouponData({ ...editCouponData, productIds: [...editCouponData.productIds, product.id] });
                                  } else {
                                    setEditCouponData({ ...editCouponData, productIds: editCouponData.productIds.filter(id => id !== product.id) });
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                                editCouponData.productIds.includes(product.id)
                                  ? 'bg-white border-white'
                                  : 'bg-[#161616] border-[#383838]'
                              }`}>
                                {editCouponData.productIds.includes(product.id) && (
                                  <Check className="w-3 h-3 text-[#0B0B0B]" />
                                )}
                              </div>
                              <span className="text-sm text-white font-regular cursor-pointer">
                                {product.translations?.[0]?.name || product.slug}
                              </span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-[#989898] text-sm font-light">
                            {products.length === 0 ? 'Нет товаров' : 'Товары не найдены'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCouponData.isActive}
                        onChange={(e) => setEditCouponData({ ...editCouponData, isActive: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                        editCouponData.isActive
                          ? 'bg-white border-white'
                          : 'bg-[#161616] border-[#383838]'
                      }`}>
                        {editCouponData.isActive && (
                          <Check className="w-3 h-3 text-[#0B0B0B]" />
                        )}
                      </div>
                      <span className="text-sm text-white font-regular cursor-pointer">
                        Активен
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditCouponModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdateCoupon}
                      className="px-4 py-2 bg-white text-black font-regular rounded-xl transition-colors cursor-pointer hover:bg-gray-200"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA Modal */}
      <Admin2FAModal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setSelected2FAAdmin(null);
          // Reload admins to get updated 2FA status
          loadAdmins();
        }}
        admin={selected2FAAdmin}
      />

      {/* Create Payment Fee Modal */}
      <AnimatePresence>
        {showCreatePaymentFeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">Добавить комиссию</h3>
                  <button
                    onClick={() => setShowCreatePaymentFeeModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Название платежного метода *
                    </label>
                    <input
                      type="text"
                      value={newPaymentFeeData.paymentMethod}
                      onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, paymentMethod: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="Например: card, cryptocloud, paypal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Процентная комиссия (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={newPaymentFeeData.percentageFee}
                      onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, percentageFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="8.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия USD
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPaymentFeeData.fixedFeeUsd}
                        onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, fixedFeeUsd: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                        placeholder="0.30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия RUB
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPaymentFeeData.fixedFeeRub}
                        onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, fixedFeeRub: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                        placeholder="23.88"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPaymentFeeData.isActive}
                        onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, isActive: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                        newPaymentFeeData.isActive
                          ? 'bg-white border-white'
                          : 'bg-[#161616] border-[#383838]'
                      }`}>
                        {newPaymentFeeData.isActive && (
                          <Check className="w-3 h-3 text-[#0B0B0B]" />
                        )}
                      </div>
                      <span className="text-sm text-white font-regular cursor-pointer">
                        Активен
                      </span>
                    </label>
                  </div>

                  {/* Example calculation */}
                  <div className="mt-4 p-4 bg-[#161616] border border-[#383838] rounded-xl">
                    <p className="text-[#989898] text-sm font-light mb-2">Пример расчета:</p>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-[#989898]">$100 товар:</span>
                        <span className="text-white ml-2">
                          ${(100 + (100 * newPaymentFeeData.percentageFee / 100) + newPaymentFeeData.fixedFeeUsd).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#989898]">₽100 товар:</span>
                        <span className="text-white ml-2">
                          ₽{(100 + (100 * newPaymentFeeData.percentageFee / 100) + newPaymentFeeData.fixedFeeRub).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreatePaymentFeeModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreatePaymentFee}
                      className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Создать
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Payment Fee Modal */}
      <AnimatePresence>
        {showEditPaymentFeeModal && selectedPaymentFee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">
                    Редактировать комиссию: {selectedPaymentFee.paymentMethod}
                  </h3>
                  <button
                    onClick={() => setShowEditPaymentFeeModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Название платежного метода *
                    </label>
                    <input
                      type="text"
                      value={editPaymentFeeData.paymentMethod}
                      onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, paymentMethod: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Процентная комиссия (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editPaymentFeeData.percentageFee}
                      onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, percentageFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия USD
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPaymentFeeData.fixedFeeUsd}
                        onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, fixedFeeUsd: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия RUB
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPaymentFeeData.fixedFeeRub}
                        onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, fixedFeeRub: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPaymentFeeData.isActive}
                        onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, isActive: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                        editPaymentFeeData.isActive
                          ? 'bg-white border-white'
                          : 'bg-[#161616] border-[#383838]'
                      }`}>
                        {editPaymentFeeData.isActive && (
                          <Check className="w-3 h-3 text-[#0B0B0B]" />
                        )}
                      </div>
                      <span className="text-sm text-white font-regular cursor-pointer">
                        Активен
                      </span>
                    </label>
                  </div>

                  {/* Example calculation */}
                  <div className="mt-4 p-4 bg-[#161616] border border-[#383838] rounded-xl">
                    <p className="text-[#989898] text-sm font-light mb-2">Пример расчета:</p>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-[#989898]">$100 товар:</span>
                        <span className="text-white ml-2">
                          ${(100 + (100 * editPaymentFeeData.percentageFee / 100) + editPaymentFeeData.fixedFeeUsd).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#989898]">₽100 товар:</span>
                        <span className="text-white ml-2">
                          ₽{(100 + (100 * editPaymentFeeData.percentageFee / 100) + editPaymentFeeData.fixedFeeRub).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditPaymentFeeModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdatePaymentFee}
                      className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Payment Fee Modal */}
      <AnimatePresence>
        {showCreatePaymentFeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">Добавить комиссию</h3>
                  <button
                    onClick={() => setShowCreatePaymentFeeModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Название платежного метода *
                    </label>
                    <input
                      type="text"
                      value={newPaymentFeeData.paymentMethod}
                      onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, paymentMethod: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="Например: card, cryptocloud, paypal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Процентная комиссия (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={newPaymentFeeData.percentageFee}
                      onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, percentageFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      placeholder="8.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия USD
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPaymentFeeData.fixedFeeUsd}
                        onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, fixedFeeUsd: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                        placeholder="0.30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия RUB
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPaymentFeeData.fixedFeeRub}
                        onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, fixedFeeRub: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                        placeholder="23.88"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPaymentFeeData.isActive}
                        onChange={(e) => setNewPaymentFeeData({ ...newPaymentFeeData, isActive: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                        newPaymentFeeData.isActive
                          ? 'bg-white border-white'
                          : 'bg-[#161616] border-[#383838]'
                      }`}>
                        {newPaymentFeeData.isActive && (
                          <Check className="w-3 h-3 text-[#0B0B0B]" />
                        )}
                      </div>
                      <span className="text-sm text-white font-regular cursor-pointer">
                        Активен
                      </span>
                    </label>
                  </div>

                  {/* Example calculation */}
                  <div className="mt-4 p-4 bg-[#161616] border border-[#383838] rounded-xl">
                    <p className="text-[#989898] text-sm font-light mb-2">Пример расчета:</p>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-[#989898]">$100 товар:</span>
                        <span className="text-white ml-2">
                          ${(100 + (100 * newPaymentFeeData.percentageFee / 100) + newPaymentFeeData.fixedFeeUsd).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#989898]">₽100 товар:</span>
                        <span className="text-white ml-2">
                          ₽{(100 + (100 * newPaymentFeeData.percentageFee / 100) + newPaymentFeeData.fixedFeeRub).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreatePaymentFeeModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreatePaymentFee}
                      className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Создать
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Payment Fee Modal */}
      <AnimatePresence>
        {showEditPaymentFeeModal && selectedPaymentFee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0B0B0B] border border-[#252525] border-dashed rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-regular text-white">
                    Редактировать комиссию: {selectedPaymentFee.paymentMethod}
                  </h3>
                  <button
                    onClick={() => setShowEditPaymentFeeModal(false)}
                    className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-[#989898]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Название платежного метода *
                    </label>
                    <input
                      type="text"
                      value={editPaymentFeeData.paymentMethod}
                      onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, paymentMethod: e.target.value })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-regular text-[#989898] mb-2">
                      Процентная комиссия (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editPaymentFeeData.percentageFee}
                      onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, percentageFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия USD
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPaymentFeeData.fixedFeeUsd}
                        onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, fixedFeeUsd: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-regular text-[#989898] mb-2">
                        Фиксированная комиссия RUB
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPaymentFeeData.fixedFeeRub}
                        onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, fixedFeeRub: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white placeholder-[#A1A1A1] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPaymentFeeData.isActive}
                        onChange={(e) => setEditPaymentFeeData({ ...editPaymentFeeData, isActive: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center cursor-pointer ${
                        editPaymentFeeData.isActive
                          ? 'bg-white border-white'
                          : 'bg-[#161616] border-[#383838]'
                      }`}>
                        {editPaymentFeeData.isActive && (
                          <Check className="w-3 h-3 text-[#0B0B0B]" />
                        )}
                      </div>
                      <span className="text-sm text-white font-regular cursor-pointer">
                        Активен
                      </span>
                    </label>
                  </div>

                  {/* Example calculation */}
                  <div className="mt-4 p-4 bg-[#161616] border border-[#383838] rounded-xl">
                    <p className="text-[#989898] text-sm font-light mb-2">Пример расчета:</p>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-[#989898]">$100 товар:</span>
                        <span className="text-white ml-2">
                          ${(100 + (100 * editPaymentFeeData.percentageFee / 100) + editPaymentFeeData.fixedFeeUsd).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#989898]">₽100 товар:</span>
                        <span className="text-white ml-2">
                          ₽{(100 + (100 * editPaymentFeeData.percentageFee / 100) + editPaymentFeeData.fixedFeeRub).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditPaymentFeeModal(false)}
                      className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdatePaymentFee}
                      className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-xl transition-colors cursor-pointer font-regular"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}