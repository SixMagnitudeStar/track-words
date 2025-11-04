<template>
  <div id="container">
    <div >
      <button @click="showblock">顯示block</button>
      <span class="iconBox">
        <div class="tooltip">
          <img @click="createNewArticle" class="icon" src="../assets/plus.png" alt="建立文章" title="建立文章"/>
          <div class="tooltip-text">建立文章</div>
        </div>
        
        <div class="tooltip">
          <img @click="fetchTextFromAPI()" class="icon" src="../assets/random.png" alt="隨機生成文章" title="隨機生成文章">
          <div class="tooltip-text">隨機一篇生成文章</div>
        </div>
        <div class="tooltip">
          <img @click="saveArticle()" class="icon" src="../assets/check.png" alt="儲存文章" title="儲存文章">
          <div class="tooltip-text">儲存文章</div>
        </div>
        <!-- <div class="tooltip" :class="{ 'editing-icon': isEditing }">
          <img  @click="editArticle()"  class="icon" src="../assets/edit.png" alt="編輯文章" title="編輯文章" >
          <div class="tooltip-text"
          >編輯文章</div>
        </div> -->
        <div class="tooltip">
          <img @click="deleteArticle()" class="icon" src="../assets/bin.png" alt="刪除文章" title="刪除文章">
          <div class="tooltip-text">刪除文章</div>
        </div>
      </span>
      <ul class="article-list">
        <li v-for="(article,index) in articles" 
        v-bind:key="index"
        :class="{selected: selectedIndex === index}"
        @click="selectArticle(index)"
        >{{ article.title  || '未命名文章' }}</li>
      </ul>
    </div>

    <div class="article-content" >
      <h1 class="article-title"
          contenteditable="true"
          placeholder="5sss"
          @input="articleTitleChange"
          @keydown="handleTitleKeydown"
          ref="editableTitle"
          spellcheck="false"
      ></h1>
      <div v-if="isEditing" 
        class="article-editor" 
        contenteditable="true"
        @input="updateContent"
         ref="editorRef"
        ></div>
        
      <div id="spandiv" v-else>
      <span
        v-for="(block, index) in selectedArticle.blocks"
        :key="index"
        :class="{ 
          word: block.text_type==='word', 
          active: block.marked,
          paragraph: block.text_type==='paragraph' 
        }"
        @click="markWord(block,index)"
        v-html="block.text"
      ></span>
      </div>
    </div>

    <div class="note-div">

      <details open>
        <summary>不熟悉單字清單</summary>
        <div class="record-words-area">
          <div class="input-bar">
            <input type="text" placeholder="Enter a word & phrase" />
            <button>Add</button>
          </div>
          
          <div class="marked-word-list">
            <ul>
            <li v-for="(word, index) in selectedArticle.marked_words" :key="index">
              <div class="parallel-div">
                <img @click="deleteMarkedWord(word)" class="remove-marked-word-icon" src="../assets/bin2.png" alt="移除單字" title="移除單字">
                <span>{{word.word}}</span>
              </div>
            </li>
              
              
          </ul>
          </div>
          
        </div>
      </details>

      <details>
        <summary>筆記</summary>
        <div class="note-area" contenteditable="true" ref="noteArea"></div>
      </details>


    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive, nextTick  } from 'vue'
import { useAuthStore } from '@/auth.js'

import api from '@/axios.js'
// import axios from 'axios'
// import { parse } from '@babel/eslint-parser'
/* global defineOptions */
defineOptions({
  name: 'articleReadingPage'
})



const auth = useAuthStore()

const headers = {
  Authorization: `Bearer ${auth.token}`
}

const selectedArticle = ref({
  'id': 0,
  'title': '',
  'content': '',
  'blocks': [],
  'marked_words':[],
  'note': ''
})




// const articleText = ref("")


const editableTitle = ref(null);

// const articleTitle = ref('');

const articles = reactive([])  // reactive 陣列
const selectedIndex = ref(0); // 記錄被選中的文章 li



const markedwords = reactive(['apple','banana','x','sawe','asss','banana','x','sawe','asss','banana','x','sawe','asss']) // 紀錄標記不熟悉的單字


const noteArea = ref(null);



// articles.value.push("訊息 1","訊息 2AFASFSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSA", "訊息 3");


