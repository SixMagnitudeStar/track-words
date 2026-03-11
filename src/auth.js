
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode' // Import jwtDecode

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    isAdmin: false // Add isAdmin state
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    getIsAdmin: (state) => state.isAdmin // Getter for isAdmin
  },
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
      try {
        const decoded = jwtDecode(token)
        this.isAdmin = decoded.is_admin || false // Set isAdmin from token payload
        console.log('AuthStore: setToken - isAdmin set to', this.isAdmin);
      } catch (error) {
        console.error('Error decoding token in setToken:', error)
        this.isAdmin = false
      }
    },
    clearToken() {
      this.token = null
      localStorage.removeItem('token')
      this.isAdmin = false // Clear isAdmin state
      console.log('AuthStore: clearToken - isAdmin set to', this.isAdmin);
    },
    // Add an action to check auth status on app load or refresh
    checkAuthStatus() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          if (decoded.exp > currentTime) {
            this.token = token;
            this.isAdmin = decoded.is_admin || false;
            console.log('AuthStore: checkAuthStatus - isAdmin set to', this.isAdmin);
          } else {
            this.clearToken(); // Token expired
            console.log('AuthStore: checkAuthStatus - Token expired, isAdmin cleared.');
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          this.clearToken();
        }
      } else {
        this.clearToken();
        console.log('AuthStore: checkAuthStatus - No token found, isAdmin cleared.');
      }
    }
  }
})
