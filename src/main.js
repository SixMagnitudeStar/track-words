import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import router from './router'

import { useAuthStore } from './auth.js' // Import useAuthStore

const app = createApp(App)

app.use(router)

const pinia = createPinia()
app.use(pinia) // Must be used before mounting

// Initialize auth state
const authStore = useAuthStore()
authStore.checkAuthStatus()

app.mount('#app')
