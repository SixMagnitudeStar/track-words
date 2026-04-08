import axios from 'axios'
import { useAuthStore } from '@/auth'
import router from './router'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE
})

//request 攔截器：每次請求前帶上 token
api.interceptors.request.use(
  (config) => {
    // 排除登入、註冊、重設密碼等不需要 token 的路徑
    const excludedPaths = ['/login', '/register', '/signup', '/forgot-password', '/reset-password']
    const isExcluded = excludedPaths.some(path => config.url.includes(path))

    if (!isExcluded) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

//Axios 攔截器 (處理 401 Unauthorized)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401){
      const auth = useAuthStore()
      auth.clearToken()
      localStorage.removeItem('token')
      router.push('/login')
    }
    return Promise.reject(err)
  }
)


export default api