// 原始文字內容（可從 API 傳入）
// const text = ref(`React (also known as React.js or ReactJS) is a free and open-source
// front-end JavaScript library for 。，building user interfaces (UIs).`)

//const text = ref('')  // 初始為空字串

// 記錄被點擊的詞索引
// const activeIndexes = ref([])
//activeIndexes.value = [1, 3]


// const text = ref('');


// 編輯器內容更新
function updateContent(e) {
  //alert('輸入內容')
  selectedArticle.value.content = e.target.innerText // 或 innerHTML，看你要不要保留格式
  articles[selectedIndex.value].content = e.target.innerText;
  
  // alert('異動內容後值: '+JSON.stringify(selectedArticle.value));
  // alert('異動內容後articles值: '+JSON.stringify(articles));
}



// 將文字斷詞，包進 HTML 結構

// \s+
// \s → 匹配任何空白字元（空格、Tab、換行）
// + → 一個或多個

// 意思：把連續的空白視為一個「單位」

// \w+
// \w → 匹配字母、數字、底線 [A-Za-z0-9_]
// + → 一個或多個

// 意思：抓連續的英文單詞或數字

// [^\w\s]
// [...] → 字元集
// ^ → 取反
// \w\s → 所有字母/數字/底線 + 空白
// [^\w\s] → 任何不是字母/數字/底線或空白的字元

// 意思：抓標點符號或特殊字元

// |
// OR 的意思
// 正則會依序匹配：空白 → 單詞/數字 → 標點
// g 標誌
// 全局匹配（global），會返回 所有匹配到的結果，而不只第一個
const parsedWords = computed(() => {
  const words = (selectedArticle.value.content || '').match(/\s+|\w+|[^\w\s]/g) || []
  return words.map((word) => {
    if ((word.trim() != '') || (!isWord(word))){
      return { html: word,  clickable: false } // 空白原樣回傳
    }
    return { html: word, clickable: true }
  })
})


//////////////////////   文章 ////////////////////////

//// 標題處理   (標題UI與 '當前選擇文章' 物件資料的同步、捕獲按下Enter事件切換到文章編輯區)

// 文章標題change事件，將最新的異動text值寫入綁定的標題值變數
function articleTitleChange(e){
  //alert('輸入標題');
  selectedArticle.value.title = e.target.innerText;

  articles[selectedIndex.value].title = e.target.innerText;
}




function handleTitleKeydown(e) {
  if (!isEditing.value) return

  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault() // 避免換行
    editorRef.value?.focus()
  }
}


///// 文章資料物件  ////////

// 狀態紀錄
const isEditing = ref(false)

// 新增文章id紀錄
const newArticleID_arr = reactive([]) // 紀錄新增文章的id

/////////////////////


///// 查詢文章 /////

// 呼叫api從後端抓取文章資料
async function getArticles() {
  try {

    const response = await api.get('/articles',  { headers: headers })

    console.log('文章資料:', response.data)
    return Array.isArray(response.data) ? response.data : [];
    // return response.data.articles
  } catch (error) {
    console.error('取得文章失敗:', error)
    return []

  }
}


onMounted(async ()=>{

  // 載入頁面時抓取文章
  const fetched = await getArticles()
  alert('fet:'+fetched)
  articles.push(...fetched)  // 展開陣列
  alert('articles:'+JSON.stringify(articles));
  await nextTick()

  selectArticle(0) // 讀取第一篇文章
  alert(JSON.stringify(selectedArticle.value.blocks));
  noteArea.value.innerText = selectedArticle.value.note;

})


function editArticle(){
  isEditing.value = true;
  
}



//////// 文章內容處理 (新增、編輯、儲存)

// 新增文章


// 創件一筆新的文章資料物件，放入文章列表中，並選取他
function createNewArticle(){

  // 設定新文章id，值為先前最新一筆資料的id值+1 
  alert(articles.length);
  const newArticle_id = articles.length === 0 ? 1 : articles[0].id+1; 
  alert(newArticle_id);
  
  // 將新增文章的id加入列表紀錄
  newArticleID_arr.push(newArticle_id);

  articles.unshift({
    id: newArticle_id,
    title: '',
    content: '',
    blocks: []
  });


  //alert('檢查: '+articles[0]);
  // 從文章列表中選取最新這筆文章資料物件
  selectArticle(0); 

  // focus標題區塊
  editableTitle.value.focus();
//  alert('focus title');
}



