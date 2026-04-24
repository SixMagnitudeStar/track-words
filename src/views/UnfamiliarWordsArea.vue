<template>
  <!--
    vocab-container：整個單字清單元件的容器
    這裡放置輸入、工具列與顯示清單（列表或 A-Z）
  -->
  <div class="vocab-container">
    <!-- ===== 輸入區：新增單字 ===== -->
    <div class="input-section">
      <!--
        v-model="newWord"：
        - 雙向綁定輸入框內容到 newWord (ref)
        - 在 Composition API 的 template 裡 Vue 會自動 unwrap ref（不需要 .value）
      -->
      <input v-model="newWord" placeholder="輸入單字..." />
      <!-- 點擊新增會執行 addWord()，在 script 區塊定義 -->
      <button class="add-btn" @click="addWord">新增</button>
    </div>

    <!-- ===== 工具列：搜尋 / 排序 / 篩選 / 模式切換 ===== -->
    <div class="toolbar">
      <!-- 搜尋框 (filter) -->
      <input v-model="searchQuery" placeholder="🔍 搜尋單字..." class="search-box" />

      <!-- 排序選擇 (加入時間 or 字母) -->
      <select v-model="sortOption" class="sort-select">
        <option value="recent">📅 加入時間</option>
        <option value="alphabetical">🔠 字母排序</option>
      </select>

      <!-- 篩選選擇 (全部 / 已掌握 / 常錯 / 日期) -->
      <select v-model="filterOption" class="filter-select">
        <option value="all">全部</option>
        <option value="familiar">✅ 已掌握</option>
        <option value="mistake">❌ 常錯</option>
        <option value="today">🗓️ 今天</option>
        <option value="recent7">🗓️ 最近 7 天</option>
        <option value="recent30">🗓️ 最近 30 天</option>
        <option value="recent90">🗓️ 最近 90 天</option>
      </select>

      <!-- 切換顯示模式：列表 或 A-Z -->
      <div class="mode-toggle">
        <button :class="{ active: !showTranslations }" @click="showTranslations = !showTranslations">{{ showTranslations ? '隱藏翻譯' : '顯示翻譯' }}</button>
        <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">列表</button>
        <button :class="{ active: viewMode === 'az' }" @click="viewMode = 'az'">A-Z</button>
      </div>
    </div>

    <!-- ===== 單字清單（列表模式） ===== -->
    <transition-group v-if="viewMode === 'list'" name="slide" tag="div" class="word-list">
      <div class="word-item" v-for="word in filteredWords" :key="word.word">
        <div class="word-main">
          <span class="word-text">
            {{ word.word }}
            <span v-if="showTranslations && word.translation" class="translation-text">: {{ word.translation }}</span>
          </span>
          <span class="date-added">{{ formatDate(word.marked_time) }}</span>
        </div>

        <div class="word-tags">
          <span v-if="word.familiar" class="tag familiar">已掌握</span>
          <span v-if="word.mistake" class="tag mistake">常錯</span>

          <div class="progress-bar">
            <div class="progress" :style="{ width: word.progress + '%' }"></div>
          </div>

          <!-- 🔥新增 DELETE 按鈕 -->
          <button class="delete-btn" @click="deleteWord(word.id)">DELETE</button>
        </div>
      </div>
    </transition-group>

    <!-- ===== A-Z 分組模式 ===== -->
    <div v-if="viewMode === 'az'" class="az-list">
      <!-- azGroups 為 A..Z 字母陣列 -->
      <div class="az-group" v-for="letter in azGroups" :key="letter">
        <h3>{{ letter }}</h3>
        <ul>
          <!-- 這裡把 filteredWords.filter 放在 template 中會在每次 render 時重新評估過濾
               效能上可接受（對少量資料），但若資料量變大可以把「已分好群的結果」抽成 computed 以避免重複計算 -->
          <li
            v-for="word in filteredWords.filter(w => w.word.startsWith(letter.toLowerCase()))"
            :key="word.id"
          >
            {{ word.word }}
            <span v-if="word.translation" class="translation-text">: {{ word.translation }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
/*
  Composition API (script setup)：
  - 使用 ref 建立響應式變數
  - 使用 computed 建立衍生資料（filteredWords）
  - 所有 template 中直接使用變數名稱（Vue 會自動 unwrap）
*/


import { ref, computed, onMounted, defineOptions } from 'vue'
import { useWordStore } from '@/stores/wordStore'
//import api from '@/axios.js'

function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekDay = weekdays[date.getDay()]

  const ampm = hours >= 12 ? '下午' : '上午'
  hours = hours % 12
  hours = hours ? hours.toString().padStart(2, '0') : '12' // the hour '0' should be '12'

  return `${year}年 ${month}月${day}日 ${weekDay} ${ampm}${hours}時${minutes}分`
}

