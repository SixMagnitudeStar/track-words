
<template>

  <!-- ELP 頁面：聽力練習與管理界面 -->
  <div id="ELP-page">
    <div v-if="mode===1">
      <!-- 頁面標題區（Header）：顯示頁面名稱與説明文字 -->
        <div>
          <h1>聽力複習</h1>
          <h3>手動添加 / 從標記單字中載入你要聽力複習的單字</h3>
          <h3>建立好，接著點擊喇叭開始聆聽</h3>
        </div>

        

        <!-- 全域詞彙清單控制區：保留舊版（single list）功能與匯入/播放控制 -->
        <div class="list-title-div">
            <h2>詞彙列表&nbsp;</h2>
            <div class="tooltip" >
              <span @click="randomListening">🎲🔊</span>
              <span class="tooltiptext">隨機從列表中撥放單字聆聽</span>
            </div>

            &nbsp;|&nbsp; 
            <div class="tooltip" >
              <img @click="refreshListeningList" class="refresh_icon" alt="Refresh list" src="@/assets/rotate.png">
              <span class="tooltiptext">刷新列表</span>
            </div>
            &nbsp;|&nbsp;&nbsp;&nbsp;   
              <div class="tooltip" @click="loadMarkedWords()">
                <div class="parallel-div">
                  <img src="@/assets/sticky-note.png" alt="">
                  <img class="arrow-down icon" src="@/assets/forward.png"  alt="將標記單字載入聆聽列表" >
                </div>
                
                <span class="tooltiptext">將標記單字載入聆聽列表</span>
              </div>
              <!-- <sapn>將標記單字載入聆聽列表/手動添加單字到列表</sapn> -->
              <span>
                
                    <img  class="or-icon" src="@/assets/or-arrows.png" title="將標記單字載入聆聽列表 OR 手動添加單字到列表"  alt="OR" />
              
              </span>
              <div>
                <input v-model="vocab" type="text" placeholder="Enter a word & phrase"  @keyup.enter="appendVocab(vocab)"/>
                &nbsp;
                <button @click="appendVocab(vocab)">Add to vocabList</button>&nbsp;
                <button @click="speak(vocab)">🔊 listening</button>
                
              </div>

        </div> 

        <!-- 新功能：建立並顯示多個詞彙清單 -->
        <!-- 新增詞彙列表按鈕：點擊新增一個獨立的詞彙清單（每個清單有自己的單字陣列） -->
        <div class="list-actions-row" style="margin: 16px 0;">
          <div>
            <button @click="addVocabList">新增詞彙列表</button>
          </div>
          <!-- 展開後提供收合按鈕於標題列，方便收回 -->
          <div v-if="showAllLists && vocabLists.length > 3">
            <button class="expand-toggle-btn" @click="toggleShowAllLists"><< 收合</button>
          </div>
        </div>

        <!-- 多清單區：每個清單是一個卡片（vocab-list-card），包含名稱、匯入與輸入/新增欄位，以及單字清單顯示 -->
        <div class="vocab-lists-container">
          <!-- 單一清單卡片：每個卡片包含 list.name、list.words，以及每清單專屬的控制項 -->
          <div v-for="(list, idx) in visibleVocabLists" :key="list.id" class="vocab-list-card">
              <div class="vocab-list-header">
                <div style="display:flex; gap:8px; align-items:center;">
                  <div v-if="list.editing">
                    <input :ref="'listName-' + list.id" v-model="list.nameDraft" type="text" class="list-name-input" title="請輸入列表名稱"  />
                  </div>
                  <div v-else>
                    <h3 style="margin:0">{{ list.name }}</h3>
                  </div>
                  <button @click="toggleEditListName(list)" class="list-name-toggle">
                    <span v-if="list.editing">💾</span>
                    <span v-else>✏️</span>
                  </button>
                </div>
              </div>
            <!-- 每清單控制項：匯入標記單字、或 OR、單字輸入、加入按鈕，以及播放按鈕 -->
            <div class="header-controls vocab-list-controls">
              
              <!-- <span>
                <img  class="or-icon" src="@/assets/or-arrows.png" title="將標記單字載入聆聽列表 OR 手動添加單字到列表"  alt="OR" />
              </span> -->
              <div class="header-input list-input-area">
                <input :ref="'listInput-' + list.id" v-model="list.input" type="text" placeholder="Enter a word & phrase"  @keyup.enter="appendVocabToList(list)"/>
                &nbsp;
                <button @click="appendVocabToList(list)">Add</button>&nbsp;
                <button @click="speak(list.input)">🔊 listening</button>
              </div>
              <div class="tooltip" @click="loadMarkedWordsToList(list)">
                <div class="parallel-div">
                  <img src="@/assets/sticky-note.png" alt="">
                  <img class="arrow-down icon" src="@/assets/forward.png"  alt="將標記單字載入聆聽列表" >
                </div>
                <span class="tooltiptext">將標記單字載入此詞彙列表</span>
              </div>
            </div>
            <!-- 當未展開且總數大於 MAX_VISIBLE 時，在這三個中第三個卡片旁顯示浮動展開按鈕 -->
            <div v-if="!showAllLists && vocabLists.length > 3 && idx === visibleVocabLists.length - 1" class="floating-expand-btn">
              <button class="expand-toggle-btn" @click="toggleShowAllLists" title="展開全部列表">>> 展開</button>
            </div>
            <div class="vocab-list-body">
              <ul>
                <li v-for="(w, idx) in list.words" :key="idx">{{ w }}
                  <div class="tooltip">
                    <span @click="speak(w)" title="listening vocab">🔊</span>
                    <span class="tooltiptext">listening vocab</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <!-- <div class="listening-div">
          <span>🎲🔊</span>
          <img @click="refreshListeningList" class="refresh_icon" alt="Refresh" src="@/assets/rotate.png" title="refresh listeningList"> 
          ：<button @click="randomListening"> random listening</button> &nbsp;
          <button @click="reListening">🔊 listening again</button><span>{{listeningVocab }}</span>
        
        </div> -->

        <div id="ListDiv">
          <div>
            <ul>
              <li v-for="(vocab, index) in vocabList" :key="index">{{vocab}}
                <div class="tooltip">
                  <span @click="speak(vocab)" title="listening vocab">🔊</span>
                  <span class="tooltiptext">listening vocab</span>
                </div>
                <div class="tooltip">
                  <img class="bin" src="@/assets/bin.png" @click="removeVocab(index)" alt="delete" >
                  <span class="tooltiptext">Delete vocab</span>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <!-- <h2>聆聽列表
              <span>🎲🔊</span>
              <img @click="refreshListeningList" class="refresh_icon" alt="Refresh" src="@/assets/rotate.png" title="refresh listeningList"> 
              ：<button @click="randomListening"> random listening</button> &nbsp;
              <button @click="reListening">🔊 listening again</button><span>{{listeningVocab }}</span> &nbsp;
            </h2> -->
            <ul>
              <li v-for="(vocab, index) in listeningList" :key="index">{{vocab}}</li>
            </ul>
          </div>
        </div>
        <hr>
        <h2>隨機聆聽測驗</h2>
    </div>
    <div v-else>
      <h3>測試</h3>
    </div>
  </div>
 
  </template>
  
  <script>
  
  import api from '@/axios.js'
  export default {
    name: 'ELPView',
    data() {
      return {
        // UI 模式：1 = 主模式；其他值將顯示不同的視圖（於模板中切換顯示）
        mode : 1,
        vocab: '',
        // 舊有 / 全域 vocab 清單（簡單的字串陣列）
        vocabList: [],
        listeningList: [],
        // 目前正在播放或選中的聽力單字
        listeningVocab: ''
        ,
        // 多個詞彙清單 (vocabLists) - 資料排序說明：
        // 新增的清單會插入陣列前端（最新的在最前面）
        // 顯示邏輯會預設顯示最前（最新）的三筆，若點選展開則顯示全部
        // 多個詞彙清單 (vocabLists)
        // 多個詞彙清單 (vocabLists)
        // 以下是每個 `list` 物件的欄位說明：
        // - id: 唯一識別數值 (Number)，用於 v-for 的 key
        // - name: 顯示用的清單名稱 (String)
        // - nameDraft: 編輯名稱時的暫存欄位 (String)，在儲存前放置使用者輸入的暫存文字
        // - words: 與該清單綁定的單字陣列 (Array<String>)
        // - input: 該清單的臨時輸入欄位，用來在 per-list UI 新增單字 (String)
        // - editing: 布林值 (Boolean)，表示目前是否處於清單名稱編輯狀態
        // 範例物件： { id: 1, name: 'List 1', nameDraft: 'List 1', words: ['apple'], input: '', editing: false }
        vocabLists: [],
        // 控制是否展開全部清單 (false 預設只顯示前三個)
        showAllLists: false,
        nextVocabListId: 1,
        activeVocabListId: null
      }
    },
    computed: {
      // 依照 showAllLists 判斷要顯示的清單（預設顯示「最新」的三筆）
      visibleVocabLists(){
        const MAX_VISIBLE = 3;
        if (this.showAllLists) return this.vocabLists;
        // 顯示最前面的三筆（最新的三筆），若長度不足則全部顯示
        return this.vocabLists.slice(0, MAX_VISIBLE);
      }
    },
    methods: {
      // 使用瀏覽器語音合成（TTS）來播放指定文字
      speak(text) {
        doSpeak(text) 
      },
      // 從聆聽列表中隨機抽取單字並播放
      // 使用輔助函式 doRandomListening 來執行選取與移除邏輯
      randomListening(){
        doRandomListening(this);
      },
      // 將單字加入全域詞彙清單（vocabList）
      // 此函式供舊有的單一清單 UI (vocabList) 使用
      appendVocab(vocab){
        if (vocab.trim() === ''){
          alert('請輸入要添加的單字!');
          return;
        }

        this.vocabList.push(vocab);
        this.vocab = '';
        this.listeningList = [...this.vocabList];
      },
      // 從舊的 vocabList 刷新聽力列表（複製 vaboList 的內容）
      refreshListeningList(){
        doRefreshListeningList(this);
      },
      // 建立一個新的命名詞彙清單，並 focus 該清單的名稱輸入欄位。
      // 新增的 list 會包含自己的 words 陣列與 per-list 的 input 欄位
      addVocabList(){
        const id = this.nextVocabListId++;
        const list = { id, name: `List ${id}`, words: [], input: '', editing: true, nameDraft: `List ${id}` };
        // 將新建的 list 插入陣列前端（unshift）以保持「最新的在最前面」排序
        this.vocabLists.unshift(list);
        this.activeVocabListId = id;
        this.$nextTick(()=>{
          const refName = 'listName-' + id;
          const el = this.$refs[refName];
          if (el){ if (Array.isArray(el)) el[0].focus(); else el.focus(); }
        });
      },
      // 切換清單檢視：展開所有清單或只顯示前三個
      toggleShowAllLists(){
        this.showAllLists = !this.showAllLists;
      },
      // 將輸入值加入指定清單的 words 陣列
      // 參數說明：list - 目標清單物件 (list.words 為其陣列)
      appendVocabToList(list){
        const value = (list.input || '').trim();
        if (!value){ alert('請輸入要添加的單字!'); return; }
        list.words.push(value);
        list.input = '';
      },
      // 切換清單名稱的編輯狀態；離開編輯時儲存名稱
      // 當 editing 為 true 時可在 nameDraft 輸入欄編輯名稱；儲存後將 nameDraft 複製到 name
      toggleEditListName(list){
        if (list.editing){
          const name = (list.nameDraft || '').trim()
          if (name === '') { alert('列表名稱不可為空'); return }
          list.name = name
          list.editing = false
        } else {
          list.nameDraft = list.name
          list.editing = true
          this.$nextTick(()=>{ const refName = 'listName-' + list.id; const el = this.$refs[refName]; if (el){ if (Array.isArray(el)) el[0].focus(); else el.focus() } })
        }
      },
      // 將後端標記的單字載入到此清單中（避免重複）
      loadMarkedWordsToList(list){
        doloadMarkedWordsToList(this, list)
      },
      reListening(){
        doReListening(this);
      },

      // 依據索引刪除詞彙列表與聆聽列表中的單字
      // 從舊有的 `vocabList` 刪除單字，同時使用 swap-and-pop 技巧從 `listeningList` 中移除對應單字，
      // 以避免 O(n) 的陣列內部 splice 重排成本。
      removeVocab(vocabIndex){
        // 取得要移除的單字
        const word = this.vocabList[vocabIndex];

        // 找尋找該單字是否存在於聆聽列表中，若存在的話取得找到的第一個索引 (若匹配多個也僅刪除一個)
        const index = this.listeningList.indexOf(word);

        if (index !== -1) {
          // 取得陣列最後一個索引與元素
          const lastIndex = this.listeningList.length - 1;
          const lastWord = this.listeningList[lastIndex];

          // 將目標元素與最後一個元素交換位置，然後用 pop 移除最後一個 (swap-and-pop(陣列中移除元素，順序若不重要可用的技巧)
          this.listeningList[index] = lastWord;
          this.listeningList.pop();
        }

        // 將單字從詞彙列表中移除
        this.vocabList.splice(vocabIndex, 1);
      },
      loadMarkedWords(){
        doloadMarkedWords(this)
      }

      

    }
  }

  function doSpeak(text){
      // 建立 SpeechSynthesisUtterance 物件用於播放文字（使用瀏覽器內建語音合成功能）
      const utterance = new SpeechSynthesisUtterance(text);

      //指定語音的語言
      utterance.lang = 'en-US'; // 可改為 'zh-TW'、'ja-JP' 等


      //語音合成器物件呼叫speak method執行上面建立的語音內容物件
      speechSynthesis.speak(utterance);
  }





