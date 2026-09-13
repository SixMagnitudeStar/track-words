// stores/article.js
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { ref, reactive } from 'vue'

// 重新建立 blocks 時，比對並還原 marked_words 狀態與 mark_id
function restoreMarkedStates(blocks, markedWords) {
  if (!blocks || !markedWords || markedWords.length === 0) return blocks;

  // 依單字/片語長度從長到短排序，防止子字串比對衝突
  const sortedMW = [...markedWords].sort((a, b) => b.word.length - a.word.length);

  // 清理字串，只留下英數字與中日韓字元以便比對
  const cleanStr = (str) => str.toLowerCase().replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g, '');

  for (const mw of sortedMW) {
    const cleanTarget = cleanStr(mw.word);
    if (!cleanTarget) continue;

    let i = 0;
    while (i < blocks.length) {
      let accumulatedClean = '';
      let j = i;
      let matchedBlocks = [];

      // 開始累積連續 block 來匹配目標字串
      while (j < blocks.length && accumulatedClean.length < cleanTarget.length) {
        const b = blocks[j];
        if (b.text_type === 'word') {
          accumulatedClean += cleanStr(b.text);
          matchedBlocks.push(b);
        } else if (b.text_type === 'punctuation' || b.text_type === 'blank') {
          matchedBlocks.push(b);
        }
        j++;
      }

      // 如果累積的內容完全符合目標，且這批 blocks 尚未被其他標記覆蓋，則套用標記
      if (accumulatedClean === cleanTarget && matchedBlocks.length > 0) {
        const alreadyMarked = matchedBlocks.some(b => b.marked);
        if (!alreadyMarked) {
          matchedBlocks.forEach(b => {
            if (b.text_type === 'word') {
              b.marked = true;
              b.mark_id = mw.mark_id;
            }
          });
          // 匹配成功，跳過已比對的 blocks 區間
          i = j - 1;
        }
      }
      i++;
    }
  }
  return blocks;
}

