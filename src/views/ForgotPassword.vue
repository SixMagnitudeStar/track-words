<template>
  <div class="forgot-password-container">
    <h2>Forgot Password</h2>
    <form @submit.prevent="requestReset">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Sending...' : 'Send Reset Link' }}
      </button>
      <p v-if="message" :class="{ 'success-message': success, 'error-message': !success }">{{ message }}</p>
      <p class="back-to-login">
        Remember your password? <router-link to="/login">Login</router-link>
      </p>
    </form>
  </div>
</template>

<script>
import axios from '../axios'; // Adjust path if necessary
import { useRouter } from 'vue-router';

export default {
  name: 'ForgotPassword',
  data() {
    return {
      email: '',
      loading: false,
      message: '',
      success: false,
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    async requestReset() {
      this.loading = true;
      this.message = '';
      this.success = false;
      try {
        const response = await axios.post('/request-password-reset', { email: this.email });
        this.message = response.data.message;
        this.success = true;
        this.router.push({ path: '/reset-password', query: { email: this.email } });
        // Optionally, you might still want to show a message before redirecting
        // this.message = response.data.message; 
        console.log(response.data);
      } catch (error) {
        this.message = error.response?.data?.detail || 'An error occurred. Please try again.';
        this.success = false;
        console.error('Password reset request failed:', error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  background-color: #f0f2f5;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

form {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: bold;
}

input[type="email"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.success-message {
  color: #28a745;
  margin-top: 15px;
  text-align: center;
}

.error-message {
  color: #dc3545;
  margin-top: 15px;
  text-align: center;
}

.back-to-login {
  margin-top: 20px;
  text-align: center;
  color: #666;
}

.back-to-login a {
  color: #007bff;
  text-decoration: none;
}

.back-to-login a:hover {
  text-decoration: underline;
}
</style>
