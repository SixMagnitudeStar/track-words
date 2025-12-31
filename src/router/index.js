// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import ELPView from '../views/ELP.vue'
import loginView from '@/views/login.vue'
import UnfamiliarWordsView from '../views/UnfamiliarWordsArea.vue'
import articleReadingPage from '@/views/articleReading.vue'
import personalSetting from '@/views/personalSetting.vue'
import { useAuthStore } from '@/auth.js'
import signUp from '@/views/signUp.vue'
import EnZhQuiz from '@/views/EnZhQuiz.vue'
//import jwtDecode from 'jwt-decode'

//console.log('jwtDecode:', jwtDecode) // 調試：檢// 備用方案：嘗試顯式訪問 default
import { jwtDecode } from 'jwt-decode' // 直接引入命名導出
console.log('jwtDecode:', jwtDecode) // 應為函數



const routes = [
  { path: '/', redirect: '/Home' },
  {
    path: '/home',
    name: 'Home',
    component: HomeView
  },
  { path: '/ELP', component: ELPView},
  { path: '/login', component: loginView},
  { path: '/UnfamiliarWordsArea', component: UnfamiliarWordsView},
  { path: '/articleReading', 
    component: articleReadingPage,
    meta: { requiresAuth: true },
    name: 'articleReading'
  
  },
  { path: '/signup', component: signUp},
    
  { path: '/personalSetting', component: personalSetting},
  { path: '/EnZhQuiz', component: EnZhQuiz}
  // 你可以在這裡加入更多頁面
]

const router = createRouter({
  history: createWebHistory(),
  routes
})




// 全域路由守衛
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const token = auth.token || localStorage.getItem('token')

  // 1. 定義「不需要登入」的白名單頁面 (使用路徑或是 Name)
  const whiteList = ['/login', '/signup']
  const isWhiteList = whiteList.includes(to.path)

  // 2. 如果要去的是白名單頁面，直接放行
  if (isWhiteList) {
    return next()
  }

  // 3. 如果不是白名單，檢查是否有 Token
  if (!token) {
    // 沒 Token 且不在白名單 -> 強制回登入頁
    return next('/login')
  }

  // 4. 有 Token，驗證是否過期
  try {
    const decoded = jwtDecode(token)
    const currentTime = Date.now() / 1000

    if (decoded.exp < currentTime) {
      // 已過期
      alert('登入已過期，請重新登入')
      auth.clearToken()
      return next('/login')
    }

    // 5. Token 有效，確保 Store 裡面的 token 是同步的
    if (!auth.token) {
      auth.token = token 
    }
    
    next() // 驗證通過，放行
  } catch (error) {
    // Token 解析失敗 (可能是亂碼或偽造)
    console.error('Invalid Token', error)
    auth.clearToken()
    next('/login')
  }
})


export default router