export const useArticleStore = defineStore('articleStore', () => {
  // --- State ---
  const articles = reactive([])
  const selectedIndex = ref(0)
  const selectedArticle = ref({
    id: 0,
    title: '',
    content: '',
    blocks: [],
    marked_words: [],
    note: ''
  })
  const isEditing = ref(false)
  const onloading = ref(false)
  const newArticleID_arr = reactive([]) // 紀錄新增文章的id

  // --- Actions ---

  // 重置 Store
  function resetArticles() {
    articles.length = 0
    selectedIndex.value = 0
    selectedArticle.value = {
      id: 0,
      title: '',
      content: '',
      blocks: [],
      marked_words: [],
      note: ''
    }
    isEditing.value = false
    onloading.value = false
    newArticleID_arr.length = 0
  }

  // 抓取所有文章
  async function loadArticles() {
    if (articles.length > 0) {
      // 如果已有文章，則不再重新載入，但要確保 selectedArticle 是最新的
      await selectArticle(selectedIndex.value)
      return
    }

    onloading.value = true

    try {
      const response = await api.get('/articles')
      const fetchedArticles = Array.isArray(response.data) ? response.data : []
      articles.length = 0 // 清空
      articles.push(...fetchedArticles) // 重新填入

      if (articles.length > 0) {
        await selectArticle(0)
      }
    } catch (error) {
      console.error('取得文章失敗:', error)
    } finally {
      onloading.value = false
    }
  }

  // 選擇文章 (支援非同步載入完整內容)
  async function selectArticle(index) {
    if (index < 0 || index >= articles.length) {
      selectedIndex.value = -1;
      resetSelectedArticle();
      return;
    }

    selectedIndex.value = index
    const article = articles[index]
    
    // --- 關鍵修復：先重置 selectedArticle，避免舊文章的屬性（如 blocks）殘留在 UI 上 ---
    resetSelectedArticle();

    // 如果這不是新文章，且還沒有載入 blocks，則從後端抓取完整內容
    if (!newArticleID_arr.includes(article.id) && (!article.blocks || article.blocks.length === 0)) {
      onloading.value = true
      try {
        const response = await api.get(`/article/${article.id}`)
        articles[index] = response.data
      } catch (error) {
        console.error('載入完整文章失敗:', error)
      } finally {
        // 這裡不直接設為 false，讓 loadArticles 的 finally 處理，或者在 select 被單獨呼叫時處理
        // 但為了相容單獨點擊列表的情境，還是保留，但要小心 race condition
        onloading.value = false
      }
    }

    Object.assign(selectedArticle.value, articles[index])

    if (newArticleID_arr.includes(selectedArticle.value.id)) {
      isEditing.value = true
    } else {
      isEditing.value = false
    }
  }

  // 輔助函數：清空選中文章的狀態
  function resetSelectedArticle() {
    Object.assign(selectedArticle.value, {
      id: 0,
      title: '',
      content: '',
      blocks: [],
      marked_words: [],
      note: '',
      language: 'en'
    });
  }

  // 建立新文章 (本地)
  function createNewArticle() {
    // 使用 Date.now() 確保本地臨時 ID 唯一，避免 key 衝突導致 UI 渲染錯誤
    const newArticle_id = Date.now() 
    newArticleID_arr.push(newArticle_id)
    isEditing.value = true

    const newArticle = {
      id: newArticle_id,
      title: '',
      content: '',
      blocks: [],
      marked_words: [],
      note: '',
      language: 'en'
    }
    articles.unshift(newArticle)
    selectArticle(0)
  }

  // 儲存文章 (新增/更新，支援分段傳輸)
  async function saveArticle(parsedBlocks) {
    // 更新本地 blocks 且還原標記狀態
    if (parsedBlocks) {
      parsedBlocks = restoreMarkedStates(parsedBlocks, selectedArticle.value.marked_words)
      selectedArticle.value.blocks = parsedBlocks
      articles[selectedIndex.value].blocks = parsedBlocks
    }

    const metadataBody = {
      id: selectedArticle.value.id,
      title: selectedArticle.value.title,
      content: selectedArticle.value.content,
      note: selectedArticle.value.note || '',
      tags_css: [] // 配合後端 schema
    }

    try {
      onloading.value = true;
      let articleId = selectedArticle.value.id
      const isNew = newArticleID_arr.includes(articleId)

      // 1. 儲存/更新文章元數據
      if (isNew) {
        // 新文章：先建立文章主體 (不帶 blocks 以節省記憶體)
        const response = await api.post('/article', { ...metadataBody, blocks: [] })
        const resArticle = response.data.article
        articleId = resArticle.id
        
        // 更新本地 ID 與狀態
        const oldId = selectedArticle.value.id
        const index = newArticleID_arr.indexOf(oldId)
        if (index !== -1) newArticleID_arr.splice(index, 1)
        
        selectedArticle.value.id = articleId
        articles[selectedIndex.value].id = articleId
      } else {
        // 舊文章：更新元數據
        await api.put(`/article/${articleId}`, metadataBody)
        // 更新後端 blocks 前先清空舊的
        if (parsedBlocks) {
          await api.delete(`/article/${articleId}/blocks`)
        }
      }

      // 2. 分段儲存 blocks (如果有 parsedBlocks)
      if (parsedBlocks && parsedBlocks.length > 0) {
        const chunkSize = 500
        for (let i = 0; i < parsedBlocks.length; i += chunkSize) {
          const chunk = parsedBlocks.slice(i, i + chunkSize)
          await api.post(`/article/${articleId}/blocks/chunk`, { blocks: chunk })
          console.log(`已儲存 blocks: ${Math.min(i + chunkSize, parsedBlocks.length)} / ${parsedBlocks.length}`)
        }
      }

      // 3. 重新載入該文章完整內容以確保同步
      const finalRes = await api.get(`/article/${articleId}`)
      const fullArticle = finalRes.data
      articles[selectedIndex.value] = { ...fullArticle }
      Object.assign(selectedArticle.value, fullArticle)
      
      alert('文章儲存成功!')
      isEditing.value = false
      return { success: true, message: '文章儲存成功' }

    } catch (err) {
      console.error('文章儲存失敗:', err.response?.data?.detail || err)
      alert('文章儲存失敗')
    } finally {
      onloading.value = false;
    }
  }

  // 刪除文章
  async function deleteArticle() {
    const idToDelete = selectedArticle.value.id
    const indexToDelete = selectedIndex.value

    articles.splice(indexToDelete, 1)
    
    // 重新選擇文章
    selectArticle(articles.length > 0 ? 0 : -1);


    // 如果是尚未儲存的新文章，則不需呼叫 API
    if (newArticleID_arr.includes(idToDelete)) {
      const index = newArticleID_arr.indexOf(idToDelete);
      if (index > -1) {
        newArticleID_arr.splice(index, 1);
      }
      return;
    }
    
    try {
      await api.delete(`/article/${idToDelete}`)
      console.log(`文章 ID:${idToDelete} 已刪除`)
    } catch (err) {
      console.error('刪除文章失敗:', err.response?.data?.detail || err)
      // 可選擇將刪除失敗的文章加回去
      // loadArticles(); // 或者重新載入
    }
  }

  // 捨棄編輯變更，重新從後端載入文章以還原狀態
  async function discardChanges() {
    const articleId = selectedArticle.value.id;
    if (newArticleID_arr.includes(articleId)) {
      // 若是全新且尚未儲存的文章，取消編輯即等於刪除該文章
      deleteArticle();
      return;
    }

    onloading.value = true;
    try {
      const response = await api.get(`/article/${articleId}`);
      articles[selectedIndex.value] = response.data;
      Object.assign(selectedArticle.value, response.data);
      isEditing.value = false;
    } catch (error) {
      console.error('捨棄變更重新載入文章失敗:', error);
      alert('捨棄變更失敗，請重新載入頁面');
    } finally {
      onloading.value = false;
    }
  }

  // 更新文章內容
  function updateArticleContent(newContent) {
    if(selectedArticle.value) {
      selectedArticle.value.content = newContent;
    }
    if(articles[selectedIndex.value]) {
      articles[selectedIndex.value].content = newContent;
    }
  }

  function updateArticleTitle(newTitle) {
      if(selectedArticle.value) {
          selectedArticle.value.title = newTitle;
      }
      if(articles[selectedIndex.value]) {
          articles[selectedIndex.value].title = newTitle;
      }
  }


  // --- Marked Words Actions ---

  async function updateWordTranslation(word, newTranslation) {
    try {
      const response = await api.put('/markedword/translation', {
        word: word,
        translation: newTranslation
      });
      selectedArticle.value.marked_words.forEach(mw => {
        if (mw.word === word) {
          mw.translation = newTranslation;
        }
      });
      return response.data;
    } catch (err) {
      console.error("更新標記單字翻譯失敗:", err);
      throw err;
    }
  }

  async function addMarkedWord(word, articleId) {
    const body = {
      article_id: articleId,
      word: word
    }
    try {
      const response = await api.post('/markedword', body);
      selectedArticle.value.marked_words.push(response.data);
      console.log('新增 marked 標記成功');
    } catch (err) {
      console.error('新增 marked 標記失敗:', err.response?.data?.detail || err);
    }
  }

  async function deleteMarkedWord(wordObj) {
    const { word } = wordObj;
    const articleId = selectedArticle.value.id;

    if (newArticleID_arr.includes(articleId)) {
        const index = selectedArticle.value.marked_words.findIndex(w => w.word === word);
        if (index > -1) {
            selectedArticle.value.marked_words.splice(index, 1);
        }
        return;
    }

    try {
        await api.delete('/markedword', { 
            params: { article_id: articleId, word: word }
        });
        const index = selectedArticle.value.marked_words.findIndex(w => w.word === word);
        if (index > -1) {
            selectedArticle.value.marked_words.splice(index, 1);
        }
        // Also unmark in blocks
        const block = selectedArticle.value.blocks.find(b => b.text.trim() === word.trim() && b.marked);
        if (block) {
            await toggleBlockMark(block);
        }
        alert('標記單字刪除成功');
    } catch (err) {
        console.error('刪除標記單字失敗', err.response?.data || err.message);
    }
  }


  // 切換 Block 標記狀態
  async function toggleBlockMark(block, markId = null) {
    if (block.text_type !== 'word') return;

    const newMarkedState = !block.marked;
    const articleId = selectedArticle.value.id; // 取得目前文章 ID

    block.marked = newMarkedState;
    block.mark_id = newMarkedState ? markId : null;

    // Call API to update block's marked status
    try {
        await api.patch(`/article-blocks/${block.id}/marked`, { 
          "article_id": selectedArticle.value.id,
          "marked": newMarkedState,
          "mark_id": block.mark_id
        });
    } catch (err) {
        console.error('更新 Block 標記失敗:', err);
        block.marked = !newMarkedState; // Revert on failure
        block.mark_id = null;
        return;
    }

    // Call API to add/remove from marked_words table
    if (newMarkedState) {
        try {
            const response = await api.post('/markedword', { 
              "article_id": articleId, 
              "word": block.text,
              "mark_id": markId
            });
            selectedArticle.value.marked_words.push(response.data);
        } catch (err) {
            console.error('新增 markedword 失敗:', err);
        }
    } else {
        try {
            await api.delete(`/markedword`, { 
                params: { article_id: articleId, word: block.text }
            });
            const idx = selectedArticle.value.marked_words.findIndex(w => w.word === block.text);
            if (idx > -1) {
                selectedArticle.value.marked_words.splice(idx, 1);
            }
        } catch (err) {
            console.error('刪除 markedword 失敗:', err);
        }
    }
  }

  async function markSelection(text, articleId, markId, startIndex, endIndex) {
    // 1. Add to marked_words
    try {
      const response = await api.post('/markedword', { 
        "article_id": articleId, 
        "word": text,
        "mark_id": markId
      });
      selectedArticle.value.marked_words.push(response.data);
    } catch (err) {
      console.error('新增 selection markedword 失敗:', err);
      return;
    }

    // 2. Identify and update blocks
    const blocksToUpdate = selectedArticle.value.blocks.filter(b => b.index >= startIndex && b.index <= endIndex);
    const blockIds = blocksToUpdate.map(b => b.id);

    try {
      await api.patch('/article-blocks/batch-mark', {
        article_id: articleId,
        block_ids: blockIds,
        marked: true,
        mark_id: markId
      });

      // Update local state
      blocksToUpdate.forEach(b => {
        b.marked = true;
        b.mark_id = markId;
      });
    } catch (err) {
      console.error('批次更新 blocks 失敗:', err);
    }
  }

  async function unmarkGroup(markId) {
    if (!markId) return;

    // 1. Find all blocks with this markId
    const blocksToUnmark = selectedArticle.value.blocks.filter(b => b.mark_id === markId);
    
    // 2. Update blocks on backend
    try {
      await api.patch(`/article/unmark-group/${markId}`, {});
      
      // 3. Update local state
      blocksToUnmark.forEach(b => {
        b.marked = false;
        b.mark_id = null;
      });

      // Remove from marked_words
      const idx = selectedArticle.value.marked_words.findIndex(w => w.mark_id === markId);
      if (idx > -1) {
        selectedArticle.value.marked_words.splice(idx, 1);
      }
      
      console.log('已取消群組標記');
    } catch (err) {
      console.error('取消群組標記失敗:', err);
      alert('取消標記失敗');
    }
  }
    
      async function translateMarkedWords() {
        const allWords = selectedArticle.value.marked_words;
        if (!allWords || allWords.length === 0) {
          console.log("No marked words to translate.");
          return;
        }

        // Only choose words that haven't been translated yet
        const wordsToTranslate = allWords.filter(w => !w.translation || w.translation.trim() === '');
        
        if (wordsToTranslate.length === 0) {
          console.log("All marked words are already translated.");
          return true;
        }

        console.log('Translating new marked words:', wordsToTranslate);
        const body = {
          words: wordsToTranslate.map(w => ({ id: w.id, word: w.word }))
        };
    
        try {
          const response = await api.post('/translate/batch-update', body);
          const updatedBatch = response.data; // This is the small batch of newly translated words
          
          // Merge results: keep existing translations, update only the new ones
          const updatedWordsList = allWords.map(originalWord => {
            const newlyUpdated = updatedBatch.find(u => u.id === originalWord.id);
            if (!newlyUpdated) {
              return originalWord;
            }
            // Preserve any local-only fields such as mark_id so hover lookup stays valid.
            return {
              ...originalWord,
              ...newlyUpdated,
              mark_id: originalWord.mark_id ?? newlyUpdated.mark_id
            };
          });

          selectedArticle.value.marked_words = updatedWordsList;
          if (articles[selectedIndex.value]) {
            articles[selectedIndex.value].marked_words = updatedWordsList;
          }
          
          console.log('Translations updated successfully.');
          return true;
        } catch (err) {
          console.error('Failed to translate marked words:', err.response?.data?.detail || err);
          return false; // UI handling is moved to the component (articleReading.vue)
        }
      }
    
    
      // --- Note Actions ---
      async function saveNote(note) {
          const body = {
              article_id: selectedArticle.value.id,
              note: note
          };
          try {
              const res = await api.patch('/article/note', body);
              articles[selectedIndex.value].note = note;
              selectedArticle.value.note = note;
              console.log('✅ 筆記已儲存:', res.data);
              return '✅ 已儲存';
          } catch (err) {
              console.error('❌ 筆記儲存失敗:', err);
              return '❌ 儲存失敗';
          }
      }
      
      // --- 隨機文章 ---
      async function fetchRandomArticle(topic, wordLimit = 500, language = 'English') {
          onloading.value = true;
          try {
              // 1. 使用 axios (api.get)，params 會自動處理 URL 編碼，不需手動 encodeURIComponent
              const res = await api.get('/essay', {
                  params: {
                      topic: topic,
                      word_limit: wordLimit,
                      language: language
                  }
              });

              // 2. Axios 資料直接就在 res.data 裡，不需要 await res.json()
              const data = res.data; 
              
              console.log('✅ 生成文章成功:', data);

              const newArticle = {
                  id: articles.length > 0 ? articles[0].id + 1 : 1,
                  title: data.topic || topic || "無標題",
                  content: data.essay || data.text || "",
                  blocks: [],
                  note: data.note || "",
                  language: language.toLowerCase().includes('english') ? 'en' : 
                            language.toLowerCase().includes('japanese') ? 'ja' :
                            language.toLowerCase().includes('korean') ? 'ko' : 'en'
              };
              
              newArticleID_arr.push(newArticle.id);
              articles.unshift(newArticle);
              selectArticle(0);
              isEditing.value = true;

          } catch (err) {
              // Axios 的錯誤訊息通常在 err.response.data 裡
              console.error("生成隨機文章失敗:", err);
              alert(`無法生成主題為 "${topic}" 的文章。原因：${err.message}`);
          } finally {
              onloading.value = false;
          }
      }







      async function getMarkedWordsFromArticles(articleIds) {
        console.log('Fetching marked words for article IDs:', articleIds);
        const words = articles
          .filter(article => articleIds.includes(article.id))
          .flatMap(article => article.marked_words || []);
        
        const wordMap = new Map();
        words.forEach(w => {
          if (!wordMap.has(w.word) || (!wordMap.get(w.word).translation && w.translation)) {
            wordMap.set(w.word, w);
          }
        });
        
        return Array.from(wordMap.values()).map(w => ({
          word: w.word,
          translation: w.translation
        }));
      }
    
    
      async function generateReadingQuiz(requestedCount = 10) {
        if (!selectedArticle.value || !selectedArticle.value.id) return null;
        try {
          const res = await api.post(`/article/${selectedArticle.value.id}/generate-reading-quiz`, {
            requested_count: requestedCount
          });
          selectedArticle.value.reading_quiz = res.data.reading_quiz;
          if (selectedIndex.value >= 0 && selectedIndex.value < articles.length) {
            articles[selectedIndex.value].reading_quiz = res.data.reading_quiz;
          }
          return res.data.reading_quiz;
        } catch (error) {
          console.error("生成閱讀測驗失敗:", error);
          throw error;
        }
      }

      async function updateReadingQuizAnswer(questionIndex, userAnswer) {
        if (!selectedArticle.value || !selectedArticle.value.id) return;
        try {
          const res = await api.put(`/article/${selectedArticle.value.id}/reading-quiz/answer`, {
            question_index: questionIndex,
            user_answer: userAnswer
          });
          selectedArticle.value.reading_quiz = res.data.reading_quiz;
          if (selectedIndex.value >= 0 && selectedIndex.value < articles.length) {
            articles[selectedIndex.value].reading_quiz = res.data.reading_quiz;
          }
        } catch (error) {
          console.error("更新測驗答案失敗:", error);
          throw error;
        }
      }

      return {
        // State
        articles,
        selectedIndex,
        selectedArticle,
        isEditing,
        onloading,
        
        // Actions
        loadArticles,
        resetArticles,
        selectArticle,
        createNewArticle,
        saveArticle,
        deleteArticle,
        discardChanges,
        updateArticleContent,
        updateArticleTitle,
        addMarkedWord,
        updateWordTranslation,
        deleteMarkedWord,
        toggleBlockMark,
        markSelection,
        unmarkGroup,
        saveNote,
        fetchRandomArticle,
        getMarkedWordsFromArticles,
        translateMarkedWords,
        generateReadingQuiz,
        updateReadingQuizAnswer,
      }
    })
