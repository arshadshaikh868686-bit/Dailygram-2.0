import axios from 'axios'
import { clearSession, getRefreshToken, getToken, saveSession } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

let refreshPromise = null

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, { refreshToken })
      .then(response => {
        const accessToken = response.data?.accessToken

        if (!accessToken) {
          throw new Error('Refresh token response did not contain an access token')
        }

        saveSession({
          accessToken,
          refreshToken,
          userid: JSON.parse(localStorage.getItem('dailygram_user') || '{}')?.userid,
          name: JSON.parse(localStorage.getItem('dailygram_user') || '{}')?.name,
          email: JSON.parse(localStorage.getItem('dailygram_user') || '{}')?.email,
          role: JSON.parse(localStorage.getItem('dailygram_user') || '{}')?.role,
          skills: JSON.parse(localStorage.getItem('dailygram_user') || '{}')?.skills || []
        })

        return accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.request.use(config => {
  const token = getToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const status = error.response?.status

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const accessToken = await refreshAccessToken()
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      clearSession()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    }
  }
)

export const getError = error =>
  error?.response?.data?.message ||
  error?.message ||
  'Something went wrong'

export default api
