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
        <div class="tooltip" :class="{ 'editing-icon': isEditing }">
          <img  @click="editArticle()"  class="icon" src="../assets/edit.png" alt="編輯文章" title="編輯文章" >
          <div class="tooltip-text"
          >編輯文章</div>
        </div>
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
      <div v-if="newArticleID_arr.includes(selectedArticle.index)" 
        class="article-editor" 
        contenteditable="true"
        @input="updateContent"
         ref="editorRef"
        ></div>
        
      <div id="spandiv" v-else

        @input="onDivInput"
        
        @keydown="onDivKeydown">
        <!-- <span v-for="(block, index) in selectedArticle.blocks" 
              :key="index"
              :data-index="index">
          {{ block.text }}
        </span> -->
      <span
        v-for="(block, index) in sortedBlocks"
        :key="index"
        :data-index="index"
        :data-previousIndex="block.previous_index"
        :data-nextIndex="block.next_index"
        :class="{ 
          block: true, 
          active: block.marked
        }"
        :contenteditable="isEditing"
        @click="toggleWord(index)"
        @input="changeblock(block, index, $event)"
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
      
          <ul>
            <li v-for="(word, index) in markedwords " :key="index">{{word}}</li>
          </ul>
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
  'note': ''
})






function refreshSpan(){

  //
  alert('刷新span');
  const container = document.querySelector('#spandiv');

  // 假設你的資料陣列


  // 清空容器
  container.innerHTML = '';

  // 依資料生成 span 
  // 這個用不到了
  sortedBlocks.value.forEach((block, index) => {
    const span = document.createElement('span');
    span.innerText = block.text;                // 設定文字
    span.dataset.index = index;                 // 儲存 index
    span.classList.add('block');               // 加 class
    if (block.marked) span.classList.add('active'); // 條件 class
    span.contentEditable = 'true';             // 可編輯

    // 可以加事件
    span.addEventListener('click', () => {
      console.log('點擊 span:', index);
    });

    container.appendChild(span);
  });
}


function onDivKeydown(e) {
  // alert('key!')
  // if (e.code === 'Space') {
  //   alert('進入')
  //   e.preventDefault(); // 阻止空白鍵輸入到 span
  //   const sel = window.getSelection();
  //   if (!sel.rangeCount) return;

  //   const range = sel.getRangeAt(0);
  //   let node = range.startContainer;
  //   const span = node.nodeType === 3 ? node.parentElement : node;
  //   const parentSpan = span.closest('span');
  //   if (!parentSpan) return;

  //   const index = parseInt(parentSpan.dataset.index);

  //   // 在陣列 index + 1 插入新元素
  //   alert('插入');
  //   selectedArticle.value.blocks.splice(index + 1, 0, { text: ' ', type: 'word', marked: false });
  //   alert('index: '+index+' new index: '+index+1);
  //   // 下一個 tick 等 DOM 更新後，把光標放到新 span
  //   nextTick(() => {
  //     const newSpan = document.querySelector(`span[data-index="${index + 1}"]`);
  //     if (!newSpan) return;

  //     const range = document.createRange();
  //     range.setStart(newSpan, 0);
  //     range.collapse(true);

  //     const sel = window.getSelection();
  //     sel.removeAllRanges();
  //     sel.addRange(range);
  //     alert('focus');
  //     newSpan.focus();
  //   });
  // }
}


function onDivInput(e) {
  // const sel = window.getSelection();
  // if (!sel.rangeCount) return;

  // const range = sel.getRangeAt(0);
  // const node = range.startContainer; // 光標所在節點

  // // 往上找最近的 span
  // const span = node.nodeType === 3 ? node.parentElement : node; 
  // const parentSpan = span.closest('span');

  // if (parentSpan) {
  //   const index = parentSpan.dataset.index;
  //   alert('光標在 span index:', index);
  // } else {
  //   alert('光標不在任何 span 中');
  // }
}

