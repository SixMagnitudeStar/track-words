<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-container">
      <div class="modal-header">
        <h3>選擇要載入的文章</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div v-for="article in articles" :key="article.id" class="article-item">
          <input type="checkbox" :id="'article-' + article.id" :value="article.id" v-model="selectedArticleIds">
          <label :for="'article-' + article.id">{{ article.title || '未命名文章' }}</label>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="close" class="btn-cancel">取消</button>
        <button @click="submit" class="btn-confirm">確定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  articles: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'submit']);

const selectedArticleIds = ref([]);

function close() {
  emit('close');
}

function submit() {
  emit('submit', selectedArticleIds.value);
  close();
}

// Reset selection when modal is opened
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedArticleIds.value = [];
  }
});
</script>

<style scoped>
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

.modal-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px 0;
  overflow-y: auto;
  flex-grow: 1;
}

.article-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
}

.modal-footer {
  border-top: 1px solid #eee;
  padding-top: 10px;
  text-align: right;
}

.btn-cancel, .btn-confirm {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 10px;
}

.btn-cancel {
  background-color: #f0f0f0;
}

.btn-confirm {
  background-color: #4CAF50;
  color: white;
}
</style>