async function doloadMarkedWords(vm){
  // 從後端抓取標記單字，並加入到舊有的全域 vocabList 與 listeningList。
  // vm: component 實例（Options API）之傳入，方便更新其響應式陣列。

  try{
    const response = await api.get("/markedwords");

    response.data.words.forEach((item) => {
      vm.listeningList.push(item.word)
      vm.vocabList.push(item.word)
    })
    console.log('標記單字載入詞彙列表成功')

  }catch(err){
    console.error('標記單字載入詞彙列表失敗',err)
  }
}

  // 隨機播放輔助函式：從 vm.listeningList 隨機抽一個單字，設定 vm.listeningVocab 並呼叫 speak 播放。
  // 會從 vm.listeningList 中移除該單字，避免在同一次聆聽會話中重複播放。
  function doRandomListening(vm){
    if (vm.listeningList.length ===0){
      alert('聆聽列表已空，請先新增詞彙');
      return;
    }

    // 從聆聽列表中隨機取得索引
    let randomIndex = Math.floor(Math.random() * vm.listeningList.length);
    
    // 取得要聆聽的詞彙
    // let randomWord = this.listeningList[randomIndex];
    vm.listeningVocab = vm.listeningList[randomIndex];

    // 將該詞彙從聆聽列表中移除
    vm.listeningList.splice(randomIndex, 1);
    
    vm.speak(vm.listeningVocab);
  }



  // 將全域 vocabList 的內容複製到 listeningList（淺拷貝）
  function doRefreshListeningList (vm) {
    vm.listeningList = vm.vocabList;
  }


