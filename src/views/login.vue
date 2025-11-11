<template>
    <div class="login-container">
    <h1>Login</h1>
    <!-- <form> -->
        <input type="text" placeholder="Username" v-model="username" required >
        <input type="password" placeholder="Password"  v-model="password" required>
        <!-- <button type="submit" @click="login">Login</button> -->
        <button type="button" @click="login">Login</button>
        <p v-if="error" style="color:red">{{ error }}</p>
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
// import axios from 'axios'
import { useRouter } from 'vue-router'  // <-- 匯入 router

import api from '@/axios.js'


// import { defineOptions } from 'vue'


// defineOptions({
//   name: 'loginView'
// })

// alert(process.env.VUE_APP_API_BASE);


const username = ref('')
const password = ref('')

username.value='plaisir963'
password.value='yuizxc789'

const error = ref('')

const auth = useAuthStore()
const router = useRouter()  // <-- 取得 router 實例

async function login() {
  alert(process.env.VUE_APP_API_BASE);
  try {
    const response = await api.post('/login', {
      username: username.value,
      password: password.value
    })
    auth.setToken(response.data.access_token)
    localStorage.setItem('token', response.data.access_token)   // 存到 localStorage
    error.value = ''
    console.log('chk'+JSON.stringify(response.data))
   // router.push('/articleReading')
    alert('跳轉')
    router.push({ name: 'articleReading' })
  } catch (err) {
    console.error(err)
    error.value = 'Login failed'
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
}

</style>