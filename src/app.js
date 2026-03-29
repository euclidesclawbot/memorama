import { defaultPairs } from './data.js';

const boardEl = document.getElementById('board');
const boardSizeEl = document.getElementById('boardSize');
const newGameBtn = document.getElementById('newGameBtn');
const pairsLabel = document.getElementById('pairsLabel');
const movesLabel = document.getElementById('movesLabel');
const statusLabel = document.getElementById('statusLabel');
const customDataEl = document.getElementById('customData');
const loadCustomBtn = document.getElementById('loadCustomBtn');
const resetDefaultBtn = document.getElementById('resetDefaultBtn');

let sourcePairs = [...defaultPairs];
let deck = [];
let flipped = [];
let moves = 0;
let matchedCount = 0;
let lockBoard = false;

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

function updateStats() {
  pairsLabel.textContent = `Pares: ${matchedCount}/${deck.length / 2}`;
  movesLabel.textContent = `Movimientos: ${moves}`;
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

function onCardClick(index) {
  if (lockBoard) return;
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
    if (matchedCount === deck.length / 2) statusLabel.textContent = 'Estado: ¡Ganaste! 🎉';
    return;
  }

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
  const size = Number(boardSizeEl.value);
  const totalCards = size * size;
  const pairsNeeded = totalCards / 2;

  deck = buildDeck(pairsNeeded);
  flipped = [];
  moves = 0;
  matchedCount = 0;
  lockBoard = false;
  statusLabel.textContent = 'Estado: jugando';
  updateStats();
  renderBoard();
}

function loadCustomData() {
  try {
    const parsed = JSON.parse(customDataEl.value || '[]');
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
  customDataEl.value = '';
  statusLabel.textContent = 'Estado: contenido por defecto';
  startGame();
}

newGameBtn.addEventListener('click', startGame);
loadCustomBtn.addEventListener('click', loadCustomData);
resetDefaultBtn.addEventListener('click', resetDefault);
boardSizeEl.addEventListener('change', startGame);

customDataEl.value = JSON.stringify(defaultPairs, null, 2);
startGame();
