'use client';

import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

export default function StatisticsCards({ data }) {
  const { 
    totalProducts = 0, 
    totalCategories = 0, 
    totalGames = 0, 
    totalAdmins = 0 
  } = data || {};

  const cards = [
    {
      title: 'Товары',
      value: totalProducts,
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      change: '+5.2%',
      trend: 'up'
    },
    {
      title: 'Категории', 
      value: totalCategories,
      icon: ShoppingCart,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      change: '+2.1%',
      trend: 'up'
    },
    {
      title: 'Игры',
      value: totalGames,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      change: '+1.8%',
      trend: 'up'
    },
    {
      title: 'Админы',
      value: totalAdmins,
      icon: Users,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      change: '0%',
      trend: 'neutral'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                <div className="flex items-center mt-2">
                  {card.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                  ) : card.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                  ) : (
                    <div className="h-4 w-4 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    card.trend === 'up' ? 'text-green-400' : 
                    card.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {card.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}