// stores/article.js
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { ref, reactive } from 'vue'

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
      selectArticle(selectedIndex.value)
      return
    }

    onloading.value = true

    try {
      const response = await api.get('/articles')
      const fetchedArticles = Array.isArray(response.data) ? response.data : []
      articles.length = 0 // 清空
      articles.push(...fetchedArticles) // 重新填入

      if (articles.length > 0) {
        selectArticle(0)
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
      console.warn(`selectArticle: index ${index} out of bounds.`)
      if (articles.length > 0) {
        selectedIndex.value = 0;
        Object.assign(selectedArticle.value, articles[0]);
      } else {
        selectedIndex.value = -1;
        Object.assign(selectedArticle.value, { id: 0, title: '', content: '', blocks: [], marked_words: [], note: '' });
      }
      return;
    }

    selectedIndex.value = index
    const article = articles[index]
    
    // 如果這不是新文章，且還沒有載入 blocks，則從後端抓取完整內容
    if (!newArticleID_arr.includes(article.id) && (!article.blocks || article.blocks.length === 0)) {
      onloading.value = true
      try {
        const response = await api.get(`/article/${article.id}`, { headers })
        articles[index] = response.data
      } catch (error) {
        console.error('載入完整文章失敗:', error)
      } finally {
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

  // 建立新文章 (本地)
  function createNewArticle() {
    const newArticle_id = articles.length === 0 ? 1 : articles[0].id + 1
    newArticleID_arr.push(newArticle_id)
    isEditing.value = true

    const newArticle = {
      id: newArticle_id,
      title: '',
      content: '',
      blocks: [],
      marked_words: [],
      note: ''
    }
    articles.unshift(newArticle)
    selectArticle(0)
  }

  // 儲存文章 (新增/更新，支援分段傳輸)
  async function saveArticle(parsedBlocks) {
    // 更新本地 blocks
    if (parsedBlocks) {
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
        const response = await api.post('/article', { ...metadataBody, blocks: [] }, { headers })
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
        await api.put(`/article/${articleId}`, metadataBody, { headers })
        // 更新後端 blocks 前先清空舊的
        if (parsedBlocks) {
          await api.delete(`/article/${articleId}/blocks`, { headers })
        }
      }

      // 2. 分段儲存 blocks (如果有 parsedBlocks)
      if (parsedBlocks && parsedBlocks.length > 0) {
        const chunkSize = 500
        for (let i = 0; i < parsedBlocks.length; i += chunkSize) {
          const chunk = parsedBlocks.slice(i, i + chunkSize)
          await api.post(`/article/${articleId}/blocks/chunk`, { blocks: chunk }, { headers })
          console.log(`已儲存 blocks: ${Math.min(i + chunkSize, parsedBlocks.length)} / ${parsedBlocks.length}`)
        }
      }

      // 3. 重新載入該文章完整內容以確保同步
      const finalRes = await api.get(`/article/${articleId}`, { headers })
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
    block.marked = newMarkedState;
    block.mark_id = newMarkedState ? markId : null;

    // Call API to update block's marked status
    try {
        await api.patch(`/article-blocks/${block.id}/marked`, { 
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
              "article_id": selectedArticle.value.id, 
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
                params: { article_id: selectedArticle.value.id, word: block.text }
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
            return newlyUpdated ? newlyUpdated : originalWord;
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
      async function fetchRandomArticle(topic, wordLimit = 500) {
          onloading.value = true;
          try {
              // 1. 使用 axios (api.get)，params 會自動處理 URL 編碼，不需手動 encodeURIComponent
              const res = await api.get('/essay', {
                  params: {
                      topic: topic,
                      word_limit: wordLimit
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
                  note: data.note || ""
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
        console.log('Simulating fetching marked words for article IDs:', articleIds);
        // Simulate API call by filtering local data
        const words = articles
          .filter(article => articleIds.includes(article.id))
          .flatMap(article => article.marked_words || []);
        
        // Remove duplicates
        const uniqueWords = [...new Set(words.map(w => w.word))];
        
        console.log('Found unique words:', uniqueWords);
        return uniqueWords.map(word => ({ word })); // Return in a consistent format
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
        updateArticleContent,
        updateArticleTitle,
        addMarkedWord,
        deleteMarkedWord,
        toggleBlockMark,
        markSelection,
        unmarkGroup,
        saveNote,
        fetchRandomArticle,
        getMarkedWordsFromArticles,
        translateMarkedWords,
      }
    })
