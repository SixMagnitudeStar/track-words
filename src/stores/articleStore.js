// stores/article.js
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { useAuthStore } from '@/auth.js'
import { ref, reactive, nextTick } from 'vue'

export const useArticleStore = defineStore('articleStore', () => {
  const auth = useAuthStore()
  const headers = {
    Authorization: `Bearer ${auth.token}`
  }

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

  // 抓取所有文章
  async function loadArticles() {
    if (articles.length > 0) {
      // 如果已有文章，則不再重新載入，但要確保 selectedArticle 是最新的
      selectArticle(selectedIndex.value)
      return
    }

    onloading.value = true
    try {
      const response = await api.get('/articles', { headers: headers })
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

  // 選擇文章
  function selectArticle(index) {
    if (index < 0 || index >= articles.length) {
      console.warn(`selectArticle: index ${index} out of bounds.`)
      // 可以選擇清空或選擇第一個
      if (articles.length > 0) {
        selectedIndex.value = 0;
        Object.assign(selectedArticle.value, articles[0]);
      } else {
        // 重置為初始狀態
        selectedIndex.value = -1;
        Object.assign(selectedArticle.value, { id: 0, title: '', content: '', blocks: [], marked_words: [], note: '' });
      }
      return;
    }

    selectedIndex.value = index
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
      marked_words: []
    }
    articles.unshift(newArticle)
    selectArticle(0)
  }

  // 儲存文章 (新增/更新)
  async function saveArticle(parsedBlocks) {
    // 更新 blocks
    if (parsedBlocks) {
      selectedArticle.value.blocks = parsedBlocks
      articles[selectedIndex.value].blocks = parsedBlocks
    }

    const body = {
      id: selectedArticle.value.id,
      title: selectedArticle.value.title,
      content: selectedArticle.value.content,
      note: selectedArticle.value.note || '',
      blocks: selectedArticle.value.blocks || []
    }

    try {
      let response
      const isNew = newArticleID_arr.includes(body.id)

      if (isNew) {
        response = await api.post('/article', body, { headers: headers })
        const index = newArticleID_arr.indexOf(body.id)
        if (index !== -1) {
          newArticleID_arr.splice(index, 1)
        }
      } else {
        response = await api.put(`/article/${body.id}`, body, { headers })
      }

      alert('文章儲存成功!')
      const resArticle = response.data.article
      
      // 更新 store state
      articles[selectedIndex.value] = { ...resArticle }
      Object.assign(selectedArticle.value, resArticle)
      isEditing.value = false

    } catch (err) {
      console.error('文章儲存失敗:', err.response?.data?.detail || err)
      alert('文章儲存失敗')
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
      await api.delete(`/article/${idToDelete}`, { headers })
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
      await api.patch('/markedword', body, { headers });
      selectedArticle.value.marked_words.push({ word: word });
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
            params: { article_id: articleId, word: word },
            headers: headers 
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
  async function toggleBlockMark(block) {
    if (block.text_type !== 'word') return;

    const newMarkedState = !block.marked;
    block.marked = newMarkedState;

    // Call API to update block's marked status
    try {
        await api.patch(`/article-blocks/${block.id}/marked`, { "marked": newMarkedState }, { headers });
    } catch (err) {
        console.error('更新 Block 標記失敗:', err);
        block.marked = !newMarkedState; // Revert on failure
        return;
    }

    // Call API to add/remove from marked_words table
    if (newMarkedState) {
        try {
            await api.post('/markedword', { "article_id": selectedArticle.value.id, "word": block.text }, { headers });
            selectedArticle.value.marked_words.push({ 'word': block.text });
        } catch (err) {
            console.error('新增 markedword 失敗:', err);
        }
    } else {
        try {
            await api.delete(`/markedword`, { 
                params: { article_id: selectedArticle.value.id, word: block.text },
                headers: headers
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

  // --- Note Actions ---
  async function saveNote(note) {
      const body = {
          article_id: selectedArticle.value.id,
          note: note
      };
      try {
          const res = await api.patch('/article/note', body, { headers });
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
        const encodedTopic = encodeURIComponent(topic);
        const url = `http://127.0.0.1:8000/essay?topic=${encodedTopic}&word_limit=${wordLimit}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`API call failed with status: ${res.status}`);
        }
        const data = await res.json();

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
        console.error("生成隨機文章失敗:", err);
        alert(`無法生成主題為 "${topic}" 的文章。請稍後再試。`);
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
    selectArticle,
    createNewArticle,
    saveArticle,
    deleteArticle,
    updateArticleContent,
    updateArticleTitle,
    addMarkedWord,
    deleteMarkedWord,
    toggleBlockMark,
    saveNote,
    fetchRandomArticle,
    getMarkedWordsFromArticles
  }
})