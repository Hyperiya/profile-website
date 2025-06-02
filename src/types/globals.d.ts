// src/types/global.d.ts
interface Window {
  API_URL: string;
  apiCall: (endpoint: string, options: any) => Promise<any>;
}
