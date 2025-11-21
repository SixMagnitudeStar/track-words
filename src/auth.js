
import { defineStore } from 'pinia'

// export const useAuthStore = defineStore('auth', {
//   state: () => ({
//     token: ''  // 這裡放 token
//   }),
//   actions: {
//     setToken(newToken) {
//       this.token = newToken
//     },
//     clearToken() {
//       this.token = ''
//     }
//   }
// })



export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    clearToken() {
      this.token = null
      localStorage.removeItem('token')
    }
  }
})
