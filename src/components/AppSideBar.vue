




<template>


  <div id="container">
    <div id="toggle-sidebar-btn-wrapper">
      <img
        id="toggle-sidebar-btn"
        :src="toggleSideBarIcon"
        @click="() => { showPanel = !showPanel; switchToggleSideIcon(); }"
      />
    </div>
    <transition name="slide">
      <div v-if="showPanel" class="panel">
        <router-link to="/" class="router-link-custom">
          <span class="iconBox">
            <img class="icon" src="@/assets/house.png" alt="首頁" />
            <span>首頁</span>
          </span>
        </router-link>
        <div class="indented-links">
          <router-link to="/articleReading" class="router-link-custom">
            <span class="iconBox">
              <img class="icon" src="@/assets/open-book.png" alt="文章閱讀區" />
              <span>文章閱讀</span>
            </span>
          </router-link>
          <router-link to="/ELP" class="router-link-custom">
            <span class="iconBox">
              <img class="icon" src="@/assets/listening.png" alt="聽力練習" />
              <span>聽力練習</span>
            </span>
          </router-link>
          <router-link to="/UnfamiliarWordsArea" class="router-link-custom">
            <span class="iconBox">
              <img class="icon" src="@/assets/flash-card.png" alt="不熟單字區" />
              <span>不熟單字</span>
            </span>
          </router-link>
          <router-link to="/EnZhQuiz" class="router-link-custom">
            <span class="iconBox">
              <img class="icon" src="@/assets/test.png" alt="中英測驗" />
              <span>中英測驗</span>
            </span>
          </router-link>
        </div>
        <span class="iconBox logoutBox" @click="logout">
          <img class="icon" src="../assets/logout.png" alt="登出" />
          <span>登出</span>
        </span>
        <footer style="text-align:center; margin-top:40px; font-size:0.8rem; color:#666;">
          <div>Home page icon made by <a href="https://www.flaticon.com/free-icon/house_845022?term=home&page=1&position=30&origin=tag&related_id=845022" target="_blank">Freepik</a> from Flaticon</div>
        </footer>
      </div>
    </transition>

  </div>


</template>





<script setup>


import { ref} from 'vue'


import api from '@/axios.js'

import { useAuthStore } from '@/auth.js'

import { useRouter } from 'vue-router'





// ---------- state ----------


// const newItem = ref('')


// const items = ref([])


const showPanel = ref(false)





const toggleSideBarIcon = ref(require('../assets/angle-double-left.png'))


// const homeIcon = ref('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNjM2MzYyIgd2lkdGg9IjI0cHgiIGhlaWnaHQ9IjI0cHgiPjxwYXRoIGQ9Ik0xMiA1LjY5TDE3IDEwLjE5VjE4aC0ydj02SDl2Nkg3di03LjgxTDEyIDUuNjlNMTIgM0wyIDEySDd2OGg2di02aDJ2Nmg2di04aDNMMTIgM3oiLz48L3N2Zz4=')





// ---------- auth ----------


const auth = useAuthStore()


// const isLoggedIn = computed(() => auth.isLoggedIn)


const router = useRouter()





// ---------- methods ----------


function switchToggleSideIcon() {


  toggleSideBarIcon.value =


    toggleSideBarIcon.value === require('../assets/angle-double-right.png')


      ? require('../assets/angle-double-left.png')


      : require('../assets/angle-double-right.png')


}





// async function logout() {


//   try {
//     await api.post('/logout')
//     auth.clearToken()
//     router.push('/login')
//   } catch (err) {
//     console.error(err)
//   }
// }
async function logout() {
  try {
    // 即使後端噴錯，也要繼續執行後續動作
    await api.post('/logout')
  } catch (err) {
    console.error('後端登出失敗，但仍將強制清除本地狀態:', err)
  } finally {
    // 放在 finally 確保無論如何都會執行
    auth.clearToken()
    router.push('/login')
  }
}
</script>








<style scoped>


#container {


  position: absolute;


  display: block;


  padding: 1rem;


  top: 0;


  left: 0;


}








#toggle-side-bar-wrapper{


  position: fixed;


  height: 50px;


  margin-left: 0;


  width: 50px;





}





#toggle-sidebar-btn:hover {


  background-color:lightgray;


}





#toggle-sidebar-btn{


  width: 40px;


  height: 40px;


  display: block; /* 避免 inline img 底部空白 */


  border-radius: 10px;





  background-color: #f4f4f4;


  cursor: pointer;


}





/* 展開/收合按鈕 */


.toggle-btn {


  top: 0;


  left: 0;


  z-index: 1000;


  padding: 0.5rem 1rem;


  background-color: #3498db;


  color: white;


  border: none;


  cursor: pointer;


}





/* 左側滑出的區塊 */


.panel {


  position: relative;


  top: 50px;


  left: 0;


  margin-left: 0;


  width: 250px;


  height: 100%;


  background: #f4f4f4;


  border-right: 1px solid #ccc;


  padding: 1rem;


  box-shadow: 2px 0 5px rgba(0,0,0,0.1);


  z-index: 999;


  border-radius: 10px;


  display: flex;


  flex-direction: column;


  gap: 10px; /* space between buttons */


}





.iconBox {


  display: flex;


  align-items: center;


  gap: 15px;


  padding: 10px;


  border-radius: 8px;


  cursor: pointer;


  transition: background-color 0.2s;


}





.iconBox:hover {


  background-color: #e0e0e0;


}





.icon {


  width: 24px;


  height: 24px;


}





.iconBox span {


  font-size: 16px;


  color: #333;


}





.router-link-custom {





  text-decoration: none;





  color: inherit;





}











.indented-links {





  padding-left: 20px;





  margin-left: 10px;





  border-left: 2px solid #ccc;





  padding-top: 10px;





  margin-top: 5px;





  display: flex;





  flex-direction: column;





  gap: 10px;





}





























/* 滑動動畫 */


.slide-enter-active,


.slide-leave-active {


  transition: transform 0.7s ease, opacity 0.7s ease;


}


.slide-enter-from,


.slide-leave-to {


  transform: translateX(-100%);


  opacity: 0;


}





</style>

