import { defaultPairs } from './data.js';

const boardEl = document.getElementById('board');
const boardSizeEl = document.getElementById('boardSize');
const gameModeEl = document.getElementById('gameMode');
const timeLimitEl = document.getElementById('timeLimit');
const newGameBtn = document.getElementById('newGameBtn');
const themeBtn = document.getElementById('themeBtn');
const pairsLabel = document.getElementById('pairsLabel');
const movesLabel = document.getElementById('movesLabel');
const timeLabel = document.getElementById('timeLabel');
const statusLabel = document.getElementById('statusLabel');
const timeoutOverlayEl = document.getElementById('timeoutOverlay');
const retryBtn = document.getElementById('retryBtn');
const customDataEl = document.getElementById('customData');
const loadCustomBtn = document.getElementById('loadCustomBtn');
const resetDefaultBtn = document.getElementById('resetDefaultBtn');

let sourcePairs = [...defaultPairs];
let deck = [];
let flipped = [];
let moves = 0;
let matchedCount = 0;
let lockBoard = false;

let timer = null;
let remainingSec = 0;
let gameFinished = false;

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark', dark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (themeBtn) themeBtn.textContent = dark ? '☀️ Light' : '🌙 Dark';
  localStorage.setItem('memorama-theme', dark ? 'dark' : 'light');
}

