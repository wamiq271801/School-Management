import { useEffect } from 'react';

/**
 * Hook to scroll the main content area to top when component mounts
 * Works with the AppLayout's main scroll container
 */
export const useScrollToTop = () => {
  useEffect(() => {
    // Find the main scroll container
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
};