// 動態偵測文章邊提區塊，將新文章內容轉為單字block
const editorRef = ref(null)
// const  icleText = computed(() => {
//   //
//   const words = (editorRef.value?.innerText || '').match(/\s+|\w+|/g) || []

//   return words.map((word) => {
//     // 空白字元
//     if (word.trim() === ''){
//       return { text: word ,text_type:'blank'}
//     }

//     // 單字
//     if (isWord(word)){
//       return { text: word ,text_type:'word'}
//     }
    
//     //標點或其他
//     return  { text: word ,text_type:'punctuation'}
//   })
// })


// 使用響應式赋值代替 Object.assign，確保seletecArticle的異動能被追蹤
function updateSelectedArticle(fetchedArticle) {
  Object.keys(fetchedArticle).forEach(key => {
    selectedArticle.value[key] = fetchedArticle[key]
  })
}




const sortedBlocks = computed(() => {
  const blocks = selectedArticle.value?.blocks || [];
  if (!blocks.length) return [];

    // 找到開頭節點（previous_index 為 null）
  let current = blocks[0];
  const result = [];

  // 沿 next_index 串起來
  while (current) {
    result.push(current);
    if (current.next_index === null) break;
    current = blocks[current.next_index];
  }


  return result;
})


const parseArticleText = computed(() => {
  // 取得文字並拆成單字、空格或換行
  const text = editorRef.value?.innerText || '';

  // 正則：單字 (\w+)，空白 (\s+)，換行 (\n)
  const words = text.match(/\n|\s+|\w+|[^\s\w]/g) || [];

  return words.map((word, idx) => {
    const length = words.length;

    // 段落換行
    if (word === '\n') {
      return {
        index: idx,
        text: word,
        text_type: 'paragraph',
        previous_index: idx === 0 ? null : idx - 1,
        next_index: idx === length - 1 ? null : idx + 1
      }
    }

    // 空白字元
    if (word.trim() === '') {
      return {
        index: idx,
        text: word,
        text_type: 'blank',
        previous_index: idx === 0 ? null : idx - 1,
        next_index: idx === length - 1 ? null : idx + 1
      }
    }

    // 單字
    if (isWord(word)) {
      return {
        index: idx,
        text: word,
        text_type: 'word',
        previous_index: idx === 0 ? null : idx - 1,
        next_index: idx === length - 1 ? null : idx + 1
      }
    }

    // 標點或其他
    return {
      index: idx,
      text: word,
      text_type: 'punctuation',
      previous_index: idx === 0 ? null : idx - 1,
      next_index: idx === length - 1 ? null : idx + 1
    }
  });
})
// const parseArticleText = computed(() => {
  
//   const words = (editorRef.value?.innerText || '').match(/\s+|\w+|/g) || []

//   return words.map((word, idx) => {
//     const length = words.length

//     // 空白字元
//     if (word.trim() === '') {
//       return {
//         index: idx,
//         text: word,
//         text_type: 'blank',
//         previous_index: idx === 0 ? null : idx - 1,
//         next_index: idx === length - 1 ? null : idx + 1
//       }
//     }

//     // 單字
//     if (isWord(word)) {
//       return {
//         index: idx,
//         text: word,
//         text_type: 'word',
//         previous_index: idx === 0 ? null : idx - 1,
//         next_index: idx === length - 1 ? null : idx + 1
//       }
//     }

//     // 標點或其他
//     return {
//       index: idx,
//       text: word,
//       text_type: 'punctuation',
//       previous_index: idx === 0 ? null : idx - 1,
//       next_index: idx === length - 1 ? null : idx + 1
//     }
//   })
// })




// // 判斷是不是字元(單一字元)
function isTextChar(char) {
  return /^[a-zA-Z0-9]$/.test(char);
}

// // 判斷是不是文字(逐一檢查每個word的單一字元)
function isWord(str) {
  // 全部字元都是文字或數字
  return [...str].every(char => isTextChar(char))
}

