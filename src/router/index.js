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


// // 全域路由守衛
router.beforeEach((to, from, next) => {
 const auth = useAuthStore()
 const token = auth.token || localStorage.getItem('token') // 從 pinia 或 localStorage 拿 token
// const token = localStorage.getItem('token') 

 // 檢查token是否過期
  if (token) {
    try {
      const { exp } = jwtDecode(token)

      if (Date.now() > exp * 1000) {
        auth.clearToken()           // ← 一定要加 ()
        localStorage.removeItem('token')
        return next('/login')
      }
    } catch (e) {
      auth.clearToken()
      localStorage.removeItem('token')
      return next('/login')
    }
  }
  // }else {
  //   // 沒 token
  //   if (to.meta.requiresAuth) {
  //     return next('/login')
  //   } else {
  //     return next()
  //   }
  // }

  if (to.meta.requiresAuth && !token) {
    // 沒有登入，跳回 login
    next('/login')
  } else {
    next()
  }
})



export default router