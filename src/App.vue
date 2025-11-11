<template>

  <div id="app">
    <nav>
      <router-link class="hidden-link" to="/login">登入</router-link> 
      <router-link class="hidden-link" to="/">首頁</router-link> 
      <router-link class="hidden-link" to="/ELP">English Listening Practice</router-link> 
      <router-link class="hidden-link" to="/UnfamiliarWordsArea">不熟單字記錄區</router-link> 
      <router-link class="hidden-link" to="/articleReading">文章閱讀區</router-link> 
      <router-link class="hidden-link" to ="/personalSetting">個人設定</router-link> 
    </nav>
    <AppSideBar></AppSideBar>
    <router-view></router-view>
  </div>
  <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
  <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->

 
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'

import AppSideBar from '@/components/AppSideBar.vue'

export default {
  name: 'App',
  components: {
    AppSideBar
    // HelloWorld
  },
  data(){
    return {
    }
  }
}
</script>

<style>
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
  background-image: url('@/assets/photo_beach.avif');
  /* background-color: lightgray; */

  background-size: cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  margin: 0;
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


</style>
