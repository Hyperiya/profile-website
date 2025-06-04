import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'

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
  const url = `${window.API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

createRoot(document.getElementById('root')!).render(
  <App />
)

