'use client';

import { motion } from 'framer-motion';
import { 
  Home, 
  Package, 
  Shield, 
  LogOut, 
  User, 
  Crown 
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  adminInfo, 
  handleLogout, 
  hasPermission 
}) {
  return (
    <div className="w-64 bg-[#171717] border-r border-[#2E2F2F] flex flex-col h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b border-[#2E2F2F]">
        <div 
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Админ Панель</h1>
            <p className="text-gray-400 text-xs">Управление системой</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
              activeTab === 'dashboard'
                ? 'bg-[#262626]'
                : 'hover:bg-[#262626]'
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="font-medium text-sm">Панель управления</span>
          </button>

          {/* Cards & Products */}
          <button
            onClick={() => setActiveTab('cards-products')}
            className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
              activeTab === 'cards-products'
                ? 'bg-[#262626]'
                : 'hover:bg-[#262626]'
            }`}
          >
            <Package className="h-4 w-4" />
            <span className="font-medium text-sm">Карточки и товары</span>
          </button>

          {/* Administrators */}
          {(hasPermission('admin.list') || adminInfo?.owner) && (
            <button
              onClick={() => setActiveTab('administrators')}
              className={`w-full flex items-center space-x-3 p-3 text-white rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                activeTab === 'administrators'
                  ? 'bg-[#262626]'
                  : 'hover:bg-[#262626]'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span className="font-medium text-sm">Администраторы</span>
            </button>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#2E2F2F]">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            {adminInfo?.owner ? <Crown className="h-4 w-4 text-[#171717]" /> : <User className="h-4 w-4 text-[#171717]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{adminInfo?.login}</p>
            <p className="text-xs text-gray-400">{adminInfo?.owner ? 'Владелец' : 'Администратор'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 text-white hover:bg-[#262626] rounded-xl transition-colors cursor-pointer focus:outline-none"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium text-sm">Выйти</span>
        </button>
      </div>
    </div>
  );
}