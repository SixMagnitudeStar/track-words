<template>
  <div class="vocab-container">
    <!-- 輸入區 -->
    <div class="input-section">
      <input v-model="newWord" placeholder="輸入單字..." />
      <button class="add-btn" @click="addWord">新增</button>
    </div>

    <!-- 工具列：搜尋、排序、篩選 -->
    <div class="toolbar">
      <input v-model="searchQuery" placeholder="🔍 搜尋單字..." class="search-box" />

      <select v-model="sortOption" class="sort-select">
        <option value="recent">📅 加入時間</option>
        <option value="alphabetical">🔠 字母排序</option>
      </select>

      <select v-model="filterOption" class="filter-select">
        <option value="all">全部</option>
        <option value="familiar">✅ 已掌握</option>
        <option value="mistake">❌ 常錯</option>
        <option value="recent7">🗓️ 最近 7 天</option>
      </select>

      <!-- 模式切換：列表 / A-Z 索引 -->
      <div class="mode-toggle">
        <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">列表</button>
        <button :class="{ active: viewMode === 'az' }" @click="viewMode = 'az'">A-Z</button>
      </div>
    </div>

    <!-- 單字清單 -->
    <div v-if="viewMode === 'list'" class="word-list">
      <div class="word-item" v-for="(word, index) in filteredWords" :key="index">
        <div class="word-main">
          <span class="word-text">{{ word.text }}</span>
          <span class="date-added">📅 {{ word.date }}</span>
        </div>
        <div class="word-tags">
          <span v-if="word.familiar" class="tag familiar">已掌握</span>
          <span v-if="word.mistake" class="tag mistake">常錯</span>
          <div class="progress-bar">
            <div class="progress" :style="{ width: word.progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- A-Z 分組模式 -->
    <div v-if="viewMode === 'az'" class="az-list">
      <div class="az-group" v-for="letter in azGroups" :key="letter">
        <h3>{{ letter }}</h3>
        <ul>
          <li v-for="word in filteredWords.filter(w => w.text.startsWith(letter.toLowerCase()))" :key="word.text">
            {{ word.text }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UnfamiliarWordsArea',
  data() {
    return {
      newWord: '',
      searchQuery: '',
      sortOption: 'recent',
      filterOption: 'all',
      viewMode: 'list',
      azGroups: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      wordList: [
        { text: 'abandon', date: '2025-07-28', familiar: false, mistake: true, progress: 30 },
        { text: 'bounce', date: '2025-07-25', familiar: true, mistake: false, progress: 100 },
        { text: 'collapse', date: '2025-07-21', familiar: false, mistake: false, progress: 60 },
      ]
    };
  },
  computed: {
    filteredWords() {
      let result = [...this.wordList];

      // 搜尋
      if (this.searchQuery.trim()) {
        result = result.filter(word => word.text.toLowerCase().includes(this.searchQuery.toLowerCase()));
      }

      // 篩選
      if (this.filterOption === 'familiar') {
        result = result.filter(word => word.familiar);
      } else if (this.filterOption === 'mistake') {
        result = result.filter(word => word.mistake);
      } else if (this.filterOption === 'recent7') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        result = result.filter(word => new Date(word.date) >= sevenDaysAgo);
      }

      // 排序
      if (this.sortOption === 'alphabetical') {
        result.sort((a, b) => a.text.localeCompare(b.text));
      } else if (this.sortOption === 'recent') {
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      return result;
    }
  },
  methods: {
    addWord() {
      const text = this.newWord.trim();
      if (!text) return;
      this.wordList.push({
        text,
        date: new Date().toISOString().split('T')[0],
        familiar: false,
        mistake: false,
        progress: 0
      });
      this.newWord = '';
    }
  }
};
</script>

<style scoped>
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
}
.mode-toggle button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: #eee;
}
.mode-toggle .active {
  background: #3498db;
  color: white;
}
.word-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.word-item {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}
.word-main {
  display: flex;
  justify-content: space-between;
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
</style>
