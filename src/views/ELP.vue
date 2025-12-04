<template>
  <div id="ELP-page">
    <div v-if="mode === 1">
      <div>
        <h1>聽力複習</h1>
        <h3>手動添加 / 從標記單字中載入你要聽力複習的單字</h3>
        <h3>建立好，接著點擊喇叭開始聆聽</h3>
      </div>

      <div class="parallel-div">
        <button @click="addVocabList">新增詞彙列表</button>
        <div v-if="!showAllLists && vocabLists.length > 3">
          <button @click="toggleShowAllLists">展開全部 >></button>
        </div>
        <div v-else>
          <button @click="toggleShowAllLists"><< 收合</button>
        </div>
      </div>

      <div class="vocab-lists-container">
        <div v-for="list in visibleVocabLists" :key="list.id" class="vocab-list-card">
          <div class="vocab-list-header">
            <div style="display:flex; gap:8px; align-items:center;">
              <div class="list-name-wrapper">
                <div v-if="list.editing">
                  <input ref="listNameRefs" v-model="list.nameDraft" type="text" title="請輸入列表名稱" />
                </div>
                <div v-else>
                  <h3 style="margin:0">{{ list.name }}</h3>
                </div>
              </div>
              <div @click="toggleEditListName(list)" class="list-name-toggle">
                <div v-if="list.editing" class="tooltip">
                  <img src="@/assets/check.png" alt="儲存列表名稱" />
                  <span class="tooltiptext">儲存列表名稱</span>
                </div>
                <div v-else class="tooltip">
                  <span>✏️</span>
                  <span class="tooltiptext">編輯列表名稱</span>
                </div>
              </div>|
            </div>

            <div v-if="list.listeningMode" 
                 @click="toggleListeningMode(list)" 
                 :class="{ active: list.listeningMode }"
                 class="mode-toggle-btn"
                 :title="list.listeningMode ? '退出聆聽模式' : '進入聆聽模式'">
              🔊 聆聽中
            </div>
            <div v-else class="tooltip" @click="toggleListeningMode(list)">
              <div class="parallel-div">
                <img class="arrow-down icon" src="@/assets/forward.png" alt="進入聆聽模式" />
                🎲🔊 
              </div>
              <span class="tooltiptext">進入聆聽模式</span>
            </div>
          </div>

          <div v-if="!list.listeningMode" class="header-controls vocab-list-controls">
            <input v-model="list.input" type="text" placeholder="Enter a word & phrase" 
                   @keyup.enter="appendVocabToList(list)" />
            <button @click="appendVocabToList(list)">Add</button>
            <div class="tooltip" @click="loadMarkedWordsToList(list)">
              <div class="parallel-div">
                <img src="@/assets/sticky-note.png" alt="">
                <img class="arrow-down icon" src="@/assets/forward.png" alt="將標記單字載入聆聽列表">
              </div>
              <span class="tooltiptext">將標記單字載入此詞彙列表</span>
            </div>
          </div>

          <div v-else class="listening-mode-controls">
            <div class="tooltip">
              <span @click="randomListeningFromList(list)">🎲🔊</span>
              <span class="tooltiptext">隨機從列表中撥放單字聆聽</span>
            </div>
            <div class="tooltip">
              <img @click="refreshListeningMode(list)" class="refresh_icon" alt="Refresh list" src="@/assets/rotate.png">
              <span class="tooltiptext">刷新列表</span>
            </div>
          </div>

          <div v-if="!list.listeningMode" class="vocab-list-body">
            <ul>
              <li v-for="(w, idx) in list.words" :key="idx">{{ w.word }}
                <div class="tooltip">
                  <span @click="speak(w.word)" title="listening vocab">🔊</span>
                  <span class="tooltiptext">listening vocab</span>
                </div>
                <div class="tooltip">
                  <img class="bin" src="@/assets/bin.png" @click="removeVocab(list, idx)" alt="delete" >
                  <span class="tooltiptext">Delete vocab</span>
                </div>
              </li>
            </ul>
          </div>

          <div v-else class="parallel-div">
            <div class="vocab-list">
              <ul>
                <li v-for="(w, idx) in list.listeningWords" :key="idx">{{ w }}
                  <div class="tooltip">
                    <span @click="speak(w)" title="listening vocab">🔊</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="vocab-list">
              <ul>
                <li v-for="(w, idx) in list.playedWords" :key="idx">{{ w }}
                  <div class="tooltip">
                    <span @click="speak(w)" title="listening vocab">🔊</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
