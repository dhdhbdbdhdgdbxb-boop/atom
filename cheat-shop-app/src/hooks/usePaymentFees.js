import { useState, useEffect } from 'react';

export const usePaymentFees = (productId, variantId, quantity = 1, couponCode = null) => {
  const [calculations, setCalculations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId || !variantId) {
      setCalculations({});
      return;
    }

    const fetchCalculations = async () => {
      setLoading(true);
      setError(null);

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
        } else {
          setError(data.error || 'Failed to calculate prices');
        }
      } catch (err) {
        setError('Network error while calculating prices');
        console.error('Error fetching price calculations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalculations();
  }, [productId, variantId, quantity, couponCode]);

  const calculatePriceForMethod = async (paymentMethod) => {
    if (!productId || !variantId || !paymentMethod) {
      return null;
    }

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
      return data.success ? data.calculation : null;
    } catch (err) {
      console.error('Error calculating price for method:', err);
      return null;
    }
  };

  return {
    calculations,
    loading,
    error,
    calculatePriceForMethod
  };
};