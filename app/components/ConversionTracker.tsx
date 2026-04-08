'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
    interface Window {
          gtag?: (...args: unknown[]) => void;
    }
}

export default function ConversionTracker() {
    const searchParams = useSearchParams();

  useEffect(() => {
        if (searchParams.get('signup_complete') === '1') {
                if (typeof window !== 'undefined' && window.gtag) {
                          window.gtag('event', 'conversion_event_signup', {});
                }
        }
  }, [searchParams]);

  return null;
}
