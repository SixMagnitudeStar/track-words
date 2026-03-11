<!-- <template>
  <div class="home-page">
    <h1 class="title">Welcome to Home Page</h1>
    <div class="card-grid">
      <router-link to="/login" class="home-card">登入</router-link>
      <router-link to="/signup" class="home-card">註冊</router-link>
      <router-link to="/" class="home-card">首頁</router-link>
      <router-link to="/ELP" class="home-card">English Listening Practice</router-link>
      <router-link to="/UnfamiliarWordsArea" class="home-card">不熟單字記錄區</router-link>
      <router-link to="/articleReading" class="home-card">文章閱讀區</router-link>
      <router-link to="/personalSetting" class="home-card">個人設定</router-link>
         <router-link
        to="/login"
        class="home-card bg-white shadow-md rounded-lg p-8 flex flex-col items-center justify-center hover:scale-105 transition transform duration-200"
      >
        <img src="@/assets/logo.png" alt="Login" class="w-16 h-16 mb-4"/>
        <span class="text-xl font-semibold">登入</span>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "HomePage"
};
</script>

<style scoped>
/* 整個頁面背景與間距 */
.home-page {
  min-height: 100vh;
  padding: 40px;
  background-color: #f0f0f0;
  font-family: Arial, sans-serif;
}

/* 標題 */
.title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 40px;
  color: #333;
}

/* 卡片容器 grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

/* 卡片 */
.home-card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-decoration: none;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

/* hover 動畫 */
.home-card:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
</style> -->
<!-- src/views/HomePage.vue -->


<template>
  <div class="home-container">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        to="/articleReading"
        class="home-card bg-white shadow-md rounded-lg p-6 flex flex-row items-center justify-center hover:scale-105 transition transform duration-200"
      >
        <img src="@/assets/open-book.png" alt="Article" class="w-10 h-10 mr-4"/>
        <span class="text-lg font-semibold">文章閱讀區</span>
      </router-link>
      <router-link
        to="/UnfamiliarWordsArea"
        class="home-card bg-white shadow-md rounded-lg p-6 flex flex-row items-center justify-center hover:scale-105 transition transform duration-200"
      >
        <img src="@/assets/flash-card.png" alt="Words" class="w-10 h-10 mr-4"/>
        <span class="text-lg font-semibold">不熟單字記錄區</span>
      </router-link>

      <router-link
        to="/ELP"
        class="home-card bg-white shadow-md rounded-lg p-6 flex flex-row items-center justify-center hover:scale-105 transition transform duration-200"
      >
        <img src="@/assets/listening.png" alt="ELP" class="w-10 h-10 mr-4"/>
        <span class="text-lg font-semibold">English Listening Practice</span>
      </router-link>

      <router-link
        to="/EnZhQuiz"
        class="home-card bg-white shadow-md rounded-lg p-6 flex flex-row items-center justify-center hover:scale-105 transition transform duration-200"
      >
        <img src="@/assets/test.png" alt="EnZhQuiz" class="w-10 h-10 mr-4"/>
        <span class="text-lg font-semibold">中英測驗</span>
      </router-link>
    </div>

    <footer class="home-footer">
      <div>Open book icon made by <a href="https://www.flaticon.com/free-icon/open-book_167755" target="_blank">Freepik</a> from Flaticon</div>
      <div>Flash-card icon made by <a href="https://www.flaticon.com/free-icon/flash-card_6727586" target="_blank">Freepik</a> from Flaticon</div>
      <div>Listening icon made by <a href="https://www.flaticon.com/free-icon/listening_5295066" target="_blank">Freepik</a> from Flaticon</div>
      <div>English-Chinese quiz icon made by <a href="https://www.flaticon.com/free-icon/test_xxxxxx" target="_blank">Freepik</a> from Flaticon</div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.body.classList.add('home-bg')
})

onUnmounted(() => {
  document.body.classList.remove('home-bg')
})
</script>

<script>
export default {
  name: "HomePage"
};
</script>

<style>
body.home-bg {
  background-image: url('@/assets/home-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
</style>

<style scoped>
.home-container {
  /* 設定固定比例寬度，防止容器縮小 */
  width: 40vw;
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 10vh;
}

.home-card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px; /* 降低高度，呈現扁平長方形 */
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-decoration: none;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
  max-width: 350px; /* 增加最大寬度限制，讓長方形更明顯 */
  margin: 0 auto; /* 置中顯示 */
  width: 100%;
}

.home-card:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.home-footer {
  text-align: center;
  margin-top: 60px;
  font-size: 0.8rem;
  color: #666;
}
</style>