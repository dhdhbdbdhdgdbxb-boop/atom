"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function RevenueAnalytics() {
  const [stats, setStats] = useState([]);
  const [period, setPeriod] = useState('7D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('rub'); // 'usd' or 'rub'
  const [chartType, setChartType] = useState('area'); // 'area' or 'bar'
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [customPeriod, setCustomPeriod] = useState(false);
  
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/admin/statistics/revenue-chart?period=${period}`;
      
      // Если используется кастомный период, добавляем даты
      if (customPeriod && dateRange.start && dateRange.end) {
        url += `&start=${dateRange.start}&end=${dateRange.end}`;
      }
      
      const response = await fetch(url, {
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
  }, [period, dateRange, customPeriod]);
  
  const formatChartData = () => {
    if (!stats || stats.length === 0) return [];
    
    return stats.map(stat => ({
      name: new Date(stat.date).toLocaleDateString('ru-RU', {
        month: 'short',
        day: 'numeric'
      }),
      fullDate: new Date(stat.date).toLocaleDateString('ru-RU'),
      revenue: currency === 'usd' ? parseFloat(stat.revenueUsd || 0) : parseFloat(stat.revenueRub || 0),
      revenueUsd: parseFloat(stat.revenueUsd || 0),
      revenueRub: parseFloat(stat.revenueRub || 0),
    }));
  };
  
  const chartData = formatChartData();
  
  // Вычисляем общий доход и изменение
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;
  
  // Вычисляем изменение по сравнению с предыдущим периодом (упрощенно)
  const recentRevenue = chartData.slice(-3).reduce((sum, item) => sum + item.revenue, 0) / 3;
  const olderRevenue = chartData.slice(0, 3).reduce((sum, item) => sum + item.revenue, 0) / 3;
  const changePercent = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;
  
  const handleCustomPeriod = () => {
    setCustomPeriod(!customPeriod);
    if (!customPeriod) {
      // Устанавливаем дефолтные даты (последние 7 дней)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      });
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Заголовок и контролы */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-regular text-white mb-2">Аналитика доходов</h3>
            <p className="text-[#989898] text-sm">Детальная статистика доходов по валютам и периодам</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Переключатель валют */}
            <div className="flex items-center space-x-1 bg-[#262626] rounded-lg p-1">
              <button
                onClick={() => setCurrency('usd')}
                className={`px-3 py-1 rounded-md text-sm font-regular transition-colors ${
                  currency === 'usd' ? 'bg-white text-black' : 'text-white hover:bg-[#383838]'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('rub')}
                className={`px-3 py-1 rounded-md text-sm font-regular transition-colors ${
                  currency === 'rub' ? 'bg-white text-black' : 'text-white hover:bg-[#383838]'
                }`}
              >
                RUB (₽)
              </button>
            </div>
            
            {/* Переключатель типа графика */}
            <div className="flex items-center space-x-1 bg-[#262626] rounded-lg p-1">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-md text-sm font-regular transition-colors ${
                  chartType === 'area' ? 'bg-white text-black' : 'text-white hover:bg-[#383838]'
                }`}
              >
                Область
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-md text-sm font-regular transition-colors ${
                  chartType === 'bar' ? 'bg-white text-black' : 'text-white hover:bg-[#383838]'
                }`}
              >
                Столбцы
              </button>
            </div>
            
            {/* Переключатель периодов */}
            {!customPeriod && (
              <div className="flex items-center space-x-1 bg-[#262626] rounded-lg p-1">
                <button
                  onClick={() => setPeriod('7D')}
                  className={`px-3 py-1 rounded-md text-sm font-regular transition-colors ${
                    period === '7D' ? 'bg-white text-black' : 'text-white hover:bg-[#383838]'
                  }`}
                >
                  7 дней
                </button>
                <button
                  onClick={() => setPeriod('30D')}
                  className={`px-3 py-1 rounded-md text-sm font-regular transition-colors ${
                    period === '30D' ? 'bg-white text-black' : 'text-white hover:bg-[#383838]'
                  }`}
                >
                  30 дней
                </button>
              </div>
            )}
            
            {/* Кнопка кастомного периода */}
            <button
              onClick={handleCustomPeriod}
              className={`px-3 py-1 rounded-lg text-sm font-regular transition-colors flex items-center gap-2 ${
                customPeriod ? 'bg-white text-black' : 'bg-[#262626] text-white hover:bg-[#383838]'
              }`}
            >
              <Calendar size={16} />
              Период
            </button>
          </div>
        </div>
        
        {/* Кастомный выбор дат */}
        {customPeriod && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-[#262626] rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">От:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-[#161616] border border-[#383838] rounded-lg px-3 py-1 text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">До:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-[#161616] border border-[#383838] rounded-lg px-3 py-1 text-white text-sm"
              />
            </div>
            <button
              onClick={fetchStats}
              className="px-4 py-1 bg-white text-black rounded-lg text-sm font-regular hover:bg-gray-200 transition-colors"
            >
              Применить
            </button>
          </div>
        )}
        
        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#262626] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-green-400" />
              <span className="text-[#989898] text-sm">Общий доход</span>
            </div>
            <p className="text-white text-2xl font-bold">
              {currency === 'usd' ? `$${totalRevenue.toFixed(2)}` : `${totalRevenue.toFixed(2)}₽`}
            </p>
          </div>
          
          <div className="bg-[#262626] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-blue-400" />
              <span className="text-[#989898] text-sm">Средний доход</span>
            </div>
            <p className="text-white text-2xl font-bold">
              {currency === 'usd' ? `$${avgRevenue.toFixed(2)}` : `${avgRevenue.toFixed(2)}₽`}
            </p>
          </div>
          
          <div className="bg-[#262626] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {changePercent >= 0 ? (
                <TrendingUp size={20} className="text-green-400" />
              ) : (
                <TrendingDown size={20} className="text-red-400" />
              )}
              <span className="text-[#989898] text-sm">Изменение</span>
            </div>
            <p className={`text-2xl font-bold ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      
      {/* График */}
      <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
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
                    formatter={(value, name) => [
                      `${currency === 'usd' ? '$' : ''}${parseFloat(value).toFixed(2)}${currency === 'rub' ? '₽' : ''}`,
                      'Доход'
                    ]}
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
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
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
                    formatter={(value, name) => [
                      `${currency === 'usd' ? '$' : ''}${parseFloat(value).toFixed(2)}${currency === 'rub' ? '₽' : ''}`,
                      'Доход'
                    ]}
                  />
                  <Bar 
                    dataKey="revenue"
                    name="Доход"
                    fill="#ffffff"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#ffffff]"></div>
              <span className="text-[#989898] font-light">
                Доход в {currency === 'usd' ? 'долларах' : 'рублях'}
              </span>
            </div>
          </div>
          <div className="text-[#989898] font-light">
            {customPeriod ? 
              `${dateRange.start} - ${dateRange.end}` : 
              `Показано за ${period === '7D' ? '7 дней' : '30 дней'}`
            }
          </div>
        </div>
      </div>
    </motion.div>
  );
}