// 呼叫api將文章存入後端
async function saveArticle() {


  Object.assign(selectedArticle.value.blocks,parseArticleText.value);
  Object.assign(articles[selectedIndex.value].blocks, parseArticleText.value);
  articles[selectedIndex.value].blocks = parseArticleText.value;


  const body = {
    id: selectedArticle.value.id,
    title: selectedArticle.value.title,
    content: selectedArticle.value.content,

    note: selectedArticle.value.note || '', // 添加預設值
    
    blocks: selectedArticle.value.blocks || []
  }
  console.log('檢查body: '+JSON.stringify(body));

  try{
    let response
    
    const i = newArticleID_arr.indexOf(body.id);

    // post
    if (i!=-1 ){
      response = await api.post('/article', body, { headers: headers })
      
      // 建立文章儲存後，從存放新文章id的列表中移除
      const index = newArticleID_arr.indexOf(selectedArticle.value.id)
      if (index !== -1) {
        newArticleID_arr.splice(index, 1) // 移除第一個匹配元素
      }
    }else{
      // put
      response = await api.put(`/article/${body.id}`, body, { headers })
   
    }

    alert('文章新增成功!')
    selectArticle(0)
    console.log('新增成功', response.data)
  } catch(err){
    console.error('422 details:', err.response?.data?.detail)
    console.error(err)
    alert('文章新增失敗')
  }
}

///////////////////////////////////////////////////////////////





/////// 文字區塊鏈異動/span異動

//let wordChangeRecord = reactive([]);

function wordchange(block, index){
  //
  alert('觸發');
  // 1. 單字異動，先keep他的previous和next
  // 2. 正則表達式重新解析整個單字
  // 3. 判斷僅修改block text還是需要異動鏈 (解析轉換內容區塊length>1，多的區塊同樣要插入文字區塊鏈，確保各自的index、previous、next正確)

  //
  // const pre_block = selectedArticle.blocks[block.previous_index]
  // const next_block = selectedArticle.blocks[block.next_index]

  const preIdx = block.previous_index;
  const nextIdx = block.next_index;
  //
  const words = (block.text || '').match(/\s+|\w+|/g) || [];

  const new_words_block = words.map((word, idx) => {

    let item = {
      index: 0,
      text_type: 'punctuation',
      text: word,
      previous_index: 0,
      next_index: 0
    }

    // 空白字元
    if (word.trim() === '') {
      item.text_type = 'blank'
      return item
    }

    // 單字
    if (isWord(word)) {
      item.text_type = 'word'
    }

    // 標點或其他
    return item
  })
 


  new_words_block.forEach((item, i) => {


        // 第一個單字寫在原本的位置
    if (i === 0){

      item.index = index; //索引為本來的索引
      item.previous_index = preIdx

      item.next_index = new_words_block.length ===1 ? nextIdx : selectedArticle.value.blocks.length

      selectedArticle.value.blocks[index] = item;
      return 
    }

    item.index = selectedArticle.value.block.length;
    item.previous_index = new_words_block[i-1].index;
    item.next_index = i === new_words_block.length-1 ? nextIdx :selectedArticle.value.blocks.length+1
    selectedArticle.value.blocks.push(item);
    //
  });


}





// function onBlur(event) {
//   if (articleTitle.value.trim() === '') {
//     articleTitle.value = '暫無標題'
//     event.target.innerText = articleTitle.value
//   }
//   console.log('blur 觸發', articleTitle.value)
// }


// 切換某個單字的高亮狀態
async function markWord(block,index) {

  let mark = !block.marked;

  block.marked = mark;  // true → false, false → true


  if (mark){
    //
    selectedArticle.value.marked_words.push({'word':block.text});
  }else{
    const idx = selectedArticle.value.marked_words.findIndex(w => w.word === block.text);
    if (idx > -1) {
      selectedArticle.value.marked_words.splice(idx, 1); // 刪除該元素
    }
  }


  const body = {
    "marked": mark 
  }

  try{
    let response
    response = await api.patch(`/article-blocks/${block.id}/marked`, body);
    console.log('異動block marked標記', response?.data)
  
  }catch(err){
    console.error('422 details:', err.response?.data?.detail)
    console.error(err)
  }


  // if (!parsedWords.value[index].clickable || isEditing.value) return

  // if (!selectedArticle) return

  // const i = String(index);

  // // const i = activeIndexes.value.indexOf(index)
  // // if (i === -1) {
  // //   activeIndexes.value.push(index)
  // // } else {
  // //   activeIndexes.value.splice(i, 1)
  // // }

  // const found = selectedArticle.value.tags_css.find(item => item.index === i)
  // if (!found){
  //   selectedArticle.tags_css.push({'index':i})
  //   saveMarkedword(parsedWords.value[index].html)
  // }else{
  //   selectedArticle.tags_css = selectedArticle.tags_css.filter(item => item.index !== i)
  //   deleteMarkedWord(parsedWords.value[index].html)
  // }
}





