
// Get CSRF token from cookie
const getCsrfToken = (): string | null => {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let cookie of cookieArray) {
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null;
};

// Fetch CSRF token from backend
export const fetchCsrfToken = async (): Promise<void> => {
    try {
        const response = await fetch(`https://api.hyperiya.com/api/auth/csrf-token`, {
            method: 'GET',
            credentials: 'include',
        });
        
        // Get token from response
        const data = await response.json();
        if (data.csrfToken) {
            // Manually set the cookie on the frontend domain
            document.cookie = `XSRF-TOKEN=${data.csrfToken}; path=/; SameSite=Lax`;
        }
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
    }
};


interface RequestOptions extends RequestInit {
    skipCsrf?: boolean;
}

// API client with CSRF protection
export const api = {
    fetch: async (url: string, options: RequestOptions = {}) => {
        const { skipCsrf = false, headers = {}, ...rest } = options;

        // Ensure headers is always a plain object
        let headersObj: Record<string, string> = {};
        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                headersObj[key] = value;
            });
        } else if (Array.isArray(headers)) {
            headers.forEach(([key, value]) => {
                headersObj[key] = value;
            });
        } else {
            headersObj = { ...headers };
        }

        // Add CSRF token to non-GET requests
        if (!skipCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
            // Ensure we have a CSRF token before making non-GET requests
            let csrfToken = getCsrfToken();
            if (!csrfToken) {
                // If no token exists, fetch it from the server first
                await fetchCsrfToken();
                csrfToken = getCsrfToken();
            }
            
            if (csrfToken) {
                headersObj['X-XSRF-TOKEN'] = csrfToken;
            } else {
                console.error('CSRF token not found even after fetching');
            }
        }


        // Include credentials to ensure cookies are sent
        const fetchOptions: RequestInit = {
            ...rest,
            headers: headersObj,
            credentials: 'include',
        };


        const response = await fetch(`https://api.hyperiya.com${url}`, fetchOptions);

        // Handle 403 errors specifically for CSRF token issues
        if (response.status === 403) {
            const data = await response.json();
            if (data.error === 'Invalid CSRF token') {
                // You might want to handle this specifically, like showing a message
                // or redirecting to login
                console.error('CSRF token validation failed');
            }
        }

        return response;
    },

    get: (url: string, options: RequestOptions = {}) => {
        return api.fetch(url, { ...options, method: 'GET' });
    },

    post: (url: string, data: any, options: RequestOptions = {}) => {
        // Don't stringify FormData objects
        const body = data instanceof FormData ? data : JSON.stringify(data);

        // Only set Content-Type if not FormData
        let headers = options.headers || {};
        if (!(data instanceof FormData)) {
            headers = { ...headers, 'Content-Type': 'application/json' };
        }

        return api.fetch(url, {
            ...options,
            method: 'POST',
            headers,
            body,
        });
    },

    put: (url: string, data: any, options: RequestOptions = {}) => {
        return api.fetch(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: (url: string, options: RequestOptions = {}) => {
        return api.fetch(url, { ...options, method: 'DELETE' });
    },
};