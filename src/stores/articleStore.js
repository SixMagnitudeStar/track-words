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

  // 清空 Store (登出用)
  function clearStore() {
    articles.length = 0
    selectedIndex.value = 0
    Object.assign(selectedArticle.value, {
      id: 0,
      title: '',
      content: '',
      blocks: [],
      marked_words: [],
      note: ''
    })
    isEditing.value = false
    onloading.value = false
    newArticleID_arr.length = 0
  }

  // 抓取所有文章
  async function loadArticles(forceRefresh = false) {
    // 如果不是強制刷新且已經有資料，就不要再抓 (但這在切換帳號時會有問題，所以配合 logout clearStore)
    if (!forceRefresh && articles.length > 0) {
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
      } else {
        selectArticle(-1)
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
      selectedIndex.value = -1;
      Object.assign(selectedArticle.value, { id: 0, title: '', content: '', blocks: [], marked_words: [], note: '' });
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
      onloading.value = true;
      let response
      const isNew = newArticleID_arr.includes(body.id)

      if (isNew) {
        response = await api.post('/article', body)
        const index = newArticleID_arr.indexOf(body.id)
        if (index !== -1) {
          newArticleID_arr.splice(index, 1)
        }
      } else {
        response = await api.put(`/article/${body.id}`, body)
      }

      alert('文章儲存成功!')
      const resArticle = response.data.article
      articles[selectedIndex.value] = { ...resArticle }
      Object.assign(selectedArticle.value, resArticle)
      isEditing.value = false

    } catch (err) {
      console.error('文章儲存失敗:', err.response?.data?.detail || err)
      alert('文章儲存失敗')
    } finally{
      onloading.value = false;
    }
  }

  // 刪除文章
  async function deleteArticle() {
    const idToDelete = selectedArticle.value.id
    const indexToDelete = selectedIndex.value

    articles.splice(indexToDelete, 1)
    selectArticle(articles.length > 0 ? 0 : -1);

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
    }
  }

  function updateArticleContent(newContent) {
    if(selectedArticle.value) selectedArticle.value.content = newContent;
    if(articles[selectedIndex.value]) articles[selectedIndex.value].content = newContent;
  }

  function updateArticleTitle(newTitle) {
    if(selectedArticle.value) selectedArticle.value.title = newTitle;
    if(articles[selectedIndex.value]) articles[selectedIndex.value].title = newTitle;
  }

  async function addMarkedWord(word, articleId) {
    const body = { article_id: articleId, word: word }
    try {
      const response = await api.post('/markedword', body);
      selectedArticle.value.marked_words.push(response.data);
    } catch (err) {
      console.error('新增 marked 標記失敗:', err.response?.data?.detail || err);
    }
  }

  async function deleteMarkedWord(wordObj) {
    const { word } = wordObj;
    const articleId = selectedArticle.value.id;

    if (newArticleID_arr.includes(articleId)) {
        const index = selectedArticle.value.marked_words.findIndex(w => w.word === word);
        if (index > -1) selectedArticle.value.marked_words.splice(index, 1);
        return;
    }

    try {
        await api.delete('/markedword', { params: { article_id: articleId, word: word } });
        const index = selectedArticle.value.marked_words.findIndex(w => w.word === word);
        if (index > -1) selectedArticle.value.marked_words.splice(index, 1);
        
        const block = selectedArticle.value.blocks.find(b => b.text.trim() === word.trim() && b.marked);
        if (block) await toggleBlockMark(block);
        alert('標記單字刪除成功');
    } catch (err) {
        console.error('刪除標記單字失敗', err.response?.data || err.message);
    }
  }

  async function toggleBlockMark(block, markId = null) {
    if (block.text_type !== 'word') return;

    const newMarkedState = !block.marked;
    block.marked = newMarkedState;
    block.mark_id = newMarkedState ? markId : null;

    try {
        await api.patch(`/article-blocks/${block.id}/marked`, { 
          "marked": newMarkedState,
          "mark_id": block.mark_id
        });
    } catch (err) {
        console.error('更新 Block 標記失敗:', err);
        block.marked = !newMarkedState;
        block.mark_id = null;
        return;
    }

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
            if (idx > -1) selectedArticle.value.marked_words.splice(idx, 1);
        } catch (err) {
            console.error('刪除 markedword 失敗:', err);
        }
    }
  }

  async function markSelection(text, articleId, markId, startIndex, endIndex) {
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

    const blocksToUpdate = selectedArticle.value.blocks.filter(b => b.index >= startIndex && b.index <= endIndex);
    const blockIds = blocksToUpdate.map(b => b.id);

    try {
      await api.patch('/article-blocks/batch-mark', {
        block_ids: blockIds,
        marked: true,
        mark_id: markId
      });
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
    const blocksToUnmark = selectedArticle.value.blocks.filter(b => b.mark_id === markId);
    try {
      await api.patch(`/article/unmark-group/${markId}`, {});
      blocksToUnmark.forEach(b => {
        b.marked = false;
        b.mark_id = null;
      });
      const idx = selectedArticle.value.marked_words.findIndex(w => w.mark_id === markId);
      if (idx > -1) selectedArticle.value.marked_words.splice(idx, 1);
    } catch (err) {
      console.error('取消群組標記失敗:', err);
      alert('取消標記失敗');
    }
  }
    
  async function translateMarkedWords() {
    const wordsToTranslate = selectedArticle.value.marked_words;
    if (!wordsToTranslate || wordsToTranslate.length === 0) return;
    
    const body = { words: wordsToTranslate.map(w => ({ id: w.id, word: w.word })) };
    try {
      const response = await api.post('/translate/batch-update', body);
      const updatedWords = response.data;
      selectedArticle.value.marked_words = updatedWords;
      if (articles[selectedIndex.value]) articles[selectedIndex.value].marked_words = updatedWords;
      return true;
    } catch (err) {
      console.error('Failed to translate marked words:', err.response?.data?.detail || err);
      alert('翻譯失敗，請稍後再試。');
      return false;
    }
  }
    
  async function saveNote(note) {
    const body = { article_id: selectedArticle.value.id, note: note };
    try {
      await api.patch('/article/note', body);
      articles[selectedIndex.value].note = note;
      selectedArticle.value.note = note;
      return '✅ 已儲存';
    } catch (err) {
      console.error('❌ 筆記儲存失敗:', err);
      return '❌ 儲存失敗';
    }
  }
      
  async function fetchRandomArticle(topic, wordLimit = 500) {
    onloading.value = true;
    try {
      const res = await api.get('/essay', { params: { topic, word_limit: wordLimit } });
      const data = res.data; 
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
      console.error("生成隨記文章失敗:", err);
      alert(`無法生成主題為 "${topic}" 的文章。原因：${err.message}`);
    } finally {
      onloading.value = false;
    }
  }

  async function getMarkedWordsFromArticles(articleIds) {
    const words = articles
      .filter(article => articleIds.includes(article.id))
      .flatMap(article => article.marked_words || []);
    const uniqueWords = [...new Set(words.map(w => w.word))];
    return uniqueWords.map(word => ({ word }));
  }
    
  return {
    articles,
    selectedIndex,
    selectedArticle,
    isEditing,
    onloading,
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
    markSelection,
    unmarkGroup,
    saveNote,
    fetchRandomArticle,
    getMarkedWordsFromArticles,
    translateMarkedWords,
    clearStore,
  }
})
