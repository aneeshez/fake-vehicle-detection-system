import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD ? '/api' : 'http://localhost:8000/api'
);

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 15000
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new Event('api-unauthorized'));
        }
        return Promise.reject(error);
    }
);

export function csrfToken() {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith('csrftoken='));
    return cookie ? decodeURIComponent(cookie.slice('csrftoken='.length)) : '';
}

export async function refreshCsrfToken() {
    await api.get('/auth/csrf/');
    return csrfToken();
}