// 將標記單字載入至指定清單的輔助函式
// vm: 傳入的 component 實例；list: 目標 list 物件，單字會推送到 list.words
async function doloadMarkedWordsToList(vm, list){
  try{
    const response = await api.get('/markedwords')
    response.data.words.forEach((item)=>{ if (!list.words.includes(item.word)) list.words.push(item.word) })
    console.log('標記單字載入至詞彙列表成功')
  }catch(err){ console.error('標記單字載入至詞彙列表失敗', err) }
}

  function doReListening(vm){
    // 重新播放目前 vm 的 listeningVocab
    vm.speak(vm.listeningVocab);
  }


  </script>


<style scoped>

input[type="text"] {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.refresh_icon{
  height: 25px;
  width: 25px;
  cursor: pointer;
}



li{
  height: 30px;
  display: flex;
  align-items: center;  /* 垂直置中 */
}

ul{
  list-style: none;
  padding: 0;
  margin: 0;
}

#ELP-page {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-top: 5vw;
}

.bin{
  height: 20px;
  width: 20px;
  cursor: pointer;
  vertical-align: middle;
}

#ListDiv{
  display: flex;
  /* align-items: center;  垂直置中 */
  align-items: flex-start; /* 讓兩個子div都靠上對齊 */
  gap: 20px;               /* 保持間距，可依需要調整 */
}