defineOptions({
  name: 'UnfamiliarWordsArea'
})

/* ===== state（響應式資料） ===== */
const newWord = ref('')               // 輸入框文字
const searchQuery = ref('')           // 搜尋字串
const sortOption = ref('recent')      // 排序方式：'recent' or 'alphabetical'
const filterOption = ref('all')       // 篩選：'all','familiar','mistake','today','recent7','recent30','recent90'
const viewMode = ref('list')          // 顯示模式：'list' / 'az'
const showTranslations = ref(true)    // 是否顯示翻譯


const store = useWordStore()


onMounted(() => {
  store.fetchWords();
 // fetchMarkedWords();
})
/**
 * 取得標記單字
 * param {Object} options - 查詢選項
 * param {number} options.article_id - 文章 ID
 * param {string} options.marked_from - 起始日期，格式 'YYYY-MM-DD'
 * param {string} options.marked_to - 結束日期，格式 'YYYY-MM-DD'
 * param {number} options.limit - 限制筆數
 */
// async function fetchMarkedWords(options = {}) {
//   try {
//     // 構造 query string，只加入有值的參數
//     const params = {}
//     if (options.article_id !== undefined) params.article_id = options.article_id
//     if (options.marked_from) params.marked_from = options.marked_from
//     if (options.marked_to) params.marked_to = options.marked_to
//     if (options.limit) params.limit = options.limit

//     const res = await api.get('/markedwords', { params })
//     wordList.value = res.data.words
//     console.log('取得單字列表:', wordList.value)
//   } catch (error) {
//     console.error('取得單字列表失敗:', error)
//   }
// }

/* A-Z 的字母群 */
const azGroups = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/* 單字主資料陣列（建議每筆加上唯一 id，這裡為簡化用 text 當 key） */
const wordList = computed(() => store.wordList)
// const wordList = ref([
//   // { id:'1',word: 'abandon', date: '2025-07-28', familiar: false, mistake: true, progress: 30 },
//   // { id:'2',word: 'bounce', date: '2025-07-25', familiar: true, mistake: false, progress: 100 },
//   // { id:'3',word: 'collapse', date: '2025-07-21', familiar: false, mistake: false, progress: 60 },
// ])

/* ===== computed: 根據搜尋 / 篩選 / 排序 產生要顯示的清單 ===== */
const filteredWords = computed(() => {
  // 使用淺拷貝避免直接修改原陣列順序（排序時會改變陣列）
  let result = [...wordList.value]

  // --- 搜尋（不區分大小寫） ---
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(w => w.word.toLowerCase().includes(q))
  }

  // --- 篩選 ---
  switch (filterOption.value) {
    case 'familiar':
      result = result.filter(w => w.familiar)
      break
    case 'mistake':
      result = result.filter(w => w.mistake)
      break
    case 'today': {
      const today = new Date().toISOString().split('T')[0]
      result = result.filter(w => w.marked_time === today)
      break
    }
    case 'recent7': {
      const seven = new Date()
      seven.setDate(seven.getDate() - 7)
      result = result.filter(w => new Date(w.marked_time) >= seven)
      break
    }
    case 'recent30': {
      const thirty = new Date()
      thirty.setDate(thirty.getDate() - 30)
      result = result.filter(w => new Date(w.marked_time) >= thirty)
      break
    }
    case 'recent90': {
      const ninety = new Date()
      ninety.setDate(ninety.getDate() - 90)
      result = result.filter(w => new Date(w.marked_time) >= ninety)
      break
    }
    default:
      // 'all' 或其他未知值：不做額外篩選
      break
  }

  // --- 排序 ---
  if (sortOption.value === 'alphabetical') {
    // 字母排序（localCompare 支援多語系）
    result.sort((a, b) => a.word.localeCompare(b.word))
  } else {
    // recent：依日期從新到舊排序（注意：date 應為可解析的日期字串 yyyy-mm-dd）
    result.sort((a, b) => new Date(b.marked_time) - new Date(a.marked_time))
  }

  return result
})

