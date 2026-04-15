'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function ConversionTrackerInner() {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('signup_complete') === '1') {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion_event_signup', {});
      }
      // Meta Pixel: track CompleteRegistration
      if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
        (window as any).fbq('track', 'CompleteRegistration');
      }
    }
  }, [searchParams]);
  return null;
}

export default function ConversionTracker() {
  return (
    <Suspense fallback={null}>
      <ConversionTrackerInner />
    </Suspense>
  );
}
