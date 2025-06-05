import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import DOMPurify from 'dompurify'

import { api } from './utils/api.ts'

const isDevelopment = import.meta.env.DEV; // true in development, false in production


if (!isDevelopment) {
  const regex = /(\w+\.\w+)(?:\/.*)?$/
  const match = window.location.hostname.match(regex);
  const domain = match ? match[1] : window.location.hostname;
  window.API_URL = `api.${domain}`;
} else {
  window.API_URL = 'https://localhost:5000';
}



window.apiCall = async (endpoint: string, options: any) => {
  const url = `${endpoint}`;
  const response = await api.fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    
    throw new Error(`API error: ${response.status}`);
  }

  const data = DOMPurify.sanitize(await response.json());
  // Ensure that any data rendered to the DOM is sanitized or escaped in your React components.
  return data;
};

createRoot(document.getElementById('root')!).render(
  <App />
)

