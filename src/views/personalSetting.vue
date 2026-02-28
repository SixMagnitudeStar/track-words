<template>
  <div class="container">
    <!-- 風格設定 -->
    <section class="card">
      <h2>風格設定</h2>
      <div class="form-group">
        <label>暱稱</label>
        <input type="text" v-model="userData.nickname" placeholder="輸入暱稱" />
      </div>
      <div class="form-group">
        <label>背景顏色</label>
        <input type="color" />
      </div>
    </section>

    <!-- 會員資訊 -->
    <section class="card">
      <h2>會員資訊</h2>
      <div class="info-group">
        <label>會員等級:</label>
        <span>{{ userData.subscription?.plan_name || 'N/A' }}</span>
      </div>
      <div class="info-group">
        <label>訂閱狀態:</label>
        <span>{{ subscriptionStatusText }}</span>
      </div>
      <div class="info-group">
        <label>訂閱開始日期:</label>
        <span>{{ formatDate(userData.subscription?.start_date) }}</span>
      </div>
      <div class="info-group">
        <label>訂閱結束日期:</label>
        <span>{{ formatDate(userData.subscription?.end_date) }}</span>
      </div>
      <div class="info-group" v-if="userData.subscription?.plan_price > 0">
        <label>方案費用:</label>
        <span>{{ userData.subscription?.plan_price }}</span>
      </div>
      <div class="info-group">
        <label>方案描述:</label>
        <span>{{ userData.subscription?.plan_description || 'N/A' }}</span>
      </div>
    </section>

    <!-- 文章設定 -->
    <section class="card">
      <h2>文章設定</h2>
      <div class="form-group">
        <label>文章主題</label>
        <textarea rows="5" placeholder="輸入文章主題或欲生成內容的描述..."></textarea>
      </div>
      <div class="form-group">
        <label>文章字數</label>
        <input type="number" placeholder="設定文章字數限制 (500~2500)" />
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 容器 */
.container {
  /* max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: Arial, sans-serif; */
}

/* 卡片區塊 */
.card {
  margin-top: 50px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
}

/* 標題 */
.card h2 {
  font-size: 1.5rem;
  margin-bottom: 15px;
}

/* 表單群組 */
.form-group, .info-group {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group label, .info-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  min-width: 100px; /* 統一 label 寬度 */
  font-weight: bold;
}

.info-group span {
    color: #555;
    font-size: 1rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group input[type="color"] {
  flex-grow: 1; /* 讓輸入框佔據剩餘空間 */
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 1rem;
}

textarea {
  resize: vertical;
}

/* input[type="color"] 小調整 */
input[type="color"] {
  width: 60px;
  height: 35px;
  padding: 0;
  border: none;
  cursor: pointer;
}
</style>
<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/axios.js';

/* global defineOptions */
defineOptions({
  name: 'personalSetting'
});

const userData = ref({
  email: '',
  nickname: '',
  subscription: null // Initialize as null or empty object
});

onMounted(async () => {
  try {
    const response = await api.get('/profile');
    userData.value = response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
});

const subscriptionStatusText = computed(() => {
  if (!userData.value.subscription) return 'N/A';
  switch (userData.value.subscription.status) {
    case 'active': return '啟用中';
    case 'expired': return '已過期';
    case 'canceled': return '已取消';
    case 'trialing': return '試用中';
    default: return userData.value.subscription.status;
  }
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(); // Format as local date string
};
</script>
<!-- 
<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 5px;
  color: white;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type="text"],
select,
textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-sizing: border-box;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
</style> -->