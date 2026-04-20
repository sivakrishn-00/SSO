import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/sso-system',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for Auth
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('sso_user'));
        if (user && user.token) {
            config.headers.Authorization = `Token ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