function selectArticle(index){


  selectedIndex.value = index;
  //selectedArticle.value = articles[index];
  Object.assign(selectedArticle.value,articles[index]);


  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.innerText = selectedArticle.value.content
    }
  })

  alert('選擇的文章id:'+selectedArticle.value.id+', 列表index..:'+selectedIndex.value);
  alert('articles: '+JSON.stringify(articles));
  alert('selectedArticle: '+ JSON.stringify(selectedArticle.value));

  if (newArticleID_arr.includes(selectedArticle.value.id)){
    alert('新文章')
    isEditing.value = true
  }else{
    alert('舊文章')
    isEditing.value = false
  }
}


// 封裝 API 請求
async function fetchTextFromAPI() {
  try {
    const topic = encodeURIComponent('AI in education')
    const wordLimit = 200
    const url = `http://127.0.0.1:8000/essay?topic=${topic}&word_limit=${wordLimit}`

    const res = await fetch(url)
    const data = await res.json() // 假設 API 回傳 JSON { text: '...' }

    const id = articles.length ;

    newArticleID_arr.push(id);

    articles.unshift({
      'id': id,
      'title': data.topic || "無標題",
      'content': data.essay || data.text || "",
      'tags_css': [],
      'note': data.note || ""
    });

   // Object.assign(selectedArticle, articles[0]);
     // 資料更新完成後再選第一個

    nextTick(() => {
      selectArticle(0)
      editableTitle.value.focus();
    })

//    selectedArticle.tags_css[1,3]
    //articleTitle.value = data.topic;
    // text.value = data.essay;     // 將 API 回傳文字設定給 ref
  } catch (err) {
    console.error(err)
  }
}


function deleteArticle(){

  // 紀錄刪除文章的id
  const id = selectedArticle.value.id
  alert('刪除文章id:'+id+', 移除文章index:'+selectedIndex.value);
  // 將當前選取文章從文章列表中移除

  articles.splice(selectedIndex.value, 1);

  // 選取第一篇文章
  selectArticle(0);

  // 檢查是否為尚未儲存的文章，如果是的話直接離開不用執行後面api
  if (newArticleID_arr.includes(selectedArticle.value.id)) return

  // 呼叫API從資料庫刪除該篇文章
  deleteArticleAPI(id);

}

async function deleteArticleAPI(id){
  //
  try{
    let response
    response = await api.delete(`/article/${id}`)
    console.log('刪除成功', response?.data)
  
  }catch(err){
    console.error('422 details:', err.response?.data?.detail)
    console.error(err)
  }
}

async function saveMarkedword(word){

    // 檢查文章是否已經儲存
    if (newArticleID_arr.includes(selectedArticle.value.id)){
      alert('文章尚未儲存，請先儲存!')
      return
    }

    
    let response

    const body = {
      article_id: selectedArticle.value.id,
      word: word
    }

  try{
    response = await api.post('/markedword', body)
    console.log('新增成功', response.data)

  }catch(err){
    console.error('422 details:', err.response?.data?.detail)
    console.error(err)
  }
}

// 檢查是否是新文章，是新文章直接離開不用呼叫API刪除標記文字
// 呼叫API，刪除對應的字，返回訊息

async function deleteMarkedWord(word) {
  alert('刪除')
  if (newArticleID_arr.includes(selectedArticle.value.id)) return
  

  const index = selectedArticle.value.marked_words.indexOf(word);
  if (index > -1) {
    selectedArticle.value.marked_words.splice(index, 1); // 刪除該元素
  }

  let response

  const params = {
    article_id: selectedArticle.value.id,
    word: word
  }

  
  response = await api.delete('/markedword/',{
    params: params
  })
  console.log(response.data)
  alert('maredword刪除成功')
}