function toggleTheme() {
  const current = localStorage.getItem('memorama-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(pairsNeeded) {
  if (sourcePairs.length < pairsNeeded) {
    throw new Error(`No hay suficientes pares. Necesitas ${pairsNeeded} y solo hay ${sourcePairs.length}.`);
  }
  const selected = shuffle(sourcePairs).slice(0, pairsNeeded);
  const cards = selected.flatMap((p, idx) => [
    { id: `p-${idx}`, pairId: idx, kind: 'person', text: p.person, image: p.image },
    { id: `c-${idx}`, pairId: idx, kind: 'contribution', text: p.contribution, image: null }
  ]);
  return shuffle(cards);
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateStats() {
  pairsLabel.textContent = `Pares: ${matchedCount}/${deck.length / 2}`;
  movesLabel.textContent = `Movimientos: ${moves}`;

  if (gameModeEl.value === 'quiz') {
    timeLabel.textContent = `Tiempo: ${fmtTime(remainingSec)}`;
    timeLabel.classList.toggle('low', remainingSec <= 20);
  } else {
    timeLabel.textContent = 'Tiempo: --';
    timeLabel.classList.remove('low');
  }
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function startTimer() {
  stopTimer();
  if (gameModeEl.value !== 'quiz') return;

  remainingSec = Math.max(30, Number(timeLimitEl.value || 120));
  updateStats();
  timer = setInterval(() => {
    if (gameFinished) return;
    remainingSec -= 1;
    updateStats();
    if (remainingSec <= 0) {
      stopTimer();
      gameFinished = true;
      lockBoard = true;
      statusLabel.textContent = 'Estado: se acabó el tiempo ⏰';
    }
  }, 1000);
}

function createCardEl(card, idx) {
  const btn = document.createElement('button');
  btn.className = 'card hidden';
  btn.dataset.index = String(idx);

  const content = document.createElement('div');
  if (card.kind === 'person' && card.image) {
    const img = document.createElement('img');
    img.src = card.image;
    img.alt = card.text;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      img.remove();
    };
    content.appendChild(img);
  }
  const txt = document.createElement('div');
  txt.textContent = card.text;
  content.appendChild(txt);

  btn.appendChild(content);
  btn.addEventListener('click', () => onCardClick(idx));
  return btn;
}

function renderBoard() {
  const size = Number(boardSizeEl.value);
  boardEl.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  boardEl.innerHTML = '';
  deck.forEach((c, i) => boardEl.appendChild(createCardEl(c, i)));
}

function reveal(index) {
  const el = boardEl.children[index];
  el.classList.remove('hidden');
  el.classList.add('reveal');
  setTimeout(() => el.classList.remove('reveal'), 280);
}

function hide(index) {
  const el = boardEl.children[index];
  el.classList.add('hidden');
}

function setMatched(index) {
  const el = boardEl.children[index];
  el.classList.remove('hidden');
  el.classList.add('matched');
  el.disabled = true;
}

function shake(index) {
  const el = boardEl.children[index];
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 350);
}

function finishWin() {
  gameFinished = true;
  stopTimer();
  const suffix = gameModeEl.value === 'quiz' ? ` (${fmtTime(remainingSec)} restantes)` : '';
  statusLabel.textContent = `Estado: ¡Ganaste! 🎉${suffix}`;
}

function onCardClick(index) {
  if (lockBoard || gameFinished) return;
  if (flipped.includes(index)) return;
  if (boardEl.children[index].classList.contains('matched')) return;

  reveal(index);
  flipped.push(index);

  if (flipped.length < 2) return;

  moves += 1;
  const [a, b] = flipped;
  const ca = deck[a];
  const cb = deck[b];

  const isMatch = ca.pairId === cb.pairId && ca.kind !== cb.kind;

  if (isMatch) {
    setMatched(a);
    setMatched(b);
    matchedCount += 1;
    flipped = [];
    updateStats();
    if (matchedCount === deck.length / 2) finishWin();
    return;
  }

  shake(a);
  shake(b);
  lockBoard = true;
  setTimeout(() => {
    hide(a);
    hide(b);
    flipped = [];
    lockBoard = false;
    updateStats();
  }, 900);
  updateStats();
}

function startGame() {
  if (timeoutOverlayEl) timeoutOverlayEl.classList.add('hidden');
  const size = Number(boardSizeEl.value);
  const totalCards = size * size;
  const pairsNeeded = totalCards / 2;

  deck = buildDeck(pairsNeeded);
  flipped = [];
  moves = 0;
  matchedCount = 0;
  lockBoard = false;
  gameFinished = false;
  statusLabel.textContent = gameModeEl.value === 'quiz' ? 'Estado: quiz en curso' : 'Estado: jugando';

  renderBoard();
  startTimer();
  updateStats();
}

function loadCustomData() {
  try {
    const raw = (customDataEl.value || '').trim();
    if (!raw) {
      resetDefault();
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('JSON inválido o vacío');

    const normalized = parsed.map((p) => ({
      person: String(p.person || '').trim(),
      contribution: String(p.contribution || '').trim(),
      image: p.image ? String(p.image).trim() : null
    }));

    const invalid = normalized.find((p) => !p.person || !p.contribution);
    if (invalid) throw new Error('Cada item debe tener person y contribution');

    sourcePairs = normalized;
    statusLabel.textContent = 'Estado: contenido personalizado cargado';
    startGame();
  } catch (err) {
    statusLabel.textContent = `Estado: error - ${err.message}`;
  }
}

function resetDefault() {
  sourcePairs = [...defaultPairs];
  customDataEl.value = JSON.stringify(defaultPairs, null, 2);
  statusLabel.textContent = 'Estado: contenido por defecto';
  startGame();
}

newGameBtn.addEventListener('click', startGame);
loadCustomBtn.addEventListener('click', loadCustomData);
resetDefaultBtn.addEventListener('click', resetDefault);
boardSizeEl.addEventListener('change', startGame);
gameModeEl.addEventListener('change', startGame);
timeLimitEl.addEventListener('change', startGame);
if (themeBtn) {
  themeBtn.addEventListener('click', toggleTheme);
  themeBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    toggleTheme();
  }, { passive: false });
}
if (retryBtn) retryBtn.addEventListener('click', startGame);

const savedTheme = localStorage.getItem('memorama-theme');
applyTheme(savedTheme || 'light');
if (!customDataEl.value || !customDataEl.value.trim()) {
  customDataEl.value = JSON.stringify(defaultPairs, null, 2);
}
// Garantiza que siempre exista data por defecto visible y jugable al inicio.
if (!sourcePairs?.length) sourcePairs = [...defaultPairs];
startGame();
