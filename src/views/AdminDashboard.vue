<template>
  <div class="admin-dashboard">
    <div class="container">
      <h1>管理員後台 - 使用者列表</h1>
      
      <div v-if="loading" class="loading">載入中...</div>
      
      <div v-else-if="error" class="error">{{ error }}</div>
      
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>暱稱</th>
              <th>驗證狀態</th>
              <th>管理員</th>
              <th>註冊時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.nickname || 'N/A' }}</td>
              <td>
                <span :class="user.is_verified ? 'status-active' : 'status-inactive'">
                  {{ user.is_verified ? '已驗證' : '未驗證' }}
                </span>
              </td>
              <td>{{ user.is_admin ? '是' : '否' }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/axios.js'

const users = ref([])
const loading = ref(true)
const error = ref(null)

const fetchUsers = async () => {
  try {
    loading.value = true
    const response = await api.get('/admin/users')
    users.value = response.data
    error.value = null
  } catch (err) {
    console.error('獲取使用者列表失敗:', err)
    error.value = err.response?.data?.detail || '無法獲取資料，請確認管理員權限。'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  background-color: #f4f7f6;
  min-height: 100vh;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
  border-bottom: 2px solid #42b983;
  padding-bottom: 0.5rem;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  text-align: left;
  padding: 12px 15px;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #42b983;
  color: white;
  font-weight: bold;
}

tr:hover {
  background-color: #f1f1f1;
}

.status-active {
  color: #27ae60;
  font-weight: bold;
}

.status-inactive {
  color: #e74c3c;
  font-weight: bold;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #e74c3c;
}
</style>
