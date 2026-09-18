<template>
  <div id="container">
    <div>
      <span class="iconBox">
        <div class="tooltip">
          <img @click="handleCreateNewArticle" class="icon" src="../assets/plus.png" alt="建立文章" title="建立文章"/>
          <div class="tooltip-text">建立文章</div>
        </div>
        <div class="tooltip">
          <img @click="openTopicModal" class="icon" src="../assets/random.png" alt="隨機生成文章" title="隨機生成文章">
          <div class="tooltip-text">隨機一篇生成文章</div>
        </div>
        <div class="tooltip" v-if="selectedArticle && selectedArticle.id && !isEditing">
          <img @click="handleEditArticle" class="icon" src="../assets/edit.png" alt="編輯文章" title="編輯文章">
          <div class="tooltip-text">編輯文章</div>
        </div>
        <div class="tooltip" v-else-if="selectedArticle && selectedArticle.id && isEditing">
          <span @click="handleCancelEdit" class="icon font-bold" style="font-size: 20px; line-height: 25px; display: inline-block; cursor: pointer;" title="取消編輯">❌</span>
          <div class="tooltip-text">取消編輯</div>
        </div>
        <div class="tooltip">
          <img @click="handleSaveArticle" class="icon" src="../assets/check.png" alt="儲存文章" title="儲存文章">
          <div class="tooltip-text">儲存文章</div>
        </div>
        <div class="tooltip">
          <img @click="handleDeleteArticle" class="icon" src="../assets/bin.png" alt="刪除文章" title="刪除文章">
          <div class="tooltip-text">刪除文章</div>
        </div>
      </span>
      <ul class="article-list">
        <li v-for="(article,index) in articles" 
            :key="article.id"
            :class="{selected: selectedIndex === index}"
            @click="articleStore.selectArticle(index)">
          {{ article.title || '未命名文章' }}
        </li>
      </ul>
    </div>

    <div v-if="isTopicModalVisible" class="modal-overlay" @click.self="closeTopicModal">
      <div class="modal-content">
        <h3>選擇文章主題、語言與字數</h3>
        <div class="topic-buttons">
          <button v-for="topic in predefinedTopics" :key="topic" @click="selectPredefinedTopic(topic)">{{ topic }}</button>
        </div>
        <div class="custom-topic">
          <p>或輸入自訂主題：</p>
          <input type="text" v-model="selectedTopic" placeholder="例如：AI" @keyup.enter="handleGenerateArticle"/>
        </div>
        
        <div class="selector-group">
          <div class="selector-item">
            <label for="article-lang">選擇語言：</label>
            <select id="article-lang" v-model="selectedArticleLanguage">
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Traditional Chinese">繁體中文</option>
            </select>
          </div>
          <div class="selector-item">
            <label for="word-count">文章字數：</label>
            <select id="word-count" v-model="selectedWordCount">
              <option v-for="count in wordCountOptions" :key="count" :value="count">{{ count }} 字</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="handleGenerateArticle" :disabled="!selectedTopic.trim()">生成文章</button>
          <button @click="closeTopicModal">取消</button>
        </div>
      </div>
    </div>

    <div class="article-content">
      <div class="article-info-bar">
        <div class="mark-mode-selector">
          <span>標記模式：</span>
          <label class="switch">
            <input type="checkbox" v-model="isSelectionMode">
            <span class="slider round"></span>
          </label>
          <span class="mode-label">{{ isSelectionMode ? 'Selection' : 'Click' }}</span>
          <div class="tooltip" v-if="selectedArticle && selectedArticle.id" style="margin-left: 15px; display: flex; align-items: center;">
            <!-- Icon attribution: <a href="https://www.flaticon.com/free-icons/reading" title="reading icons">Reading icons created by mangsaabguru - Flaticon</a> -->
            <img v-if="!showQuiz" src="../assets/test.png" @click="showQuiz = true" class="icon" style="cursor: pointer; width: 24px; height: 24px;" alt="閱讀測驗" />
            <img v-else src="../assets/reading-book.png" @click="showQuiz = false" class="icon" style="cursor: pointer; width: 24px; height: 24px;" alt="閱讀文章" />
            <div class="tooltip-text">{{ showQuiz ? '閱讀文章' : '閱讀測驗' }}</div>
          </div>
        </div>
        <span>已標記單字: {{ markedWordsCount }}</span>
      </div>

      <div v-show="!showQuiz" style="height: 100%; display: flex; flex-direction: column;">
        <h1 class="article-title"
            :contenteditable="isEditing" 
            placeholder="請輸入標題"
            @input="onTitleInput"
            @keydown="handleTitleKeydown"
            ref="editableTitle"
            spellcheck="false"></h1>

        <div v-if="onloading" class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">載入中...</div>
        </div>

        <div v-if="isEditing" v-show="!onloading" class="article-editor" contenteditable="true" @input="onContentInput" ref="editorRef"></div>
          
        <div id="spandiv" v-else v-show="!onloading" @mouseup="handleMouseUp">
          <template v-for="(block, index) in selectedArticle.blocks" :key="index">
            <img v-if="block.text_type === 'image'" :src="block.text" class="article-image" :style="block.style" />
            <span v-else
              :style="block.style" 
              :class="{ word: block.text_type==='word', active: block.marked, paragraph: block.text_type==='paragraph' }"
              :data-index="index"
              @click="handleBlockClick(block, $event)"
              @mouseenter="handleMouseEnter(block, $event)"
              @mouseleave="handleMouseLeave"
              v-html="block.text"
            ></span>
          </template>
        </div>
      </div>

      <div v-if="showQuiz" class="quiz-container" style="padding: 20px; overflow-y: auto;">
        <h2 style="margin-bottom: 20px;">閱讀測驗</h2>
        <div v-if="!selectedArticle.reading_quiz || selectedArticle.reading_quiz.length === 0">
          <p style="margin-bottom: 10px;">這篇文章尚未建立閱讀測驗。</p>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label>題目數量：</label>
            <input type="number" v-model="generateQuizCount" min="1" max="20" style="width: 60px; padding: 4px;"> 題
            <button @click="handleGenerateQuiz" :disabled="isGeneratingQuiz" style="padding: 4px 12px; cursor: pointer;">
              {{ isGeneratingQuiz ? '生成中...' : '生成閱讀測驗' }}
            </button>
          </div>
        </div>
        <div v-else>
          <div v-for="(q, index) in selectedArticle.reading_quiz" :key="index" class="quiz-question" style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
            <p style="font-weight: bold; margin-bottom: 10px;">{{ index + 1 }}. {{ q.question }}</p>
            <ul style="list-style: none; padding: 0;">
              <li v-for="(opt, optIndex) in q.options" :key="optIndex" style="margin-bottom: 8px;">
                <label style="cursor: pointer; display: flex; align-items: flex-start; gap: 8px;">
                  <input type="radio" :name="'question-' + index" :value="String.fromCharCode(65 + optIndex)" 
                         :checked="q.user_answer === String.fromCharCode(65 + optIndex)" 
                         @change="handleQuizAnswerChange(index, String.fromCharCode(65 + optIndex))"
                         style="margin-top: 4px;">
                  <span>{{ String.fromCharCode(65 + optIndex) }}. {{ opt }}</span>
                </label>
              </li>
            </ul>
            <div v-if="q.user_answer" style="margin-top: 10px; font-size: 0.9em; padding: 8px; border-radius: 4px; background-color: #f5f5f5;" 
                 :style="{ borderLeft: q.user_answer === q.correct_answer ? '4px solid #4CAF50' : '4px solid #F44336' }">
              你的答案: <strong>{{ q.user_answer }}</strong> 
              <span v-if="q.user_answer !== q.correct_answer" style="color: #F44336; margin-left: 10px;">(正確答案: {{ q.correct_answer }})</span>
              <span v-else style="color: #4CAF50; margin-left: 10px;">✔️ 回答正確</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Translation Tooltip -->
      <div v-if="hoveredTranslation" class="translation-tooltip" :style="tooltipPosition">
        {{ hoveredTranslation }}
      </div>
      
      <!-- Hover Translation Tooltip -->
      <div 
        v-if="hoverTooltip.show" 
        class="translation-tooltip" 
        :style="tooltipStyle"
        @mouseenter="clearHideTimeout"
        @mouseleave="startHideTimeout"
      >
        <span v-if="hoverTooltip.text">{{ hoverTooltip.text }}</span>
        <span @click="speak(hoverTooltip.word)" class="speaker-icon" title="聆聽發音" style="margin-left: 6px;">🔊</span>
      </div>
      
      <div v-if="showCancelConfirmation" class="cancel-confirmation" :style="confirmationPos" @mouseleave="showCancelConfirmation = false">
        <button @click="confirmCancelMark">Cancel Mark</button>
      </div>
      
      <div class="icon-attribution" style="margin-top: auto; padding: 20px 0 10px; font-size: 12px; color: #aaa; text-align: center; line-height: 1.5;">
        <a href="https://www.flaticon.com/free-icons/reading" title="reading icons" target="_blank" style="color: #aaa; text-decoration: none;">Reading icons created by mangsaabguru - Flaticon</a><br>
        <a href="https://www.flaticon.com/free-icons/test" title="test icons" target="_blank" style="color: #aaa; text-decoration: none;">Test icons created by Magnific - Flaticon</a>
      </div>
    </div>

    <div class="resizer" @mousedown="startResize"></div>

    <div class="note-div" :style="{ width: sidebarWidth + 'px' }">
      <details open>
        <summary>不熟悉單字清單</summary>
        <div class="record-words-area" :style="{ height: wordsHeight + 'px' }">      
          <div class="input-bar">
            <div class="translation-controls">
              <span v-if="!isTranslating" @click="toggleTranslation" class="translation-bar">
                <img src="../assets/translate.png" title="翻譯標記單字..">
                <span>翻譯...</span>
                <span class="checkmark" v-if="translated">✔</span>
              </span>
              <span v-else class="translating-indicator">翻譯中...</span>
              <button @click="showTranslations = !showTranslations" class="toggle-translation-btn" :disabled="!hasTranslations">
                {{ showTranslations ? '關閉翻譯' : '顯示翻譯' }}
              </button>
            </div>
            <span class="parallel-div">
              <input v-model="inputWord" type="text" placeholder="Enter a word" @keyup.enter="handleAddMarkedWord"/>
              <button @click="handleAddMarkedWord">Add</button>
            </span>
          </div>
          <div class="marked-word-list">
            <ul>
              <li v-for="(word, index) in selectedArticle.marked_words" :key="index">
                <div class="word-item-container">
                  <div class="action-icons">
                    <img @click="articleStore.deleteMarkedWord(word)" class="icon-btn remove-icon" src="../assets/bin2.png" title="刪除單字">
                    <span @click="speak(word.word)" class="speaker-icon" title="聆聽發音">🔊</span>
                    <img @click="editWordTranslation(word)" class="icon-btn edit-icon" src="../assets/edit.png" title="編輯翻譯">
                  </div>
                  <div class="word-text">
                    <span class="word-en">{{word.word}}</span>
                    <span v-if="showTranslations && word.translation" class="translation-text">: {{ word.translation }}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="h-resizer" @mousedown="startResizeHeight('words', $event)"></div>
      </details>

      <details>
        <summary>筆記</summary>
        <div class="note-area" contenteditable="true" ref="noteArea" @input="onNoteInput" :style="{ height: notesHeight + 'px' }"></div>
        <div class="status">{{ noteSaveStatus }}</div>
        <div class="h-resizer" @mousedown="startResizeHeight('notes', $event)"></div>
      </details>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast.show" 
           :class="['toast-container', toast.type === 'success' ? 'toast-success' : 'toast-error']">
        <div class="toast-content">
          <span v-if="toast.type === 'success'" class="toast-icon">✓</span>
          <span v-else class="toast-icon">✕</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </div>
    </Transition>
    <TranslationModal 
      :visible="translationModalState.visible"
      :word="translationModalState.word"
      :translation="translationModalState.translation"
      @close="translationModalState.visible = false"
      @submit="handleTranslationSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineOptions, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useArticleStore } from '@/stores/articleStore.js'
