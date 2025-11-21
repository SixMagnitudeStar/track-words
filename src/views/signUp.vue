<template>
  <div style="padding: 30px; font-family: Arial;">
    <h2>Email 驗證流程</h2>

    <!-- 步驟 1：輸入 Email -->
    <div v-if="step === 1">
      <input
        v-model="email"
        type="email"
        placeholder="請輸入 Email"
        style="padding:8px; width:250px;"
      />
      <br />
      <button @click="sendCode" style="padding:8px; margin-top:5px;">取得驗證碼</button>
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

      <button @click="verifyCode" style="padding:8px; margin-top:15px;">驗證</button>
    </div>

    <!-- 驗證成功 -->
    <div v-if="step === 3">
      <p style="color:green;">驗證成功！🎉</p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";

const step = ref(1);
const email = ref("");
const codeInputs = ref(["", "", "", "", "", ""]);
const codeRefs = ref([]);
let verificationCode = "";

function sendCode() {
  if (!email.value) {
    alert("請輸入 Email");
    return;
  }

  // 模擬寄送驗證碼
  verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  alert(`模擬寄信: 驗證碼為 ${verificationCode}`);
  step.value = 2;

  // 自動聚焦第一格
  nextTick(() => {
    codeRefs.value[0]?.focus();
  });
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

function verifyCode() {
  const enteredCode = codeInputs.value.join("");
  if (enteredCode === verificationCode) {
    step.value = 3;
  } else {
    alert("驗證碼錯誤");
  }
}
</script>

<style>
.code-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 10px 0;
}

.code-box {
  width: 40px;
  height: 45px;
  text-align: center;
  font-size: 20px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.code-box:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 4px #4CAF50;
}
</style>