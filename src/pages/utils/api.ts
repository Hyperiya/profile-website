// src/utils/api.ts
import { config } from '../config';

export const apiCall = async (endpoint: string, options:any ) => {
    const url = `${config.apiUrl}${endpoint}`;
    console.log(options)
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
};
