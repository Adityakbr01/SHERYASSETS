import axios from 'axios';// API Configuration using Axios
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});// Request interceptor to add the auth token header
apiClient.interceptors.request.use(
  (config) => {
    // We can't directly import zustand store in an interceptor reliably if it causes circular deps,
    // so we can read it from localStorage
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch (error) {
      console.error('Error reading token from storage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
