// src/components/Sakura.tsx
import { useEffect } from 'react';

declare global {
  interface Window {
    Sakura: new (selector: string, options?: unknown) => {
      stop?: () => void;
    };
  }
}

export function Sakura() {
  useEffect(() => {
    // Load the script dynamically
    const script = document.createElement('script');
    script.src = '/sakura/sakura.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Initialize Sakura after script loads
    script.onload = () => {
      if (window.Sakura) {
        new window.Sakura('.hyperiya-ab-container', {
          className: 'sakura',
        });
      }
    };
    
    // Cleanup
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return null;
}