.or-icon{
  margin: 10px 20px;
  /* height: 30px;
  width: 40px; */
  height: 20px;
  width: 30px;
  display: block;
  cursor: pointer;
}


.tooltip {
  position: relative;
  display: inline-block;



}

.tooltip img{
  height: 25px;
  width: 25px;
}



.tooltip .tooltiptext {
  visibility: hidden;
  background-color: black;
  color: white;
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  position: absolute;
  z-index: 1;
  bottom: 100%; /* 顯示在上方 */
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}


.arrow-down {
  transform: rotate(90deg);
  /* height: 25px;
  width: 25px; */
  height: 15px;
  width: 15px;
  cursor: pointer;
  /* margin-top: 7px;
  margin-left: 5px; */
}

.vocab-lists-container{ margin-top:12px; display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px }
.vocab-list-card{ border: 2px solid #cddbf7; padding: 8px; border-radius: 8px; background: #fff; position: relative }
.vocab-list-header{ display:flex; align-items:center; justify-content:space-between }
.vocab-list-controls{ display:flex; gap:8px; align-items:center; margin-top:8px }
.list-input-area{ display:flex; gap:0px; align-items:center }
.vocab-list-body ul{ list-style:none; padding:0; margin:0; }
.vocab-list-body li{ display:flex; gap:8px; align-items:center; height:28px }
.vocab-list-card{ border:2px solid #8fa8ff; }
.vocab-list-card .list-name-input{ padding:6px; font-weight:600; }
.list-name-toggle{ background:transparent; border:none; margin-left:8px; cursor:pointer; }

.list-title-div{
  display: flex;
  align-items: center;   /* 垂直置中 */
}

.listening-div{
  text-align: left;

}

.list-actions-row{ display:flex; justify-content:space-between; align-items:center; }
.list-expand-container{ display:flex; gap:8px; align-items:center }
.expand-toggle-btn{ background:transparent; border:1px solid #8fa8ff; padding:6px 10px; border-radius:6px; cursor:pointer }
.show-count{ color:#666; font-size: 0.9em }
.floating-expand-btn{ position:absolute; right:-34px; top:8px; z-index:5 }
.floating-expand-btn .expand-toggle-btn{ padding: 6px 8px; }




</style>