function showblock(){

  alert(JSON.stringify(selectedArticle.value.blocks))
  // const container = document.querySelector('.article-content');
  // const spans = container.querySelectorAll('span');

  // // 連接所有文字
  // const combinedText = Array.from(spans)
  //   .map(span => span.innerText)   // 或 span.textContent
  //   .join(' ');                    // 空格分隔，也可以用 '' 連接

  // alert(combinedText);

}

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
  alert('輸入內容')
  selectedArticle.value.content = e.target.innerText // 或 innerHTML，看你要不要保留格式
  articles[selectedIndex.value].content = e.target.innerText;
  
  alert('異動內容後值: '+JSON.stringify(selectedArticle.value));
  alert('異動內容後articles值: '+JSON.stringify(articles));
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
  alert('輸入標題');
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

  noteArea.value.innerText = selectedArticle.value.note;

})


function editArticle(){
  alert('editing');
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


  alert('檢查: '+articles[0]);
  // 從文章列表中選取最新這筆文章資料物件
  selectArticle(0); 

  // focus標題區塊
  editableTitle.value.focus();
  alert('focus title');
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


// span綁上事件
function changeblock(block, index, event){
  // 取得 span 元素
  // const spanEl = event.target;
  const targetBlock = selectedArticle.value.blocks.find(b => b.index === index);
  targetBlock.edited = true;

    // 將 data-edited 同步到 span 元素
  const spanEl = event.target;
  spanEl.dataset.edited = 'true'; // 或 targetBlock.edited.toString()

  // alert('異動block: '+targetBlock.text);
  // alert('整筆: '+JSON.stringify(selectedArticle.value.blocks));
  // targetBlock.text = spanEl.innerText;
  // alert('新值: '+targetBlock.text);
  // data-index
  // const dataIndex = spanEl.dataset.index;

  // alert(`data-index: ${dataIndex}, v-for index: ${index}, block: ${JSON.stringify(block)}`);

  // alert(JSON.stringify(block));
  // const targetBlock = selectedArticle.value.blocks.find(b => b.index === index);
  //  if (!targetBlock) return;  // 沒找到就退出

  // if (targetBlock) {
  //   targetBlock.edited = true
  //   // block.text = 'New Text';
  //   // block.marked = false;
  // }

  // alert(JSON.stringify(block));
}


function reLinkBlocks() {
  // 1️⃣ 找出所有 data-edited="true" 的 span
  const editedSpans = document.querySelectorAll('span[data-edited="true"]');

  editedSpans.forEach(span => {
    // 取得編輯過的 span 基本資料
    const text = span.textContent || '';
    const index = Number(span.dataset.index); // 記得轉數字
    const preIndex = span.dataset.previousIndex;
    const nextIndex = span.dataset.nextIndex;

    // 2️⃣ 拆解成單字／空白／標點的陣列
    const wordsList = text.match(/\s+|\w+|/g) || [];

    // 3️⃣ 轉成新的 block 結構
    const newBlocks = wordsList.map((word, idx) => {
      const blocksLength = selectedArticle.value.blocks.length; // append 前長度
      let textType = '';

      if (word.trim() === '') textType = 'blank';
      else if (isWord(word)) textType = 'word';
      else textType = 'punctuation';

      return {
        edited: true,
        // 第一個留原 index，其餘接在目前長度之後
        index: idx === 0 ? index : blocksLength + idx,
        text: word,
        text_type: textType,
        previous_index: null,
        next_index: null
      };
    });

    // 4️⃣ 建立鏈接（previous / next）
    for (let i = 0; i < newBlocks.length; i++) {
      if (i === 0) newBlocks[i].previous_index = preIndex;
      else newBlocks[i].previous_index = newBlocks[i - 1].index;

      if (i === newBlocks.length - 1) newBlocks[i].next_index = nextIndex;
      else newBlocks[i].next_index = newBlocks[i + 1].index;
    }

    // 5️⃣ 替換第一個、附加其餘
    for (let i = 0; i < newBlocks.length; i++) {
      if (i === 0) {
        // 用第一個覆蓋原本位置
        selectedArticle.value.blocks[index] = newBlocks[i];
      } else {
        // 其餘 append 到最後
        selectedArticle.value.blocks.push(newBlocks[i]);
      }
    }

    // 6️⃣ 建立異動清單 (changeList)
    const changeList = [];

    // 找出要刪除的空 block
    selectedArticle.value.blocks.forEach(block => {
      if (block.text === '') {
        changeList.push({
          method: 'delete',
          index: block.index
        });
      }
    });

    // 新增與修改
    newBlocks.forEach((block, idx) => {
      if (idx === 0) {
        changeList.push({
          method: 'change',
          index: block.index,
          previous_index: block.previous_index,
          next_index: block.next_index,
          text: block.text
        });
      } else {
        changeList.push({
          method: 'add',
          index: block.index,
          previous_index: block.previous_index,
          next_index: block.next_index,
          text: block.text
        });
      }
    });

    console.log('changeList:', changeList);
  });

  // 7️⃣ 最後可選：保持陣列順序
 // selectedArticle.value.blocks.sort((a, b) => a.index - b.index);
}

// 重新連結所有單字blocks
// function reLinkBlcoks(){
//     //1 遍歷找出edit的span (如果內容為空視為刪除,最後一筆資料index改為該index，該筆資料刪掉)
//     // 找到所有 data-edited="true" 的 span
//     const editedSpans = document.querySelectorAll('span[data-edited="true"]');


//     //2 正則表達式將span內容拆解成陣列，開頭元素寫入原位置，剩餘的放末尾
//     editedSpans.forEach(span => {

//         // 取得編輯過的span
//         const text = span.textContent;

//         // 取得編輯過的span index
//         const index = span.dataset.index; // dataset屬性是字串

//         // 取得編輯過的previous index
//         const preIndex = span.dataset.previousIndex;

//         // 取得編輯過的next index
//         const nextIndex = span.dataset.nextIndex;


//         // 用正則表達式將span內容解析成新的單詞陣列
//         let wordsList =  (text || '').match(/\s+|\w+|/g) || [];



//         // 將單詞陣列中的值轉換成block的結構，並設定index、previous index、next index 加入整個word blocks的linked list中
//         let newBlocks = wordsList.map((word, idx) => {

//                 // 取得現在blocks陣列長度
//                 const blocksLength = selectedArticle.value.blocks.length;
                
//                 let textType = '';

//                 // 設定單字類型
//                 // 1.空白字元
//                 if (word.trim() === '') {
//                   textType = 'blank';
//                 }
//                 // 2.單字
//                 else if (isWord(word)) {
//                   textType = 'word';
//                 }
//                 // 3.標點符號或其他
//                 else{
//                   textType = 'punctuation';
//                 }


//                 // 當前block的index (新陣列的第一個單字放入原位置，其餘的放入末尾)

//                 let newBlock = {
//                     edited: 'true',
//                     index: idx === 0 ? index : blocksLength-1 + idx,
//                     text: word,
//                     text_type: textType,
//                     previous_index: null,
//                     next_index: null
//                 }
//                 return newBlock;
//         })

//         alert('newblocks: '+JSON.stringify(newBlocks));

//         // 設定新block的previous index、next index
//         for (let i=0; i<newBlocks.length; i++){
//           //
//           if (i=== 0){
//             newBlocks[i].previous_index = preIndex;
//           }else{
//             newBlocks[i].previous_index = newBlocks[i-1].index
//           }

//           if (i=== newBlocks.length-1){
//             alert('下一個值'+selectedArticle.value.blocks[nextIndex].text);
//             newBlocks[i].next_index = nextIndex;
//           }else{
//             newBlocks[i].next_index = newBlocks[i+1].index;
//           }      
//         }   

//         for (let i=0; i<newBlocks.length; i++){
//           if (i===0){
//             //
//             let str = selectedArticle.value.blocks.map(item => item.text).join("");
//             alert('str: '+str);
//             selectedArticle.value.blocks[index] = newBlocks[i];
//             let str2 = selectedArticle.value.blocks.map(item => item.text).join("");
//             alert('str2: '+str2);
            
//           }else{

//             selectedArticle.value.blocks.push(newBlocks[i]);
//           }
//         }

//         //3 建立一個api異動block表  做2的同時，將每個元素依據修改或修增，插入一筆資料到該list裡，最後提交異動
//         let changeList = [];

//         selectedArticle.value.blocks.forEach((block)=>{
//           if (block.text === ""){
//             changeList.push({
//               method: 'delete',
//               index: block.index
//             })
//           }
//         })


//         newBlocks.forEach((block, index)=>{
//           if (index===0){
//             changeList.push({
//               method: 'change',
//               index: block.index,
//               previous_Index:block.previous_index,
//               next_index: block.next_index,
//               text: block.text
//             })
//           }else{
//             changeList.push({
//               method: 'add',
//               index: block.index,
//               previous_Index:block.previous_index,
//               next_index: block.next_index,
//               text: block.text
//             })
//           }
//         })
        
//     });


//   //4 後端新增一個api，接收異動API表，修改的就依據index找到該資料修改，新增的就把新block資料寫入資料庫
// }
  // const words = (editorRef.value?.innerText || '').match(/\s+|\w+|/g) || []

  // return words.map((word, idx) => {
  //   const length = words.length

  //   // 空白字元
  //   if (word.trim() === '') {
  //     return {
  //       index: idx,
  //       text: word,
  //       text_type: 'blank',
  //       previous_index: idx === 0 ? null : idx - 1,
  //       next_index: idx === length - 1 ? null : idx + 1
  //     }
  //   }

  //   // 單字
  //   if (isWord(word)) {
  //     return {
  //       index: idx,
  //       text: word,
  //       text_type: 'word',
  //       previous_index: idx === 0 ? null : idx - 1,
  //       next_index: idx === length - 1 ? null : idx + 1
  //     }
  //   }

  //   // 標點或其他
  //   return {
  //     index: idx,
  //     text: word,
  //     text_type: 'punctuation',
  //     previous_index: idx === 0 ? null : idx - 1,
  //     next_index: idx === length - 1 ? null : idx + 1
  //   }
  // })


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

// 監聽 computed 的變化
watch(sortedBlocks, (newVal) => {
  //refreshSpan(); // 每次 sortedBlocks 更新時呼叫
});


const parseArticleText = computed(() => {
  const words = (editorRef.value?.innerText || '').match(/\s+|\w+|/g) || []

  return words.map((word, idx) => {
    const length = words.length

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
  })
})




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

  // 將編輯區塊文字轉換後的block寫入 選擇文章物件 內

  alert('重新排序前: ' +JSON.stringify(selectedArticle.value.blocks));

  let str1 = selectedArticle.value.blocks.map(item => item.text).join("");
  alert(str1);
  //reLinkBlcoks();
  reLinkBlocks();
  
  alert('重新排序後: ' +JSON.stringify(selectedArticle.value.blocks));
  let str2 = selectedArticle.value.blocks.map(item => item.text).join("");
  alert(str2);

  let str3 = sortedBlocks.value.map(item=> item.text).join("");
  alert(str3)


  return;
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
function toggleWord(index) {
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


  // if (text.value != newItem.content){
  //   text.value = newItem.content;
  // }
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
    margin-left: 30px;
    border: none;
    outline: none;
}

.article-editor{
    width: 50vw;
    text-align: left;
    font-size: 24px;
    margin-left: 30px;
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
  border-radius: 6px;
}




.note-div .record-words-area{
  height: 25vh;
  display: block;
  width: auto; 
  padding: 10px;

  overflow-x: hidden;
  overflow-y: scroll;

}


.note-div .record-words-area input{
  /* margin-bottom: 10px; */
  border: 2px solid #ccc;
  border-radius: 5px; 
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
}

.note-div div{
  background-color: rgba(240, 240, 240, 5); /* 背景半透明 */
  border: 1px solid #ccc;   /*外框 */
  overflow: auto;        /* 讓邊框收齊 */
}

.note-div summary{
  text-align: left;
}

.input-bar{
  position: fixed;
  display: flex;
}


.editing-icon{
  background-color: #ddd; /* 滑上去變淺灰 */
  border-radius: 8px;
}


[contenteditable='true']{
  outline: none;
}


</style>