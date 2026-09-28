import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://campusfix-vnhn.onrender.com/api';
export const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusfix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid session
      const base = import.meta.env.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : base + '/';
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && currentPath !== cleanBase) {
        localStorage.removeItem('campusfix_token');
        localStorage.removeItem('campusfix_user');
        window.location.href = `${cleanBase}login?expired=true`;
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Issues Endpoints
export const issueAPI = {
  analyzePreview: (formData) => api.post('/issues/analyze-preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createIssue: (formData) => api.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyIssues: (params) => api.get('/issues/my', { params }),
  getIssueById: (id) => api.get(`/issues/${id}`),
  confirmResolution: (id, data) => api.post(`/issues/${id}/confirm-resolution`, data),
  addComment: (id, commentData) => api.post(`/issues/${id}/comments`, commentData),
};

// Maintenance Endpoints
export const maintenanceAPI = {
  getMyAssignedIssues: (params) => api.get('/maintenance/assigned', { params }),
  startWork: (id, data) => api.post(`/maintenance/issues/${id}/start-work`, data),
  addProgress: (id, data) => api.post(`/maintenance/issues/${id}/progress`, data),
  resolveIssue: (id, formData) => api.post(`/maintenance/issues/${id}/resolve`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Admin Endpoints
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getAllIssues: (params) => api.get('/admin/issues', { params }),
  reviewIssueAI: (id, data) => api.patch(`/admin/issues/${id}/review`, data),
  assignTeam: (id, data) => api.post(`/admin/issues/${id}/assign`, data),
  updateStatus: (id, data) => api.patch(`/admin/issues/${id}/status`, data),
  resolveDuplicate: (id, data) => api.post(`/admin/issues/${id}/resolve-duplicate`, data),
  getTeams: () => api.get('/admin/teams'),
  createTeam: (data) => api.post('/admin/teams', data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  getRecurringProblems: () => api.get('/admin/recurring-problems'),
};

// Notifications Endpoints
export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
};

export default api;
