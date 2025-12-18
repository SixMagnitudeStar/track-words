<template>
  <div class="quiz-container">
    <h1>英翻中測驗</h1>

    <!-- Start Quiz Button -->
    <div v-if="!quizInProgress" class="start-quiz-section">
      <button @click="startQuiz" class="start-button" :disabled="isLoading">
        {{ isLoading ? '載入中...' : '開始測驗' }}
      </button>
      <p v-if="!isLoading">點擊按鈕，將從您的單字庫中隨機挑選單字進行測驗。</p>
    </div>

    <!-- Quiz Questions -->
    <div v-if="quizInProgress && !showResults" class="quiz-section">
      <div v-for="(question, index) in quizQuestions" :key="index" class="question-card">
        <p class="question-text">{{ index + 1 }}. {{ question.englishWord }}</p>
        <div class="options">
          <div v-for="(option, optionIndex) in question.options" :key="optionIndex" class="option">
            <input 
              type="radio" 
              :id="`q${index}o${optionIndex}`" 
              :name="`question-${index}`" 
              :value="option"
              v-model="question.userAnswer"
            >
            <label :for="`q${index}o${optionIndex}`">{{ option }}</label>
          </div>
        </div>
      </div>
      <button @click="submitQuiz" class="submit-button">提交答案</button>
    </div>

    <!-- Results -->
    <div v-if="showResults" class="results-section">
      <h2>測驗結果</h2>
      <p class="score">你的分數: {{ score }} / 10</p>
      <div class="review">
        <h3>題目回顧:</h3>
        <ul>
          <li v-for="(question, index) in quizQuestions" :key="index" :class="{ correct: question.isCorrect, incorrect: !question.isCorrect }">
            <p><strong>題目 {{ index + 1 }}:</strong> {{ question.englishWord }}</p>
            <p><strong>正確答案:</strong> {{ question.correctAnswer }}</p>
            <p><strong>你的答案:</strong> {{ question.userAnswer || '未作答' }}</p>
          </li>
        </ul>
      </div>
      <button @click="resetQuiz" class="retry-button">再試一次</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '@/axios.js';

const quizInProgress = ref(false);
const showResults = ref(false);
const quizQuestions = ref([]);
const score = ref(0);
const isLoading = ref(false); // To show a loading indicator

const startQuiz = async () => {
  alert('載入單字')
  isLoading.value = true;
  try {
    const response = await api.get('/quiz/random');
    
    if (!response.data || response.data.length === 0) {
      alert('無法獲取測驗題目，可能是您的單字庫是空的。');
      isLoading.value = false;
      return;
    }

    alert(JSON.stringify(response))
    
    // Map API response to the structure needed by the frontend
    quizQuestions.value = response.data.map(q => ({
      englishWord: q.word,
      options: q.options,
      correctAnswer: q.correct_answer,
      userAnswer: '',
      isCorrect: false
    }));

    quizInProgress.value = true;
    showResults.value = false;
    score.value = 0;

  } catch (error) {
    console.error("獲取測驗失敗:", error);
    alert("獲取測驗失敗，請稍後再試。");
  } finally {
    isLoading.value = false;
  }
};

const submitQuiz = () => {
  let currentScore = 0;
  quizQuestions.value.forEach(q => {
    if (q.userAnswer === q.correctAnswer) {
      q.isCorrect = true;
      currentScore++;
    } else {
      q.isCorrect = false;
    }
  });
  score.value = currentScore;
  showResults.value = true;
};

const resetQuiz = () => {
  quizInProgress.value = false;
  showResults.value = false;
  quizQuestions.value = [];
};
</script>

<style scoped>
.quiz-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

/* Start Section */
.start-quiz-section {
  text-align: center;
}

.start-button, .submit-button, .retry-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.2s;
}

.start-button:hover, .submit-button:hover, .retry-button:hover {
  background-color: #2980b9;
}

.start-quiz-section p {
  margin-top: 1rem;
  color: #666;
}

/* Quiz Section */
.question-card {
  background: white;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.question-text {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.option {
  display: flex;
  align-items: center;
}

.option input[type="radio"] {
  margin-right: 0.5rem;
}

.option label {
  font-size: 1rem;
}

/* Results Section */
.results-section {
  text-align: center;
}

.score {
  font-size: 1.8rem;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 2rem;
}

.review ul {
  list-style: none;
  padding: 0;
  text-align: left;
}

.review li {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.review li.correct {
  background-color: #e8f5e9; /* Light green */
  border-left: 5px solid #4caf50; /* Green */
}

.review li.incorrect {
  background-color: #ffebee; /* Light red */
  border-left: 5px solid #f44336; /* Red */
}

</style>
