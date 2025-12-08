// stores/wordStore.js
import { defineStore } from 'pinia'
import api from '@/axios.js'

export const useWordStore = defineStore('wordStore', {
  state: () => ({
    wordList: [],    // 標記單字列表
    loaded: false    // 是否已經抓過資料
  }),
  actions: {
    // 抓取標記單字
    async fetchWords(params = {}) {
      if (this.loaded) return  // 已抓過就不再抓
      try {
        const res = await api.get('/markedwords', { params })
        this.wordList = res.data.words
        this.loaded = true
      } catch (error) {
        console.error('抓取標記單字失敗', error)
      }
    },

    // 刪除單字（含呼叫 API + 更新 store）
    async deleteWordById(id) {
      try {
        await api.delete(`/markedword/${id}`)  // 呼叫後端刪除
        // 刪除成功後更新 store
        this.wordList = this.wordList.filter(w => w.id !== id)
      } catch (error) {
        console.error('刪除單字失敗', error)
      }
    }
  }
})