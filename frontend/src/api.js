import axios from 'axios';

const apiClient = axios.create({
  baseURL: '',
});

// Request interceptor: подставляем accessToken
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: при 401 пробуем обновить токен
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!accessToken || !refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (username, password, role) =>
    apiClient.post('/api/auth/register', { username, password, role }),
  login: (username, password) =>
    apiClient.post('/api/auth/login', { username, password }),
  me: () => apiClient.get('/api/auth/me'),
  logout: (refreshToken) =>
    apiClient.post('/api/auth/logout', { refreshToken }),
};

// Products API
export const productsAPI = {
  getAll: () => apiClient.get('/api/products'),
  getById: (id) => apiClient.get(`/api/products/${id}`),
  create: (data) => apiClient.post('/api/products', data),
  update: (id, data) => apiClient.put(`/api/products/${id}`, data),
  delete: (id) => apiClient.delete(`/api/products/${id}`),
};

// Users API (admin)
export const usersAPI = {
  getAll: () => apiClient.get('/api/users'),
  getById: (id) => apiClient.get(`/api/users/${id}`),
  update: (id, data) => apiClient.put(`/api/users/${id}`, data),
  block: (id) => apiClient.delete(`/api/users/${id}`),
};

export default apiClient;
