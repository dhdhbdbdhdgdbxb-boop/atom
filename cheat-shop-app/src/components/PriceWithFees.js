import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const PriceWithFees = ({ 
  productId, 
  variantId, 
  basePrice, 
  currency, 
  paymentMethod = 'card',
  quantity = 1,
  couponCode = null,
  showBreakdown = false,
  className = ''
}) => {
  const { language } = useLanguage();
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId || !variantId || !paymentMethod) {
      return;
    }

    const fetchCalculation = async () => {
      setLoading(true);
      
      try {
        const response = await fetch('/api/calculate-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            variantId,
            paymentMethod,
            quantity,
            couponCode
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setCalculation(data.calculation);
        }
      } catch (error) {
        console.error('Error calculating price with fees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalculation();
  }, [productId, variantId, paymentMethod, quantity, couponCode]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-300 rounded w-20"></div>
      </div>
    );
  }

  if (!calculation) {
    // Fallback to base price if calculation fails
    const currencySymbol = currency === 'USD' ? '$' : '₽';
    const displayPrice = language === 'ru' && currency === 'USD' ? 
      `${basePrice} ${currencySymbol}` : 
      `${basePrice} ${currencySymbol}`;
    
    return (
      <span className={className}>
        {displayPrice}
      </span>
    );
  }

  const priceData = currency === 'USD' ? calculation.usd : calculation.rub;
  const currencySymbol = currency === 'USD' ? '$' : '₽';
  
  if (!showBreakdown) {
    return (
      <span className={className}>
        {priceData.totalAmount.toFixed(2)} {currencySymbol}
      </span>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Базовая цена:</span>
          <span>{priceData.baseAmount.toFixed(2)} {currencySymbol}</span>
        </div>
        
        {priceData.percentageFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              Комиссия ({priceData.feeSettings?.percentageRate || 0}%):
            </span>
            <span>{priceData.percentageFee.toFixed(2)} {currencySymbol}</span>
          </div>
        )}
        
        {priceData.fixedFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Фиксированная комиссия:</span>
            <span>{priceData.fixedFee.toFixed(2)} {currencySymbol}</span>
          </div>
        )}
        
        {calculation.couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-400">
            <span>Скидка ({calculation.couponDiscount}%):</span>
            <span>-{((priceData.baseAmount * calculation.couponDiscount) / 100).toFixed(2)} {currencySymbol}</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-lg border-t border-gray-600 pt-1">
          <span>Итого:</span>
          <span>{priceData.totalAmount.toFixed(2)} {currencySymbol}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceWithFees;