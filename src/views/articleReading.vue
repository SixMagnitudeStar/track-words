<template>
  <div id="container">
    <div>
      <!-- <button @click="showblock">顯示block</button> -->
      <span class="iconBox">
        <div class="tooltip">
          <img @click="handleCreateNewArticle" class="icon" src="../assets/plus.png" alt="建立文章" title="建立文章"/>
          <div class="tooltip-text">建立文章</div>
        </div>
        
        <div class="tooltip">
          <img @click="openTopicModal" class="icon" src="../assets/random.png" alt="隨機生成文章" title="隨機生成文章">
          <div class="tooltip-text">隨機一篇生成文章</div>
        </div>
        <div class="tooltip">
          <img @click="handleSaveArticle" class="icon" src="../assets/check.png" alt="儲存文章" title="儲存文章">
          <div class="tooltip-text">儲存文章</div>
        </div>
        <div class="tooltip">
          <img @click="articleStore.deleteArticle()" class="icon" src="../assets/bin.png" alt="刪除文章" title="刪除文章">
          <div class="tooltip-text">刪除文章</div>
        </div>
      </span>
      <ul class="article-list">
        <li v-for="(article,index) in articles" 
        v-bind:key="article.id"
        :class="{selected: selectedIndex === index}"
        @click="articleStore.selectArticle(index)"
        >{{ article.title  || '未命名文章' }}</li>
      </ul>
    </div>

    <!-- Topic Selection Modal -->
    <div v-if="isTopicModalVisible" class="modal-overlay" @click.self="closeTopicModal">
      <div class="modal-content">
        <h3>選擇文章主題與字數</h3>
        <div class="topic-buttons">
          <button v-for="topic in predefinedTopics" :key="topic" @click="selectPredefinedTopic(topic)">
            {{ topic }}
          </button>
        </div>
        <div class="custom-topic">
          <p>或輸入自訂主題：</p>
          <input type="text" v-model="selectedTopic" placeholder="例如：Artificial Intelligence" @keyup.enter="handleGenerateArticle"/>
        </div>
        <div class="word-count-selector">
            <label for="word-count">選擇文章字數：</label>
            <select id="word-count" v-model="selectedWordCount">
                <option v-for="count in wordCountOptions" :key="count" :value="count">
                {{ count }} 字
                </option>
            </select>
        </div>
        <div class="modal-actions">
          <button @click="handleGenerateArticle" :disabled="!selectedTopic.trim()">生成文章</button>
          <button @click="closeTopicModal">取消</button>
        </div>
      </div>
    </div>

    <div class="article-content" >
      <h1 class="article-title"
          :contenteditable="isEditing" 
          placeholder="請輸入標題"
          @input="onTitleInput"
          @keydown="handleTitleKeydown"
          ref="editableTitle"
          spellcheck="false"
      ></h1>
      <div v-if="onloading" class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">載入中...</div>
      </div>
      <div v-if="isEditing" 
        class="article-editor" 
        contenteditable="true"
        @input="onContentInput"
         ref="editorRef"
        ></div>
        
      <div id="spandiv" v-else v-show="!onloading">
      <span
        v-for="(block, index) in selectedArticle.blocks"
        :style="block.style" 
        :key="index"
        :class="{ 
          word: block.text_type==='word', 
          active: block.marked,
          paragraph: block.text_type==='paragraph' 
        }"
        @click="articleStore.toggleBlockMark(block)"
        v-html="block.text"
      ></span>
      </div>
    </div>

    <div class="note-div">
      <details open>
        <summary>不熟悉單字清單</summary>
        <div class="record-words-area">      
          <div class="input-bar">
            <div class="translation-controls">
              <span v-if="!isTranslating" @click="toggleTranslation" class="translation-bar" >
                <img src="../assets/translate.png" title="翻譯標記單字..">
                <span>翻譯...</span>
                <span class="checkmark" v-if="translated">✔</span>
              </span>
              <span v-else class="translating-indicator">
                翻譯中...
              </span>
              <button @click="showTranslations = !showTranslations" class="toggle-translation-btn" :disabled="!hasTranslations">
                {{ showTranslations ? '關閉翻譯' : '顯示翻譯' }}
              </button>
            </div>
            <span class="parallel-div">
              <input v-model="inputWord" type="text" placeholder="Enter a word & phrase" @keyup.enter="handleAddMarkedWord"/>
              <button @click="handleAddMarkedWord">Add</button>
            </span>
          </div>
          
          <div class="marked-word-list">
            <ul>
              <li v-for="(word, index) in selectedArticle.marked_words" :key="index">
                <div class="parallel-div">
                  <img @click="articleStore.deleteMarkedWord(word)" class="remove-marked-word-icon" src="../assets/bin2.png" alt="移除單字" title="移除單字">
                  <span>{{word.word}}</span>
                  <span v-if="showTranslations && word.translation" class="translation-text">
                    : {{ word.translation }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </details>

      <details>
        <summary>筆記</summary>
        <div
            class="note-area"
            contenteditable="true"
            ref="noteArea"
            @input="onNoteInput"
        ></div>
        <div class="status">{{ noteSaveStatus }}</div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, defineOptions } from 'vue'
import { storeToRefs } from 'pinia'
import { useArticleStore } from '@/stores/articleStore.js'

defineOptions({
  name: 'articleReading'
})

// --- Store ---
const articleStore = useArticleStore()
// Immediately ensure an article is selected if the list is already populated
if (articleStore.articles.length > 0) {
  articleStore.selectArticle(articleStore.selectedIndex);
}
const { articles, selectedIndex, selectedArticle, isEditing, onloading } = storeToRefs(articleStore)


// --- Local State & Refs ---
const translated = ref(false)
const showTranslations = ref(false)
const isTranslating = ref(false)
const inputWord = ref('')
const noteSaveStatus = ref('')
const saveTimer = ref(null)

const editableTitle = ref(null)
const editorRef = ref(null)
const noteArea = ref(null)

const hasTranslations = computed(() => {
  return selectedArticle.value.marked_words.some(word => word.translation && word.translation.trim() !== '');
});

// --- Topic Modal State ---
const isTopicModalVisible = ref(false)
const predefinedTopics = ref(['History', 'Health', 'Education', 'Lifestyle', 'Travel', 'Technology', 'Science', 'Finance', 'Sports'])
const selectedTopic = ref('')
const wordCountOptions = ref([500, 1000, 1500, 2000]);
const selectedWordCount = ref(500);


// --- Lifecycle Hooks ---
onMounted(() => {
  // Load articles only if the list is empty
  if (articles.value.length === 0) {
    articleStore.loadArticles()
  }
  // This is a good place to ensure DOM refs are synced, though the watcher handles it.
  syncRefsToStore();
})

// --- Methods ---

function syncRefsToStore() {
    if (editableTitle.value && editableTitle.value.innerText !== selectedArticle.value.title) {
        editableTitle.value.innerText = selectedArticle.value.title
    }
    if (noteArea.value && noteArea.value.innerText !== selectedArticle.value.note) {
        noteArea.value.innerText = selectedArticle.value.note
    }
    if (isEditing.value && editorRef.value && editorRef.value.innerText !== selectedArticle.value.content) {
      editorRef.value.innerText = selectedArticle.value.content;
    }
}

async function toggleTranslation() {
  if (isTranslating.value) return; // Prevent multiple calls
  isTranslating.value = true;
  try {
    const success = await articleStore.translateMarkedWords();
    if (success) {
      translated.value = true;
      showTranslations.value = true;
    }
  } finally {
    isTranslating.value = false;
  }
}

// 將元件的 ref innerText 同步到 store
function onTitleInput(e) {
  articleStore.updateArticleTitle(e.target.innerText)
}

function onContentInput(e) {
  articleStore.updateArticleContent(e.target.innerText)
}

function handleTitleKeydown(e) {
  if (!isEditing.value) return
  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault()
    editorRef.value?.focus()
  }
}

function handleCreateNewArticle() {
  articleStore.createNewArticle()
  nextTick(() => {
    editableTitle.value?.focus()
  })
}

// --- Topic Modal Methods ---
function openTopicModal() {
  selectedTopic.value = '';
  selectedWordCount.value = 500;
  isTopicModalVisible.value = true;
}

function closeTopicModal() {
  isTopicModalVisible.value = false;
}

function selectPredefinedTopic(topic) {
  selectedTopic.value = topic;
}

function handleGenerateArticle() {
  if (!selectedTopic.value.trim()) {
    return; // Or show an error message
  }
  articleStore.fetchRandomArticle(selectedTopic.value, selectedWordCount.value);
  closeTopicModal();
}


// 判斷是不是文字
function isWord(str) {
  return /^[a-zA-Z0-9]+$/.test(str)
}

// 解析文章編輯器的內容，拆成 blocks
const parseArticleText = computed(() => {
    // ... (parsing logic remains the same)
    const blocks = []
    let idx = 0
    const editor = editorRef.value
    if (!editor) return []

    function processNode(node, parentStyle = '') {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.match(/\n|\s+|\w+|[^\s\w]/g) || []
        for (const word of words) {
          let text_type = 'punctuation'
          if (word === '\n') text_type = 'paragraph'
          else if (word.trim() === '') text_type = 'blank'
          else if (isWord(word)) text_type = 'word'

          blocks.push({
            index: idx, text: word, text_type,
            previous_index: idx === 0 ? null : idx - 1,
            next_index: null, style: parentStyle
          })
          idx++
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase()
        if ((tag === 'p' || tag === 'div') && idx > 0) {
          blocks.push({
            index: idx, text: '\n', text_type: 'paragraph',
            previous_index: idx === 0 ? null : idx - 1,
            next_index: null, style: parentStyle
          })
          idx++
        }
        if (tag === 'br') {
          blocks.push({
            index: idx, text: '\n', text_type: 'paragraph',
            previous_index: idx === 0 ? null : idx - 1,
            next_index: null, style: parentStyle
          })
          idx++
        }
        const computedStyle = window.getComputedStyle(node)
        const currentStyle = `font-weight: ${computedStyle.fontWeight}; font-size: ${computedStyle.fontSize}; color: ${computedStyle.color}; font-style: ${computedStyle.fontStyle}; text-decoration: ${computedStyle.textDecorationLine};`.replace(/\s+/g, ' ').trim()
        const style = parentStyle ? `${parentStyle};${currentStyle}` : currentStyle
        node.childNodes.forEach(child => processNode(child, style))
      }
    }

    editor.childNodes.forEach(child => processNode(child))

    for (let i = 0; i < blocks.length; i++) {
      blocks[i].next_index = i === blocks.length - 1 ? null : i + 1
    }

    return blocks
})

async function handleSaveArticle() {
  let blocksToSave = null;
  if (isEditing.value && editorRef.value) {
    blocksToSave = parseArticleText.value;
  }
  await articleStore.saveArticle(blocksToSave);
}

// 筆記自動儲存
function onNoteInput() {
  clearTimeout(saveTimer.value)
  noteSaveStatus.value = '輸入中...'
  saveTimer.value = setTimeout(async () => {
    noteSaveStatus.value = '💾 儲存中...'
    const newNote = noteArea.value.innerText;
    const status = await articleStore.saveNote(newNote);
    noteSaveStatus.value = status;
    setTimeout(() => (noteSaveStatus.value = ''), 2000);
  }, 3000)
}

// 新增標記單字
async function handleAddMarkedWord() {
  if (inputWord.value.trim() === '') return
  await articleStore.addMarkedWord(inputWord.value, selectedArticle.value.id)
  inputWord.value = ''
}


// --- Watchers ---

// 監聽 selectedArticle 的變化，以同步 UI 顯示
watch(selectedArticle, (newArticle) => {
  if (newArticle) {
    // Using nextTick to ensure the DOM has updated before we try to sync refs
    nextTick(() => {
        syncRefsToStore();
    });
  }
}, { deep: true, immediate: true });


// 當 isEditing 狀態改變時，確保編輯器有正確的內容
watch(isEditing, (editing) => {
    if (editing) {
        nextTick(() => {
            if (editorRef.value) {
                editorRef.value.innerText = selectedArticle.value.content;
                editorRef.value.focus();
            }
        });
    }
});

</script>

<style scoped>
/* Styles remain unchanged */
#container{
  width: 70vw;
  min-height: 60vh;
  height: auto;

  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-top: 5vw;

  display: flex;
}

