import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Attach JWT to every request if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bikeflux_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
