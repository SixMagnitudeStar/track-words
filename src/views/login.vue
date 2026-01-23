<template>
    <div class="login-container">
    <h1>Login</h1>
    <!-- <form> -->
        <input type="email" placeholder="Email" v-model="email" required >
        <input type="password" placeholder="Password"  v-model="password" required>
        <!-- <button type="submit" @click="login">Login</button> -->
        <button type="button" @click="login" :disabled="isLoading">
            <span v-if="isLoading" class="loading-dots">
            <span>.</span><span>.</span><span>.</span>
            </span>
            <span v-else>Login</span>
        </button>
        <p v-if="error" style="color:red">{{ error }}</p>
        <p>Don't have an account? <router-link to="/signup">Sign Up</router-link></p>
    <!-- </form> --> 
    </div>
</template>

<script>
export default {
  name: 'LoginView' // 使用多单词名称
}
</script>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/auth.js'
import { useRouter } from 'vue-router'  // <-- 匯入 router
import api from '@/axios.js'


const email = ref('')
const password = ref('')

const error = ref('')

const auth = useAuthStore()
const router = useRouter()  // <-- 取得 router 實例

async function login() {
  if (isLoading.value) return;

  isLoading.value = true;

  error.value = '';
  // alert(process.env.VUE_APP_API_BASE);
  try {
    const response = await api.post('/login', {
      email: email.value,
      password: password.value
    })
    auth.setToken(response.data.access_token)
    localStorage.setItem('token', response.data.access_token)   // 存到 localStorage
    error.value = ''
    // console.log('chk'+JSON.stringify(response.data))
   // router.push('/articleReading')

    router.push({ name: 'Home' })
  } catch (err) {
    console.error(err)
    error.value = 'Login failed'
  } finally {
    isLoading.value = false;
  }
}

</script>

<style scoped>

.login-container input {
  width: 95%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.login-container button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
}


.login-container button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

.loading-dots span {
  animation: blink 1.4s infinite both;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0% {
    opacity: 0.2;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

</style>