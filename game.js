const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const keys = new Set();
const roomPlatforms = [
  [{x:0,y:485,w:960,h:55},{x:205,y:402,w:170,h:18},{x:438,y:330,w:170,h:18},{x:682,y:265,w:165,h:18},{x:35,y:195,w:125,h:18}],
  [{x:0,y:485,w:960,h:55},{x:185,y:405,w:150,h:18,crumble:true,standTime:0,hidden:0},{x:415,y:345,w:150,h:18},{x:650,y:405,w:150,h:18,moving:true,direction:1},{x:150,y:260,w:125,h:18}],
  [{x:0,y:485,w:960,h:55},{x:180,y:405,w:150,h:18},{x:390,y:330,w:150,h:18},{x:610,y:255,w:150,h:18},{x:800,y:185,w:140,h:18},{x:315,y:445,w:95,h:18,lift:true,direction:-1}],
  [{x:0,y:485,w:960,h:55},{x:210,y:370,w:120,h:18},{x:630,y:370,w:120,h:18}],
  [{x:0,y:485,w:960,h:55},{x:170,y:405,w:150,h:18},{x:390,y:335,w:150,h:18},{x:610,y:265,w:150,h:18},{x:800,y:205,w:140,h:18}]
];
let room = 0, coreCollected = false, reactorPowered = false, bossDefeated = false, bossActive = false, bossIntroTimer = 0, bossVictoryTimer = 0, interactQueued = false;
const boss = {x: 650, y: 409, w: 70, h: 76, health: 10, maxHealth: 10, state: 'idle', timer: 90, direction: -1, flash: 0, musicTick: 0, nextAttack: 'charge', phase: 1};
const bossShot = {x: 0, y: 0, w: 24, h: 24, direction: 1, active: false};
function resetBoss() { Object.assign(boss, {x: 650, y: 409, health: boss.maxHealth, state: 'idle', timer: 90, direction: -1, flash: 0, musicTick: 0, nextAttack: 'charge', phase: 1}); bossActive = room === 3; bossIntroTimer = bossActive ? 120 : 0; bossVictoryTimer = 0; bossShot.active = false; }
const door = {x: 900, y: 405, w: 60, h: 80};
const exitDoor = {x: 0, y: 405, w: 60, h: 80};
const goal = {x: 845, y: 440, w: 36, h: 45};
const elevatorGoal = {x: 855, y: 145, w: 34, h: 40};
const arenaExit = {x: 880, y: 405, w: 60, h: 80};
const greenhouseGoal = {x: 865, y: 165, w: 30, h: 40};
const thorns = {x: 355, y: 455, w: 65, h: 30, cycle: 0};
const rollingGear = {x: 480, y: 445, w: 40, h: 40, direction: 1, angle: 0};
const weakWall = {x: 800, y: 425, w: 25, h: 60, broken: false, flash: 0};
const piston = {x: 720, y: 180, w: 40, h: 75, cycle: 0};
const controlSwitch = {x: 475, y: 308, w: 30, h: 37, active: false};
const jumpUpgrade = {x: 540, y: 315, w: 24, h: 30};
let doubleJumpUnlocked = false, doubleJumpUsed = false;
const spring = {x: 115, y: 468, w: 40, h: 17, flash: 0};
const supply = {x: 200, y: 235, w: 22, h: 25, available: true};
const steamCanister = {x: 260, y: 380, w: 20, h: 25, available: true};
const crates = [
  {x: 260, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: 770, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: 300, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false},
  {x: 290, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false}
];
function resetCrates() { for (const crate of crates) { crate.health = 2; crate.flash = 0; crate.dropped = false; } }
function resetRoomCrate() { const crate = crates[room]; crate.health = 2; crate.flash = 0; crate.dropped = false; }
const logs = [
  {x: 130, y: 450, w: 28, h: 35, text: '鍋爐日誌：動力核心熄滅後，城裡的鐘就停了。'},
  {x: 705, y: 450, w: 28, h: 35, text: '控制室紀錄：守衛仍在巡邏，卻已無人記得它在守護什麼。'},
  {x: 120, y: 450, w: 28, h: 35, text: '升降機紀錄：通往地表的升降機停在井頂，等待重新啟動。'},
  null,
  {x: 120, y: 450, w: 28, h: 35, text: '溫室日誌：蒸汽停歇之後，種子仍在破碎的玻璃下等待陽光。'}
];
const secretLog = {x: 45, y: 160, w: 28, h: 35, text: '修復者手記：我們把城市的記憶藏進齒輪，希望有一天能再相見。'};
const shaftLog = {x: 620, y: 220, w: 28, h: 35, text: '維修紀錄：升降機的鋼纜仍然堅固，地表的光就在上方。'};
const bossLog = {text: '守衛記憶：最後一班升降機離開後，我仍履行著等待的命令。'};
let logMessage = '', logTimer = 0, mapOpen = false, journalOpen = false, helpOpen = false, paused = false;
const allLogs = [logs[0], logs[1], secretLog, logs[2], shaftLog, bossLog, logs[4]];
const memoryGears = [
  {room: 0, x: 300, y: 375, w: 22, h: 22, collected: false},
  {room: 0, x: 790, y: 238, w: 22, h: 22, collected: false},
  {room: 1, x: 245, y: 233, w: 22, h: 22, collected: false},
  {room: 0, x: 85, y: 168, w: 22, h: 22, collected: false},
  {room: 2, x: 680, y: 228, w: 22, h: 22, collected: false},
  {room: 2, x: 865, y: 458, w: 22, h: 22, collected: false},
  {room: 2, x: 815, y: 158, w: 22, h: 22, collected: false},
  {room: 4, x: 680, y: 238, w: 22, h: 22, collected: false}
];
const player = {x:90,y:420,w:30,h:42,vx:0,vy:0,grounded:false,facing:1};
const target = {x: 790, y: 432, w: 38, h: 53, flash: 0, hits: 0};
const enemy = {x: 500, y: 451, w: 34, h: 34, direction: 1, health: 3, flash: 0, stun: 0, state: 'patrol', timer: 0, cooldown: 0};
const drone = {x: 470, y: 270, w: 32, h: 24, direction: 1, health: 2, flash: 0, phase: 0, shotTimer: 120};
const steamShot = {x: 0, y: 0, w: 10, h: 14, active: false};
const flowerShot = {x: 0, y: 0, w: 14, h: 14, direction: 1, active: false};
let flowerCooldown = 120, flowerWarning = 0, flowerDirection = 1;
function resetMovingPlatform() {
  const platform = roomPlatforms[1].find(item => item.moving); platform.x = 650; platform.direction = 1;
  const fragile = roomPlatforms[1].find(item => item.crumble); fragile.standTime = 0; fragile.hidden = 0;
  const lift = roomPlatforms[2].find(item => item.lift); lift.y = 445; lift.direction = -1;
  Object.assign(rollingGear, {x: 480, direction: 1, angle: 0}); weakWall.broken = false; weakWall.flash = 0; piston.cycle = 0; thorns.cycle = 0; steamCanister.available = true;
}
function resetDrone() { Object.assign(drone, {x: room === 2 ? 700 : 470, y: room === 2 ? 170 : 270, direction: 1, health: 2, flash: 0, phase: 0, shotTimer: 120}); steamShot.active = false; }
const core = {x: 757, y: 225, w: 26, h: 40};
const checkpoint = {x: 507, y: 284, w: 32, h: 46, activated: false};
const elevatorCheckpoint = {x: 455, y: 284, w: 32, h: 46, activated: false};
const greenhouseCheckpoint = {x: 445, y: 289, w: 32, h: 46, activated: false};
let activeCheckpoint = null;
function checkpointSpawn() {
  if (activeCheckpoint === 'greenhouse' && greenhouseCheckpoint.activated) return {room: 4, point: greenhouseCheckpoint};
  if (activeCheckpoint === 'elevator' && elevatorCheckpoint.activated) return {room: 2, point: elevatorCheckpoint};
  if (activeCheckpoint === 'boiler' && checkpoint.activated) return {room: 0, point: checkpoint};
  if (greenhouseCheckpoint.activated) return {room: 4, point: greenhouseCheckpoint};
  if (elevatorCheckpoint.activated) return {room: 2, point: elevatorCheckpoint};
  if (checkpoint.activated) return {room: 0, point: checkpoint};
  return {room: 0, point: {x: 90, y: 420}};
}
const repair = {x: 0, y: 465, w: 20, h: 20, available: false};
const vent = {x: 350, y: 485, w: 40, h: 72, cycle: 0};
const sideVent = {x: 745, y: 365, w: 140, h: 30, cycle: 0};
let health = 3, steam = 0, healQueued = false, invulnerability = 0, gameOver = false, won = false;
let ambientTime = 0, endingTime = 0, roomTitleTimer = 180, saveFeedbackTimer = 0, shakeTimer = 0;
const sparks = [];
let dashQueued = false, dashTimer = 0, dashCooldown = 0, dashFacing = 1;
let jumpQueued = false, jumpBuffer = 0, coyoteTime = 0, variableJump = false, attackQueued = false, attackTimer = 0, attackCooldown = 0, attackFacing = 1, attackDown = false, attackUp = false;
const saveKey = 'steam-city-progress-v1';
let storageAvailable = true;
let audioContext = null, muted = false;
try { muted = localStorage.getItem('steam-city-sound') === 'off'; } catch (error) { /* Use sound by default. */ }
const soundButton = document.querySelector('#sound-toggle');
const shakeButton = document.querySelector('#shake-toggle');
let shakeEnabled = true;
try { shakeEnabled = localStorage.getItem('steam-city-shake') !== 'off'; } catch (error) { /* Keep the default if storage is unavailable. */ }
function updateShakeButton() { shakeButton.textContent = shakeEnabled ? '震動：開啟' : '震動：關閉'; shakeButton.setAttribute('aria-pressed', String(shakeEnabled)); }
updateShakeButton();
shakeButton.addEventListener('click', () => {
  shakeEnabled = !shakeEnabled; updateShakeButton();
  try { localStorage.setItem('steam-city-shake', shakeEnabled ? 'on' : 'off'); } catch (error) { /* The setting remains active for this session. */ }
});
const restartButton = document.querySelector('#restart-button');
const pauseButton = document.querySelector('#pause-button');
const fullscreenButton = document.querySelector('#fullscreen-button');
const helpButton = document.querySelector('#help-button');
function playSound(frequency, duration, type = 'square', endFrequency = frequency) {
  if (muted) return;
  try {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    if (!audioContext) audioContext = new AudioEngine();
    if (audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(now); oscillator.stop(now + duration);
  } catch (error) { /* Audio is optional; gameplay remains available. */ }
}
function unlockAudio() {
  try {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine || muted) return;
    if (!audioContext) audioContext = new AudioEngine();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch (error) { /* Browsers may block audio. */ }
}
function updateSoundButton() {
  soundButton.textContent = muted ? '聲音：關閉' : '聲音：開啟';
  soundButton.setAttribute('aria-pressed', String(!muted));
}
updateSoundButton();
soundButton.addEventListener('click', () => {
  muted = !muted; updateSoundButton();
  try { localStorage.setItem('steam-city-sound', muted ? 'off' : 'on'); } catch (error) { /* Keep the choice for this session. */ }
  if (!muted) unlockAudio();
});
const controls = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','KeyR','KeyE','KeyQ','KeyJ','KeyM','KeyH','Tab','Escape','ShiftLeft','ShiftRight'];
window.addEventListener('keydown', e => {
  unlockAudio();
  if (controls.includes(e.code)) e.preventDefault();
  if (e.code === 'Escape') {
    if (!e.repeat && !gameOver && !won) {
      if (mapOpen) mapOpen = false;
      else if (journalOpen) journalOpen = false;
      else if (helpOpen) helpOpen = false;
      else { paused = !paused; pauseButton.textContent = paused ? '繼續' : '暫停'; }
      keys.clear(); jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false;
    }
    return;
  }
  if (e.code === 'KeyM') { if (!e.repeat) soundButton.click(); return; }
  if (e.code === 'KeyH') {
    if (!e.repeat && !gameOver && !won) {
      helpOpen = !helpOpen; mapOpen = false; journalOpen = false; keys.clear();
      jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false;
    }
    return;
  }
  if (paused || helpOpen) return;
  if (e.code === 'KeyJ') {
    if (!e.repeat && !gameOver && !won) {
      journalOpen = !journalOpen; mapOpen = false; keys.clear(); jumpQueued = false; jumpBuffer = 0;
      attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false;
    }
    return;
  }
  if (journalOpen) return;
  if (e.code === 'Tab') {
    if (!e.repeat && !gameOver && !won) {
      mapOpen = !mapOpen; keys.clear(); jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false;
    }
    return;
  }
  if (mapOpen) return;
  if (!e.repeat && e.code === 'KeyE') interactQueued = true;
  if (!e.repeat && e.code === 'KeyQ') healQueued = true;
  if (!e.repeat && e.code === 'KeyR' && (gameOver || won)) resetGame();
  if (!e.repeat && (e.code === 'ShiftLeft' || e.code === 'ShiftRight')) dashQueued = true;
  if (!e.repeat && ['Space','ArrowUp','KeyW'].includes(e.code)) jumpQueued = true;
  keys.add(e.code);
});
canvas.addEventListener('mousedown', e => {
  unlockAudio();
  if (e.button === 0 && !mapOpen && !journalOpen && !helpOpen && !paused) attackQueued = true;
});
window.addEventListener('keyup', e => {
  keys.delete(e.code);
  if (!paused && !mapOpen && !journalOpen && !helpOpen && variableJump && ['Space', 'ArrowUp', 'KeyW'].includes(e.code)
      && !['Space', 'ArrowUp', 'KeyW'].some(code => keys.has(code))) {
    if (player.vy < -5) player.vy = -5;
    variableJump = false;
  }
});
window.addEventListener('blur', () => { if (!gameOver && !won && !mapOpen && !journalOpen && !helpOpen) { paused = true; pauseButton.textContent = '繼續'; } keys.clear(); jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; });
function saveProgress() {
  try {
    localStorage.setItem(saveKey, JSON.stringify({checkpoint: checkpoint.activated, elevatorCheckpoint: elevatorCheckpoint.activated, greenhouseCheckpoint: greenhouseCheckpoint.activated, activeCheckpoint, core: coreCollected, reactor: reactorPowered, bossDefeated, doubleJump: doubleJumpUnlocked, gears: memoryGears.map(gear => gear.collected), logs: allLogs.map(log => log.read === true)}));
    storageAvailable = true; saveFeedbackTimer = 120;
  } catch (error) { storageAvailable = false; }
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    checkpoint.activated = saved.checkpoint === true;
    elevatorCheckpoint.activated = saved.elevatorCheckpoint === true;
    greenhouseCheckpoint.activated = saved.greenhouseCheckpoint === true;
    activeCheckpoint = ['boiler', 'elevator', 'greenhouse'].includes(saved.activeCheckpoint) ? saved.activeCheckpoint : null;
    coreCollected = saved.core === true;
    reactorPowered = saved.reactor === true;
    bossDefeated = saved.bossDefeated === true;
    doubleJumpUnlocked = saved.doubleJump === true;
    if (Array.isArray(saved.gears)) memoryGears.forEach((gear, i) => { gear.collected = saved.gears[i] === true; });
    if (Array.isArray(saved.logs)) allLogs.forEach((log, i) => { log.read = saved.logs[i] === true; });
    if (bossDefeated) bossLog.read = true;
    const savedSpawn = checkpointSpawn();
    room = savedSpawn.room; player.x = savedSpawn.point.x; player.y = savedSpawn.point.y;
    if (room === 2) resetDrone();
  } catch (error) { storageAvailable = false; }
}
function resetGame() {
  if (won) { checkpoint.activated = false; elevatorCheckpoint.activated = false; greenhouseCheckpoint.activated = false; activeCheckpoint = null; coreCollected = false; reactorPowered = false; bossDefeated = false; doubleJumpUnlocked = false; memoryGears.forEach(gear => { gear.collected = false; }); allLogs.forEach(log => { log.read = false; }); saveProgress(); }
  sparks.length = 0; endingTime = 0; shakeTimer = 0; roomTitleTimer = 180; controlSwitch.active = false;
  const savedSpawn = checkpointSpawn();
  room = savedSpawn.room; interactQueued = false; logMessage = ''; logTimer = 0; mapOpen = false; journalOpen = false; helpOpen = false; paused = false; pauseButton.textContent = '暫停';
  const spawn = savedSpawn.point;
  Object.assign(player, {x: spawn.x, y: spawn.y, vx: 0, vy: 0, grounded: false, facing: 1});
  Object.assign(enemy, {x: 500, direction: 1, health: 3, flash: 0, stun: 0, state: 'patrol', timer: 0, cooldown: 0});
  resetDrone(); resetMovingPlatform(); resetBoss(); flowerShot.active = false; flowerCooldown = 120; flowerWarning = 0;
  repair.available = false; vent.cycle = 0; sideVent.cycle = 0; spring.flash = 0; supply.available = true; resetCrates();
  health = 3; steam = 0; doubleJumpUsed = false; healQueued = false; invulnerability = 0; gameOver = false; won = false; dashQueued = false; dashTimer = 0; dashCooldown = 0; attackTimer = 0; attackCooldown = 0; attackQueued = false; jumpQueued = false; jumpBuffer = 0; coyoteTime = 0; variableJump = false; keys.clear();
}
function changeRoom(nextRoom) {
  playSound(220, 0.18, 'triangle', 440);
  const previousRoom = room;
  room = nextRoom; roomTitleTimer = 180; shakeTimer = 0; logMessage = ''; logTimer = 0; sparks.length = 0; controlSwitch.active = false;
  const enteringFromLeft = nextRoom > previousRoom;
  const returningToShaft = previousRoom === 3 && nextRoom === 2;
  Object.assign(player, {x: returningToShaft ? 805 : enteringFromLeft ? 70 : 820, y: returningToShaft ? 143 : 443, vx: 0, vy: 0, grounded: true, facing: enteringFromLeft ? 1 : -1});
  Object.assign(enemy, {x: 500, direction: 1, health: 3, flash: 0, stun: 0, state: 'patrol', timer: 0, cooldown: 0});
  resetDrone(); resetMovingPlatform(); resetBoss(); flowerShot.active = false; flowerCooldown = 120; flowerWarning = 0;
  repair.available = false; vent.cycle = 0; sideVent.cycle = 0; spring.flash = 0; supply.available = true; resetRoomCrate(); dashTimer = 0; jumpBuffer = 0; coyoteTime = 0; variableJump = false; doubleJumpUsed = false; attackTimer = 0;
}
function sendControl(code, kind) {
  window.dispatchEvent(new KeyboardEvent(kind, {code, bubbles: true, cancelable: true}));
}
pauseButton.addEventListener('click', () => sendControl('Escape', 'keydown'));
helpButton.addEventListener('click', () => sendControl('KeyH', 'keydown'));
fullscreenButton.addEventListener('click', () => {
  const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  if (request && typeof request.catch === 'function') request.catch(() => {});
});
for (const button of document.querySelectorAll('.touch-controls button')) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    if (button.dataset.key) sendControl(button.dataset.key, 'keydown');
    else if (button.dataset.action === 'attack') canvas.dispatchEvent(new MouseEvent('mousedown', {button: 0}));
  });
  const release = event => {
    event.preventDefault();
    if (button.dataset.key) sendControl(button.dataset.key, 'keyup');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}
