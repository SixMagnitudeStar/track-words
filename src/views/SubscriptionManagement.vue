<template>
  <div class="subscription-management">
    <h1>訂閱管理</h1>
    
    <section class="subscription-plans-section">
      <h2>訂閱計畫</h2>
      
      <!-- Create/Edit Plan Form -->
      <div class="form-container">
        <h3>{{ isEditingPlan ? '編輯訂閱計畫' : '新增訂閱計畫' }}</h3>
        <form @submit.prevent="isEditingPlan ? updatePlan() : createPlan()">
          <div class="form-group">
            <label for="planName">名稱:</label>
            <input type="text" id="planName" v-model="currentPlan.name" required />
          </div>
          <div class="form-group">
            <label for="planDescription">描述:</label>
            <input type="text" id="planDescription" v-model="currentPlan.description" />
          </div>
          <div class="form-group">
            <label for="planDuration">持續天數:</label>
            <input type="number" id="planDuration" v-model.number="currentPlan.duration_days" required />
          </div>
          <div class="form-group">
            <label for="planPrice">價格:</label>
            <input type="number" step="0.01" id="planPrice" v-model.number="currentPlan.price" required />
          </div>
          <button type="submit">{{ isEditingPlan ? '更新計畫' : '新增計畫' }}</button>
          <button type="button" @click="cancelEditPlan()" v-if="isEditingPlan">取消</button>
        </form>
      </div>

      <!-- Plan List -->
      <div class="plan-list">
        <h3>現有計畫</h3>
        <div v-for="plan in subscriptionPlans" :key="plan.id" class="plan-card">
          <h4>{{ plan.name }}</h4>
          <p>描述: {{ plan.description }}</p>
          <p>持續天數: {{ plan.duration_days }}</p>
          <p>價格: {{ plan.price }}</p>
          <div class="actions">
            <button @click="editPlan(plan)">編輯</button>
            <button @click="deletePlan(plan.id)">刪除</button>
          </div>
        </div>
        <p v-if="subscriptionPlans.length === 0">沒有訂閱計畫。</p>
      </div>
    </section>

    <section class="user-subscriptions-section">
      <h2>使用者訂閱狀態</h2>

      <!-- Search User -->
      <div class="search-user-container form-group">
        <label for="userSearch">搜尋使用者 (Email):</label>
        <input type="text" id="userSearch" v-model="userSearchQuery" @keyup.enter="searchUserSubscriptions" placeholder="輸入使用者 Email" />
        <button @click="searchUserSubscriptions">搜尋</button>
        <button @click="loadAllUserSubscriptions" v-if="userSearchQuery">載入所有訂閱</button>
      </div>

      <!-- User Subscription List -->
      <div class="user-sub-list">
        <h3>使用者訂閱</h3>
        <div v-for="userSub in filteredUserSubscriptions" :key="userSub.id" class="user-sub-card">
          <h4>使用者 ID: {{ userSub.user_id }}</h4>
          <p>計畫: {{ userSub.plan ? userSub.plan.name : '未知' }}</p>
          <p>狀態: {{ userSub.status }}</p>
          <p>開始日期: {{ new Date(userSub.start_date).toLocaleDateString() }}</p>
          <p>結束日期: {{ new Date(userSub.end_date).toLocaleDateString() }}</p>
          <div class="actions">
            <button @click="editUserSubscription(userSub)">編輯</button>
            <button @click="deleteUserSubscription(userSub.user_id)">刪除</button>
          </div>
        </div>
        <p v-if="filteredUserSubscriptions.length === 0">沒有使用者訂閱。</p>
      </div>

      <!-- Edit User Subscription Form -->
      <div class="form-container" v-if="isEditingUserSub">
        <h3>編輯使用者訂閱</h3>
        <form @submit.prevent="updateUserSubscription()">
          <div class="form-group">
            <label>使用者 ID:</label>
            <span>{{ currentUserSub.user_id }}</span>
          </div>
          <div class="form-group">
            <label for="subPlan">訂閱計畫:</label>
            <select id="subPlan" v-model.number="currentUserSub.plan_id" required>
              <option v-for="plan in subscriptionPlans" :key="plan.id" :value="plan.id">
                {{ plan.name }} ({{ plan.price }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="subStatus">狀態:</label>
            <input type="text" id="subStatus" v-model="currentUserSub.status" required />
          </div>
          <div class="form-group">
            <label for="subStartDate">開始日期:</label>
            <input type="date" id="subStartDate" v-model="currentUserSub.start_date_display" required />
          </div>
          <div class="form-group">
            <label for="subEndDate">結束日期:</label>
            <input type="date" id="subEndDate" v-model="currentUserSub.end_date_display" required />
          </div>
          <button type="submit">更新使用者訂閱</button>
          <button type="button" @click="cancelEditUserSubscription()">取消</button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/auth.js'; 
import axios from '@/axios'; 

const authStore = useAuthStore();
const subscriptionPlans = ref([]);
const userSubscriptions = ref([]);
const allUserSubscriptions = ref([]); // To store all fetched subscriptions for local filtering

const isEditingPlan = ref(false);
const currentPlan = ref({}); // For create/edit plan form

const isEditingUserSub = ref(false);
const currentUserSub = ref({}); // For edit user subscription form
const userSearchQuery = ref('');

// Computed property for filtering user subscriptions based on search query
const filteredUserSubscriptions = computed(() => {
    if (!userSearchQuery.value) {
        return userSubscriptions.value;
    }
    const query = userSearchQuery.value.toLowerCase();
    return userSubscriptions.value.filter(sub => 
        (sub.user_id && String(sub.user_id).includes(query)) ||
        (sub.user && sub.user.email && sub.user.email.toLowerCase().includes(query)) // Assuming user email is available if eager loaded
    );
});


// Helper to format Date to 'YYYY-MM-DD' for date input fields
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

// --- Subscription Plan Methods ---
const resetPlanForm = () => {
  isEditingPlan.value = false;
  currentPlan.value = { name: '', description: '', duration_days: 0, price: 0.0 };
};

const fetchSubscriptionPlans = async () => {
  try {
    const response = await axios.get('/admin/subscription-plans/', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    subscriptionPlans.value = response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    alert('無法載入訂閱計畫。');
  }
};

const createPlan = async () => {
  try {
    await axios.post('/admin/subscription-plans/', currentPlan.value, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    alert('訂閱計畫新增成功！');
    resetPlanForm();
    fetchSubscriptionPlans();
  } catch (error) {
    console.error('Error creating plan:', error);
    alert('新增計畫失敗: ' + (error.response?.data?.detail || error.message));
  }
};

const editPlan = (plan) => {
  isEditingPlan.value = true;
  currentPlan.value = { ...plan }; // Copy plan data to form
};

const updatePlan = async () => {
  try {
    await axios.put(`/admin/subscription-plans/${currentPlan.value.id}`, currentPlan.value, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    alert('訂閱計畫更新成功！');
    resetPlanForm();
    fetchSubscriptionPlans();
  } catch (error) {
    console.error('Error updating plan:', error);
    alert('更新計畫失敗: ' + (error.response?.data?.detail || error.message));
  }
};

const cancelEditPlan = () => {
  resetPlanForm();
};

const deletePlan = async (id) => {
  if (confirm('確定要刪除此訂閱計畫嗎？')) {
    try {
      await axios.delete(`/admin/subscription-plans/${id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      alert('訂閱計畫刪除成功！');
      fetchSubscriptionPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('刪除計畫失敗: ' + (error.response?.data?.detail || error.message));
    }
  }
};


// --- User Subscription Methods ---
const resetUserSubForm = () => {
  isEditingUserSub.value = false;
  currentUserSub.value = {};
};


const fetchUserSubscriptions = async (query = '') => {
  try {
    const url = query ? `/admin/user-subscriptions?user_email=${query}` : '/admin/user-subscriptions/';
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    userSubscriptions.value = response.data;
    allUserSubscriptions.value = response.data; // Store all for local filtering
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    alert('無法載入使用者訂閱。');
  }
};

// This would ideally search the backend by email
const searchUserSubscriptions = async () => {
    if (userSearchQuery.value) {
        // Implement backend search by email if available, otherwise filter locally
        // For now, assuming you can fetch all and filter, or backend provides a specific endpoint
        // You might need to add a new backend endpoint like /admin/user-subscriptions/search?email=...
        // For now, let's just refetch all and filter locally
        await fetchUserSubscriptions(); // Re-fetch all to ensure data is fresh
    } else {
        await fetchUserSubscriptions();
    }
};

const loadAllUserSubscriptions = () => {
    userSearchQuery.value = '';
    fetchUserSubscriptions();
};


const editUserSubscription = (userSub) => {
  isEditingUserSub.value = true;
  // Deep copy to prevent direct mutation
  currentUserSub.value = { 
    ...userSub,
    start_date_display: formatDateForInput(userSub.start_date),
    end_date_display: formatDateForInput(userSub.end_date)
  }; 
};

const updateUserSubscription = async () => {
  try {
    // Format dates back to ISO string for backend
    const payload = {
        ...currentUserSub.value,
        start_date: new Date(currentUserSub.value.start_date_display).toISOString(),
        end_date: new Date(currentUserSub.value.end_date_display).toISOString(),
    };
    // Ensure we don't send extra display properties
    delete payload.start_date_display;
    delete payload.end_date_display;


    await axios.put(`/admin/user-subscriptions/${payload.user_id}`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    alert('使用者訂閱更新成功！');
    resetUserSubForm();
    fetchUserSubscriptions(); // Refresh list
  } catch (error) {
    console.error('Error updating user subscription:', error);
    alert('更新使用者訂閱失敗: ' + (error.response?.data?.detail || error.message));
  }
};

const cancelEditUserSubscription = () => {
  resetUserSubForm();
};

const deleteUserSubscription = async (user_id) => {
  if (confirm('確定要刪除此使用者的訂閱嗎？')) {
    try {
      await axios.delete(`/admin/user-subscriptions/${user_id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      alert('使用者訂閱刪除成功！');
      fetchUserSubscriptions();
    } catch (error) {
      console.error('Error deleting user subscription:', error);
      alert('刪除使用者訂閱失敗: ' + (error.response?.data?.detail || error.message));
    }
  }
};


onMounted(() => {
  resetPlanForm(); // Initialize form
  resetUserSubForm(); // Initialize form
  fetchSubscriptionPlans();
  fetchUserSubscriptions();
});
</script>

<style scoped>
.subscription-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
}
h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}
h2 {
  color: #555;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  margin-top: 40px;
  margin-bottom: 20px;
}
h3 {
  color: #666;
  margin-top: 20px;
  margin-bottom: 15px;
}
.form-container {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #444;
  font-weight: bold;
}
.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group select {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}
.form-group input[type="number"]::-webkit-inner-spin-button,
.form-group input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 10px;
  transition: background-color 0.2s;
}
button:hover {
  background-color: #0056b3;
}
button[type="button"] {
  background-color: #6c757d;
}
button[type="button"]:hover {
  background-color: #5a6268;
}
.plan-list, .user-sub-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.plan-card, .user-sub-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.plan-card p, .user-sub-card p {
  margin: 5px 0;
  color: #666;
}
.plan-card h4, .user-sub-card h4 {
  color: #333;
  margin-top: 0;
  margin-bottom: 10px;
}
.actions {
  margin-top: 15px;
  text-align: right;
}
.actions button {
  padding: 8px 12px;
  font-size: 0.9rem;
  margin-left: 10px;
}
.search-user-container {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 20px;
}
.search-user-container input {
    flex-grow: 1;
}
</style>