const loginScreen = document.getElementById('login-screen');
const gameContainer = document.getElementById('game-container');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const currentUserDisplay = document.getElementById('current-user');

const wordSlotsContainer = document.getElementById('word-slots-container');
const currentWordDisplay = document.getElementById('current-word-display');
const lettersWheel = document.getElementById('letters-wheel');
const canvas = document.getElementById('swipe-canvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const coinsDisplay = document.getElementById('coins');
const levelNumDisplay = document.getElementById('level-num');
const endScreen = document.getElementById('end-screen');

const hintBtn = document.getElementById('hint-btn');
const logoutBtn = document.getElementById('logout-btn');
const resetGameBtn = document.getElementById('reset-game-btn');

let currentUser = null;
let currentLevel = 1;
let score = 0;
let coins = 150;
let activeLevelConfig = null;

let letterElements = [];
let selectedLetters = [];
let isSwiping = false;
let currentGuess = "";
let foundWords = [];

// --- ENGIN AUDIO (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playAudio(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === 'tap') {
        osc.frequency.setValueAtTime(350 + (selectedLetters.length * 60), audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'win') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'coin') {
        osc.frequency.setValueAtTime(987.77, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'fail') {
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    }
}

// --- LOGIQUE LOGIN & SAVE ---
loginBtn.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!user || !pass) {
        loginError.innerText = "Veuillez remplir tous les champs.";
        return;
    }

    let existingProfile = PlayerStorage.get(user);

    if (existingProfile) {
        if (existingProfile.password !== pass) {
            loginError.innerText = "Mot de passe incorrect.";
            playAudio('fail');
            return;
        }
        currentUser = user;
        currentLevel = existingProfile.level;
        score = existingProfile.score;
        coins = existingProfile.coins;
    } else {
        currentUser = user;
        currentLevel = 1;
        score = 0;
        coins = 150;
        PlayerStorage.save(currentUser, pass, currentLevel, score, coins);
    }

    loginScreen.classList.remove('active');
    gameContainer.classList.remove('hidden');
    currentUserDisplay.innerText = currentUser;
    
    scoreDisplay.innerText = score;
    coinsDisplay.innerText = coins;
    
    loadLevel();
});

function syncData() {
    if (!currentUser) return;
    const pass = passwordInput.value.trim();
    PlayerStorage.save(currentUser, pass, currentLevel, score, coins);
}

logoutBtn.addEventListener('click', () => {
    syncData();
    currentUser = null;
    usernameInput.value = "";
    passwordInput.value = "";
    loginError.innerText = "";
    gameContainer.classList.add('hidden');
    loginScreen.classList.add('active');
});

// --- RENDER JEU ---
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

function loadLevel() {
    wordSlotsContainer.innerHTML = '';
    lettersWheel.innerHTML = '';
    selectedLetters = [];
    currentGuess = "";
    currentWordDisplay.innerText = "";
    foundWords = [];
    resizeCanvas();

    if (currentLevel > 3000) {
        endScreen.classList.add('active');
        return;
    }

    activeLevelConfig = generateLevelConfig(currentLevel);
    levelNumDisplay.innerText = currentLevel;

    activeLevelConfig.words.forEach((word, rowIndex) => {
        const row = document.createElement('div');
        row.classList.add('word-row');
        row.dataset.word = word;

        for (let i = 0; i < word.length; i++) {
            const box = document.createElement('div');
            box.classList.add('letter-box');
            if (activeLevelConfig.star.row === rowIndex && activeLevelConfig.star.col === i) {
                box.classList.add('has-star');
            }
            row.appendChild(box);
        }
        wordSlotsContainer.appendChild(row);
    });

    letterElements = [];
    const num = activeLevelConfig.letters.length;
    const radius = 65;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    activeLevelConfig.letters.forEach((letter, i) => {
        const angle = (i / num) * Math.PI * 2 - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);

        const el = document.createElement('div');
        el.classList.add('wheel-letter');
        el.innerText = letter;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        lettersWheel.appendChild(el);

        letterElements.push({ letter, x, y, el });
    });
}