import { speakText } from '@/utils/tts.js'
import TranslationModal from '@/components/TranslationModal.vue'

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
const isSelectionMode = ref(false)
const showCancelConfirmation = ref(false)
const confirmationPos = ref({ top: '0px', left: '0px' })
const activeMarkId = ref(null)
const translated = ref(false)
const showTranslations = ref(true)
const isTranslating = ref(false)
const inputWord = ref('')
const noteSaveStatus = ref('')
const saveTimer = ref(null)

const showQuiz = ref(false)
const generateQuizCount = ref(10)
const isGeneratingQuiz = ref(false)

const handleGenerateQuiz = async () => {
  if (isGeneratingQuiz.value) return;
  isGeneratingQuiz.value = true;
  try {
    await articleStore.generateReadingQuiz(generateQuizCount.value);
    showToast('閱讀測驗生成成功！');
  } catch (error) {
    showToast('生成失敗，請稍後再試。', 'error');
  } finally {
    isGeneratingQuiz.value = false;
  }
}

const handleQuizAnswerChange = async (index, answer) => {
  try {
    await articleStore.updateReadingQuizAnswer(index, answer);
    showToast('已記錄您的答案');
  } catch (error) {
    showToast('儲存答案失敗', 'error');
  }
}

const hoveredTranslation = ref('')
const tooltipPosition = ref({ top: '0px', left: '0px' })

