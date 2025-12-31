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
        <div v-else-if="vocabLists.length > 3">
          <button @click="toggleShowAllLists">&lt;&lt; 收合</button>
        </div>
      </div>

      <div class="vocab-lists-container">
        <div v-for="list in visibleVocabLists" :key="list.id" class="vocab-list-card">
          <div class="vocab-list-header">
            <div style="display:flex; gap:8px; align-items:center;">
              <div class="list-name-wrapper">
                <div v-if="list.editing">
                  <input ref="listNameRefs" v-model="list.nameDraft" type="text" title="請輸入列表名稱" @keyup.enter="toggleEditListName(list)" />
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
              </div>
              <div class="tooltip">
                <img class="bin" src="@/assets/bin.png" @click="deleteVocabList(list)" alt="刪除列表" >
                <span class="tooltiptext">刪除列表</span>
              </div>
            </div>

            <div v-if="list.listeningMode" @click="toggleListeningMode(list)" :class="{ active: list.listeningMode }" class="mode-toggle-btn" :title="list.listeningMode ? '退出聆聽模式' : '進入聆聽模式'">
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
            <input v-model="list.input" type="text" placeholder="Enter a word & phrase" @keyup.enter="appendVocabToList(list)" />
            <button @click="appendVocabToList(list)">Add</button>
            <div class="tooltip" @click="openArticleSelectionModal(list)">
              <div class="parallel-div">
                <img src="@/assets/sticky-note.png" alt="">
                <img class="arrow-down icon" src="@/assets/forward.png" alt="將標記單字載入聆聽列表">
              </div>
              <div class="tooltiptext parallel-div">
                <span>從文章載入標記單字</span>
              </div>
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
              <li v-for="(w, idx) in list.words" :key="w.id">{{ w.word }}
                <div class="tooltip">
                  <span @click="speak(w.word)" title="listening vocab">🔊</span>
                  <span class="tooltiptext">listening vocab</span>
                </div>
                <div class="tooltip">
                  <img class="bin" src="@/assets/bin.png" @click="removeVocab(list, idx)" alt="delete">
                  <span class="tooltiptext">Delete vocab</span>
                </div>
              </li>
            </ul>
          </div>

          <div v-else class="parallel-div">
            <div class="vocab-list">
              <ul>
                <li v-for="(w, idx) in list.listeningWords" :key="idx">{{ w.word }}
                  <div class="tooltip">
                    <span @click="speak(w.word)" title="listening vocab">🔊</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="vocab-list">
              <ul>
                <li v-for="(w, idx) in list.playedWords" :key="idx">{{ w.word }}
                  <div class="tooltip">
                    <span @click="speak(w.word)" title="listening vocab">🔊</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>

    <ArticleSelectionModal 
      :visible="isModalVisible" 
      :articles="articles"
      @close="isModalVisible = false"
      @submit="handleModalSubmit"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, reactive, defineOptions } from 'vue'
import api from '@/axios.js'
import { useArticleStore } from '@/stores/articleStore.js'
import { storeToRefs } from 'pinia'
import ArticleSelectionModal from '@/components/ArticleSelectionModal.vue'

defineOptions({
  name: 'ELP'
})