//import { ref, reactive, computed, nextTick } from 'vue'
import api from '@/axios.js'

export default {
  setup() {
    const mode = ref(1)
    const vocab = ref('')
    const vocabLists = ref([])
    const showAllLists = ref(false)
    const nextVocabListId = ref(1)
    const listNameRefs = ref([])  // ref array for inputs

    // API 取得詞彙列表
    const fetchVocabLists = async () => {
      try {
        const response = await api.get('/vocabulary_lists/')
        
        // 將後端回傳的每個 list 都用 reactive 包裝
        vocabLists.value = response.data.map(list => reactive({
          ...list,
          words: list.words || [],             // 從後端取得的單字陣列
          input: '',                            // 新增輸入框值
          editing: false,                       // 是否正在編輯名稱
          listeningMode: false,                 // 聆聽模式
          listeningWords: [],                   // 播放單字序列
          playedWords: [],                      // 已播放過的單字
          currentListeningWord: ''              // 當前播放的單字
        }))

        console.log('詞彙列表載入成功', vocabLists.value)
      } catch (err) {
        console.error('詞彙列表載入失敗', err)
      }
    }

    // onMounted 時自動呼叫
    onMounted(() => {
      fetchVocabLists()
    })

    const visibleVocabLists = computed(() => {
      const MAX_VISIBLE = 3
      return showAllLists.value ? vocabLists.value : vocabLists.value.slice(0, MAX_VISIBLE)
    })

    // ------------------- METHODS -------------------

    const speak = (text) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      speechSynthesis.speak(utterance)
    }

  const addVocabList = async () => {
    const id = nextVocabListId.value++

    // 先建立本地 reactive list
    const list = reactive({
      id,
      name: `List ${id}`,
      nameDraft: `List ${id}`,
      words: [],
      input: '',
      editing: true,
      listeningMode: false,
      listeningWords: [],
      playedWords: [],
      currentListeningWord: ''
    })

    // 將本地 list 插入陣列前端
    vocabLists.value.unshift(list)

    // 呼叫後端 API 建立列表
    try {
      const response = await api.post('vocabulary_lists/', {
        name: list.nameDraft,
        description: ''
      })


      // 將後端回傳的 id 覆蓋本地 id（若你希望同步後端 id）
      list.id = response.data.list.id
      list.name = response.data.list.name
      list.nameDraft = response.data.list.name
      console.log('列表新增成功', response.data)
    } catch (err) {
      console.error('新增列表失敗', err)
      alert('無法新增列表，請稍後再試')
      // 若失敗，可以選擇從本地移除該 list
      vocabLists.value.shift()
      return
    }

    // focus 新增列表的名稱欄位
    nextTick(() => {
      const el = listNameRefs.value[0]
      if (el) el.focus()
    })
  }




    const toggleShowAllLists = () => {
      showAllLists.value = !showAllLists.value
    }

    const toggleEditListName = (list) => {
      if (list.editing) {
        const name = list.nameDraft.trim()
        if (name === '') { alert('列表名稱不可為空'); return }
        list.name = name
        list.editing = false
      } else {
        list.nameDraft = list.name
        list.editing = true
        nextTick(() => {
          const el = listNameRefs.value[0]
          if (el) el.focus()
        })
      }
    }

    const appendVocabToList = async (list) => {
      const value = list.input.trim()
      if (!value) { 
        alert('請輸入要添加的單字!'); 
        return 
      }

      // 先更新前端畫面
      list.words.push(value)
      list.input = ''

      // 呼叫後端 API
      try {
        await api.post(`/vocabulary_lists/${list.id}/words`, {
          // list_id: list.id,
          word: value
        })
        console.log(`單字 "${value}" 已添加到後端`)
      } catch (err) {
        console.error(`添加單字 "${value}" 失敗`, err)
      }


    }
    const toggleListeningMode = (list) => {
      if (!list.listeningMode && list.words.length === 0) {
        alert('列表為空，請先新增單字')
        return
      }
      list.listeningMode = !list.listeningMode
      if (list.listeningMode) list.listeningWords = [...list.words]
    }

    const randomListeningFromList = (list) => {
      if (list.listeningWords.length === 0) {
        alert('聆聽列表已空')
        return
      }
      const randomIndex = Math.floor(Math.random() * list.listeningWords.length)
      const word = list.listeningWords[randomIndex]
      list.currentListeningWord = word
      speak(word)
      list.listeningWords.splice(randomIndex, 1)
      list.playedWords.push(word)
    }

    const refreshListeningMode = (list) => {
      list.listeningWords = [...list.words]
      list.playedWords = []
      list.currentListeningWord = ''
    }

    const removeVocab = (list, idx) => {
      list.words.splice(idx, 1)
    }

    const loadMarkedWordsToList = async (list) => {
      try {
        const res = await api.get('/markedwords')
        res.data.words.forEach(item => {
          if (!list.words.includes(item.word)) list.words.push(item.word)
        })
        console.log('標記單字載入成功')
      } catch (err) {
        console.error('標記單字載入失敗', err)
      }
    }

    return {
      mode,
      vocab,
      vocabLists,
      showAllLists,
      visibleVocabLists,
      addVocabList,
      toggleShowAllLists,
      toggleEditListName,
      appendVocabToList,
      toggleListeningMode,
      randomListeningFromList,
      refreshListeningMode,
      removeVocab,
      loadMarkedWordsToList,
      speak,
      listNameRefs
    }
  }
}
</script>

