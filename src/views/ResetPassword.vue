<template>
  <div class="reset-password-container">
    <h2>Reset Password</h2>
    <form @submit.prevent="resetPassword">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="token">Verification Code:</label>
        <input type="text" id="token" v-model="token" required />
      </div>
      <div class="form-group">
        <label for="newPassword">New Password:</label>
        <input type="password" id="newPassword" v-model="newPassword" required />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm New Password:</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Resetting...' : 'Reset Password' }}
      </button>
      <p v-if="message" :class="{ 'success-message': success, 'error-message': !success }">{{ message }}</p>
    </form>
  </div>
</template>

<script>
import axios from '../axios'; // Adjust path if necessary
import { useRouter } from 'vue-router';

export default {
  name: 'ResetPassword',
  data() {
    return {
      email: '',
      token: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
      message: '',
      success: false,
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  mounted() {
    // Attempt to pre-fill email/token if present in URL query parameters
    const query = this.router.currentRoute.value.query;
    if (query.email) {
      this.email = query.email;
    }
    if (query.token) {
      this.token = query.token;
    }
  },
  methods: {
    async resetPassword() {
      if (this.newPassword !== this.confirmPassword) {
        this.message = 'New password and confirmation do not match.';
        this.success = false;
        return;
      }

      this.loading = true;
      this.message = '';
      this.success = false;
      try {
        const response = await axios.post('/reset-password', {
          email: this.email,
          token: this.token,
          new_password: this.newPassword,
        });
        this.message = response.data.message;
        this.success = true;
        // Redirect to login page on successful password reset
        setTimeout(() => {
          this.router.push('/login');
        }, 3000); // Redirect after 3 seconds
      } catch (error) {
        this.message = error.response?.data?.detail || 'An error occurred. Please try again.';
        this.success = false;
        console.error('Password reset failed:', error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.reset-password-container {
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

input[type="email"],
input[type="text"],
input[type="password"] {
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
</style>