restartButton.addEventListener('click', () => {
  if (!window.confirm('確定重新開始嗎？已儲存的休息站、能力、齒輪與紀錄進度都會清除。')) return;
  checkpoint.activated = false; elevatorCheckpoint.activated = false; greenhouseCheckpoint.activated = false; activeCheckpoint = null; coreCollected = false; reactorPowered = false; bossDefeated = false; doubleJumpUnlocked = false;
  memoryGears.forEach(gear => { gear.collected = false; }); allLogs.forEach(log => { log.read = false; });
  won = false; resetGame(); saveProgress();
});
function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function addSparks(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    sparks.push({x, y, vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5 - 1, life: 16, color});
  }
}
function hurtPlayer(sourceX) {
  if (invulnerability > 0) return;
  shakeTimer = 9; addSparks(player.x + player.w / 2, player.y + player.h / 2, '#f3aa6c');
  health--; invulnerability = 75; dashTimer = 0; playSound(180, 0.2, 'sawtooth', 75);
  variableJump = false; player.vy = -6; player.vx = player.x + player.w / 2 < sourceX ? -5 : 5;
  if (health <= 0) gameOver = true;
}
function update() {
  if (gameOver || won || mapOpen || journalOpen || helpOpen || paused) return;
  if (healQueued && steam >= 3 && health < 3) { steam = 0; health++; addSparks(player.x + player.w / 2, player.y + player.h / 2, '#a6edc4'); playSound(400, 0.25, 'sine', 750); }
  healQueued = false;
  for (let i = sparks.length - 1; i >= 0; i--) {
    const spark = sparks[i]; spark.x += spark.vx; spark.y += spark.vy; spark.vy += .12;
    if (--spark.life <= 0) sparks.splice(i, 1);
  }
  if (bossIntroTimer > 0) bossIntroTimer--;
  if (bossVictoryTimer > 0) bossVictoryTimer--;
  if (shakeTimer > 0) shakeTimer--;
  if (roomTitleTimer > 0) roomTitleTimer--;
  if (saveFeedbackTimer > 0) saveFeedbackTimer--;
  if (logTimer > 0) logTimer--;
  if (invulnerability > 0) invulnerability--;
  vent.cycle = (vent.cycle + 1) % 180;
  if (room < 2 && vent.cycle === 100) playSound(180, .15, 'triangle', 240);
  if (room === 1) {
    sideVent.cycle = (sideVent.cycle + 1) % 240;
    if (sideVent.cycle === 110) playSound(180, .15, 'triangle', 240);
  }
  if (room === 1) {
    const fragile = roomPlatforms[1].find(item => item.crumble);
    if (fragile.hidden > 0) { fragile.hidden--; }
    else {
      const standing = player.grounded && Math.abs(player.y + player.h - fragile.y) < .01 && player.x + player.w > fragile.x && player.x < fragile.x + fragile.w;
      if (standing) fragile.standTime++;
      else fragile.standTime = 0;
      if (fragile.standTime >= 60) { fragile.hidden = 150; fragile.standTime = 0; player.grounded = false; }
    }
    const platform = roomPlatforms[1].find(item => item.moving);
    const riding = player.grounded && Math.abs(player.y + player.h - platform.y) < .01 && player.x + player.w > platform.x && player.x < platform.x + platform.w;
    const oldX = platform.x;
    platform.x += platform.direction * 1.1;
    if (platform.x >= 735 || platform.x <= 600) {
      platform.x = Math.max(600, Math.min(735, platform.x)); platform.direction *= -1;
    }
    if (riding) player.x = Math.max(0, Math.min(canvas.width - player.w, player.x + platform.x - oldX));
  }
  if (room === 3 && bossActive) {
    // A short synthesized loop follows the encounter and uses the shared sound toggle.
    const notes = [110, 165, 130.81, 196, 146.83, 220, 130.81, 174.61, 110, 165, 130.81, 196, 98, 146.83, 130.81, 164.81];
    if (boss.musicTick % 15 === 0) {
      const step = Math.floor(boss.musicTick / 15) % notes.length;
      const tone = notes[step] * (boss.phase === 2 ? 1.25 : 1);
      playSound(tone, .16, 'sawtooth', tone);
      if (step % 4 === 0) playSound(notes[step] / 2, .23, 'triangle', notes[step] / 2);
    }
    boss.musicTick++;
    if (boss.flash > 0) boss.flash--;
    if (boss.state === 'idle' && --boss.timer <= 0) {
      boss.state = 'warning'; boss.timer = boss.phase === 2 ? 42 : 55;
      boss.direction = player.x + player.w / 2 < boss.x + boss.w / 2 ? -1 : 1;
      playSound(170, .3, 'square', 260);
    } else if (boss.state === 'warning' && --boss.timer <= 0) {
      boss.state = boss.nextAttack; boss.timer = boss.state === 'charge' ? 34 : 18;
      if (boss.state === 'slam') { shakeTimer = 9; playSound(100, .24, 'sawtooth', 45); }
      if (boss.state === 'shoot') {
        bossShot.x = boss.direction > 0 ? boss.x + boss.w : boss.x - bossShot.w;
        bossShot.y = 443; bossShot.direction = boss.direction; bossShot.active = true;
        boss.state = 'recover'; boss.timer = boss.phase === 2 ? 65 : 85; boss.nextAttack = 'charge';
        playSound(260, .17, 'square', 130);
      }
    } else if (boss.state === 'charge') {
      boss.x += boss.direction * 5.5;
      if (--boss.timer <= 0 || boss.x <= 360 || boss.x >= 755) {
        boss.x = Math.max(360, Math.min(755, boss.x)); boss.state = 'recover'; boss.timer = boss.phase === 2 ? 65 : 85; boss.nextAttack = 'slam';
      }
    } else if (boss.state === 'slam') {
      const shock = {x: boss.x - 75, y: 450, w: boss.w + 150, h: 35};
      if (overlaps(player, shock)) hurtPlayer(boss.x + boss.w / 2);
      if (--boss.timer <= 0) { boss.state = 'recover'; boss.timer = boss.phase === 2 ? 65 : 85; boss.nextAttack = 'shoot'; }
    } else if (boss.state === 'recover' && --boss.timer <= 0) {
      boss.state = 'idle'; boss.timer = 55;
    }
    if (bossShot.active) {
      bossShot.x += bossShot.direction * 5;
      if (overlaps(player, bossShot)) { bossShot.active = false; hurtPlayer(bossShot.x + bossShot.w / 2); }
      else if (bossShot.x < -bossShot.w || bossShot.x > canvas.width) bossShot.active = false;
    }
    if (overlaps(player, boss)) hurtPlayer(boss.x + boss.w / 2);
  }
  if (room === 4) {
    thorns.cycle = (thorns.cycle + 1) % 220;
    if (thorns.cycle === 100) playSound(180, .16, 'triangle', 260);
    if (thorns.cycle >= 140 && thorns.cycle < 185 && overlaps(player, thorns)) hurtPlayer(thorns.x + thorns.w / 2);
  }
  if (room === 2) {
    piston.cycle = (piston.cycle + 1) % 210;
    if (piston.cycle === 85) playSound(130, .18, 'square', 170);
    if (piston.cycle >= 120 && piston.cycle < 155 && overlaps(player, piston)) hurtPlayer(piston.x + piston.w / 2);
    rollingGear.x += rollingGear.direction * 1.6;
    rollingGear.angle += rollingGear.direction * .08;
    if (rollingGear.x <= 440 || rollingGear.x >= 790) {
      rollingGear.x = Math.max(440, Math.min(790, rollingGear.x)); rollingGear.direction *= -1;
    }
    if (overlaps(player, rollingGear)) hurtPlayer(rollingGear.x + rollingGear.w / 2);
    const lift = roomPlatforms[2].find(item => item.lift);
    const riding = player.grounded && Math.abs(player.y + player.h - lift.y) < .01 && player.x + player.w > lift.x && player.x < lift.x + lift.w;
    const oldY = lift.y;
    lift.y += lift.direction * .8;
    if (lift.y <= 285 || lift.y >= 445) {
      lift.y = Math.max(285, Math.min(445, lift.y)); lift.direction *= -1;
    }
    if (riding) player.y += lift.y - oldY;
  }
  if (enemy.flash > 0) enemy.flash--;
  if (spring.flash > 0) spring.flash--;
  if (weakWall.flash > 0) weakWall.flash--;
  if (drone.flash > 0) drone.flash--;
  if ((room === 1 || room === 2) && drone.health > 0) {
    drone.phase += .045; drone.y = (room === 2 ? 170 : 270) + Math.sin(drone.phase) * 24;
    drone.x += drone.direction * 1.1;
    if (drone.x <= (room === 2 ? 580 : 350) || drone.x >= (room === 2 ? 830 : 610)) drone.direction *= -1;
    if (overlaps(player, drone)) hurtPlayer(drone.x + drone.w / 2);
    drone.shotTimer--;
    if (drone.shotTimer === 45) playSound(480, 0.15, 'triangle', 620);
    if (drone.shotTimer <= 0) {
      steamShot.x = drone.x + (drone.w - steamShot.w) / 2; steamShot.y = drone.y + drone.h;
      steamShot.active = true; drone.shotTimer = 180;
      playSound(320, 0.12, 'triangle', 130);
    }
  }
  if ((room === 1 || room === 2) && steamShot.active) {
    const previousBottom = steamShot.y + steamShot.h;
    steamShot.y += 4;
    if (roomPlatforms[room].some(p => !(p.hidden > 0) && previousBottom <= p.y && steamShot.y + steamShot.h >= p.y && steamShot.x + steamShot.w > p.x && steamShot.x < p.x + p.w)) steamShot.active = false;
    else if (overlaps(player, steamShot)) { hurtPlayer(steamShot.x + steamShot.w / 2); steamShot.active = false; }
    else if (steamShot.y >= 485) steamShot.active = false;
  }
  const crate = crates[room];
  if (crate.flash > 0) crate.flash--;
  if ((room < 2 || room === 4) && enemy.health > 0) {
    if (enemy.stun > 0) {
      enemy.stun--;
    } else if (room === 1) {
      if (enemy.cooldown > 0) enemy.cooldown--;
      const distance = (player.x + player.w / 2) - (enemy.x + enemy.w / 2);
      const sameHeight = Math.abs((player.y + player.h) - (enemy.y + enemy.h)) < 55;
      if (enemy.state === 'patrol' && enemy.cooldown === 0 && sameHeight && Math.abs(distance) < 180) {
        enemy.state = 'warning'; enemy.timer = 45; enemy.direction = distance < 0 ? -1 : 1;
        playSound(220, 0.18, 'square', 300);
      }
      if (enemy.state === 'warning') {
        if (--enemy.timer <= 0) { enemy.state = 'charge'; enemy.timer = 24; }
      } else if (enemy.state === 'charge') {
        enemy.x += enemy.direction * 5;
        if (--enemy.timer <= 0 || enemy.x <= 60 || enemy.x >= 866) {
          enemy.x = Math.max(60, Math.min(866, enemy.x));
          enemy.state = 'patrol'; enemy.cooldown = 120;
        }
      } else {
        enemy.x += enemy.direction * 0.8;
        if (enemy.x <= 250 || enemy.x >= 690) enemy.direction *= -1;
      }
    } else {
      enemy.x += enemy.direction * 0.8;
      if (enemy.x <= 430 || enemy.x >= 690) enemy.direction *= -1;
    }
    if (invulnerability === 0 && overlaps(player, enemy)) {
      hurtPlayer(enemy.x + enemy.w / 2);
    }
  }
  if (room === 4 && enemy.health > 0) {
    if (flowerCooldown > 0) flowerCooldown--;
    if (flowerWarning > 0) {
      flowerWarning--;
      if (flowerWarning === 0) {
        flowerShot.x = flowerDirection > 0 ? enemy.x + enemy.w : enemy.x - flowerShot.w;
        flowerShot.y = enemy.y + 10; flowerShot.direction = flowerDirection; flowerShot.active = true; flowerCooldown = 150;
        playSound(360, .15, 'triangle', 200);
      }
    } else if (flowerCooldown === 0 && Math.abs(player.y - enemy.y) < 55 && Math.abs(player.x - enemy.x) < 250) {
      flowerWarning = 45; flowerDirection = player.x < enemy.x ? -1 : 1; playSound(280, .18, 'sine', 400);
    }
  }
  if (room === 4 && flowerShot.active) {
    flowerShot.x += flowerShot.direction * 3.5;
    if (overlaps(player, flowerShot)) { flowerShot.active = false; hurtPlayer(flowerShot.x + flowerShot.w / 2); }
    else if (flowerShot.x < -flowerShot.w || flowerShot.x > canvas.width) flowerShot.active = false;
  }
  if (gameOver) { attackQueued = false; interactQueued = false; healQueued = false; return; }
  const direction = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  if (dashCooldown > 0) dashCooldown--;
  if (direction && dashTimer === 0) player.facing = direction;
  if (dashQueued && dashCooldown === 0) {
    dashFacing = player.facing; dashTimer = 10; dashCooldown = 60; playSound(150, 0.12, 'sawtooth', 310);
  }
  dashQueued = false;
  if (dashTimer > 0) { player.vx = dashFacing * 9; dashTimer--; }
  else player.vx += (direction * 3.5 - player.vx) * .25;
  if (player.grounded) coyoteTime = 6;
  else if (coyoteTime > 0) coyoteTime--;
  if (jumpQueued) jumpBuffer = 6;
  else if (jumpBuffer > 0) jumpBuffer--;
  if (jumpBuffer > 0 && coyoteTime > 0) {
    player.vy = -11.5; player.grounded = false; coyoteTime = 0; jumpBuffer = 0; variableJump = true;
    playSound(220, 0.12, 'triangle', 370);
    if (!['Space', 'ArrowUp', 'KeyW'].some(code => keys.has(code))) { player.vy = -5; variableJump = false; }
  } else if (jumpQueued && doubleJumpUnlocked && !doubleJumpUsed && !player.grounded) {
    player.vy = -11.5; doubleJumpUsed = true; jumpBuffer = 0; variableJump = true;
    addSparks(player.x + player.w / 2, player.y + player.h, '#a9e1d2');
    playSound(270, 0.18, 'triangle', 540);
  }
  jumpQueued = false;
  if (attackCooldown > 0) attackCooldown--;
  if (attackTimer > 0) attackTimer--;
  if (target.flash > 0) target.flash--;
  if (attackQueued && attackCooldown === 0) {
    attackTimer = 10; attackCooldown = 22; attackFacing = player.facing;
    attackDown = !player.grounded && (keys.has('ArrowDown') || keys.has('KeyS'));
    attackUp = !player.grounded && !attackDown && (keys.has('ArrowUp') || keys.has('KeyW'));
    playSound(420, 0.1, 'triangle', 190);
    const hitbox = attackDown
      ? {x: player.x + 2, y: player.y + player.h, w: player.w - 4, h: 48}
      : attackUp ? {x: player.x + 2, y: player.y - 48, w: player.w - 4, h: 48}
      : {x: player.facing > 0 ? player.x + player.w : player.x - 48, y: player.y + 6, w: 48, h: 30};
    let hit = false;
    if ((room < 2 || room === 4) && enemy.health > 0 && overlaps(hitbox, enemy)) {
      hit = true; enemy.health--; steam = Math.min(3, steam + 1); enemy.flash = 10; enemy.stun = 12; shakeTimer = 5;
      enemy.x = Math.max(60, Math.min(866, enemy.x + (player.x < enemy.x ? 12 : -12)));
      if (room === 1) { enemy.state = 'patrol'; enemy.cooldown = 60; }
      addSparks(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#f4c575');
      playSound(110, 0.12, 'square', 65);
      if (enemy.health === 0) { if (room === 4) { flowerShot.active = false; flowerWarning = 0; } repair.x = enemy.x + (enemy.w - repair.w) / 2; repair.available = true; addSparks(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#f6a957'); playSound(180, .22, 'sawtooth', 55); }
    }
    if (room === 0 && hitbox.x < target.x + target.w && hitbox.x + hitbox.w > target.x && hitbox.y < target.y + target.h && hitbox.y + hitbox.h > target.y) { hit = true; target.hits++; target.flash = 10; }
    if (room === 3 && bossActive && overlaps(hitbox, boss)) {
      hit = true; boss.health--; boss.flash = 10; shakeTimer = 7; steam = Math.min(3, steam + 1);
      addSparks(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffca77'); playSound(85, .15, 'square', 60);
      if (boss.health > 0 && boss.health <= boss.maxHealth / 2 && boss.phase === 1) {
        boss.phase = 2; logMessage = '蒸汽守衛的核心過熱了！'; logTimer = 150;
        addSparks(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ff835e'); playSound(140, .35, 'sawtooth', 350);
      }
      if (boss.health <= 0) {
        bossDefeated = true; bossActive = false; bossIntroTimer = 0; bossVictoryTimer = 150; bossShot.active = false; bossLog.read = true; saveProgress();
        logMessage = '蒸汽守衛已倒下，紀錄冊新增守衛記憶。'; logTimer = 240;
        addSparks(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffe3a0'); playSound(180, .35, 'sawtooth', 50);
      }
    }
    if (room === 4 && flowerShot.active && overlaps(hitbox, flowerShot)) {
      hit = true; flowerShot.active = false; addSparks(flowerShot.x + 7, flowerShot.y + 7, '#b3e8a0'); playSound(430, .12, 'triangle', 600);
    }
    if (room === 3 && bossShot.active && overlaps(hitbox, bossShot)) {
      hit = true; bossShot.active = false;
      addSparks(bossShot.x + bossShot.w / 2, bossShot.y + bossShot.h / 2, '#ffd28b'); playSound(440, .13, 'triangle', 700);
    }
    if ((room === 1 || room === 2) && steamShot.active && overlaps(hitbox, steamShot)) {
      hit = true; steamShot.active = false;
      addSparks(steamShot.x + steamShot.w / 2, steamShot.y + steamShot.h / 2, '#b5f1dd');
      playSound(520, 0.13, 'triangle', 820);
    }
    if ((room === 1 || room === 2) && drone.health > 0 && overlaps(hitbox, drone)) {
      hit = true; drone.health--; drone.flash = 10; steam = Math.min(3, steam + 1); shakeTimer = 5;
      if (drone.health === 0) { steamShot.active = false; addSparks(drone.x + drone.w / 2, drone.y + drone.h / 2, '#f6a957'); playSound(180, .22, 'sawtooth', 55); }
      addSparks(drone.x + drone.w / 2, drone.y + drone.h / 2, '#a9e1d2');
      playSound(180, 0.12, 'square', 90);
    }
    if (crate.health > 0 && overlaps(hitbox, crate)) {
      crate.health--; crate.flash = 10; hit = true; playSound(150, 0.1, 'square', 90);
      if (crate.health === 0) crate.dropped = true;
    }
    if (attackDown && room === 1 && overlaps(hitbox, spring)) {
      player.vy = -15.5; player.grounded = false; variableJump = false; spring.flash = 12;
      playSound(180, 0.2, 'triangle', 620);
    } else if (attackDown && hit) { player.vy = -9; player.grounded = false; variableJump = false; }
  }
  attackQueued = false;
  const previousBottom = player.y + player.h;
  player.vy = Math.min(player.vy + .48, 12);
  const previousX = player.x;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x + player.vx));
  if (room === 2 && !weakWall.broken && overlaps(player, weakWall)) {
    if (dashTimer > 0) {
      weakWall.broken = true; weakWall.flash = 12; shakeTimer = 9;
      addSparks(weakWall.x + weakWall.w / 2, weakWall.y + weakWall.h / 2, '#e8c07c');
      playSound(120, .18, 'square', 60);
    } else if (previousX + player.w <= weakWall.x) { player.x = weakWall.x - player.w; player.vx = 0; }
    else if (previousX >= weakWall.x + weakWall.w) { player.x = weakWall.x + weakWall.w; player.vx = 0; }
  }
  player.y += player.vy;
  const wasGrounded = player.grounded, landingSpeed = player.vy;
  player.grounded = false;
  for (const p of roomPlatforms[room]) {
    if (p.hidden > 0) continue;
    if (player.vy >= 0 && previousBottom <= p.y && player.y + player.h >= p.y && player.x + player.w > p.x && player.x < p.x + p.w) {
      player.y = p.y - player.h; player.vy = 0; player.grounded = true; variableJump = false; doubleJumpUsed = false;
      if (!wasGrounded && landingSpeed > 3) {
        addSparks(player.x + player.w / 2, p.y, '#c6b69b');
        playSound(95, 0.07, 'triangle', 65);
      }
    }
  }
  if (room === 1 && sideVent.cycle >= 150 && sideVent.cycle < 195 && overlaps(player, sideVent)) hurtPlayer(sideVent.x + sideVent.w);
  const steamActive = vent.cycle >= 120 && vent.cycle < 165;
  if (room < 2 && steamActive && overlaps(player, {x: vent.x, y: vent.y - vent.h, w: vent.w, h: vent.h})) hurtPlayer(vent.x + vent.w / 2);
  if (gameOver) { interactQueued = false; return; }
  if (room === 4 && !greenhouseCheckpoint.activated && overlaps(player, greenhouseCheckpoint)) { greenhouseCheckpoint.activated = true; activeCheckpoint = 'greenhouse'; health = 3; logMessage = '溫室休息站已啟動，生命已回復。'; logTimer = 180; saveProgress(); playSound(390, 0.22, 'sine', 700); }
  if (room === 2 && !elevatorCheckpoint.activated && overlaps(player, elevatorCheckpoint)) { elevatorCheckpoint.activated = true; activeCheckpoint = 'elevator'; health = 3; logMessage = '升降機井休息站已啟動，生命已回復。'; logTimer = 180; saveProgress(); playSound(390, 0.22, 'sine', 700); }
  if (room === 0 && !checkpoint.activated && overlaps(player, checkpoint)) { checkpoint.activated = true; activeCheckpoint = 'boiler'; health = 3; logMessage = '鍋爐室休息站已啟動，生命已回復。'; logTimer = 180; saveProgress(); playSound(390, 0.22, 'sine', 700); }
  if (crate.dropped && health < 3 && overlaps(player, crate)) { health++; crate.dropped = false; addSparks(player.x + player.w / 2, player.y + player.h / 2, '#a6edc4'); playSound(500, 0.16, 'sine', 750); }
  if (room === 2 && steamCanister.available && steam < 3 && overlaps(player, steamCanister)) { steam++; steamCanister.available = false; logMessage = '取得蒸汽補給。'; logTimer = 120; playSound(300, .18, 'sine', 520); }
  if (room === 1 && supply.available && health < 3 && overlaps(player, supply)) { health++; supply.available = false; addSparks(player.x + player.w / 2, player.y + player.h / 2, '#a6edc4'); playSound(500, 0.16, 'sine', 750); }
  if (repair.available && health < 3 && overlaps(player, repair)) { health++; repair.available = false; addSparks(player.x + player.w / 2, player.y + player.h / 2, '#a6edc4'); playSound(500, 0.16, 'sine', 750); }
  if (room === 1 && !doubleJumpUnlocked && overlaps(player, jumpUpgrade)) {
    doubleJumpUnlocked = true; saveProgress(); logMessage = '獲得蒸汽雙躍！空中可再按一次跳躍。'; logTimer = 240;
    playSound(360, 0.3, 'sine', 780);
  }
  for (const gear of memoryGears) {
    if (gear.room === room && !gear.collected && overlaps(player, gear)) {
      gear.collected = true; saveProgress();
      logMessage = '取得記憶齒輪（' + memoryGears.filter(item => item.collected).length + ' / ' + memoryGears.length + '）'; logTimer = 150;
      playSound(560, 0.18, 'sine', 840);
    }
  }
  if (room === 0 && !coreCollected && overlaps(player, core)) { coreCollected = true; saveProgress(); playSound(350, 0.3, 'sine', 700); }
  if (interactQueued) {
    if (room === 1 && (reactorPowered || (enemy.health === 0 && controlSwitch.active)) && overlaps(player, goal)) {
      reactorPowered = true; saveProgress(); changeRoom(2);
    }
    else if (room === 2 && overlaps(player, elevatorGoal)) changeRoom(3);
    else if (room === 3 && overlaps(player, arenaExit)) {
      if (bossDefeated && !bossActive) changeRoom(4);
      else { logMessage = '先擊敗蒸汽守衛！'; logTimer = 180; }
    }
    else if (room === 4 && overlaps(player, greenhouseGoal)) { won = true; endingTime = 0; playSound(450, 0.4, 'triangle', 900); }
    else if (room === 4 && overlaps(player, exitDoor)) changeRoom(3);
    else if (room === 3 && overlaps(player, exitDoor)) changeRoom(2);
    else if (room === 2 && overlaps(player, exitDoor)) changeRoom(1);
    else if (room === 1 && overlaps(player, {x: controlSwitch.x - 15, y: controlSwitch.y - 10, w: controlSwitch.w + 30, h: controlSwitch.h + 10})) {
      if (!controlSwitch.active) { controlSwitch.active = true; playSound(280, 0.2, 'triangle', 560); }
      logMessage = '蒸汽開關已啟動。'; logTimer = 150;
    }
    else if (room === 0 && coreCollected && overlaps(player, door)) changeRoom(1);
    else if (room === 1 && overlaps(player, exitDoor)) changeRoom(0);
    else if (room === 4 && greenhouseCheckpoint.activated && overlaps(player, {x: greenhouseCheckpoint.x - 20, y: greenhouseCheckpoint.y, w: greenhouseCheckpoint.w + 40, h: greenhouseCheckpoint.h})) {
      health = 3; activeCheckpoint = 'greenhouse'; saveProgress(); logMessage = '溫室休息站：生命已回復，重生點已更新。'; logTimer = 180; playSound(390, 0.22, 'sine', 700);
    }
    else if (room === 2 && elevatorCheckpoint.activated && overlaps(player, {x: elevatorCheckpoint.x - 20, y: elevatorCheckpoint.y, w: elevatorCheckpoint.w + 40, h: elevatorCheckpoint.h})) {
      health = 3; activeCheckpoint = 'elevator'; saveProgress(); logMessage = '升降機井休息站：生命已回復，重生點已更新。'; logTimer = 180; playSound(390, 0.22, 'sine', 700);
    }
    else if (room === 0 && checkpoint.activated && overlaps(player, {x: checkpoint.x - 20, y: checkpoint.y, w: checkpoint.w + 40, h: checkpoint.h})) {
      health = 3; activeCheckpoint = 'boiler'; saveProgress(); logMessage = '鍋爐室休息站：生命已回復，重生點已更新。'; logTimer = 180;
      playSound(390, 0.22, 'sine', 700);
    }
    else {
      const availableLogs = room === 0 ? [logs[room], secretLog] : room === 2 ? [logs[room], shaftLog] : room === 3 ? [] : [logs[room]];
      const log = availableLogs.find(item => overlaps(player, {x: item.x - 30, y: item.y - 15, w: item.w + 60, h: item.h + 15}));
      if (log) { logMessage = log.text; logTimer = 300; if (!log.read) { log.read = true; saveProgress(); } playSound(450, 0.12, 'sine', 600); }
    }
  }
  interactQueued = false;
  if (player.y > canvas.height + 100) { player.x = 90; player.y = 420; player.vx = 0; player.vy = 0; }
}
function drawGear(x, y, radius, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = '#716047';
  for (let i = 0; i < 12; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.fillRect(radius - 5, -5, 12, 10); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#30332f'; ctx.beginPath(); ctx.arc(0, 0, radius * .68, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#716047'; ctx.lineWidth = 6;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * Math.PI / 2) * radius * .72, Math.sin(i * Math.PI / 2) * radius * .72); ctx.stroke();
  }
  ctx.fillStyle = '#9c8259'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function draw() {
  ctx.save();
  if (shakeEnabled && shakeTimer > 0 && !paused && !mapOpen && !journalOpen && !helpOpen && !gameOver && !won) {
    const strength = Math.min(3, shakeTimer * .5);
    ctx.translate(Math.sin(ambientTime * 2.3) * strength, Math.cos(ambientTime * 2.9) * strength);
  }
  const bg = ctx.createLinearGradient(0, 0, 0, 540);
  bg.addColorStop(0, room === 0 ? '#252b2b' : room === 1 ? '#1b3031' : room === 2 ? '#20262b' : room === 3 ? '#301d1b' : '#233b36');
  bg.addColorStop(1, room === 0 ? '#514635' : room === 1 ? '#344b45' : room === 2 ? '#3a3b3a' : room === 3 ? '#62402c' : '#435c43');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle='#202524'; for(let x=30;x<960;x+=150){ctx.fillRect(x,0,55,485);ctx.fillStyle='#584b38';ctx.fillRect(x+5,0,5,485);ctx.fillStyle='#202524';}
  if (room === 4) {
    ctx.fillStyle = '#20332f'; ctx.fillRect(80, 35, 800, 390);
    ctx.strokeStyle = '#78917a'; ctx.lineWidth = 6; ctx.strokeRect(80, 35, 800, 390);
    for (let x = 180; x < 880; x += 140) { ctx.beginPath(); ctx.moveTo(x, 35); ctx.lineTo(x, 425); ctx.stroke(); }
    ctx.strokeStyle = '#446b4d'; ctx.lineWidth = 8;
    for (let x = 120; x < 880; x += 120) { ctx.beginPath(); ctx.moveTo(x, 425); ctx.lineTo(x + 15, 335); ctx.lineTo(x + 2, 270); ctx.stroke(); }
    ctx.fillStyle = '#719d69'; for (let x = 120; x < 880; x += 120) { ctx.beginPath(); ctx.arc(x + 14, 335, 15, 0, Math.PI * 2); ctx.fill(); }
  }
  if (room === 3) {
    ctx.fillStyle = '#251c1b'; ctx.fillRect(330, 30, 300, 400);
    ctx.strokeStyle = '#806047'; ctx.lineWidth = 10; ctx.strokeRect(330, 30, 300, 400);
    ctx.fillStyle = '#8c4932'; ctx.fillRect(365, 65, 230, 230);
    ctx.fillStyle = '#df8b55'; ctx.globalAlpha = .13 + Math.sin(ambientTime * .04) * .04;
    ctx.beginPath(); ctx.arc(480, 180, 125, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#554235'; ctx.lineWidth = 9;
    for (let x = 380; x <= 580; x += 40) { ctx.beginPath(); ctx.moveTo(x, 65); ctx.lineTo(x, 295); ctx.stroke(); }
    ctx.fillStyle = '#b17850';
    for (let y = 320; y <= 400; y += 40) { ctx.fillRect(350, y, 12, 12); ctx.fillRect(598, y, 12, 12); }
  }
  if (room === 2) {
    ctx.fillStyle = '#1b2023'; ctx.fillRect(275, 0, 175, 485); ctx.fillRect(615, 0, 170, 485);
    ctx.strokeStyle = '#65746c'; ctx.lineWidth = 6;
    for (const x of [290, 435, 630, 770]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 485); ctx.stroke(); }
    ctx.strokeStyle = '#a48b62'; ctx.lineWidth = 2;
    for (const x of [327, 398, 656, 744]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 485); ctx.stroke(); }
    ctx.fillStyle = '#98d1b5'; ctx.globalAlpha = .35;
    for (let y = 50; y < 485; y += 100) { ctx.fillRect(300, y, 9, 9); ctx.fillRect(750, y, 9, 9); }
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = .48;
  drawGear(300, 245, 58, ambientTime * .006);
  drawGear(400, 245, 36, -ambientTime * .0097);
  drawGear(830, 165, 50, -ambientTime * .005);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = room === 0 ? '#716044' : '#526c5f'; ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(0,115);ctx.lineTo(960,115);ctx.moveTo(0,225);ctx.lineTo(960,225);ctx.stroke();
  if (room === 1) {
    for (let x = 105; x < 960; x += 240) {
      ctx.fillStyle = '#273d39'; ctx.fillRect(x, 130, 80, 65);
      ctx.strokeStyle = '#729588'; ctx.lineWidth = 3; ctx.strokeRect(x, 130, 80, 65);
      ctx.fillStyle = '#9bdac3'; ctx.globalAlpha = .55;
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 12 + i * 16, 175 - ((i * 13 + Math.floor(ambientTime / 15)) % 30), 7, 8);
      ctx.globalAlpha = 1;
    }
  }
  ctx.fillStyle=room === 0 ? '#d8a95c' : room === 3 ? '#ed8d59' : '#92d4bb';ctx.globalAlpha=.13;for(let x=110;x<960;x+=240){ctx.beginPath();ctx.arc(x,115,48,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  ctx.fillStyle = 'rgba(203, 222, 206, .09)';
  for (let i = 0; i < 6; i++) {
    const x = 90 + i * 155 + Math.sin(ambientTime * .012 + i) * 12;
    const y = 430 - ((ambientTime * .45 + i * 77) % 400);
    ctx.beginPath(); ctx.arc(x, y, 10 + (i % 3) * 4, 0, Math.PI * 2); ctx.fill();
  }
  for (const p of roomPlatforms[room]) {
    if (p.hidden > 0) {
      ctx.strokeStyle = 'rgba(201, 174, 121, .25)'; ctx.lineWidth = 1; ctx.strokeRect(p.x, p.y, p.w, p.h);
      continue;
    }
    ctx.fillStyle = p.crumble && p.standTime > 25 && Math.floor(p.standTime / 5) % 2 === 0 ? '#a2734b' : '#594a36';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = p.moving || p.lift ? '#add6c2' : p.crumble ? '#d7a865' : '#a88451'; ctx.fillRect(p.x, p.y, p.w, 5);
    ctx.fillStyle = '#302e29'; for (let x = p.x + 12; x < p.x + p.w; x += 40) ctx.fillRect(x, p.y + 9, 4, 4);
    if (p.lift) { ctx.fillStyle = '#b5d8c6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('升降平台', p.x + p.w / 2, p.y + 33); }
    if (p.crumble) { ctx.fillStyle = '#dfc49b'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('鬆動平台', p.x + p.w / 2, p.y + 33); }
  }
  // Amber light warns before the steam jet starts.
  if (room < 2) {
  ctx.fillStyle = '#3d352c'; ctx.fillRect(vent.x, vent.y - 7, vent.w, 7);
  ctx.fillStyle = vent.cycle >= 100 && vent.cycle < 120 ? '#f1a553' : '#8b714c';
  ctx.fillRect(vent.x + 5, vent.y - 7, vent.w - 10, 4);
  if (vent.cycle >= 120 && vent.cycle < 165) {
    ctx.fillStyle = 'rgba(200, 229, 218, .48)';
    for (let i = 0; i < 4; i++) {
      const y = vent.y - 14 - i * 17;
      ctx.beginPath(); ctx.arc(vent.x + 12 + (i % 2) * 13, y, 13, 0, Math.PI * 2); ctx.fill();
    }
  }
  }
  if (room === 1) {
    ctx.fillStyle = '#3d4540'; ctx.fillRect(sideVent.x + sideVent.w, sideVent.y - 5, 18, sideVent.h + 10);
    ctx.fillStyle = sideVent.cycle >= 110 && sideVent.cycle < 150 ? '#ffc078' : '#7b9b8c';
    ctx.fillRect(sideVent.x + sideVent.w + 4, sideVent.y, 8, 7);
    if (sideVent.cycle >= 150 && sideVent.cycle < 195) {
      ctx.fillStyle = 'rgba(199, 229, 218, .5)';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath(); ctx.arc(sideVent.x + 10 + i * 20, sideVent.y + 15 + (i % 2 ? 3 : -3), 12, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  if (repair.available) {
    ctx.fillStyle = 'rgba(157, 228, 192, .18)'; ctx.beginPath(); ctx.arc(repair.x + 10, repair.y + 10, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c59b5b'; ctx.beginPath(); ctx.arc(repair.x + 10, repair.y + 10, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c1f1d0'; ctx.fillRect(repair.x + 8, repair.y + 4, 4, 12); ctx.fillRect(repair.x + 4, repair.y + 8, 12, 4);
  }
  if (room === 0) {
  // A lit rest station marks the active checkpoint.
  ctx.fillStyle = '#5e4935'; ctx.fillRect(checkpoint.x + 3, checkpoint.y + 7, 26, 39);
  ctx.fillStyle = checkpoint.activated ? '#b4f2de' : '#ac8a59'; ctx.fillRect(checkpoint.x + 8, checkpoint.y + 12, 16, 20);
  ctx.fillStyle = '#d7b577'; ctx.fillRect(checkpoint.x, checkpoint.y + 3, 32, 5); ctx.fillRect(checkpoint.x, checkpoint.y + 39, 32, 7);
  ctx.fillStyle = checkpoint.activated ? '#b4f2de' : '#e1c99f'; ctx.textAlign = 'center'; ctx.font = '13px sans-serif';
  ctx.fillText(checkpoint.activated ? '按 E 休息' : '蒸汽休息站', checkpoint.x + 16, checkpoint.y - 10);
  }
  if (room === 0 && !coreCollected) {
  // The illuminated core marks the destination on the highest platform.
  ctx.fillStyle = 'rgba(146, 220, 202, .16)'; ctx.beginPath(); ctx.arc(core.x + 13, core.y + 20, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8e6c3f'; ctx.fillRect(core.x + 2, core.y + 5, 22, 30);
  ctx.fillStyle = '#b4f2de'; ctx.fillRect(core.x + 7, core.y + 10, 12, 20);
  ctx.fillStyle = '#d7b577'; ctx.fillRect(core.x, core.y + 2, 26, 5); ctx.fillRect(core.x, core.y + 34, 26, 5);
  ctx.textAlign = 'center'; ctx.font = '13px sans-serif'; ctx.fillStyle = '#b4e9d4'; ctx.fillText('動力核心', core.x + 13, core.y - 12);
  }
  if ((room === 1 || room === 2) && steamShot.active) {
    ctx.fillStyle = '#eaa06c'; ctx.fillRect(steamShot.x, steamShot.y, steamShot.w, steamShot.h);
    ctx.fillStyle = '#ffe3b0'; ctx.fillRect(steamShot.x + 3, steamShot.y + 2, 4, 7);
  }
  if ((room === 1 || room === 2) && drone.health > 0) {
    if (drone.shotTimer <= 45) {
      ctx.fillStyle = 'rgba(236, 150, 99, .2)'; ctx.fillRect(drone.x + 12, drone.y + drone.h, 8, 485 - (drone.y + drone.h));
      ctx.fillStyle = '#ffc58c'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', drone.x + drone.w / 2, drone.y - 12);
    }
    ctx.fillStyle = drone.flash ? '#f5e3ac' : '#698e86'; ctx.fillRect(drone.x + 3, drone.y + 6, 26, 14);
    ctx.fillStyle = '#a6cabe'; ctx.fillRect(drone.x, drone.y + 2, 32, 4);
    ctx.fillStyle = '#e89767'; ctx.fillRect(drone.x + 12, drone.y + 10, 8, 5);
    ctx.fillStyle = '#d6bb83'; ctx.fillRect(drone.x + 6, drone.y + 20, 5, 4); ctx.fillRect(drone.x + 21, drone.y + 20, 5, 4);
    ctx.fillStyle = '#49362c'; ctx.fillRect(drone.x, drone.y - 7, drone.w, 3);
    ctx.fillStyle = '#9bd2bf'; ctx.fillRect(drone.x, drone.y - 7, drone.w * drone.health / 2, 3);
  }
  if (room === 4 && flowerShot.active) {
    ctx.fillStyle = '#a3cd7a'; ctx.beginPath(); ctx.arc(flowerShot.x + 7, flowerShot.y + 7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e3edac'; ctx.fillRect(flowerShot.x + 5, flowerShot.y + 4, 4, 4);
  }
  if ((room < 2 || room === 4) && enemy.health > 0) {
    if (room === 4 && flowerWarning > 0) {
      ctx.fillStyle = '#d4e797'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', enemy.x + enemy.w / 2, enemy.y - 12);
      ctx.fillStyle = 'rgba(177, 216, 137, .22)'; ctx.fillRect(flowerDirection > 0 ? enemy.x + enemy.w : enemy.x - 100, enemy.y + 10, 100, 14);
    }
    if (room === 1 && enemy.state === 'warning') {
      ctx.fillStyle = '#ffc05c'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', enemy.x + enemy.w / 2, enemy.y - 18);
      ctx.fillStyle = 'rgba(238, 112, 76, .25)'; ctx.fillRect(enemy.direction > 0 ? enemy.x + enemy.w : enemy.x - 90, enemy.y + 12, 90, 18);
    }
    ctx.fillStyle = enemy.flash ? '#f5db9e' : (room === 4 ? '#517c55' : room === 1 ? '#75423a' : '#75523a'); ctx.fillRect(enemy.x, enemy.y + 6, enemy.w, 24);
    if (room === 4) { ctx.fillStyle = '#85ad72'; ctx.fillRect(enemy.x + 4, enemy.y - 5, 10, 7); ctx.fillRect(enemy.x + 20, enemy.y - 5, 10, 7); }
    ctx.fillStyle = room === 4 ? '#769f65' : '#bb8950'; ctx.fillRect(enemy.x + 4, enemy.y, 26, 8);
    ctx.fillStyle = '#252725'; ctx.fillRect(enemy.x + 5, enemy.y + 27, 7, 7); ctx.fillRect(enemy.x + 22, enemy.y + 27, 7, 7);
    ctx.fillStyle = '#e66e49'; ctx.fillRect(enemy.x + (enemy.direction > 0 ? 23 : 6), enemy.y + 12, 5, 5);
    ctx.fillStyle = '#49362c'; ctx.fillRect(enemy.x, enemy.y - 10, enemy.w, 4);
    ctx.fillStyle = '#dc9a57'; ctx.fillRect(enemy.x, enemy.y - 10, enemy.w * enemy.health / 3, 4);
  }
  if (room === 0) {
  ctx.fillStyle = target.flash ? '#f8d997' : '#8b6541'; ctx.fillRect(target.x, target.y, target.w, target.h);
  ctx.fillStyle = '#c8a46e'; ctx.fillRect(target.x + 4, target.y + 6, 30, 5); ctx.fillRect(target.x + 4, target.y + 40, 30, 5);
  ctx.fillStyle = '#33302a'; ctx.beginPath(); ctx.arc(target.x + 19, target.y + 25, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e5bc76'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('練習靶 · ' + target.hits, target.x + target.w / 2, target.y - 12);
  }
  const crate = crates[room];
  if (crate.health > 0) {
    ctx.fillStyle = crate.flash ? '#f7d69c' : '#735334'; ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.strokeStyle = '#c19b63'; ctx.lineWidth = 3; ctx.strokeRect(crate.x + 2, crate.y + 2, crate.w - 4, crate.h - 4);
    ctx.beginPath(); ctx.moveTo(crate.x + 6, crate.y + 6); ctx.lineTo(crate.x + 28, crate.y + 28); ctx.moveTo(crate.x + 28, crate.y + 6); ctx.lineTo(crate.x + 6, crate.y + 28); ctx.stroke();
  } else if (crate.dropped) {
    ctx.fillStyle = '#c59b5b'; ctx.beginPath(); ctx.arc(crate.x + 17, crate.y + 24, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c1f1d0'; ctx.fillRect(crate.x + 15, crate.y + 18, 4, 12); ctx.fillRect(crate.x + 11, crate.y + 22, 12, 4);
  }
  if (room === 1) {
    if (!doubleJumpUnlocked) {
      ctx.fillStyle = 'rgba(164, 235, 205, .2)'; ctx.beginPath(); ctx.arc(jumpUpgrade.x + 12, jumpUpgrade.y + 15, 23, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a6dfc7'; ctx.fillRect(jumpUpgrade.x + 4, jumpUpgrade.y + 4, 16, 22);
      ctx.fillStyle = '#e1f5dd'; ctx.fillRect(jumpUpgrade.x + 10, jumpUpgrade.y, 4, 30);
      ctx.fillStyle = '#c4ead8'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('蒸汽雙躍', jumpUpgrade.x + 12, jumpUpgrade.y - 8);
    }
    ctx.fillStyle = '#5c4b39'; ctx.fillRect(controlSwitch.x, controlSwitch.y + 5, controlSwitch.w, controlSwitch.h - 5);
    ctx.fillStyle = controlSwitch.active ? '#aee9cb' : '#e0a76b'; ctx.fillRect(controlSwitch.x + 7, controlSwitch.y + 11, 16, 13);
    ctx.fillStyle = '#ead5ae'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(controlSwitch.active ? '開關已啟動' : 'E 啟動開關', controlSwitch.x + 15, controlSwitch.y - 8);
    ctx.fillStyle = spring.flash > 0 ? '#e8dfaf' : '#a67c49'; ctx.fillRect(spring.x, spring.y, spring.w, spring.h);
    ctx.strokeStyle = '#d1c09a'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(spring.x + 5, spring.y + 13); ctx.lineTo(spring.x + 12, spring.y + 5); ctx.lineTo(spring.x + 20, spring.y + 13); ctx.lineTo(spring.x + 28, spring.y + 5); ctx.lineTo(spring.x + 35, spring.y + 13); ctx.stroke();
    ctx.fillStyle = '#d4d6b2'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('下劈彈簧', spring.x + spring.w / 2, spring.y - 8);
    if (supply.available) {
      ctx.fillStyle = '#bba06b'; ctx.fillRect(supply.x, supply.y, supply.w, supply.h);
      ctx.fillStyle = '#c1f1d0'; ctx.fillRect(supply.x + 9, supply.y + 5, 4, 15); ctx.fillRect(supply.x + 4, supply.y + 10, 14, 4);
      ctx.fillStyle = '#c1f1d0'; ctx.fillText('修復補給', supply.x + supply.w / 2, supply.y - 6);
    }
  }
  for (const log of (room === 0 ? [logs[room], secretLog] : room === 2 ? [logs[room], shaftLog] : room === 3 ? [] : [logs[room]])) {
    ctx.fillStyle = '#635342'; ctx.fillRect(log.x, log.y + 7, log.w, log.h - 7);
    ctx.fillStyle = '#8fd8c5'; ctx.fillRect(log.x + 5, log.y + 11, log.w - 10, 12);
    ctx.fillStyle = '#d7b577'; ctx.fillRect(log.x - 2, log.y + 3, log.w + 4, 5);
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#c6e8d6';
    ctx.fillText('E 讀取紀錄', log.x + log.w / 2, log.y - 7);
  }
  for (const gear of memoryGears) {
    if (gear.room !== room || gear.collected) continue;
    ctx.fillStyle = 'rgba(237, 193, 101, .18)'; ctx.beginPath(); ctx.arc(gear.x + 11, gear.y + 11, 17, 0, Math.PI * 2); ctx.fill();
    drawGear(gear.x + 11, gear.y + 11, 8, ambientTime * .015);
  }
  const currentDoor = room === 0 ? door : exitDoor;
  ctx.fillStyle = '#302c27'; ctx.fillRect(currentDoor.x + 5, currentDoor.y, 50, 80);
  ctx.strokeStyle = room === 0 && !coreCollected ? '#72563d' : '#b6d9c3'; ctx.lineWidth = 4; ctx.strokeRect(currentDoor.x + 7, currentDoor.y + 2, 46, 78);
  ctx.fillStyle = '#ead5ae'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(room === 0 && !coreCollected ? '需要核心' : '按 E 開門', currentDoor.x + 30, currentDoor.y - 10);
  if (room === 1) {
    ctx.fillStyle = '#d0a45f'; ctx.fillRect(goal.x, goal.y + 8, goal.w, goal.h - 8);
    const consoleReady = reactorPowered || (enemy.health === 0 && controlSwitch.active);
    ctx.fillStyle = consoleReady ? '#b4f2de' : '#bd7055'; ctx.fillRect(goal.x + 8, goal.y + 14, 20, 20);
    ctx.fillStyle = '#ead5ae'; ctx.fillText(consoleReady ? '按 E 前往升降機井' : (enemy.health > 0 ? '先擊敗守衛' : '先啟動蒸汽開關'), goal.x + 18, goal.y - 4);
  }
  for (const spark of sparks) {
    ctx.fillStyle = spark.color; ctx.globalAlpha = spark.life / 16; ctx.fillRect(spark.x, spark.y, 4, 4);
  }
  ctx.globalAlpha = 1;
  if (room === 2) {
    if (steamCanister.available) {
      ctx.fillStyle = '#aa8050'; ctx.fillRect(steamCanister.x, steamCanister.y + 3, steamCanister.w, steamCanister.h - 3);
      ctx.fillStyle = '#98daca'; ctx.fillRect(steamCanister.x + 5, steamCanister.y + 8, 10, 12);
      ctx.fillStyle = '#bce5d6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('蒸汽補給', steamCanister.x + 10, steamCanister.y - 5);
    }
    const pistonActive = piston.cycle >= 120 && piston.cycle < 155;
    const pistonWarning = piston.cycle >= 85 && piston.cycle < 120;
    ctx.fillStyle = '#495751'; ctx.fillRect(piston.x + 13, 110, 14, pistonActive ? 112 : 48);
    ctx.fillStyle = pistonWarning ? '#f0ac64' : '#83978c'; ctx.fillRect(piston.x + 15, 115, 10, 10);
    if (pistonWarning) { ctx.fillStyle = 'rgba(239, 167, 105, .2)'; ctx.fillRect(piston.x, piston.y, piston.w, piston.h); }
    ctx.fillStyle = pistonActive ? '#b9996b' : '#80765e'; ctx.fillRect(piston.x, pistonActive ? 220 : 150, piston.w, 20);
    if (!weakWall.broken) {
      ctx.fillStyle = '#816a4f'; ctx.fillRect(weakWall.x, weakWall.y, weakWall.w, weakWall.h);
      ctx.strokeStyle = '#d6b786'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(weakWall.x + 14, weakWall.y + 4); ctx.lineTo(weakWall.x + 8, weakWall.y + 22); ctx.lineTo(weakWall.x + 16, weakWall.y + 30); ctx.lineTo(weakWall.x + 9, weakWall.y + 51); ctx.stroke();
      ctx.fillStyle = '#e8d3ad'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('衝刺撞開', weakWall.x + weakWall.w / 2, weakWall.y - 8);
    }
    ctx.fillStyle = '#5e4935'; ctx.fillRect(elevatorCheckpoint.x + 3, elevatorCheckpoint.y + 7, 26, 39);
    ctx.fillStyle = elevatorCheckpoint.activated ? '#b4f2de' : '#ac8a59'; ctx.fillRect(elevatorCheckpoint.x + 8, elevatorCheckpoint.y + 12, 16, 20);
    ctx.fillStyle = '#d7b577'; ctx.fillRect(elevatorCheckpoint.x, elevatorCheckpoint.y + 3, 32, 5); ctx.fillRect(elevatorCheckpoint.x, elevatorCheckpoint.y + 39, 32, 7);
    ctx.fillStyle = '#d7e8d1'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(elevatorCheckpoint.activated ? '按 E 休息' : '蒸汽休息站', elevatorCheckpoint.x + 16, elevatorCheckpoint.y - 10);
    drawGear(rollingGear.x + rollingGear.w / 2, rollingGear.y + rollingGear.h / 2, 17, rollingGear.angle);
    ctx.fillStyle = '#667f74'; ctx.fillRect(elevatorGoal.x, elevatorGoal.y, elevatorGoal.w, elevatorGoal.h);
    ctx.fillStyle = '#b6ead1'; ctx.fillRect(elevatorGoal.x + 8, elevatorGoal.y + 8, 18, 18);
    ctx.textAlign = 'center'; ctx.font = '13px sans-serif'; ctx.fillStyle = '#e6dec3'; ctx.fillText('按 E 進入守衛房間', elevatorGoal.x + 17, elevatorGoal.y - 10);
  }
  if (room === 3) {
    if (bossShot.active) drawGear(bossShot.x + 12, bossShot.y + 12, 9, ambientTime * .2);
    if (bossActive) {
      if (boss.state === 'warning') {
        ctx.fillStyle = 'rgba(242, 151, 75, .28)';
        if (boss.nextAttack === 'slam') ctx.fillRect(boss.x - 75, 450, boss.w + 150, 35);
        else if (boss.nextAttack === 'shoot') ctx.fillRect(boss.direction > 0 ? boss.x + boss.w : 0, 443, boss.direction > 0 ? 960 - boss.x - boss.w : boss.x, 24);
        else ctx.fillRect(boss.direction > 0 ? boss.x + boss.w : boss.x - 120, 449, 120, 36);
        ctx.fillStyle = '#ffc17c'; ctx.textAlign = 'center'; ctx.font = 'bold 16px sans-serif';
        const attackName = boss.nextAttack === 'slam' ? '地面重擊！' : boss.nextAttack === 'shoot' ? '齒輪彈！' : '衝刺！';
        ctx.fillText(attackName, boss.x + boss.w / 2, boss.y - 14);
      }
      if (boss.state === 'slam') {
        ctx.fillStyle = 'rgba(255, 194, 120, .65)'; ctx.fillRect(boss.x - 75, 455, boss.w + 150, 30);
        ctx.fillStyle = '#ffdb9d'; for (let i = 0; i < 7; i++) ctx.fillRect(boss.x - 65 + i * 32, 446, 12, 14);
      }
      ctx.fillStyle = boss.flash > 0 ? '#f7dc9b' : boss.phase === 2 ? '#9b4730' : '#70503a'; ctx.fillRect(boss.x + 5, boss.y + 12, 60, 54);
      ctx.fillStyle = '#ad804a'; ctx.fillRect(boss.x + 12, boss.y + 3, 46, 14);
      ctx.fillStyle = '#342f29'; ctx.fillRect(boss.x + 4, boss.y + 62, 18, 14); ctx.fillRect(boss.x + 48, boss.y + 62, 18, 14);
      ctx.fillStyle = '#e87750'; ctx.fillRect(boss.x + (boss.direction > 0 ? 44 : 16), boss.y + 25, 10, 7);
      drawGear(boss.x + 35, boss.y + 43, 12, ambientTime * .025);
    }
    ctx.fillStyle = bossDefeated && !bossActive ? '#9bd7b8' : '#795745'; ctx.fillRect(arenaExit.x, arenaExit.y, arenaExit.w, arenaExit.h);
    ctx.fillStyle = '#e8d7b4'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(bossDefeated && !bossActive ? '按 E 前往廢棄溫室' : '擊敗守衛後解鎖', arenaExit.x + 30, arenaExit.y - 10);
  }
  if (room === 4) {
    ctx.fillStyle = '#4b5e43'; ctx.fillRect(thorns.x, thorns.y + thorns.h - 7, thorns.w, 7);
    if (thorns.cycle >= 100 && thorns.cycle < 140) {
      ctx.fillStyle = '#d6b76a'; ctx.fillRect(thorns.x + 5, thorns.y + thorns.h - 7, thorns.w - 10, 4);
    }
    if (thorns.cycle >= 140 && thorns.cycle < 185) {
      ctx.fillStyle = '#91ad6c';
      for (let x = thorns.x + 2; x < thorns.x + thorns.w - 4; x += 13) {
        ctx.beginPath(); ctx.moveTo(x, thorns.y + thorns.h); ctx.lineTo(x + 6, thorns.y); ctx.lineTo(x + 12, thorns.y + thorns.h); ctx.closePath(); ctx.fill();
      }
    }
    ctx.fillStyle = '#5e4935'; ctx.fillRect(greenhouseCheckpoint.x + 3, greenhouseCheckpoint.y + 7, 26, 39);
    ctx.fillStyle = greenhouseCheckpoint.activated ? '#b4f2de' : '#ac8a59'; ctx.fillRect(greenhouseCheckpoint.x + 8, greenhouseCheckpoint.y + 12, 16, 20);
    ctx.fillStyle = '#d7b577'; ctx.fillRect(greenhouseCheckpoint.x, greenhouseCheckpoint.y + 3, 32, 5); ctx.fillRect(greenhouseCheckpoint.x, greenhouseCheckpoint.y + 39, 32, 7);
    ctx.fillStyle = '#d7e8d1'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(greenhouseCheckpoint.activated ? '按 E 休息' : '蒸汽休息站', greenhouseCheckpoint.x + 16, greenhouseCheckpoint.y - 10);
    ctx.fillStyle = '#8caa78'; ctx.fillRect(greenhouseGoal.x, greenhouseGoal.y + 5, greenhouseGoal.w, greenhouseGoal.h - 5);
    ctx.fillStyle = '#d4e6ab'; ctx.fillRect(greenhouseGoal.x + 7, greenhouseGoal.y + 12, 16, 16);
    ctx.textAlign = 'center'; ctx.font = '13px sans-serif'; ctx.fillStyle = '#e8edd2'; ctx.fillText('按 E 查看地表', greenhouseGoal.x + 15, greenhouseGoal.y - 8);
  }
  if (attackTimer > 0) {
    // The sword swings around the hand, with a brass gear as its guard.
    const progress = (10 - attackTimer) / 9;
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + 23);
    if (attackDown) ctx.rotate(Math.PI / 2 - 0.45 + progress * 0.9);
    else if (attackUp) ctx.rotate(-Math.PI / 2 - 0.45 + progress * 0.9);
    else { ctx.scale(attackFacing, 1); ctx.rotate(-0.7 + progress * 1.4); }
    ctx.fillStyle = '#5d4030'; ctx.fillRect(2, -3, 13, 6);
    ctx.fillStyle = '#b9c4b9';
    ctx.beginPath(); ctx.moveTo(15, -5); ctx.lineTo(48, -4); ctx.lineTo(54, 0); ctx.lineTo(48, 4); ctx.lineTo(15, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4ece0'; ctx.fillRect(18, -2, 28, 2);
    ctx.fillStyle = '#c99b51';
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.translate(15, 0); ctx.rotate(i * Math.PI / 4); ctx.fillRect(5, -2, 4, 4); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(15, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#594632'; ctx.beginPath(); ctx.arc(15, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (dashTimer > 0) {
    ctx.fillStyle = 'rgba(202, 224, 214, 0.4)';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath(); ctx.arc(player.x + player.w / 2 - dashFacing * (12 + i * 10), player.y + 28, 7 - i, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = invulnerability > 0 && Math.floor(invulnerability / 5) % 2 === 0 ? 0.35 : 1;
  const walking = player.grounded && Math.abs(player.vx) > .45;
  const stride = walking ? Math.sin(ambientTime * .25) * 4 : 0;
  const bob = player.grounded ? (walking ? -Math.abs(Math.sin(ambientTime * .25)) * 2 : Math.sin(ambientTime * .04) * .7) : -2;
  ctx.save(); ctx.translate(player.x, player.y);
  // Boots move independently while the body and head subtly bob.
  ctx.fillStyle = '#292622';
  if (player.grounded) {
    ctx.fillRect(5 + stride, 34, 8, 8); ctx.fillRect(18 - stride, 34, 8, 8);
  } else {
    ctx.fillRect(5, 32, 8, 7); ctx.fillRect(18, 35, 8, 7);
  }
  ctx.translate(0, bob);
  ctx.fillStyle = '#6f5139'; ctx.fillRect(player.facing > 0 ? 1 : 23, 19, 6, 15);
  ctx.fillStyle = '#a87e4a'; ctx.fillRect(3, 13, 24, 23);
  ctx.fillStyle = '#705235'; ctx.fillRect(3, 28, 24, 4);
  ctx.fillStyle = '#d2b17c'; ctx.fillRect(2, 2, 26, 19);
  ctx.fillStyle = '#413a2e'; ctx.fillRect(0, 0, 30, 6);
  ctx.fillStyle = '#aee0d0'; ctx.fillRect(player.facing > 0 ? 18 : 7, 9, 5, 5);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.fillStyle = health === 1 && Math.floor(ambientTime / 20) % 2 === 0 ? '#ff9c7d' : '#ead5ae'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText((['鍋爐室', '機械控制室', '升降機井', '蒸汽守衛房間', '廢棄溫室'][room]) + '   生命  ' + '♥ '.repeat(health) + '♡ '.repeat(3 - health), 24, 32);
  ctx.fillStyle = '#ead5ae'; ctx.font = '14px sans-serif'; ctx.fillText('蒸汽衝刺', 24, 57);
  ctx.textAlign = 'right'; ctx.fillText('記憶齒輪 ' + memoryGears.filter(gear => gear.collected).length + ' / ' + memoryGears.length, 936, 57); ctx.textAlign = 'left';
  ctx.fillText('修復蒸汽 ' + '● '.repeat(steam) + '○ '.repeat(3 - steam) + (steam === 3 ? ' Q 修復' : ''), 220, 57);
  ctx.fillStyle = '#e9c594';
  const objective = room === 0
    ? (coreCollected ? '目標：前往右側大門，按 E 進入控制室' : '目標：前往高處，取得動力核心')
    : room === 1 ? (reactorPowered ? '目標：按 E 前往升降機井' : enemy.health > 0 ? '目標：擊敗守衛（留意衝刺警示）' : !controlSwitch.active ? '目標：到平台上啟動蒸汽開關' : '目標：按 E 啟動控制台') : room === 2 ? '目標：登上井頂，按 E 進入守衛房間' : room === 4 ? '目標：登上溫室高處，查看地表' : (!bossActive && bossDefeated ? '目標：到右側按 E 前往廢棄溫室' : '目標：擊敗蒸汽守衛');
  ctx.fillText(objective, 24, 81);
  if (health === 1) { ctx.fillStyle = '#ffb09a'; ctx.fillText('生命危急', 24, 104); }
  if (doubleJumpUnlocked) { ctx.fillStyle = doubleJumpUsed ? '#8e9b90' : '#b5e6d0'; ctx.fillText(doubleJumpUsed ? '雙躍：落地後恢復' : '雙躍：就緒', 220, 104); }
  if (roomTitleTimer > 0 && bossIntroTimer === 0 && bossVictoryTimer === 0 && !mapOpen && !journalOpen && !helpOpen && !paused) {
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(18, 23, 21, .75)'; ctx.fillRect(350, 108, 260, 44);
    ctx.fillStyle = '#e6d4ad'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(['鍋爐室', '機械控制室', '升降機井', '蒸汽守衛房間', '廢棄溫室'][room], 480, 137);
    ctx.textAlign = 'left'; ctx.font = '14px sans-serif';
  }
  ctx.textAlign = 'right'; ctx.fillStyle = storageAvailable ? '#b4d3bb' : '#e8aa81';
  ctx.fillText(storageAvailable ? (saveFeedbackTimer > 0 ? '進度已儲存 ✓' : '進度自動儲存') : '無法儲存進度', 936, 32); ctx.textAlign = 'left';
  ctx.fillStyle = '#3e3a30'; ctx.fillRect(94, 46, 100, 10);
  ctx.fillStyle = '#9bcbbb'; ctx.fillRect(94, 46, 100 * (1 - dashCooldown / 60), 10);
  if (room === 3 && bossActive && bossIntroTimer > 0 && !mapOpen && !journalOpen && !helpOpen && !paused && !gameOver && !won) {
    ctx.fillStyle = 'rgba(29, 20, 18, .82)'; ctx.fillRect(290, 125, 380, 83);
    ctx.strokeStyle = '#bc8a5c'; ctx.lineWidth = 2; ctx.strokeRect(290, 125, 380, 83);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f3d7a9'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('蒸汽守衛', 480, 160);
    ctx.fillStyle = '#cfaa83'; ctx.font = '15px sans-serif'; ctx.fillText('升降機井的看守者', 480, 187);
  }
  if (room === 3 && bossVictoryTimer > 0 && !mapOpen && !journalOpen && !helpOpen && !paused && !gameOver && !won) {
    ctx.fillStyle = 'rgba(29, 20, 18, .85)'; ctx.fillRect(290, 125, 380, 83);
    ctx.strokeStyle = '#d0ac71'; ctx.lineWidth = 2; ctx.strokeRect(290, 125, 380, 83);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f4dfb8'; ctx.font = 'bold 25px sans-serif'; ctx.fillText('蒸汽守衛已擊敗', 480, 160);
    ctx.fillStyle = '#bfe7cf'; ctx.font = '15px sans-serif'; ctx.fillText('右側升降機已解鎖', 480, 187);
  }
  if (room === 3 && bossActive && !gameOver && !won) {
    ctx.fillStyle = '#e8d2ad'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(boss.phase === 2 ? '蒸汽守衛 · 核心過熱' : '蒸汽守衛', 480, 438);
    ctx.fillStyle = '#3a3029'; ctx.fillRect(300, 445, 360, 14);
    ctx.fillStyle = '#c66c4b'; ctx.fillRect(303, 448, 354 * boss.health / boss.maxHealth, 8);
    ctx.textAlign = 'left';
  }
  if (logTimer > 0 && !gameOver && !won) {
    ctx.fillStyle = 'rgba(25, 28, 27, .9)'; ctx.fillRect(100, 470, 760, 48);
    ctx.strokeStyle = '#a7895d'; ctx.lineWidth = 1; ctx.strokeRect(100, 470, 760, 48);
    ctx.fillStyle = '#f0dfc1'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(logMessage, 480, 500);
  }
  if (mapOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .92)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('機械城地圖', 480, 125);
    ctx.strokeStyle = '#846e50'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(140, 250); ctx.lineTo(820, 250); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const x = 30 + i * 180;
      ctx.fillStyle = i === room ? '#544838' : '#303631'; ctx.fillRect(x, 195, 165, 110);
      ctx.strokeStyle = i === room ? '#d9b876' : '#786c53'; ctx.lineWidth = 3; ctx.strokeRect(x, 195, 165, 110);
      ctx.fillStyle = '#efdfbe'; ctx.font = 'bold 17px sans-serif'; ctx.fillText(['鍋爐室', '機械控制室', '升降機井', '守衛房間', '廢棄溫室'][i], x + 82, 235);
      ctx.font = '15px sans-serif'; ctx.fillStyle = '#b9d4bd'; ctx.fillText(i === room ? '你在這裡' : (i === 1 && !coreCollected ? '需要動力核心' : i >= 2 && !reactorPowered ? '需要啟動控制台' : i === 4 && !bossDefeated ? '需要擊敗守衛' : '已連通'), x + 82, 265);
      const roomGears = memoryGears.filter(gear => gear.room === i);
      ctx.fillStyle = '#d4bd91'; ctx.font = '13px sans-serif';
      ctx.fillText('記憶齒輪 ' + roomGears.filter(gear => gear.collected).length + '/' + roomGears.length, x + 82, 290);
    }
    ctx.fillStyle = '#d6c3a0'; ctx.font = '16px sans-serif';
    ctx.fillText('鍋爐室休息站：' + (checkpoint.activated ? '已啟動' : '未啟動') + '   升降機井休息站：' + (elevatorCheckpoint.activated ? '已啟動' : '未啟動') + '   動力核心：' + (coreCollected ? '已取得' : '尚未取得'), 480, 355);
    ctx.fillText('控制室開關：' + (controlSwitch.active ? '已啟動' : '尚未啟動（離開房間後重置）') + '     雙躍：' + (doubleJumpUnlocked ? '已取得' : '未取得'), 480, 383);
    ctx.fillText('蒸汽守衛：' + (bossDefeated ? '曾經擊敗' : '尚未擊敗') + '     目前重生點：' + ({boiler: '鍋爐室', elevator: '升降機井', greenhouse: '溫室'}[activeCheckpoint] || (greenhouseCheckpoint.activated ? '溫室' : elevatorCheckpoint.activated ? '升降機井' : checkpoint.activated ? '鍋爐室' : '起點')), 480, 410);
    ctx.fillStyle = '#a79d8a'; ctx.fillText('按 Tab 關閉地圖', 480, 445);
  }
  if (journalOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .94)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('機械城紀錄冊', 480, 115);
    ctx.font = '16px sans-serif';
    allLogs.forEach((log, i) => {
      ctx.fillStyle = log.read ? '#e4d8bc' : '#857e70';
      ctx.fillText(log.read ? log.text : '尚未發現的紀錄', 480, 145 + i * 42);
    });
    ctx.fillStyle = '#a79d8a'; ctx.fillText('按 J 或 Esc 關閉紀錄冊', 480, 490);
  }
  if (helpOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .95)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('操作說明', 480, 90);
    ctx.font = '17px sans-serif'; ctx.fillStyle = '#e4d8bc';
    const lines = ['A / D 或 ← / →：移動　　W / ↑ / 空白鍵：跳躍', '滑鼠左鍵：攻擊　　空中按住上或下：改變攻擊方向', 'Shift：衝刺　　E：互動　　Q：蒸汽修復', 'Tab：地圖　　J：紀錄冊　　Esc：暫停　　M：音效', '取得雙躍後，在空中再按一次跳躍鍵。'];
    lines.forEach((line, i) => ctx.fillText(line, 480, 165 + i * 50));
    ctx.fillStyle = '#a79d8a'; ctx.fillText('按 H 或 Esc 關閉', 480, 455);
  }
  if (paused && !gameOver && !won && !helpOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .86)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f0d5a2'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('遊戲暫停', 480, 250);
    ctx.font = '18px sans-serif'; ctx.fillText('按 Esc 繼續', 480, 290);
  }
  if (won) {
    ctx.fillStyle = 'rgba(15, 21, 20, .9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#61746b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(400, 60); ctx.lineTo(400, 245); ctx.moveTo(560, 60); ctx.lineTo(560, 245); ctx.stroke();
    const cabinY = 190 - Math.min(endingTime * .35, 80);
    ctx.fillStyle = '#735e45'; ctx.fillRect(422, cabinY, 116, 70);
    ctx.fillStyle = '#9ccdb5'; ctx.fillRect(435, cabinY + 10, 90, 40);
    ctx.fillStyle = '#39433c'; ctx.fillRect(472, cabinY + 24, 16, 26);
    ctx.fillStyle = '#e5d0a4'; ctx.fillRect(474, cabinY + 20, 12, 11);
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8d4aa'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('陽光照進了溫室', 480, 310);
    ctx.font = '17px sans-serif'; ctx.fillStyle = '#b9d6c3'; ctx.fillText(memoryGears.every(gear => gear.collected) ? '齒輪中的記憶亮起：這座城曾為守護人們而轉動。' : '機械城重新運轉，地表的旅程才正要開始。', 480, 352);
    ctx.fillStyle = '#b6aa92'; ctx.fillText('本次探索完成 · 按 R 開始新一輪', 480, 405);
  } else if (gameOver) {
    ctx.fillStyle = 'rgba(15, 15, 14, .78)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f0d5a2'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('機械修復者倒下了', 480, 250);
    ctx.font = '18px sans-serif'; ctx.fillText(checkpoint.activated || elevatorCheckpoint.activated || greenhouseCheckpoint.activated ? '按 R 從休息站重新出發' : '按 R 重新開始', 480, 290);
  }
}
let last = 0, accumulator = 0;
function frame(time){ if (!last) last=time; accumulator += Math.min(time-last,100); last=time; while(accumulator >= 1000/60){update();ambientTime++;if(won) endingTime++;accumulator-=1000/60} draw();requestAnimationFrame(frame); }
loadProgress();
requestAnimationFrame(frame);