.word {
  cursor: pointer;
  padding: 2px;
  transition: 0.2s;
  
}
.word.active {
  color: red !important;
  font-weight: bold !important; 
}

.word:hover{
  background-color: #ddd;
  border-radius: 5px;
}

.article-content{
    width: 50vw;
    text-align: left;
    font-size: 24px;
    margin: 30px;
    border: none;
    outline: none;
}

.article-editor{
    width: 50vw;
    text-align: left;
    font-size: 24px;
    margin: 30px;
    border: none;
    outline: none;
    min-height: 300px; /* 給一個最小高度 */
    border: 1px solid #ccc;
}

.article-title{
    border: none;
}

.article-title:empty::before {
  content: "輸入文章標題…";
  color: #aaa;
  pointer-events: none; /* 避免遮住點擊 */
}

.article-list{
  width: 150px;
  background-color: rgba(240, 240, 240, 5);
  height: auto;
  cursor: pointer;
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: auto;
  user-select: none;
} 

.article-list li {
  padding: 10px;
  border-bottom: 1px solid #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-list li.selected {
  background-color: #ddd;
}

.article-list li:last-child {
  border-bottom: none;
}

.note-div{
  width: 400px;
  height: 100%;
}

.note-div .record-words-area{
  height: 25vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 15px;
}

.note-div .record-words-area input{
  border: 2px solid #ccc;
}

.note-div .record-words-area input:focus{
  outline: none;
  border: 2px solid #555;
}

.note-div .record-words-area button{
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.note-div .note-area{
  height: 25vh;
  display: block;
  text-align: left;
  border-radius: 15px;
  padding: 10px;
}

.note-div div{
  background-color: rgba(240, 240, 240, 5);
  overflow: auto;
}

.note-div summary{
  text-align: left;
}

.input-bar{
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.parallel-div {
    display: flex;
}

.editing-icon{
  background-color: #ddd;
  border-radius: 8px;
}

[contenteditable='true']{
  outline: none;
}

.paragraph {
  display: block;
  margin-bottom: 1em;
}

.marked-word-list{
  flex: 1;
  overflow-y: scroll;
  border: none;
}
.marked-word-list ul{
  list-style: none;
  padding-left: 10px;
}
.marked-word-list li{
  text-align: left;
}

.remove-marked-word-icon{
  margin: 2px 10px;
  cursor: pointer;
}

.remove-marked-word-icon:hover{
  background-color: #e0e0e0;
}

.translation-bar {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  border-radius: 4px;
}

.translation-bar:hover{
  background-color: #e0e0e0;
  cursor: pointer;
}

.translation-bar img{
  margin-right: 10px;
}

.checkmark {
  margin-left: 15px;
  color: green;
  font-size: 20px;
}

.translating-indicator {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  color: #555;
  font-style: italic;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 20px;
}

.spinner {
  width: 80px;
  height: 80px;
  border: 6px solid #d6d6d6;
  border-top: 6px solid #2c3e50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
}

@keyframes spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 14px;
  font-size: 20px;
  color: #2c3e50;
  font-weight: 600;
  font-family: "Segoe UI", Arial, sans-serif;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  text-align: center;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.topic-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.topic-buttons button {
  padding: 8px 15px;
  border: 1px solid #ccc;
  border-radius: 20px;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.topic-buttons button:hover {
  background-color: #e0e0e0;
}

.topic-buttons button:focus, .topic-buttons button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.custom-topic {
  margin-bottom: 20px;
}

.custom-topic p {
  margin: 0 0 8px;
  color: #555;
}

.custom-topic input {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.word-count-selector {
    margin-bottom: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.word-count-selector label {
    color: #555;
}

.word-count-selector select {
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.modal-actions button {
  padding: 10px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-actions button:first-child {
  background-color: #007bff;
  color: white;
}

.modal-actions button:first-child:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.modal-actions button:last-child {
  background-color: #f44336;
  color: white;
}

.translation-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-translation-btn {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
}

.toggle-translation-btn:hover {
  background-color: #e0e0e0;
}

.toggle-translation-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.translation-text {
  margin-left: 8px;
  color: #555;
  font-style: italic;
}
</style>