export default {
  components: {
    ArticleSelectionModal
  },
  setup() {
    const mode = ref(1)
    const vocabLists = ref([])
    const showAllLists = ref(false)
   // const nextVocabListId = ref(1)
    const listNameRefs = ref([])

    // Modal state
    const isModalVisible = ref(false)
    const targetList = ref(null)

    // Article Store
    const articleStore = useArticleStore()
    const { articles } = storeToRefs(articleStore)

    const fetchVocabLists = async () => {
      try {
        const response = await api.get('/vocabulary_lists/')
        // Sort by ID descending to show newest first
        const sortedLists = response.data.sort((a, b) => b.id - a.id);
        
        vocabLists.value = sortedLists.map(list => reactive({
          ...list,
          words: list.words || [],
          input: '',
          editing: false,
          nameDraft: list.name,
          listeningMode: false,
          listeningWords: [],
          playedWords: [],
          currentListeningWord: ''
        }))
        console.log('詞彙列表載入成功', vocabLists.value)
      } catch (err) {
        console.error('詞彙列表載入失敗', err)
      }
    }

    onMounted(() => {
      fetchVocabLists()
      articleStore.loadArticles()
    })

    const visibleVocabLists = computed(() => {
      const MAX_VISIBLE = 3
      return showAllLists.value ? vocabLists.value : vocabLists.value.slice(0, MAX_VISIBLE)
    })

    const speak = (text) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      speechSynthesis.speak(utterance)
    }

    const addVocabList = async () => {
      // Create a temporary name for the new list
      const tempName = `New List...`;
      const list = reactive({
        id: -1, // Temporary ID
        name: tempName,
        nameDraft: tempName,
        words: [],
        input: '',
        editing: true,
        listeningMode: false,
        listeningWords: [],
        playedWords: [],
        currentListeningWord: ''
      });
      vocabLists.value.unshift(list);

      try {
        const response = await api.post('vocabulary_lists/', { name: list.nameDraft, description: '' });
        // Update the list with data from the server
        list.id = response.data.list.id;
        list.name = response.data.list.name;
        list.nameDraft = response.data.list.name;
        console.log('列表新增成功', response.data);
        // Focus the input for the new list
        nextTick(() => {
          const el = listNameRefs.value[0];
          if (el) el.focus();
        });
      } catch (err) {
        console.error('新增列表失敗', err);
        alert('無法新增列表，請稍後再試');
        vocabLists.value.shift(); // Remove the temporary list on failure
      }
    }

    const deleteVocabList = async (listToDelete) => {
      if (!confirm(`確定要刪除列表 "${listToDelete.name}" 嗎?`)) return;

      try {
        await api.delete(`/vocabulary_lists/${listToDelete.id}`);
        vocabLists.value = vocabLists.value.filter(list => list.id !== listToDelete.id);
        console.log(`列表 ${listToDelete.id} 已刪除`);
      } catch (err) {
        console.error(`刪除列表 ${listToDelete.id} 失敗`, err);
        alert('刪除失敗，請稍後再試');
      }
    }

    const toggleShowAllLists = () => {
      showAllLists.value = !showAllLists.value
    }

    const toggleEditListName = async (list) => {
      if (list.editing) {
        const name = list.nameDraft.trim();
        if (name === '' || name === list.name) {
          list.editing = false;
          list.nameDraft = list.name; // Reset draft
          return; 
        }
        
        try {
          await api.put(`/vocabulary_lists/${list.id}`, { name: name });
          list.name = name; // Update the name on success
          console.log(`列表 ${list.id} 名稱已更新`);
        } catch (err) {
          console.error(`更新列表 ${list.id} 名稱失敗`, err);
          list.nameDraft = list.name; // Revert draft on failure
        }
        list.editing = false;

      } else {
        list.nameDraft = list.name
        list.editing = true
        nextTick(() => {
          const el = listNameRefs.value.find(input => input.__vnode.key === list.id);
          if (el) el.focus()
        })
      }
    }

    const appendVocabToList = async (list) => {
      const value = list.input.trim()
      if (!value) { alert('請輸入要添加的單字!'); return }

      try {
        const res = await api.post(`/vocabulary_lists/${list.id}/words`, { word: value })
        list.words.push(res.data.word)
        list.input = ''
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
      if (list.listeningMode) {
        list.playedWords = []
        list.listeningWords = [...list.words]
      }
    }

    const randomListeningFromList = (list) => {
      if (list.listeningWords.length === 0) {
        alert('聆聽列表已空')
        return
      }
      const randomIndex = Math.floor(Math.random() * list.listeningWords.length)
      const word = list.listeningWords[randomIndex]
      speak(word.word)
      list.listeningWords.splice(randomIndex, 1)
      list.playedWords.push(word)
    }

    const refreshListeningMode = (list) => {
      list.listeningWords = [...list.words]
      list.playedWords = []
      list.currentListeningWord = ''
    }

    const removeVocab = (list, idx) => {
      const deletedWord = list.words[idx]
      list.words.splice(idx, 1)
      try {
        api.delete(`/vocabulary_lists/${list.id}/words/${deletedWord.id}`)
        console.log(`單字 "${deletedWord.word}" 已從後端刪除`)
      } catch (err) {
        console.error(`刪除單字 "${deletedWord.word}" 失敗`, err)
      }
    }
    
    // --- New Methods for Modal ---
    
    const openArticleSelectionModal = (list) => {
      targetList.value = list;
      isModalVisible.value = true;
    }

    const handleModalSubmit = async (selectedIds) => {
      if (!targetList.value) return;
      isModalVisible.value = false;
      if (selectedIds.length === 0) return;
      
      console.log('選取文章ID:', selectedIds);
      const words_to_add = await articleStore.getMarkedWordsFromArticles(selectedIds);
      console.log('將要載入的標記單字:', words_to_add);

      for (const item of words_to_add) {
          const alreadyExists = targetList.value.words.some(w => w.word === item.word);
          if (alreadyExists) continue;

          try {
            const res = await api.post(`/vocabulary_lists/${targetList.value.id}/words`, {
              word: item.word
            });
            targetList.value.words.push(res.data.word);
            console.log(`單字 "${item.word}" 已添加到後端`);
          } catch (err) {
            console.error(`添加單字 "${item.word}" 失敗`, err);
          }
      }
    }


    return {
      mode,
      vocabLists,
      showAllLists,
      visibleVocabLists,
      addVocabList,
      deleteVocabList,
      toggleShowAllLists,
      toggleEditListName,
      appendVocabToList,
      toggleListeningMode,
      randomListeningFromList,
      refreshListeningMode,
      removeVocab,
      speak,
      listNameRefs,
      // Modal
      isModalVisible,
      openArticleSelectionModal,
      handleModalSubmit,
      articles,
    }
  }
}
</script>

<style scoped>
/* styles are mostly unchanged, small additions for clarity */
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
  gap: 8px;
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

.tooltip {
  position: relative;
  display: inline-block;
  cursor: pointer;
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
}

.vocab-lists-container {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  line-height: 28px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 8px 0;
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

.parallel-div {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>