watch(selectedArticle.value, (newItem) => {
  if (editableTitle.value && editableTitle.value.innerText !== newItem.title){
    editableTitle.value.innerText = newItem.title;
  }

  if (noteArea.value.innerText != newItem.note){
    noteArea.value.innerText = newItem.note;
  }
})



</script>
<style scoped>

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
  color: red;
  font-weight: bold;
}

.word:hover{
  background-color: #ddd;
  border-radius: 5px;
}

.article-content{
    width: 50vw;
    text-align: left;
    font-size: 24px;
    margin: 30px;
    border: none;
    outline: none;
}

.article-editor{
    width: 50vw;
    text-align: left;
    font-size: 24px;
    margin: 30px;
    border: none;
    outline: none;
    font-size: blue;
}

.article-title{
    border: none;
}

.article-title:empty::before {
  content: "輸入文章標題…";
  color: #aaa;
  pointer-events: none; /* 避免遮住點擊 */
}

.article-list{
  width: 150px;
  /* background-color: #F0F0F0; */
  background-color: rgba(240, 240, 240, 5); /* 背景半透明 */
  height: auto;
  cursor: pointer;

  list-style: none;        /* 移除前面的圓點 */
  padding: 0;
  margin: 0;
  border: 1px solid #ccc;  /* 外框 */
  border-radius: 6px;
  overflow: auto;        /* 讓邊框收齊 */

      caret-color: transparent;   /* 隱藏輸入游標 */
    user-select: none;          /* 禁止選取文字 (可選) */
/*    outline: none;              移除點擊時外框 */
} 

.article-list li {
  padding: 10px;
  border-bottom: 1px solid #ccc;

  overflow: hidden;           /* 超出隱藏 */
  text-overflow: ellipsis;    /* 顯示省略號 */
}

.article-list li.selected {
  background-color: #ddd; /* 反灰 */
}

.article-list li:last-child {
  border-bottom: none; /* 最後一項不要下邊框 */
}


.note-div{
  width: 400px;
  height: 100%;
  
}




.note-div .record-words-area{
  /* height: 25vh;
  display: block;
  width: auto; 
  padding: 10px;

  border-radius: 15px; */


  height: 25vh;
  display: flex;
  flex-direction: column; /* 垂直排列 input-bar 與列表 */
  padding: 10px;
  border-radius: 15px;
}


.note-div .record-words-area input{
  /* margin-bottom: 10px; */
  border: 2px solid #ccc;

  /* margin-left: 0; */

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
  height: 25vh;
  /* border: none; */
  display: block;
  text-align: left;
  border-radius: 15px;
  padding: 10px;
}

.note-div div{
  background-color: rgba(240, 240, 240, 5); /* 背景半透明 */
  /* border: 1px solid #ccc;    */
  overflow: auto;        /* 讓邊框收齊 */
}

.note-div summary{
  text-align: left;
}

.input-bar{
  position: absolute;
  display: flex;
  gap: 8px; /* input 與 button 間距 */
  margin-bottom: 8px; /* 與下面 ul 保持距離 */



}


.editing-icon{
  background-color: #ddd; /* 滑上去變淺灰 */
  border-radius: 8px;
}


[contenteditable='true']{
  outline: none;
}

.paragraph {
  display: block;   /* 換行 */
  margin-bottom: 1em; /* 可選，段落間距 */
}

.marked-word-list{
  display: block;
  margin-top: 50px;
  
  overflow-x: hidden;
  overflow-y: scroll;
  flex: 1;               /* 填滿剩餘空間 */

  border: none;       /* 移除邊框 */
  
}
.marked-word-list ul{
  list-style: none;   /* 移除圓點 */
  padding-left: 10px; /* 左側縮排 */
}
.marked-word-list li{
  text-align: left;
}


.remove-marked-word-icon{
  margin: 2px 10px;
}

.remove-marked-word-icon:hover{
  background-color: #e0e0e0; /* 滑上去變淺灰 */
  cursor: pointer;       
}

.parallel-div{
  display: flex;
}

</style>