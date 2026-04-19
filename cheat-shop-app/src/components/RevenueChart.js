"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function RevenueChart() {
  const [stats, setStats] = useState([]);
  const [period, setPeriod] = useState('7D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('rub'); // 'usd' or 'rub'
  
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Получаем данные из API с учетом периода
      const response = await fetch(`/api/admin/statistics/revenue-chart?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.revenueData);
      } else {
        throw new Error(data.error || 'Failed to fetch revenue data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching revenue stats:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStats();
  }, [period]);
  
  const formatChartData = () => {
    if (!stats || stats.length === 0) return [];
    
    return stats.map(stat => ({
      name: new Date(stat.date).toLocaleDateString('ru-RU', {
        month: 'short',
        day: 'numeric'
      }),
      revenue: currency === 'usd' ? stat.revenueUsd : stat.revenueRub,
    }));
  };
  
  const chartData = formatChartData();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#161616] border border-[#383838] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-regular text-white">Статистика дохода</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrency('usd')}
              className={`px-3 py-1 rounded-lg text-sm font-regular transition-colors cursor-pointer ${
                currency === 'usd' ? 'bg-white text-black' : 'bg-[#262626] text-white hover:bg-[#383838]'
              }`}
            >
              $
            </button>
            <button
              onClick={() => setCurrency('rub')}
              className={`px-3 py-1 rounded-lg text-sm font-regular transition-colors cursor-pointer ${
                currency === 'rub' ? 'bg-white text-black' : 'bg-[#262626] text-white hover:bg-[#383838]'
              }`}
            >
              ₽
            </button>
          </div>
          <button
            onClick={() => setPeriod('7D')}
            className={`px-3 py-1 rounded-lg text-sm font-regular transition-colors ${
              period === '7D'
                ? 'bg-white text-black'
                : 'bg-[#262626] text-white hover:bg-[#383838]'
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setPeriod('30D')}
            className={`px-3 py-1 rounded-lg text-sm font-regular transition-colors ${
              period === '30D'
                ? 'bg-white text-black'
                : 'bg-[#262626] text-white hover:bg-[#383838]'
            }`}
          >
            30D
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm font-regular">Ошибка: {error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#383838] transition-colors"
          >
            Повторить попытку
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#989898] text-sm font-light">Нет данных за выбранный период</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
              <XAxis 
                dataKey="name"
                stroke="#989898"
                tick={{ fontSize: 12, fill: '#989898' }}
                tickLine={{ stroke: '#383838' }}
              />
              <YAxis 
                stroke="#989898"
                tick={{ fontSize: 12, fill: '#989898' }}
                tickLine={{ stroke: '#383838' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#161616',
                  border: '1px solid #383838',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                labelStyle={{ color: '#ffffff' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Legend 
                wrapperStyle={{ color: '#989898', fontSize: '12px' }}
                iconSize={12}
              />
              <Area 
                type="monotone"
                dataKey="revenue"
                name="Доход"
                stroke="#ffffff"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#ffffff]"></div>
            <span className="text-[#989898] font-light">Доход</span>
          </div>
        </div>
        <div className="text-[#989898] font-light">
          Показано за {period === '24H' ? '24 часа' : period === '7D' ? '7 дней' : '30 дней'}
        </div>
      </div>
    </motion.div>
  );
}