/* ===== methods ===== */
function addWord() {
  // trim 移除前後空白，避免只插入空白字串
  const text = newWord.value.trim()
  if (!text) return

  // 推入新物件到 wordList（若要更安全，建議加唯一 id，例如 timestamp 或 uuid）
  wordList.value.push({
    text,
    marked_time: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    familiar: false,
    mistake: false,
    progress: 0
  })

  // 清空輸入欄
  newWord.value = ''
}

// 🔥 刪除字
async function deleteWord(id) {
  store.deleteWordById(id)
}

// async function deleteMarkedWordById(id) {
//   try {
//     if (!id) throw new Error('請提供單字 id')

//     // 呼叫後端 API
//     const res = await api.delete(`/markedword/${id}`)
//     console.log('刪除成功:', res.data)

//     // 刪除後自動更新 wordList
//     wordList.value = wordList.value.filter(word => word.id !== id)
//   } catch (error) {
//     console.error('刪除失敗:', error)
//   }
// }

/*
  注意：
  - template 裡使用的 v-model/變數會自動 unwrap，寫成 newWord 而不是 newWord.value（只在 script 中使用 .value）
  - v-for 的 key 不要用索引（:key="index"），因為排序/插入/刪除時會導致 DOM 重新使用錯誤的節點。
    目前使用 :key="word.text"（若文字可能重複，建議改成唯一 id，例如 :key="word.id"）
*/
</script>

<style scoped>
/* =========================
   動畫（enter / leave）部分：
   transition-group 的 class 規則說明：
   - 當使用 name="slide" 時，Vue 會在元素進場時加入：
       .slide-enter-from -> 初始狀態
       .slide-enter-active -> 動畫期間（transition）
       .slide-enter-to -> 動畫結束狀態
     出場時類似使用 .slide-leave-*
   - 這裡實作從右方滑入 (translateX(40px))，以及漸顯效果
   ========================= */

/* 進場：初始為透明且向右偏移 */
.slide-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

/* 進場：過渡效果（期間） */
.slide-enter-active {
  transition: all 0.35s ease;
}

/* 進場：結束狀態，回到正常位置與不透明 */
.slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}

/* 出場：從可見狀態開始 */
.slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* 出場：過渡期間（此處設定 position: absolute 可避免離場元素影響 layout 跳動） */
.slide-leave-active {
  transition: all 0.25s ease;
  position: absolute;
}

/* 出場：結束時往左淡出 */
.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* =========================
   版面樣式（基本樣式）
   可依需求調整顏色 / spacing / RWD
   ========================= */

.vocab-container {
  max-width: 600px;
  padding: 1rem;
  font-family: sans-serif;
}

.input-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
.add-btn:hover {
  filter: brightness(0.95);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-box,
.sort-select,
.filter-select {
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.mode-toggle button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: #eee;
  border-radius: 6px;
  cursor: pointer;
}
.mode-toggle .active {
  background: #3498db;
  color: white;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  /* position relative 可以搭配 leave 時的 absolute，使出場元素不影響其他項目 */
  position: relative;
}

.word-item {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.word-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-added {
  font-size: 0.85em; /* 稍微縮小字體 */
  color: #666; /* 顏色可以稍微淡一點 */
}

.word-tags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
}

.tag.familiar {
  background: #2ecc71;
}

.tag.mistake {
  background: #e74c3c;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #ddd;
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #3498db;
  transition: width 0.2s ease;
}

.az-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.az-group h3 {
  margin: 0;
  color: #333;
}

.az-group ul {
  list-style: none;
  padding-left: 1rem;
  margin: 0;
}


/* DELETE 按鈕樣式 */
.delete-btn {
  margin-left: auto;
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 6px;
  background-color: #e57373; /* 柔和紅色 */
  color: white;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}

.delete-btn:hover {
  background-color: #d32f2f; /* 深紅 */
}

.delete-btn:active {
  transform: scale(0.95);
}
</style>