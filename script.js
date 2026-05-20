const h = document.getElementById("h");
const m = document.getElementById("m");
const s = document.getElementById("s");
const progress = document.getElementById("progress");
const alarm = document.getElementById("alarmSound");
const controls = document.getElementById("controls");
const soundBtn = document.getElementById("soundBtn");

const RADIUS = 100;
const CIRC = 2 * Math.PI * RADIUS;

progress.style.strokeDasharray = CIRC;
progress.style.strokeDashoffset = 0;

let interval = null;
let running = false;
let soundOn = true;

let lastSetTime = 0;
let initialTime = 0;
let remainingTime = 0;

const pad = v => String(v).padStart(2, "0");

function clampInputs() {
  h.value = h.value.replace(/\D/g, "").slice(0, 2);
  m.value = m.value.replace(/\D/g, "").slice(0, 2);
  s.value = s.value.replace(/\D/g, "").slice(0, 2);

  if (+m.value > 59) m.value = "59";
  if (+s.value > 59) s.value = "59";
}

function formatInputs() {
  h.value = pad(Number(h.value) || 0);
  m.value = pad(Number(m.value) || 0);
  s.value = pad(Number(s.value) || 0);
}

[h, m, s].forEach(i => {
  i.addEventListener("input", e => {
    clampInputs();
    onUserEdit();
  });
  i.addEventListener("blur", formatInputs);
});

handleScrollChange(h, 0, 99);
handleScrollChange(m, 0, 59);
handleScrollChange(s, 0, 59);

function readInput() {
  formatInputs();
  return (
    (Number(h.value) || 0) * 3600 +
    (Number(m.value) || 0) * 60 +
    (Number(s.value) || 0)
  );
}

function writeTime(sec) {
  h.value = pad(Math.floor(sec / 3600));
  m.value = pad(Math.floor((sec % 3600) / 60));
  s.value = pad(sec % 60);
  document.title = `${h.value}:${m.value}:${s.value}`;
}

function onUserEdit() {
  if (!running) {
    initialTime = 0;
    remainingTime = 0;
  }
}

function handleScrollChange(input, min, max) {
  input.addEventListener("wheel", e => {
    if (running) return;
    e.preventDefault();

    let value = Number(input.value) || 0;

    if (e.deltaY < 0) value++;
    if (e.deltaY > 0) value--;

    value = Math.max(min, Math.min(max, value));
    input.value = pad(value);

    onUserEdit();
  });
}


function updateCircle() {
  if (initialTime === 0) return;
  progress.style.strokeDashoffset =
    CIRC - (remainingTime / initialTime) * CIRC;
}

function tick() {
  remainingTime--;
  writeTime(remainingTime);
  updateCircle();

  if (remainingTime <= 0) {
    stopInterval();

    remainingTime = 0;
    initialTime = 0;

    writeTime(0);
    progress.style.strokeDashoffset = CIRC;

    if (soundOn) {
      alarm.currentTime = 0;
      alarm.play();
    }

    renderBigReset();
  }
}

function startTimer() {
  if (running) return;

  if (initialTime === 0) {
    const input = readInput();
    if (input <= 0) return;

    initialTime = input;
    remainingTime = input;
    lastSetTime = input;
  }

  running = true;
  interval = setInterval(tick, 1000);
  renderSmallControls(false);
}

function stopInterval() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  running = false;
}

function stopTimer() {
  stopInterval();
  renderSmallControls(true);
}

function resetTimer() {
  stopInterval();

  alarm.pause();
  alarm.currentTime = 0;

  if (lastSetTime > 0) {
    initialTime = lastSetTime;
    remainingTime = lastSetTime;

    writeTime(remainingTime);
    progress.style.strokeDashoffset = 0;
  }

  renderBigStart();
}

function renderBigStart() {
  controls.innerHTML =
    `<button class="main-btn" id="startBtn">START</button>`;
  document.getElementById("startBtn").onclick = startTimer;
}

function renderBigReset() {
  controls.innerHTML =
    `<button class="main-btn" id="resetBtn">RESET</button>`;
  document.getElementById("resetBtn").onclick = resetTimer;
}

function renderSmallControls(paused) {
  controls.innerHTML = `
    <button class="small-btn" id="toggleBtn">
      ${paused ? "START" : "STOP"}
    </button>
    <button class="small-btn" id="resetBtn">RESET</button>
  `;

  document.getElementById("toggleBtn").onclick =
    paused ? startTimer : stopTimer;

  document.getElementById("resetBtn").onclick = resetTimer;
}

const soundIcon = soundBtn.querySelector("i");

soundBtn.onclick = () => {
  soundOn = !soundOn;

  soundIcon.classList.toggle("fa-volume-high", soundOn);
  soundIcon.classList.toggle("fa-volume-xmark", !soundOn);

  if (!soundOn) {
    alarm.pause();
    alarm.currentTime = 0;
  }
};

writeTime(0);
renderBigStart();
