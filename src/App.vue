<template>
  <div id="app">
    <AppSideBar v-if="isLoggedIn"></AppSideBar>

    <!-- Vue 3 建議的路由過渡寫法 -->
    <router-view v-slot="{ Component }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" class="router-view" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import AppSideBar from '@/components/AppSideBar.vue'
import { useAuthStore } from './auth.js'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const route = useRoute()
const transitionName = ref('zoom')

// 監聽路由變化，針對登入跳轉首頁做特殊處理
watch(() => route.path, (to, from) => {
  if (from === '/login' && (to === '/' || to === '/Home')) {
    transitionName.value = 'fade-quick'
  } else {
    transitionName.value = 'zoom'
  }
}, { immediate: true })
</script>

<style>
/* ... 前面保留不變 ... */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.hidden-link {
  display: none;
}
body{
  font-family: sans-serif;
 /* background-image: url('@/assets/photo_beach.avif');*/
   background-color: lightgray; 

  background-size: cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  margin: 0;

  background-repeat: no-repeat;
  background-attachment: fixed; /* 背景固定，不隨滾動拉伸 */
  background-position: center center; /* 居中顯示 */
}

/* 訊息提示框 */
.tooltip {
  position: relative;
  display: inline-block;
  cursor: pointer;
  padding: 5px;
}

.tooltip:hover{
  background-color: #ddd;
  border-radius: 8px;
}

.tooltip .tooltip-text {
  visibility: hidden;
  background-color: #333;
  color: #fff;
  text-align: center;
  padding: 6px 10px;
  border-radius: 6px;
  position: absolute;
  bottom: 125%; /* 在元素上方 */
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  z-index: 10;
}

.tooltip .tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color:  #333 transparent transparent transparent;
  /* border-color: transparent #333 #333 #333; */
}

.tooltip:hover .tooltip-text {
  visibility: visible;

}

.icon{
  width: 25px;
  height: 25px;
  display: block;
  cursor: pointer;
}

.iconBox{
  display: flex;
  margin: 5px;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
}

.iconBox span{
  margin-left: 3px;
}

.logoutBox{
  cursor: pointer;
}

.logoutBox:hover {
  background-color: #e0e0e0; /* 滑上去變淺灰 */
  cursor: pointer;           /* 滑鼠顯示小手 */
}

/* 統一 router-view 樣式 */
.router-view{
  display: block;
  margin-top: 5vh;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  /* 增加此項，確保動畫寬度穩定 */
  box-sizing: border-box; 
  width: auto;
  min-width: 300px;
}

.parallel-div{
  display: flex;
}


/* Zoom 動畫 - 縮短時間至 0.5s 讓切換更俐落 */
.zoom-enter-active, .zoom-leave-active {
  transition: all 0.5s ease;
}
.zoom-enter-from {
  transform: scale(0.6);
  opacity: 0;
}
.zoom-leave-to {
  transform: scale(1.4);
  opacity: 0;
}

/* 快速淡入動畫 */
.fade-quick-enter-active, .fade-quick-leave-active {
  transition: opacity 0.5s ease;
}
.fade-quick-enter-from, .fade-quick-leave-to {
  opacity: 0;
}

</style>