// --- TOUCH & SWIPE MANAGEMENT ---
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function detectCollision(pos) {
    letterElements.forEach(item => {
        const distance = Math.hypot(item.x - pos.x, item.y - pos.y);
        if (distance < 28 && !selectedLetters.includes(item)) {
            selectedLetters.push(item);
            item.el.classList.add('active');
            currentGuess += item.letter;
            currentWordDisplay.innerText = currentGuess;
            playAudio('tap');
        }
    });
}

function renderSwipeLines(currentPos) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (selectedLetters.length === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = '#cca43b'; 
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(selectedLetters[0].x, selectedLetters[0].y);
    for (let i = 1; i < selectedLetters.length; i++) {
        ctx.lineTo(selectedLetters[i].x, selectedLetters[i].y);
    }

    if (currentPos && isSwiping) {
        ctx.lineTo(currentPos.x, currentPos.y);
    }
    ctx.stroke();
}

canvas.addEventListener('mousedown', (e) => { isSwiping = true; const p = getCoordinates(e); detectCollision(p); renderSwipeLines(p); });
window.addEventListener('mousemove', (e) => { if (!isSwiping) return; const p = getCoordinates(e); detectCollision(p); renderSwipeLines(p); });
window.addEventListener('mouseup', processGuess);

canvas.addEventListener('touchstart', (e) => { isSwiping = true; const p = getCoordinates(e); detectCollision(p); renderSwipeLines(p); }, {passive:false});
window.addEventListener('touchmove', (e) => { if (!isSwiping) return; const p = getCoordinates(e); detectCollision(p); renderSwipeLines(p); e.preventDefault(); }, {passive:false});
window.addEventListener('touchend', processGuess);

function processGuess() {
    if (!isSwiping) return;
    isSwiping = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeLevelConfig && activeLevelConfig.words.includes(currentGuess) && !foundWords.includes(currentGuess)) {
        foundWords.push(currentGuess);
        playAudio('win');

        document.querySelectorAll('.word-row').forEach(row => {
            if (row.dataset.word === currentGuess) {
                row.querySelectorAll('.letter-box').forEach((box, i) => {
                    if (!box.classList.contains('revealed')) {
                        box.innerText = currentGuess[i];
                        box.classList.add('revealed');
                        if (box.classList.contains('has-star')) {
                            coins += 25; coinsDisplay.innerText = coins;
                            playAudio('coin');
                        }
                    }
                });
            }
        });

        score += currentGuess.length * 10;
        scoreDisplay.innerText = score;
        syncData();
        checkLevelCompletion();
    } else {
        if (currentGuess.length > 0) playAudio('fail');
    }

    letterElements.forEach(item => item.el.classList.remove('active'));
    selectedLetters = [];
    currentGuess = "";
    currentWordDisplay.innerText = "";
}

function checkLevelCompletion() {
if (foundWords.length === activeLevelConfig.words.length) {
setTimeout(() => {
currentLevel++;
syncData();
loadLevel();
}, 1000);
}
}
// --- BOUTON HINT ---
hintBtn.addEventListener('click', () => {
if (coins >= 50) {
const rows = document.querySelectorAll('.word-row');
for (let row of rows) {
const boxes = row.querySelectorAll('.letter-box:not(.revealed)');
if (boxes.length > 0) {
coins -= 50; coinsDisplay.innerText = coins;
playAudio('coin');
const word = row.dataset.word;
const indexToReveal = word.length - boxes.length;
const targetBox = row.children[indexToReveal];
targetBox.innerText = word[indexToReveal];
targetBox.classList.add('revealed');
if (targetBox.classList.contains('has-star')) {
coins += 25; coinsDisplay.innerText = coins;
playAudio('coin');
}
syncData();
const allDone = Array.from(row.children).every(b => b.classList.contains('revealed'));
if (allDone && !foundWords.includes(word)) {
foundWords.push(word);
checkLevelCompletion();
}
break;
}
}
} else {
playAudio('fail');
alert("Coins insuffisants !");
}
});
resetGameBtn.addEventListener('click', () => {
score = 0; currentLevel = 1; coins = 150;
scoreDisplay.innerText = score; coinsDisplay.innerText = coins;
endScreen.classList.remove('active');
syncData();
loadLevel();
});
window.onresize = resizeCanvas;