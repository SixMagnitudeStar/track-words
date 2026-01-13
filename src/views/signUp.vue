<template>
  <div class="login-container">
    <h2>註冊新帳號</h2>

    <!-- 步驟 1：輸入 Email 和密碼 -->
    <div v-if="step === 1">
      <input
        v-model="email"
        type="email"
        placeholder="請輸入 Email"
        required
      />
      <input
        v-model="nickname"
        type="text"
        placeholder="請輸入暱稱"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="請輸入密碼"
        required
      />
      <button @click="register">註冊</button>
    </div>

    <!-- 步驟 2：輸入驗證碼 -->
    <div v-if="step === 2" style="margin-top: 20px;">
      <p>已寄送驗證碼至: <strong>{{ email }}</strong></p>

      <div style="display: flex; gap: 8px; justify-content: center;">
        <input
          v-for="(val, idx) in codeInputs"
          :key="idx"
          ref="codeRefs"
          maxlength="1"
          type="text"
          inputmode="numeric"
          style="
            width: 40px;
            height: 50px;
            text-align: center;
            font-size: 24px;
            border: 1px solid #ccc;
            border-radius: 6px;
          "
          v-model="codeInputs[idx]"
          @input="handleInput(idx, $event)"
          @keydown="handleKeydown(idx, $event)"
        />
      </div>

      <button @click="verifyCode">驗證</button>
    </div>

    <!-- 驗證成功 -->
    <div v-if="step === 3">
      <p style="color:green;">註冊成功！🎉</p>
      <router-link to="/login">回到登入頁面</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import api from "@/axios";

const step = ref(1);
const email = ref("");
const password = ref("");
const nickname = ref(""); // 新增 nickname
const codeInputs = ref(["", "", "", "", "", ""]);
const codeRefs = ref([]);

async function register() {
  if (!email.value || !password.value || !nickname.value) {
    alert("請輸入 Email、暱稱和密碼");
    return;
  }

  try {
    const response = await api.post("/register", {
      email: email.value,
      password: password.value,
      nickname: nickname.value,
    });
    
    console.log(response.data.message)
    alert("註冊請求已送出，請檢查您的電子郵件以取得驗證碼。");
    step.value = 2;

    // 自動聚焦第一格
    nextTick(() => {
      codeRefs.value[0]?.focus();
    });
  } catch (error) {
    console.error("註冊失敗:", error.response ? error.response.data : error.message);
    alert(`註冊失敗：${error.response?.data?.detail || '發生未知錯誤'}`);
  }
}

function handleInput(index, event) {
  const value = event.target.value;
  // 只取最後一個字元（避免貼上多位）
  codeInputs.value[index] = value.slice(-1);

  // 自動跳下一格
  if (value && index < codeInputs.value.length - 1) {
    codeRefs.value[index + 1]?.focus();
  }
}

function handleKeydown(index, event) {
  const key = event.key;

  // ← 左移
  if (key === "ArrowLeft" && index > 0) {
    event.preventDefault();

    codeRefs.value[index - 1]?.focus();
    return;
  }

  // → 右移
  if (key === "ArrowRight" && index < codeInputs.value.length - 1) {
    event.preventDefault();
    codeRefs.value[index + 1]?.focus();
    return;
  }

  // Backspace / Delete
  if (key === "Backspace" || key === "Delete") {
    event.preventDefault();
    if (codeInputs.value[index]) {
      // 清除當前值
      codeInputs.value[index] = "";
    } else if (index > 0) {
      // 移到前一格並清空
      codeRefs.value[index - 1]?.focus();
      codeInputs.value[index - 1] = "";
    }
  }

  // 輸入數字時，覆蓋現有內容
  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    codeInputs.value[index] = key;
    if (index < codeInputs.value.length - 1) {
      codeRefs.value[index + 1]?.focus();
    }
  }
}

async function verifyCode() {
  const enteredCode = codeInputs.value.join("");
  if (enteredCode.length !== 6) {
    alert("請輸入完整的 6 位數驗證碼。");
    return;
  }

  try {
    const response = await api.post("/verify-email", {
      email: email.value,
      code: enteredCode,
    });
    
    console.log(response.data.message);
    alert("電子郵件驗證成功！您現在可以登入。");
    step.value = 3;
  } catch (error) {
    console.error("驗證失敗:", error.response ? error.response.data : error.message);
    alert(`驗證失敗：${error.response?.data?.detail || '發生未知錯誤'}`);
  }
}
</script>

<style scoped>
.login-container {
  padding: 30px;
  font-family: Arial;
}

.login-container input {
  width: 95%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 8px; /* 更圓潤 */
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.9); /* 半透明質感 */
}

.login-container button {
  background-color: rgba(76, 175, 80, 0.8); /* 半透明綠色 */
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 8px; /* 更圓潤 */
  cursor: pointer;
}
</style>