<style scoped>

input[type="text"] {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 130px;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.refresh_icon {
  height: 25px;
  width: 25px;
  cursor: pointer;
}

li {
  height: 30px;
  display: flex;
  align-items: center;
}

ul {
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

.bin {
  height: 15px;
  width: 15px;
  cursor: pointer;
  vertical-align: middle;
}

#ListDiv {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.or-icon {
  margin: 10px 20px;
  height: 20px;
  width: 30px;
  display: block;
  cursor: pointer;
}

.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip img {
  height: 25px;
  width: 25px;
}
.tooltip img.bin{
  height: 15px;
  width: 15px;
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
  bottom: 100%;
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
  height: 15px;
  width: 15px;
  cursor: pointer;
}

.vocab-lists-container {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); */
  gap: 10px;
}

.vocab-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.vocab-list-card {
  border: 2px solid #cddbf7;
  padding: 8px;
  border-radius: 8px;
  background: #fff;
  position: relative;
}

.vocab-list-body li {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 28px;
}

.vocab-list-body ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.vocab-list{
  display:block;
  width: 140px;
}


.list-name-wrapper{
  display: flex;
  align-items: center;
  padding-top: 10px;
}


.list-name-wrapper h3 {
  margin: 0;
  line-height: 28px;  /* 對齊 input */
}

.list-name-toggle {
  display: flex;
  align-items: center;
}

.list-name-toggle{
  display: flex;
  align-items: center;
}


.list-input-area {
  display: flex;
  gap: 0px;
  align-items: center;
}

.vocab-list-controls {
  display: flex;
  /* gap: 8px; */
  align-items: center;
  padding: auto auto;
  /* margin-top: 8px; */
}

.vocab-list-controls input[type="text"] {
  display: block;
  /* width: auto; */
  margin: 0 ;
}


.mode-toggle-btn {
  background: #ff9800;
  padding: 6px 12px;
  font-size: 0.9em;
  cursor: pointer;
}

.mode-toggle-btn.active {
  background: #ff5722;
}

.listening-mode-controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.listening-mode-controls button {
  flex: 1;
  padding: 10px;
}

.primary-btn {
  background-color: #2196F3;
}

.secondary-btn {
  background-color: #4CAF50;
}


.as{
  padding-top: 15px;
}
</style>