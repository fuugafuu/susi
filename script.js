// カタカナや漢字が表示されても、打つのは「ひらがな」でOK
const SUSHI_WORDS = [
  {display: "まぐろ", yomi: "まぐろ"},
  {display: "サーモン", yomi: "さーもん"},
  {display: "えび", yomi: "えび"},
  {display: "たまご", yomi: "たまご"},
  {display: "いくら", yomi: "いくら"},
  {display: "はまち", yomi: "はまち"},
  {display: "こはだ", yomi: "こはだ"},
  {display: "たい", yomi: "たい"},
  {display: "うに", yomi: "うに"},
  {display: "かっぱ", yomi: "かっぱ"},
  {display: "鉄火", yomi: "てっか"},
  {display: "とろ", yomi: "とろ"},
  {display: "いか", yomi: "いか"},
  {display: "さば", yomi: "さば"}
];
const DIFFICULTY = {
  easy: { label: "やさしい", speed: 0.7, addInterval: 2000 },
  normal: { label: "ふつう", speed: 1.1, addInterval: 1300 },
  hard: { label: "むずかしい", speed: 1.7, addInterval: 850 },
};
let difficulty = "easy";
let sushiList = [];
let score = 0;
let timer = 30;
let interval1, interval2, timerInterval;
let running = false;
let sushiId = 0;
let typingBuffer = "";

// ひらがな変換（カタカナ→ひらがな、漢字そのまま、長音記号そのまま）
function toHiragana(str) {
  return str.replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0)-0x60))
            .replace(/[ー]/g, "ー");
}

// --- 不正対策 ---
document.addEventListener('contextmenu', e => e.preventDefault()); // 右クリック禁止
document.addEventListener('keydown', function(e) {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    location.reload();
  }
});
window.onblur = () => { if (running) pauseGame(); };
window.onfocus = () => { if (running && timer > 0 && !interval1) resumeGame(); };
window.addEventListener('paste', function(e) {
  document.getElementById('warning').textContent = "ペースト禁止です！";
  e.preventDefault();
  setTimeout(() => document.getElementById('warning').textContent = "", 1600);
});
let devtoolsOpen = false;
setInterval(function(){
  if(window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160){
    if(!devtoolsOpen) { location.reload(); devtoolsOpen = true; }
  }
}, 800);

function pauseGame() {
  clearInterval(interval1); clearInterval(interval2); clearInterval(timerInterval);
  document.getElementById('msg').textContent = "ウインドウが非アクティブになったため一時停止中です";
}
function resumeGame() {
  document.getElementById('msg').textContent = "";
  interval1 = setInterval(moveSushi, 20);
  interval2 = setInterval(addSushi, DIFFICULTY[difficulty].addInterval);
  timerInterval = setInterval(() => {
    timer--;
    document.getElementById("timer").textContent = timer;
    if (timer <= 0) finishGame();
  }, 1000);
}

document.getElementById("easy-btn").onclick = () => selectDifficulty("easy");
document.getElementById("normal-btn").onclick = () => selectDifficulty("normal");
document.getElementById("hard-btn").onclick = () => selectDifficulty("hard");

function selectDifficulty(diff) {
  difficulty = diff;
  document.querySelectorAll(".difficulty button").forEach(btn => btn.classList.remove("selected"));
  document.getElementById(diff + "-btn").classList.add("selected");
}

function getRandomWord() {
  return SUSHI_WORDS[Math.floor(Math.random() * SUSHI_WORDS.length)];
}

function startGame() {
  document.querySelector('.difficulty').style.display = "none";
  document.getElementById("start-btn").style.display = "none";
  sushiList = [{ word: getRandomWord(), left: 100, id: ++sushiId }];
  score = 0;
  timer = 30;
  running = true;
  typingBuffer = "";
  document.getElementById("score").textContent = score;
  document.getElementById("timer").textContent = timer;
  document.getElementById("msg").textContent = "";
  document.getElementById("typing-area").textContent = "";
  renderSushi();
  document.getElementById("hidden-input").value = "";
  document.getElementById("hidden-input").focus();
  interval1 = setInterval(moveSushi, 20);
  interval2 = setInterval(addSushi, DIFFICULTY[difficulty].addInterval);
  timerInterval = setInterval(() => {
    timer--;
    document.getElementById("timer").textContent = timer;
    if (timer <= 0) finishGame();
  }, 1000);
}

function moveSushi() {
  sushiList.forEach(sushi => sushi.left -= DIFFICULTY[difficulty].speed);
  sushiList = sushiList.filter(sushi => sushi.left > 0);
  renderSushi();
}

function addSushi() {
  sushiList.push({ word: getRandomWord(), left: 100, id: ++sushiId });
  renderSushi();
}

function finishGame() {
  running = false;
  clearInterval(interval1); clearInterval(interval2); clearInterval(timerInterval);
  document.getElementById("msg").textContent = `終了！あなたのスコア: ${score}`;
  saveRanking(score, DIFFICULTY[difficulty].label);
  showRanking();
  document.querySelector('.difficulty').style.display = "";
  document.getElementById("start-btn").style.display = "";
}

// 入力欄でリアルタイム判定
document.getElementById("hidden-input").addEventListener("input", function(e){
  if (!running) return;
  typingBuffer = e.target.value;
  document.getElementById('typing-area').textContent = typingBuffer;
  const typedHira = toHiragana(typingBuffer);

  let idx = sushiList.findIndex(s => toHiragana(s.word.yomi) === typedHira);
  if (idx !== -1) {
    score += 10;
    document.getElementById("score").textContent = score;
    sushiList.splice(idx, 1);
    renderSushi();
    typingBuffer = "";
    e.target.value = "";
    document.getElementById('typing-area').textContent = "";
  } else if (!SUSHI_WORDS.some(w => w.yomi.startsWith(typedHira))) {
    typingBuffer = "";
    e.target.value = "";
    document.getElementById('typing-area').textContent = "";
  }
});
document.getElementById('typing-area').addEventListener('click',()=>{
  if (running) document.getElementById('hidden-input').focus();
});

function renderSushi() {
  const area = document.getElementById("sushi-area");
  area.innerHTML = "";
  sushiList.forEach(sushi => {
    const div = document.createElement("div");
    div.className = "sushi";
    div.textContent = sushi.word.display;
    div.style.left = sushi.left + "%";
    area.appendChild(div);
  });
}

document.getElementById("start-btn").onclick = startGame;

// --- ランキング ---
function saveRanking(newScore, diff) {
  if (newScore === 0) return;
  let records = [];
  try {
    records = JSON.parse(localStorage.getItem("sushi-ranking") || "[]");
  } catch {}
  let name = prompt("ランキング用ニックネームを入力してください！", "名無し");
  if (!name) name = "名無し";
  const newRec = {
    name,
    score: newScore,
    diff,
    date: new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
  };
  records.push(newRec);
  records = records.sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem("sushi-ranking", JSON.stringify(records));
}

function showRanking() {
  let records = [];
  try {
    records = JSON.parse(localStorage.getItem("sushi-ranking") || "[]");
  } catch {}
  let html = "<b>ランキング</b><br><table><tr><th>順位</th><th>名前</th><th>スコア</th><th>難易度</th><th>日時</th></tr>";
  records.forEach((rec, i) => {
    html += `<tr${i==0?" style='font-weight:bold;color:#b71c1c'":""}><td>${i+1}</td><td>${rec.name}</td><td>${rec.score}</td><td>${rec.diff}</td><td>${rec.date}</td></tr>`;
  });
  html += "</table>";
  document.getElementById("ranking").innerHTML = html;
}
showRanking();
