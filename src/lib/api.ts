import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5022/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  signup: async (userData: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/signup', userData)
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials)
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken')
  },

  getCurrentUserData: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
}

// SCORM API
export const scormAPI = {
  getSCORMs: async () => {
    const response = await api.get('/scorm')
    return response.data
  },

  getSCORM: async (id: string) => {
    const response = await api.get(`/scorm/${id}`)
    return response.data
  },

  createSCORM: async (scormData: { title: string; description?: string; content?: any[] }) => {
    const response = await api.post('/scorm', scormData)
    return response.data
  },

  updateSCORM: async (id: string, scormData: any) => {
    const response = await api.put(`/scorm/${id}`, scormData)
    return response.data
  },

  deleteSCORM: async (id: string) => {
    const response = await api.delete(`/scorm/${id}`)
    return response.data
  },

  publishSCORM: async (id: string) => {
    const response = await api.post(`/scorm/${id}/publish`)
    return response.data
  }
}

export default api