const editableTitle = ref(null)
const editorRef = ref(null)
const noteArea = ref(null)
const sidebarWidth = ref(400)
const wordsHeight = ref(300)
const notesHeight = ref(300)
const activeHeightType = ref(null)
let startY = 0
let startH = 0

const startResize = () => {
  window.addEventListener('mousemove', doResize)
  window.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const doResize = (e) => {
  const noteDiv = document.querySelector('.note-div')
  if (noteDiv) {
    const rect = noteDiv.getBoundingClientRect()
    // Calculate width from the right edge of the sidebar to the mouse position
    const newWidth = rect.right - e.clientX
    // Set constraints to prevent the sidebar from becoming too small or too large
    if (newWidth > 200 && newWidth < 800) {
      sidebarWidth.value = newWidth
    }
  }
}

const stopResize = () => {
  window.removeEventListener('mousemove', doResize)
  window.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const startResizeHeight = (type, e) => {
  activeHeightType.value = type
  startY = e.clientY
  startH = type === 'words' ? wordsHeight.value : notesHeight.value
  window.addEventListener('mousemove', doResizeHeight)
  window.addEventListener('mouseup', stopResizeHeight)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

const doResizeHeight = (e) => {
  const deltaY = e.clientY - startY
  const newHeight = startH + deltaY
  if (newHeight > 100 && newHeight < 800) {
    if (activeHeightType.value === 'words') {
      wordsHeight.value = newHeight
    } else {
      notesHeight.value = newHeight
    }
  }
}

const stopResizeHeight = () => {
  window.removeEventListener('mousemove', doResizeHeight)
  window.removeEventListener('mouseup', stopResizeHeight)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// --- Hover Tooltip State ---
const hoverTooltip = reactive({
  show: false,
  text: '',
  word: '',
  x: 0,
  y: 0
})

const tooltipStyle = computed(() => ({
  top: `${hoverTooltip.y}px`,
  left: `${hoverTooltip.x}px`
}))

let hideTimeout = null

function clearHideTimeout() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

function startHideTimeout() {
  clearHideTimeout()
  hideTimeout = setTimeout(() => {
    hoverTooltip.show = false
  }, 200)
}

function handleMouseEnter(block, event) {
  if (block.text_type === 'word') {
    clearHideTimeout()
    
    // 先用 mark_id 找，這對於選取標記（多個 blocks）最準確
    let found = null;
    if (block.marked) {
      found = selectedArticle.value.marked_words.find(mw => mw.mark_id === block.mark_id);
      // 如果沒找到，嘗試用文字匹配（相容舊資料或手動新增）
      if (!found) {
        found = selectedArticle.value.marked_words.find(mw => mw.word.trim() === block.text.trim());
      }
    }

    const rect = event.target.getBoundingClientRect();
    hoverTooltip.text = found?.translation || '';
    hoverTooltip.word = found?.word || block.text.replace(/<[^>]*>/g, '').trim();
    // 將 tooltip 置於單字上方中央
    hoverTooltip.x = rect.left + window.scrollX + (rect.width / 2);
    hoverTooltip.y = rect.top + window.scrollY - 10;
    hoverTooltip.show = true;
  }
}

function handleMouseLeave() {
  startHideTimeout()
}

const toast = reactive({
  show: false,
  message: '',
  type: 'success'
})

function showToast(message, type = 'success') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

const hasTranslations = computed(() => {
  return selectedArticle.value.marked_words.some(word => word.translation && word.translation.trim() !== '');
});

const markedWordsCount = computed(() => {
  return selectedArticle.value?.marked_words?.length || 0;
});


// --- Topic Modal State ---
const isTopicModalVisible = ref(false)
const predefinedTopics = ref(['History', 'Health', 'Education', 'Lifestyle', 'Travel', 'Technology', 'Science', 'Finance', 'Sports', 'Environment', 'Culture'])
const selectedTopic = ref('')
const wordCountOptions = ref([500, 1000, 1500, 2000]);
const selectedWordCount = ref(500);
const selectedArticleLanguage = ref('English');

const speak = (text) => {
  const targetLang = selectedArticle.value?.language || 'en';
  speakText(text, targetLang);
};
const translationModalState = reactive({
  visible: false,
  word: '',
  translation: ''
})

const editWordTranslation = (wordObj) => {
  translationModalState.word = wordObj.word
  translationModalState.translation = wordObj.translation || ''
  translationModalState.visible = true
}

const handleTranslationSubmit = async (newTranslation) => {
  translationModalState.visible = false
  try {
    await articleStore.updateWordTranslation(translationModalState.word, newTranslation)
    showToast("翻譯更新成功", "success")
  } catch (err) {
    showToast("更新翻譯失敗", "error")
  }
}
// --- Lifecycle Hooks ---
onMounted(() => {
  document.body.classList.add('articleReading-bg')
  // Load articles only if the list is empty
  if (articles.value.length === 0) {
    articleStore.loadArticles()
  }
  // This is a good place to ensure DOM refs are synced, though the watcher handles it.
  syncRefsToStore();
})

onUnmounted(() => {
  document.body.classList.remove('articleReading-bg')
})

// --- Methods ---

async function handleBlockClick(block, event) {
  if (!isSelectionMode.value) {
    // Click 模式：直接切換狀態，不跳確認
    if (block.marked) {
      await articleStore.unmarkGroup(block.mark_id);
    } else {
      const markId = Date.now().toString();
      await articleStore.toggleBlockMark(block, markId);
    }
    showCancelConfirmation.value = false;
  } else {
    // Selection 模式：點擊已標記處才跳出 Cancel Mark 按鈕
    if (block.marked) {
      const rect = event.target.getBoundingClientRect();
      confirmationPos.value = {
        top: `${rect.top + window.scrollY - 30}px`,
        left: `${rect.left + window.scrollX}px`
      };
      activeMarkId.value = block.mark_id;
      showCancelConfirmation.value = true;
    }
  }
}

async function confirmCancelMark() {
  if (!activeMarkId.value) return;
  await articleStore.unmarkGroup(activeMarkId.value);
  showCancelConfirmation.value = false;
  activeMarkId.value = null;
}

function handleMouseUp() {
  if (!isSelectionMode.value) return;
  
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  // const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  
  if (selectedText.length > 0) {
    // Find all spans within the selection
    const container = document.getElementById('spandiv');
    const spans = container.querySelectorAll('span[data-index]');
    let startIndex = Infinity;
    let endIndex = -Infinity;

    spans.forEach(span => {
      if (selection.containsNode(span, true)) {
        const index = parseInt(span.getAttribute('data-index'));
        if (index < startIndex) startIndex = index;
        if (index > endIndex) endIndex = index;
      }
    });

    if (startIndex !== Infinity && endIndex !== -Infinity) {
      const markId = Date.now().toString();
      articleStore.markSelection(selectedText, selectedArticle.value.id, markId, startIndex, endIndex);
    }
    selection.removeAllRanges();
  }
}

let lastSyncedArticleId = null;

function syncRefsToStore() {
    if (!selectedArticle.value) return;

    const articleId = selectedArticle.value.id;
    const forceSync = (articleId !== lastSyncedArticleId);

    // Title
    if (editableTitle.value) {
        const isFocused = document.activeElement === editableTitle.value;
        if ((forceSync || !isFocused) && editableTitle.value.innerText !== selectedArticle.value.title) {
            editableTitle.value.innerText = selectedArticle.value.title || '';
        }
    }

    // Note
    if (noteArea.value) {
        const isFocused = document.activeElement === noteArea.value;
        if ((forceSync || !isFocused) && noteArea.value.innerText !== selectedArticle.value.note) {
            noteArea.value.innerText = selectedArticle.value.note || '';
        }
    }

    // Content (Editor)
    if (editorRef.value) {
        const isFocused = document.activeElement === editorRef.value;
        if (isEditing.value && (forceSync || !isFocused) && editorRef.value.innerHTML !== selectedArticle.value.content) {
            editorRef.value.innerHTML = selectedArticle.value.content || '';
        }
    }

    lastSyncedArticleId = articleId;
}

async function toggleTranslation() {
  if (isTranslating.value) return; // Prevent multiple calls
  isTranslating.value = true;
  try {
    const success = await articleStore.translateMarkedWords();
    if (success) {
      translated.value = true;
      showTranslations.value = true;
      showToast('翻譯完成！')
    }
  } catch (error) {
    showToast('翻譯失敗，請稍後再試。', 'error')
  } finally {
    isTranslating.value = false;
  }
}

// 將元件的 ref innerText 同步到 store
function onTitleInput(e) {
  articleStore.updateArticleTitle(e.target.innerText)
}

function onContentInput(e) {
  articleStore.updateArticleContent(e.target.innerHTML)
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

function handleEditArticle() {
  isEditing.value = true
}

async function handleCancelEdit() {
  if (window.confirm('確定要捨棄未儲存的編輯嗎？')) {
    await articleStore.discardChanges()
  }
}

// --- Topic Modal Methods ---
function openTopicModal() {

  if (articleStore.onloading) return;
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


// 判斷是不是文字 (支援英文、日文、韓文、中文)
function isWord(str) {
  // 包含英數字、日文(平假名、片假名、漢字)、韓文、中文
  return /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]+$/.test(str)
}

// 取得單字的翻譯 (用於滑鼠懸停顯示)
// function getWordTranslation(block) {
//   if (!block.marked || !block.mark_id || !selectedArticle.value?.marked_words) return '';
//   const wordObj = selectedArticle.value.marked_words.find(w => w.mark_id === block.mark_id);
//   return wordObj?.translation || '';
// }

// function handleMouseEnter(block, event) {
//   const translation = getWordTranslation(block);
//   if (translation) {
//     hoveredTranslation.value = translation;
//     const rect = event.target.getBoundingClientRect();
//     tooltipPosition.value = {
//       top: `${rect.top + window.scrollY - 40}px`,
//       left: `${rect.left + window.scrollX + rect.width / 2}px`
//     };
//   }
// }

// function handleMouseLeave() {
//   hoveredTranslation.value = '';
// }

// 解析文章編輯器的內容，拆成 blocks
const parseArticleText = computed(() => {
    const blocks = []
    let idx = 0
    const editor = editorRef.value
    if (!editor) return []

    function processNode(node, parentStyle = '') {
      if (node.nodeType === Node.TEXT_NODE) {
        // 更新正則：除了空白和換行，將英數字連續抓取，並將中日韓字元單獨抓取
        const words = node.textContent.match(/\n|\s+|[a-zA-Z0-9]+|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]|[^\s\w]/g) || []
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

        if (tag === 'img') {
          blocks.push({
            index: idx, text: node.src, text_type: 'image',
            previous_index: idx === 0 ? null : idx - 1,
            next_index: null, style: parentStyle
          })
          idx++
          return
        }

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
  if (articleStore.onloading) return;

  let blocksToSave = null;
  if (isEditing.value && editorRef.value) {
    blocksToSave = parseArticleText.value;
  }
  
  try {
    const result = await articleStore.saveArticle(blocksToSave);
    if (result && result.success) {
      showToast(result.message);
    }
  } catch (error) {
    showToast('文章儲存失敗', 'error');
  }
}

function handleDeleteArticle() {
  const title = selectedArticle.value.title || '這篇文章';
  if (window.confirm(`確定要刪除「${title}」嗎？此動作無法復原。`)) {
    articleStore.deleteArticle();
    showToast('文章已刪除');
  }
}

// 筆記自動儲存
function onNoteInput() {
  if (saveTimer.value) {
    clearTimeout(saveTimer.value)
  }
  noteSaveStatus.value = '輸入中...'
  
  saveTimer.value = setTimeout(async () => {
    noteSaveStatus.value = '💾 儲存中...'
    const newNote = noteArea.value.innerText;
    
    // 紀錄開始時間，確保「儲存中」至少顯示 800ms
    const startTime = Date.now();
    const status = await articleStore.saveNote(newNote);
    const elapsed = Date.now() - startTime;
    
    if (elapsed < 800) {
      await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
    }
    
    noteSaveStatus.value = status;
    
    // 3 秒後清除狀態字樣
    setTimeout(() => {
      if (noteSaveStatus.value === status) {
        noteSaveStatus.value = '';
      }
    }, 3000);
  }, 1000)
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

<style>
body.articleReading-bg {
  background-image: url('@/assets/articleReading-page-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
</style>

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

.article-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}

.article-content{
    flex: 1;
    text-align: left;
    font-size: 24px;
    margin: 30px;
    border: none;
    outline: none;
    min-width: 300px;
}

.article-editor{
    flex: 1;
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

.article-info-bar {
  /* background-color: #f8f9fa; */
  padding: 8px 12px;
  /* border-radius: 4px; */
  margin-bottom: 16px;
  font-size: 14px;
  color: #555;
  /* border: 1px solid #e0e0e0; */
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

.resizer {
  width: 8px;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.2s;
  z-index: 10;
}

.resizer:hover, .resizer:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.note-div{
  height: 100%;
  flex-shrink: 0;
}

.note-div .record-words-area{
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 15px;
  resize: vertical;
  overflow: auto;
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
  display: block;
  text-align: left;
  border-radius: 15px;
  padding: 10px;
  resize: vertical;
  overflow: auto;
}

.h-resizer {
  height: 8px;
  cursor: row-resize;
  width: 100%;
  transition: background 0.2s;
  z-index: 10;
}

.h-resizer:hover, .h-resizer:active {
  background-color: rgba(0, 0, 0, 0.05);
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

.word-item-container {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
}

.action-icons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
  align-items: center;
}

.icon-btn {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
  object-fit: contain;
}

.speaker-icon {
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
}

.icon-btn:hover, .speaker-icon:hover {
  filter: brightness(0.8);
}

.word-text {
  flex-grow: 1;
  word-break: break-word;
  line-height: 1.4;
}

.word-en {
  font-weight: 500;
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

.selector-group {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  margin-bottom: 25px;
}

.selector-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.selector-item label {
  font-size: 14px;
  color: #666;
}

.selector-item select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  min-width: 120px;
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

/* Mark Mode Switch Styles */
.mark-mode-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.mode-label {
  font-weight: bold;
  min-width: 70px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(20px);
  -ms-transform: translateX(20px);
  transform: translateX(20px);
}

.slider.round {
  border-radius: 20px;
}

.slider.round:before {
  border-radius: 50%;
}

.cancel-confirmation {
  position: absolute;
  z-index: 100;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  padding: 5px;
}

.cancel-confirmation button {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-confirmation button:hover {
  background-color: #ff3333;
}

/* Custom Translation Tooltip */
.translation-tooltip {
  position: absolute;
  z-index: 2000;
  background-color: #333;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  pointer-events: auto; /* 允許滑鼠與 tooltip 互動 */
  transform: translateX(-50%);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.translation-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

/* Toast Styles */
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
}

.toast-success {
  background-color: #4caf50;
  color: white;
}

.toast-error {
  background-color: #f44336;
  color: white;
}

.toast-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 500;
}

.toast-icon {
  font-size: 1.2em;
}

/* Toast Animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

/* Hover Translation Tooltip Styles */
.translation-tooltip {
  position: absolute;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  pointer-events: auto; /* 允許滑鼠與 tooltip 互動 */
  transform: translate(-50%, -100%); /* 向上位移並水平居中 */
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.translation-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
}
</style>
