import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { CreditCard, Smartphone, Wallet, DollarSign } from 'lucide-react';

const PaymentMethodSelector = ({ 
  productId, 
  variantId, 
  quantity = 1,
  couponCode = null,
  onMethodSelect,
  selectedMethod = 'card',
  className = ''
}) => {
  const { language } = useLanguage();
  const [calculations, setCalculations] = useState({});
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    {
      id: 'card',
      name: language === 'ru' ? 'Банковская карта' : 'Bank Card',
      icon: CreditCard,
      description: language === 'ru' ? 'Visa, MasterCard, МИР' : 'Visa, MasterCard, MIR'
    },
    {
      id: 'antilopay',
      name: language === 'ru' ? 'Antilopay' : 'Antilopay',
      icon: CreditCard,
      description: language === 'ru' ? 'Карты РФ, СБП' : 'Russian cards, SBP'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: CreditCard,
      description: language === 'ru' ? 'Visa, MasterCard (международные)' : 'Visa, MasterCard (international)'
    },
    {
      id: 'cryptocloud',
      name: language === 'ru' ? 'Криптовалюта' : 'Cryptocurrency',
      icon: DollarSign,
      description: language === 'ru' ? 'Bitcoin, Ethereum, USDT' : 'Bitcoin, Ethereum, USDT'
    },
    {
      id: 'sbp',
      name: language === 'ru' ? 'СБП' : 'SBP',
      icon: Smartphone,
      description: language === 'ru' ? 'Система быстрых платежей' : 'Fast Payment System'
    }
  ];

  useEffect(() => {
    if (!productId || !variantId) {
      return;
    }

    const fetchCalculations = async () => {
      setLoading(true);
      
      try {
        const params = new URLSearchParams({
          productId: productId.toString(),
          variantId: variantId.toString(),
          quantity: quantity.toString()
        });

        if (couponCode) {
          params.append('couponCode', couponCode);
        }

        const response = await fetch(`/api/calculate-price?${params}`);
        const data = await response.json();

        if (data.success) {
          setCalculations(data.calculations);
        }
      } catch (error) {
        console.error('Error fetching price calculations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalculations();
  }, [productId, variantId, quantity, couponCode]);

  const handleMethodSelect = (methodId) => {
    onMethodSelect?.(methodId);
  };

  const formatPrice = (amount, currency) => {
    const currencySymbol = currency === 'USD' ? '$' : '₽';
    return `${amount.toFixed(2)} ${currencySymbol}`;
  };

  const getMethodCalculation = (methodId) => {
    const calc = calculations[methodId];
    if (!calc) return null;
    
    return language === 'ru' ? calc.rub : calc.usd;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">
        {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
      </h3>
      
      {paymentMethods.map((method) => {
        const calculation = getMethodCalculation(method.id);
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;
        
        return (
          <div
            key={method.id}
            onClick={() => handleMethodSelect(method.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-white/10 hover:border-cyan-400/50 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-cyan-400 text-black' : 'bg-white/10 text-white'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{method.name}</h4>
                  <p className="text-gray-400 text-sm">{method.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-5 bg-gray-300 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                  </div>
                ) : calculation ? (
                  <div>
                    <div className="text-cyan-400 font-bold">
                      {formatPrice(calculation.totalAmount, language === 'ru' ? 'RUB' : 'USD')}
                    </div>
                    {calculation.totalFee > 0 && (
                      <div className="text-gray-400 text-xs">
                        +{formatPrice(calculation.totalFee, language === 'ru' ? 'RUB' : 'USD')} 
                        {language === 'ru' ? ' комиссия' : ' fee'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                  </div>
                )}
              </div>
            </div>
            
            {isSelected && calculation && calculation.totalFee > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>{language === 'ru' ? 'Базовая цена:' : 'Base price:'}</span>
                    <span>{formatPrice(calculation.baseAmount, language === 'ru' ? 'RUB' : 'USD')}</span>
                  </div>
                  {calculation.percentageFee > 0 && (
                    <div className="flex justify-between">
                      <span>
                        {language === 'ru' ? 'Процентная комиссия:' : 'Percentage fee:'} 
                        ({calculation.feeSettings?.percentageRate || 0}%)
                      </span>
                      <span>{formatPrice(calculation.percentageFee, language === 'ru' ? 'RUB' : 'USD')}</span>
                    </div>
                  )}
                  {calculation.fixedFee > 0 && (
                    <div className="flex justify-between">
                      <span>{language === 'ru' ? 'Фиксированная комиссия:' : 'Fixed fee:'}</span>
                      <span>{formatPrice(calculation.fixedFee, language === 'ru' ? 'RUB' : 'USD')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;