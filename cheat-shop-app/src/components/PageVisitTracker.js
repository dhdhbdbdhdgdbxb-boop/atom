"use client";

import { useEffect } from 'react';

export default function PageVisitTracker() {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const response = await fetch('/api/page-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error('Failed to track page visit');
        }
      } catch (error) {
        console.error('Error tracking page visit:', error);
      }
    };
    
    trackVisit();
  }, []);
  
  return null;
}