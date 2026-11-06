const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const keys = new Set();
const roomPlatforms = [
  [{x:0,y:485,w:960,h:55},{x:205,y:402,w:170,h:18},{x:438,y:330,w:170,h:18},{x:682,y:265,w:165,h:18},{x:35,y:195,w:125,h:18}],
  [{x:0,y:485,w:960,h:55},{x:185,y:405,w:150,h:18,crumble:true,standTime:0,hidden:0},{x:415,y:345,w:150,h:18},{x:650,y:405,w:150,h:18,moving:true,direction:1},{x:150,y:260,w:125,h:18}],
  [{x:0,y:485,w:960,h:55},{x:180,y:405,w:150,h:18},{x:390,y:330,w:150,h:18},{x:610,y:255,w:150,h:18},{x:800,y:185,w:140,h:18},{x:315,y:445,w:95,h:18,lift:true,direction:-1}],
  [{x:0,y:485,w:960,h:55},{x:210,y:370,w:120,h:18},{x:630,y:370,w:120,h:18}],
  [{x:0,y:485,w:960,h:55},{x:170,y:405,w:150,h:18},{x:390,y:335,w:150,h:18},{x:610,y:265,w:150,h:18},{x:800,y:205,w:140,h:18}],
  [{x:0,y:485,w:160,h:55},{x:210,y:420,w:105,h:18},{x:350,y:355,w:110,h:18},{x:510,y:390,w:100,h:18,courseMoving:true,direction:1},{x:685,y:335,w:100,h:18},{x:820,y:280,w:120,h:18}],
  [{x:0,y:485,w:960,h:55},{x:165,y:405,w:130,h:18},{x:355,y:335,w:125,h:18},{x:550,y:275,w:130,h:18},{x:745,y:345,w:140,h:18}],
  [{x:0,y:485,w:960,h:55},{x:120,y:375,w:140,h:18},{x:315,y:305,w:130,h:18},{x:510,y:380,w:120,h:18,mineMoving:true,direction:1},{x:700,y:310,w:145,h:18}],
  [{x:0,y:485,w:960,h:55},{x:130,y:405,w:135,h:18},{x:690,y:405,w:140,h:18},{x:408,y:190,w:102,h:18}],
  [{x:0,y:485,w:960,h:55},{x:145,y:405,w:145,h:18},{x:650,y:405,w:145,h:18}],
  [{x:0,y:485,w:960,h:55},{x:150,y:395,w:140,h:18},{x:660,y:395,w:140,h:18}],
  [{x:0,y:485,w:960,h:55}]
];
const forestNames = ['林緣小徑', '蘋果斷橋', '橙光高坡', '莓果雙谷', '梨形水渠', '葡萄藤橋', '古樹齒輪場', '果園休息地', '鏽葉山道', '森林深處'];
const forestFruit = [
  {name: '機械蘋果', color: '#bd594e', speed: 1.0, attack: 'charge'},
  {name: '蒸汽橙子', color: '#d79545', speed: .7, attack: 'shot'},
  {name: '發條草莓', color: '#d36a6d', speed: 1.45, attack: 'charge'},
  {name: '鐵殼梨', color: '#9dab54', speed: .6, attack: 'charge'},
  {name: '齒輪葡萄', color: '#826c9d', speed: .85, attack: 'shot'}
];
function isForestRoom() { return room >= 12 && room <= 21; }
function combatFoesHere() { return (room >= 6 && room <= 8) || isForestRoom(); }
const forestGate = {x: 715, y: 315, w: 50, h: 80};
// Separate collision layouts: paths, gaps, a moving bridge and raised platforms.
const forestLayouts = [
  [{x:0,y:485,w:960,h:55},{x:170,y:405,w:150,h:18},{x:410,y:340,w:130,h:18},{x:690,y:395,w:130,h:18}],
  [{x:0,y:485,w:300,h:55},{x:380,y:485,w:580,h:55},{x:225,y:405,w:100,h:18},{x:400,y:355,w:135,h:18},{x:690,y:400,w:120,h:18}],
  [{x:0,y:485,w:560,h:55},{x:650,y:485,w:310,h:55},{x:110,y:390,w:130,h:18},{x:310,y:320,w:120,h:18},{x:515,y:405,w:100,h:18},{x:700,y:350,w:130,h:18}],
  [{x:0,y:485,w:260,h:55},{x:330,y:485,w:280,h:55},{x:680,y:485,w:280,h:55},{x:190,y:390,w:100,h:18},{x:405,y:350,w:130,h:18},{x:650,y:400,w:100,h:18}],
  [{x:0,y:485,w:960,h:55},{x:100,y:410,w:120,h:18},{x:270,y:340,w:110,h:18},{x:440,y:275,w:120,h:18},{x:620,y:340,w:110,h:18},{x:790,y:410,w:100,h:18}],
  [{x:0,y:485,w:390,h:55},{x:510,y:485,w:450,h:55},{x:390,y:420,w:100,h:18,forestMoving:true,direction:1},{x:180,y:390,w:130,h:18},{x:620,y:360,w:130,h:18}],
  [{x:0,y:485,w:960,h:55},{x:165,y:405,w:130,h:18},{x:350,y:340,w:130,h:18},{x:580,y:385,w:110,h:18},{x:760,y:320,w:125,h:18}],
  [{x:0,y:485,w:960,h:55},{x:150,y:390,w:115,h:18},{x:680,y:390,w:115,h:18}],
  [{x:0,y:485,w:220,h:55},{x:300,y:485,w:270,h:55},{x:660,y:485,w:300,h:55},{x:145,y:405,w:100,h:18},{x:350,y:340,w:120,h:18},{x:600,y:390,w:100,h:18},{x:760,y:325,w:120,h:18}],
  [{x:0,y:485,w:960,h:55},{x:130,y:405,w:120,h:18},{x:325,y:345,w:120,h:18},{x:515,y:285,w:120,h:18},{x:725,y:385,w:130,h:18}]
];
const forestHazards = {14: {x: 440, y: 420, w: 42, h: 65}, 16: {x: 550, y: 420, w: 42, h: 65}, 20: {x: 480, y: 420, w: 42, h: 65}};
for (const layout of forestLayouts) roomPlatforms.push(layout);
// Retain the old room indices for saved data; these rooms are no longer reachable.
for (let i = 0; i < 5; i++) roomPlatforms.push([{x:0,y:485,w:960,h:55}]);
roomPlatforms.push([{x:0,y:485,w:960,h:55},{x:170,y:375,w:115,h:18},{x:675,y:375,w:115,h:18}]);
roomPlatforms.push([{x:0,y:485,w:960,h:55},{x:200,y:405,w:140,h:18},{x:470,y:345,w:130,h:18},{x:720,y:405,w:130,h:18}]);
const wildZones = [
  {name: '樹根之路', kind: 'meadow', platforms: [{x:0,y:485,w:960,h:55},{x:180,y:405,w:140,h:18},{x:440,y:345,w:140,h:18},{x:720,y:405,w:130,h:18}], enemies: [{type:0,x:390},{type:1,x:740}]},
  {name: '風鈴原野', kind: 'meadow', platforms: [{x:0,y:485,w:340,h:55},{x:430,y:485,w:530,h:55},{x:170,y:405,w:125,h:18},{x:460,y:370,w:140,h:18},{x:710,y:405,w:130,h:18}], enemies: [{type:0,x:220},{type:1,x:640},{type:2,x:780}]},
  {name: '斷風峽口', kind: 'gorge', platforms: [{x:0,y:485,w:350,h:55},{x:570,y:485,w:390,h:55},{x:130,y:390,w:110,h:18},{x:700,y:390,w:130,h:18}], enemies: [{type:0,x:170},{type:1,x:720}]},
  {name: '獵痕小徑', kind: 'trail', platforms: [{x:0,y:485,w:960,h:55},{x:130,y:395,w:130,h:18},{x:340,y:330,w:130,h:18},{x:510,y:400,w:130,h:18},{x:680,y:340,w:160,h:18}], enemies: [{type:0,x:270},{type:1,x:650},{type:2,x:790}]},
  {name: '獵者營地', kind: 'camp', platforms: [{x:0,y:485,w:960,h:55},{x:150,y:390,w:120,h:18},{x:690,y:390,w:120,h:18}], enemies: []},
  {name: '暮霧哨道', kind: 'trail', platforms: [{x:0,y:485,w:960,h:55},{x:170,y:375,w:120,h:18},{x:675,y:375,w:120,h:18}], enemies: []}
];
function isWildRoom() { return room >= 28 && room <= 35; }
function wildRoomName() { return room===35 ? '故人決鬥場' : room === 34 ? '齒輪下劈試煉' : wildZones[room - 28].name; }
for (let i = 0; i < wildZones.length; i++) roomPlatforms[28 + i] = wildZones[i].platforms;
roomPlatforms[34] = [{x:0,y:485,w:170,h:55},{x:800,y:275,w:160,h:18}];
roomPlatforms[35]=[{x:0,y:485,w:960,h:55},{x:185,y:375,w:110,h:18},{x:665,y:375,w:110,h:18}];
const dockZones = [
  {name:'墜落廢塢',platforms:[{x:0,y:485,w:960,h:55},{x:170,y:405,w:130,h:18},{x:650,y:380,w:145,h:18}],enemies:[]},
  {name:'熔爐棧橋',platforms:[{x:0,y:485,w:300,h:55},{x:430,y:485,w:200,h:55},{x:750,y:485,w:210,h:55},{x:230,y:395,w:115,h:18},{x:465,y:360,w:120,h:18},{x:695,y:395,w:110,h:18}],enemies:[{type:0,x:520},{type:1,x:805},{type:2,x:650}]},
  {name:'吊鏈升降井',platforms:[{x:0,y:485,w:280,h:55},{x:710,y:485,w:250,h:55},{x:230,y:405,w:115,h:18},{x:410,y:330,w:120,h:18},{x:580,y:400,w:115,h:18,dockLift:true,direction:-1},{x:710,y:345,w:120,h:18},{x:800,y:405,w:85,h:18}],enemies:[{type:1,x:790},{type:2,x:450}]},
  {name:'舊泵房',platforms:[{x:0,y:485,w:960,h:55},{x:160,y:405,w:135,h:18},{x:400,y:335,w:135,h:18},{x:670,y:405,w:135,h:18}],enemies:[{type:0,x:380},{type:1,x:690}]}
];
for(let i=0;i<dockZones.length;i++)roomPlatforms[36+i]=dockZones[i].platforms;
function isDockRoom(){return room>=36&&room<=39;}
function roamingEnemiesHere(){return isWildRoom()||isDockRoom();}
let dockEntered=false,dockFallPending=false,dockFallTick=-1,dockArrivalStage=0,dockShortcut=false;
const dockArrivalLines=[
  '女同事：「……下面竟然還有一座工廠。」',
  '主角：「別勉強。你的核心還沒穩住。」',
  '主角：「留在燈旁邊。我去找出路，會回來接你。」'
];
function dockArrivalActive(){return room===36&&dockArrivalStage>0&&dockArrivalStage<=dockArrivalLines.length;}
const dockEnemyTypes=[{name:'染疫熔錘鑄工',hp:4,color:'#a66c47'},{name:'輻射熔渣炮手',hp:3,color:'#987852'},{name:'吊鏈熱束機',hp:2,color:'#927466'}];
const dockJet={x:560,y:395,w:45,h:90};
const dockLever={x:835,y:430,w:30,h:55};
const wildPogoGate = {x: 730, y: 260, w: 45, h: 80};
const wildPogoGoal = {x: 850, y: 235, w: 34, h: 40};
const wildPogoTargets = [{x:280,y:440,w:54,h:18,flash:0},{x:450,y:375,w:54,h:18,flash:0},{x:620,y:310,w:54,h:18,flash:0}];
const wildTrap = {x: 425, y: 465, w: 60, h: 20};
let wildTicks = 0, wildGauntletCleared = false, wildPogoRewardClaimed = false, wildPogoFinished = false, gauntletWave = 0, gauntletWait = 0;
const wildEnemyTypes = [{name:'染疫草刃衛',hp:2,color:'#a49c6a'},{name:'輻射風弩手',hp:3,color:'#7b8870'},{name:'變異巡空蜂',hp:2,color:'#a68a5e'}];
let duelistDefeated=false,duelIntroIndex=0;
const duelistLines=[
  '女同事：「……是你？十年前，我以為你已經……」',
  '主角：「我回來了。你身上那些裂痕，是輻射？」',
  '女同事：「別靠近！我快要控制不住這把劍了……」',
  '主角：「……我不會把你留在這裡。」'
];
const duelist={x:690,y:431,w:36,h:54,health:12,maxHealth:12,irradiated:true,state:'idle',timer:65,direction:-1,phase:1,attackIndex:0,move:'dash',vy:0,flash:0,musicTick:0,combo:0};
function duelIntroActive() {return room===35&&!duelistDefeated&&duelIntroIndex<duelistLines.length;}
function duelistActive() {return room===35&&!duelistDefeated&&duelist.health>0&&!duelIntroActive();}
function resetDuelist() {
  Object.assign(duelist,{x:690,y:431,health:duelistDefeated?0:12,state:'idle',timer:65,direction:-1,phase:1,attackIndex:0,move:'dash',vy:0,flash:0,musicTick:0,combo:0});duelIntroIndex=0;
}
let altar1Claimed = false, spearQueued = false, spearCooldown = 0;
const wildAltar1 = {x:210,y:351,w:40,h:54};
function playerMaxHealth() { return 3 + (altar1Claimed ? 1 : 0); }
const ironSpear = {active:false,x:0,y:0,w:48,h:14,vx:0,phase:'out',ticks:0,hit:new Set()};
function resetIronSpear() { ironSpear.active=false;ironSpear.hit.clear();spearQueued=false;spearCooldown=0; }
const wildEnemies = [];
const gauntletWaves=[[{type:0,x:650}],[{type:0,x:350},{type:1,x:720}],[{type:0,x:320},{type:1,x:740},{type:2,x:610}]];
function spawnWildEnemies(specs) {
  wildEnemies.length = 0;
  specs.forEach((spec, index) => {
    const flyer = spec.type === 2;
    const floor = roomPlatforms[room].find(p => p.y === 485 && spec.x >= p.x && spec.x + 34 <= p.x + p.w);
    const low = flyer ? Math.max(90, spec.x - 85) : Math.max(floor.x + 35, spec.x - 70);
    const high = flyer ? Math.min(840, spec.x + 85) : Math.min(floor.x + floor.w - 68, spec.x + 70);
    wildEnemies.push({x:spec.x,y:flyer?285:445,w:34,h:40,type:spec.type,irradiated:true,health:wildEnemyTypes[spec.type].hp,maxHealth:wildEnemyTypes[spec.type].hp,
      direction:-1,state:'patrol',timer:0,cooldown:110+index*45,flash:0,stun:0,phase:index,minX:low,maxX:high,homeX:spec.x,homeY:flyer?285:445,
      shot:{x:0,y:0,w:16,h:8,vx:0,vy:0,life:0,active:false}});
  });
}
function startPogoRun(message = '按住 S 加滑鼠左鍵下劈齒輪，反彈後繼續前進。') {
  resetIronSpear();
  Object.assign(player,{x:70,y:443,vx:0,vy:0,grounded:true,facing:1});
  keys.clear(); jumpQueued=false; jumpBuffer=0; coyoteTime=0; wallJumpLock=0; attackQueued=false; attackTimer=0; attackCooldown=0; dashQueued=false; dashTimer=0; dashCooldown=0;
  toolQueued=false; spearQueued=false; toolProjectile.active=false; healQueued=false; healTimer=0; wildPogoFinished=false;
  wildPogoTargets.forEach(target=>target.flash=0); logMessage=message; logTimer=220;
}
function resetWildRoom() {
  wildTicks=0; wildEnemies.length=0; gauntletWave=0; gauntletWait=0;
  if(isDockRoom()){
    const lift=roomPlatforms[room].find(p=>p.dockLift);if(lift){lift.y=400;lift.direction=-1;}
    spawnWildEnemies(dockZones[room-36].enemies);
    for(const foe of wildEnemies)foe.health=foe.maxHealth=dockEnemyTypes[foe.type].hp;
    return;
  }
  if (!isWildRoom()) return;
  if (room===35) {resetDuelist();return;}
  if (room===34) { startPogoRun(); return; }
  if (room===33 && !wildGauntletCleared) { gauntletWave=1; gauntletWait=75; return; }
  spawnWildEnemies(wildZones[room-28].enemies);
}

let visitedRooms = Array.from({length: roomPlatforms.length}, (_, i) => i === 0);
let forestBossKey = false, forestBossDefeated = false, forestSeedOwned = false, forestSeedPlanted = false, importantGear1 = false, farewellStage = 0, reunionStage = 0;
const reunionLines = [
  '小孩：「你回來了！我就知道你一定會回來！」',
  '主角：「……別跑那麼快，小心跌倒。」',
  '小孩：「我好想你！這次可以多待一會兒嗎？」',
  '主角：「我只是回來看看。……你過得好嗎？」'
];
function reunionActive() { return room === 10 && reunionStage >= 1 && reunionStage <= reunionLines.length; }
const farewellLines = [
  '小孩：「新的路出現了……你真的要走了嗎？」',
  '主角：「嗯。我得繼續往前。你回鎮上吧。」',
  '小孩：「我會想念你的。你一定要平安回來喔！」',
  '主角：「……照顧好自己。還有，謝謝你。」'
];
function farewellActive() { return room === 12 && farewellStage >= 1 && farewellStage <= farewellLines.length; }
const seedSoil = {x: 500, y: 455, w: 40, h: 30};
const seedGate = {x: 455, y: 260, w: 50, h: 80};
const forestKeyCard = {x: 200, y: 375, w: 24, h: 30};
function inBossRoom() { return room === 3 || room === 27; }
let room = 0, coreCollected = false, reactorPowered = false, bossDefeated = false, bossActive = false, bossIntroTimer = 0, bossVictoryTimer = 0, interactQueued = false;
const boss = {x: 650, y: 409, w: 70, h: 76, health: 10, maxHealth: 10, state: 'idle', timer: 90, direction: -1, flash: 0, musicTick: 0, nextAttack: 'charge', phase: 1};
const bossShot = {x: 0, y: 0, w: 24, h: 24, direction: 1, active: false};
const forestBossSeeds = [];
const forestBossWave = {x: 0, y: 463, w: 74, h: 22, vx: 0, active: false};
const forestBossMusic = {
  melody: [196, 261.63, 311.13, 392, 349.23, 311.13, 261.63, 233.08, 196, 293.66, 349.23, 440, 392, 349.23, 293.66, 261.63],
  bass: [98, 98, 116.54, 116.54, 130.81, 130.81, 87.31, 87.31]
};
function resetBoss() { Object.assign(boss, {x: 650, y: 409, health: boss.maxHealth, state: 'idle', timer: 90, direction: -1, flash: 0, musicTick: 0, nextAttack: 'charge', phase: 1}); bossActive = inBossRoom(); bossIntroTimer = bossActive ? 120 : 0; bossVictoryTimer = 0; bossShot.active = false; forestBossSeeds.length = 0; forestBossWave.active = false; if (room === 27) boss.nextAttack = 'seedRain'; }
const door = {x: 900, y: 405, w: 60, h: 80};
const exitDoor = {x: 0, y: 405, w: 60, h: 80};
const goal = {x: 845, y: 440, w: 36, h: 45};
const elevatorGoal = {x: 855, y: 145, w: 34, h: 40};
const arenaExit = {x: 880, y: 405, w: 60, h: 80};
const greenhouseGoal = {x: 865, y: 165, w: 30, h: 40};
const branchDoor = {x: 70, y: 115, w: 50, h: 80};
const workshopWalls = [{x:390,y:210,w:18,h:205}, {x:510,y:210,w:18,h:205}];
const mineSaw = {x: 480, y: 445, w: 40, h: 40};
const branchVent = {x: 465, y: 410, w: 55, h: 75};
const courseFinish = {x: 860, y: 240, w: 38, h: 40};
const courseVent = {x: 390, y: 320, w: 40, h: 35, cycle: 0};
let courseTicks = 0, courseRunning = false, courseFinished = false, courseBestTicks = null, courseRewardClaimed = false;
const thorns = {x: 355, y: 455, w: 65, h: 30, cycle: 0};
const rollingGear = {x: 480, y: 445, w: 40, h: 40, direction: 1, angle: 0};
const weakWall = {x: 800, y: 425, w: 25, h: 60, broken: false, flash: 0};
const piston = {x: 720, y: 180, w: 40, h: 75, cycle: 0};
const controlSwitch = {x: 475, y: 308, w: 30, h: 37, active: false};
const jumpUpgrade = {x: 540, y: 315, w: 24, h: 30};
let doubleJumpUnlocked = false, doubleJumpUsed = false, wallJumpLock = 0;
const spring = {x: 115, y: 468, w: 40, h: 17, flash: 0};
const supply = {x: 200, y: 235, w: 22, h: 25, available: true};
const steamCanister = {x: 260, y: 380, w: 20, h: 25, available: true};
const crates = [
  {x: 260, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: 770, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: 300, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false},
  {x: 290, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false},
  {x: 700, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: 680, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: 600, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false},
  {x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false},
  {x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false},
  {x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false}
];
for (let i = 0; i < 15; i++) crates.push({x: 450 + (i % 3) * 60, y: 451, w: 34, h: 34, health: 2, flash: 0, dropped: false});
crates.push({x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false});
crates.push({x: -1000, y: 0, w: 0, h: 0, health: 0, flash: 0, dropped: false});
while (crates.length < roomPlatforms.length) crates.push({x:-1000,y:0,w:0,h:0,health:0,flash:0,dropped:false});
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
let logMessage = '', logTimer = 0, mapOpen = false, journalOpen = false, helpOpen = false, equipmentOpen = false, shopOpen = false, travelOpen = false, paused = false;
let money = 0, shopNotice = '', travelNotice = '';
const coins = [];
const merchant = {x: 25, y: 443, w: 28, h: 42};
const purchases = {piercer: false, fortress: false, magnet: false};
const allLogs = [logs[0], logs[1], secretLog, logs[2], shaftLog, bossLog, logs[4]];
const memoryGears = [
  {room: 0, x: 300, y: 375, w: 22, h: 22, collected: false},
  {room: 0, x: 790, y: 238, w: 22, h: 22, collected: false},
  {room: 1, x: 245, y: 233, w: 22, h: 22, collected: false},
  {room: 0, x: 85, y: 168, w: 22, h: 22, collected: false},
  {room: 2, x: 680, y: 228, w: 22, h: 22, collected: false},
  {room: 2, x: 865, y: 458, w: 22, h: 22, collected: false},
  {room: 2, x: 815, y: 158, w: 22, h: 22, collected: false},
  {room: 4, x: 680, y: 238, w: 22, h: 22, collected: false},
  {room: 6, x: 600, y: 248, w: 22, h: 22, collected: false},
  {room: 7, x: 350, y: 278, w: 22, h: 22, collected: false},
  {room: 8, x: 448, y: 163, w: 22, h: 22, collected: false}
];
const player = {x:90,y:420,w:30,h:42,vx:0,vy:0,grounded:false,facing:1};
const target = {x: 790, y: 432, w: 38, h: 53, flash: 0, hits: 0};
const enemy = {x: 500, y: 451, w: 34, h: 34, direction: 1, health: 3, flash: 0, stun: 0, state: 'patrol', timer: 0, cooldown: 0};
const drone = {x: 470, y: 270, w: 32, h: 24, direction: 1, health: 2, flash: 0, phase: 0, shotTimer: 120};
// A fresh branch enemy appears when its room is entered, just like other room enemies.
const branchEnemies = Array.from({length: 3}, () => ({x: -100, y: 0, w: 36, h: 34, health: 0, maxHealth: 3, direction: -1, state: 'idle', timer: 0, cooldown: 0, flash: 0, stun: 0, phase: 0, patrolMin: 0, patrolMax: 0, baseY: 0,
  shot: {x: 0, y: 0, w: 12, h: 12, vx: 0, vy: 0, life: 0, active: false}}));
// Keep the first enemy and its shot available to existing game checks.
const branchEnemy = branchEnemies[0], branchShot = branchEnemy.shot;
function resetBranchEnemy() {
  const specs = {
    6: [{x: 620, y: 451}, {x: 340, y: 451}, {x: 150, y: 451}],
    7: [{x: 250, y: 451}, {x: 510, y: 451}, {x: 740, y: 451}],
    8: [{x: 670, y: 315}, {x: 230, y: 315}, {x: 670, y: 210}]
  };
  branchEnemies.forEach((foe, i) => {
    let spec = isForestRoom() ? {x: room === 19 ? [120, 250, 750][i] : 180 + i * 260, y: 451} : specs[room] && specs[room][i];
    if (isForestRoom()) {
      const ground = roomPlatforms[room].filter(platform => platform.y === 485);
      const desired = spec.x;
      const choices = ground.filter(platform => platform.w >= 50).map(platform => Math.max(platform.x + 5, Math.min(platform.x + platform.w - 41, desired)));
      spec.x = choices.reduce((best, value) => Math.abs(value - desired) < Math.abs(best - desired) ? value : best, choices[0]);
    }
    Object.assign(foe, {x: -100, y: 0, health: 0, maxHealth: 3, direction: i === 1 ? 1 : -1, state: 'idle', timer: 0, cooldown: 0, flash: 0, stun: 0, phase: i * 1.7, patrolMin: 0, patrolMax: 0, baseY: 0});
    foe.shot.active = false;
    if (!spec) return;
    const health = (room === 8 || isForestRoom()) ? 2 : 3;
    foe.fruitType = isForestRoom() ? (room - 12 + i) % forestFruit.length : -1;
    Object.assign(foe, spec, {health, maxHealth: health, baseY: spec.y,
      patrolMin: Math.max(90, spec.x - (room === 8 ? 70 : 90)), patrolMax: Math.min(840, spec.x + (room === 8 ? 70 : 90)),
      cooldown: (room === 6 ? 80 : room === 7 ? 60 : 100) + i * 45});
  });
}
const steamShot = {x: 0, y: 0, w: 10, h: 14, active: false};
const flowerShot = {x: 0, y: 0, w: 14, h: 14, direction: 1, active: false};
let flowerCooldown = 120, flowerWarning = 0, flowerDirection = 1;
function resetMovingPlatform() {
  const platform = roomPlatforms[1].find(item => item.moving); platform.x = 650; platform.direction = 1;
  const fragile = roomPlatforms[1].find(item => item.crumble); fragile.standTime = 0; fragile.hidden = 0;
  const lift = roomPlatforms[2].find(item => item.lift); lift.y = 445; lift.direction = -1;
  const minePlatform = roomPlatforms[7].find(item => item.mineMoving); minePlatform.x = 510; minePlatform.direction = 1;
  const forestBridge = roomPlatforms[17].find(item => item.forestMoving); forestBridge.x = 390; forestBridge.direction = 1;
  const moving = roomPlatforms[5].find(item => item.courseMoving); moving.x = 510; moving.direction = 1; courseVent.cycle = 0;
  Object.assign(rollingGear, {x: 480, direction: 1, angle: 0}); weakWall.broken = false; weakWall.flash = 0; piston.cycle = 0; thorns.cycle = 0; steamCanister.available = true;
}
function resetDrone() { Object.assign(drone, {x: room === 2 ? 700 : 470, y: room === 2 ? 170 : 270, direction: 1, health: 2, flash: 0, phase: 0, shotTimer: 120}); steamShot.active = false; }
const core = {x: 757, y: 225, w: 26, h: 40};
const checkpoint = {x: 507, y: 284, w: 32, h: 46, activated: false};
const elevatorCheckpoint = {x: 455, y: 284, w: 32, h: 46, activated: false};
const greenhouseCheckpoint = {x: 445, y: 289, w: 32, h: 46, activated: false};
const townCheckpoint = {x: 350, y: 439, w: 32, h: 46, activated: false};
const forestCheckpoint = {x: 460, y: 439, w: 32, h: 46, activated: false};
const wildCheckpoint = {x:465,y:439,w:32,h:46,activated:false};
const dockCheckpoint = {x:310,y:439,w:32,h:46,activated:false};
const travelDestinations = [
  {id: 'boiler', name: '鍋爐室', room: 0, station: checkpoint},
  {id: 'elevator', name: '升降機井', room: 2, station: elevatorCheckpoint},
  {id: 'greenhouse', name: '廢棄溫室', room: 4, station: greenhouseCheckpoint},
  {id: 'town', name: '鐘樓鎮', room: 10, station: townCheckpoint},
  {id: 'forest', name: '果園休息地', room: 19, station: forestCheckpoint},
  {id:'wild',name:'獵者營地',room:32,station:wildCheckpoint},
  {id:'dock',name:'墜落廢塢',room:36,station:dockCheckpoint}
];
function nearbyStation() {
  return travelDestinations.find(destination => {
    const station = destination.station;
    return destination.room === room && station.activated && overlaps(player, {x: station.x - 20, y: station.y, w: station.w + 40, h: station.h});
  });
}
let postFall = false, childConversation = 0, familyStage = 0;
let townMenu = null, townNotice = '', townGuideMask = 0, townCloak = false, townPrizeCount = 0, townChildX = 130;
let townCloakStyle = 0, townCloakOwned = [false, false, false, false, false], townPrizes = [0, 0, 0, 0, 0];
const townGoods = [
  {name: '小型修理包', price: 8, health: 1}, {name: '雙重修理包', price: 14, health: 2},
  {name: '完整修理包', price: 18, health: 99}, {name: '蒸汽罐', price: 5, steam: 1}, {name: '大容量蒸汽罐', price: 12, steam: 3}
];
const townClothes = [
  {name: '暖紅披風', price: 15, color: '#a75548'}, {name: '深海披風', price: 18, color: '#466f91'},
  {name: '苔綠披風', price: 18, color: '#60865c'}, {name: '暮紫披風', price: 20, color: '#836389'},
  {name: '琥珀披風', price: 20, color: '#bc8a44'}
];
const townDolls = ['齒輪娃娃', '蒸汽小鳥', '鐘樓貓', '發條兔', '守衛玩偶'];
const townShops = [
  {id: 'general', name: '齒輪雜貨店', x: 230},
  {id: 'clothes', name: '縫時服飾店', x: 480},
  {id: 'claw', name: '星星抓娃娃屋', x: 730}
];
function townShopNear(shop) { return room === 10 && Math.abs(player.x + player.w / 2 - shop.x) < 55 && player.y + player.h > 420; }
function openTownShop(shop) {
  townMenu = shop.id; townNotice = ''; keys.clear();
  jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false;
}
function townShopAction(index) {
  if (townMenu === 'general') {
    const item = townGoods[index]; if (!item) return;
    if (item.health && health >= playerMaxHealth()) { townNotice = '生命已滿，不需要修理。'; return; }
    if (item.steam && steam >= 3) { townNotice = '蒸汽已滿，不需要補充。'; return; }
    if (money < item.price) { townNotice = '齒輪幣不足，需要 ' + item.price + ' 枚。'; return; }
    money -= item.price;
    if (item.health) { health = Math.min(playerMaxHealth(), health + item.health); healingGlow(); }
    else steam = Math.min(3, steam + item.steam);
    townNotice = '使用了' + item.name + '。';
  } else if (townMenu === 'clothes') {
    if (index === 5) { townCloakStyle = 0; townNotice = '已換回原本的破披風。'; saveProgress(); return; }
    const item = townClothes[index]; if (!item) return;
    if (!townCloakOwned[index]) {
      if (money < item.price) { townNotice = '齒輪幣不足，需要 ' + item.price + ' 枚。'; return; }
      money -= item.price; townCloakOwned[index] = true;
    }
    townCloakStyle = index + 1; townCloak = townCloakOwned[0];
    townNotice = '已穿上' + item.name + '。已購買的披風可免費換穿。';
  } else if (townMenu === 'claw') {
    const name = townDolls[index]; if (!name) return;
    if (money < 5) { townNotice = '齒輪幣不足，需要 5 枚才能遊玩。'; return; }
    money -= 5;
    const position = ambientTime % 120;
    if (position >= 45 && position <= 75) {
      townPrizes[index] = Math.min(999, townPrizes[index] + 1); townPrizeCount = townPrizes.reduce((sum, count) => sum + count, 0);
      townNotice = '抓到了' + name + '！這款收藏：' + townPrizes[index] + ' 隻。';
    } else townNotice = '差一點！光標進入綠色範圍時再選擇娃娃。';
  } else return;
  saveProgress(); playSound(500, .16, 'triangle', 700);
}
const child = {x: 545, y: 447, w: 24, h: 38};
let activeCheckpoint = null;
function checkpointSpawn() {
  if(dockFallPending)return {room:35,point:{x:600,y:443}};
  if(dockArrivalActive()||(dockEntered&&dockArrivalStage>0&&dockArrivalStage<=dockArrivalLines.length))return {room:36,point:dockCheckpoint};
  if(activeCheckpoint==='dock'&&dockCheckpoint.activated)return {room:36,point:dockCheckpoint};
  if (postFall && reunionStage >= 1 && reunionStage <= reunionLines.length) return {room: 10, point: {x: 100, y: 443}};
  if (postFall && farewellStage >= 1 && farewellStage <= farewellLines.length) return {room: 12, point: {x: 480, y: 443}};
  if (postFall && (familyStage === 6 || familyStage === 7)) return {room: 11, point: {x: 330, y: 443}};
  if (activeCheckpoint==='wild' && wildCheckpoint.activated) return {room:32,point:wildCheckpoint};
  if (postFall && activeCheckpoint === 'forest' && forestCheckpoint.activated) return {room: 19, point: forestCheckpoint};
  if (postFall && activeCheckpoint === 'town' && townCheckpoint.activated) return {room: 10, point: townCheckpoint};
  if (postFall && activeCheckpoint === 'greenhouse' && greenhouseCheckpoint.activated) return {room: 4, point: greenhouseCheckpoint};
  if (postFall && activeCheckpoint === 'elevator' && elevatorCheckpoint.activated) return {room: 2, point: elevatorCheckpoint};
  if (postFall && activeCheckpoint === 'boiler' && checkpoint.activated) return {room: 0, point: checkpoint};
  if (postFall && familyStage > 0) return {room: 11, point: {x: 330, y: 443}};
  if (postFall) return {room: 9, point: {x: 425, y: 443}};
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
let health = playerMaxHealth(), steam = 0, healQueued = false, invulnerability = 0, gameOver = false, won = false;
const HEAL_DURATION = 75, DEATH_DURATION = 54, RESPAWN_DURATION = 48;
let healTimer = 0, healGlowTimer = 0, deathTimer = 0, respawnTimer = 0;
let storyIntroTimer = 480;
let ambientTime = 0, endingTime = 0, roomTitleTimer = 180, saveFeedbackTimer = 0, shakeTimer = 0;
const sparks = [];
let dashQueued = false, dashTimer = 0, dashCooldown = 0, dashFacing = 1;
const equipment = {red: 'needle', blue: 'guard', yellow: 'regulator'};
const equipmentOptions = {
  red: [
    {id: 'needle', name: '蒸汽飛針', description: '快速遠射，消耗 1 次', unlocked: () => true},
    {id: 'pulse', name: '擴散蒸汽彈', description: '範圍較大，可擊散彈幕；消耗 1 次', unlocked: () => true},
    {id: 'piercer', name: '破甲飛針', description: '兩點傷害，較短射程；消耗 2 次', unlocked: () => coreCollected || purchases.piercer, hint: '取得動力核心或向商人購買'}
  ],
  blue: [
    {id: 'guard', name: '緩衝護甲', description: '受傷後保護約 1.6 秒', unlocked: () => true},
    {id: 'rotor', name: '疾轉齒輪', description: '揮劍間隔縮短至約 0.28 秒', unlocked: () => true},
    {id: 'fortress', name: '強韌護甲', description: '保護約 2.1 秒，移速降低 10%', unlocked: () => memoryGears.filter(gear => gear.collected).length >= 2 || purchases.fortress, hint: '收集兩枚記憶齒輪或向商人購買'}
  ],
  yellow: [
    {id: 'regulator', name: '壓力調節器', description: '蒸汽衝刺恢復得更快', unlocked: () => true},
    {id: 'springboots', name: '輕量彈簧靴', description: '左右移動速度稍微加快', unlocked: () => true},
    {id: 'magnet', name: '磁吸裝置', description: '從更遠的位置收集記憶齒輪', unlocked: () => bossDefeated || purchases.magnet, hint: '擊敗蒸汽守衛或向商人購買'}
  ]
};
const shopItems = [
  {slot: 'red', id: 'piercer', price: 25, name: '破甲飛針'},
  {slot: 'blue', id: 'fortress', price: 30, name: '強韌護甲'},
  {slot: 'yellow', id: 'magnet', price: 35, name: '磁吸裝置'}
];
function buyShopItem(index) {
  const offer = shopItems[index];
  if (!offer) return;
  const item = equipmentOptions[offer.slot].find(option => option.id === offer.id);
  if (item.unlocked()) { shopNotice = offer.name + '已解鎖，可到休息站裝備。'; return; }
  if (money < offer.price) { shopNotice = '齒輪幣不足，無法購買' + offer.name + '。'; return; }
  money -= offer.price; purchases[offer.id] = true; saveProgress();
  shopNotice = '已解鎖' + offer.name + '，到休息站按 I 裝備。'; playSound(520, .2, 'sine', 760);
}
function dropCoins(x, y, value) {
  coins.push({x: x - 7, y: y - 7, w: 14, h: 14, vy: -2, value});
}
const toolProjectile = {x: 0, y: 0, w: 0, h: 0, vx: 0, life: 0, active: false, type: 'needle'};
let toolAmmo = 4, toolQueued = false, equipmentNotice = '';
function resetEquipment() { Object.assign(equipment, {red: 'needle', blue: 'guard', yellow: 'regulator'}); toolAmmo = 4; toolQueued=false; spearQueued=false; toolProjectile.active = false; }
function selectEquipment(slot, item) {
  if (!item.unlocked()) { equipmentNotice = item.hint || '工具尚未解鎖'; return; }
  equipment[slot] = item.id;
  equipmentNotice = '已裝備：' + item.name;
  saveProgress();
}
function cycleEquipment(slot) {
  const available = equipmentOptions[slot].filter(item => item.unlocked());
  const index = available.findIndex(item => item.id === equipment[slot]);
  selectEquipment(slot, available[(index + 1) % available.length]);
}
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
const equipmentButton = document.querySelector('#equipment-button');
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
const controls = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','KeyR','KeyE','KeyQ','KeyV','KeyJ','KeyM','KeyH','KeyI','KeyF','KeyG','KeyT','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Tab','Escape','ShiftLeft','ShiftRight'];
window.addEventListener('keydown', e => {
  unlockAudio();
  if (controls.includes(e.code)) e.preventDefault();
  if(dockFallTick>=0 && !['Escape','KeyM'].includes(e.code))return;
  if(dockArrivalActive()){if(!e.repeat&&e.code==='KeyE'){dockArrivalStage++;keys.clear();saveProgress();}return;}
  if(duelIntroActive()) {
    if(!e.repeat && e.code==='KeyE'){duelIntroIndex++;keys.clear();if(!duelIntroActive()){logMessage='留意她的招架姿勢，避開突刺後反擊。';logTimer=180;}}
    return;
  }
  if (reunionActive()) {
    if (!e.repeat && e.code === 'KeyE') {
      reunionStage++; keys.clear();
      if (reunionStage > reunionLines.length) { logMessage = '小孩開心地和主角並肩走在鐘樓鎮。'; logTimer = 200; }
      saveProgress();
    }
    return;
  }
  if (farewellActive()) {
    if (!e.repeat && e.code === 'KeyE') {
      farewellStage++; keys.clear();
      if (farewellStage > farewellLines.length) { logMessage = '小孩回到鐘樓鎮了。爬上平台，獨自穿過樹門。'; logTimer = 220; }
      saveProgress();
    }
    return;
  }
  if (e.code === 'Escape') {
    if (!e.repeat && !gameOver && !won) {
      if (mapOpen) mapOpen = false;
      else if (journalOpen) journalOpen = false;
      else if (helpOpen) helpOpen = false;
      else if (equipmentOpen) equipmentOpen = false;
      else if (shopOpen) shopOpen = false;
      else if (townMenu) townMenu = null;
      else if (travelOpen) travelOpen = false;
      else { paused = !paused; pauseButton.textContent = paused ? '繼續' : '暫停'; }
      keys.clear(); jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false;
    }
    return;
  }
  if (e.code === 'KeyM') { if (!e.repeat) soundButton.click(); return; }
  if (e.code === 'KeyH') {
    if (!e.repeat && !gameOver && !won) {
      helpOpen = !helpOpen; mapOpen = false; journalOpen = false; equipmentOpen = false; shopOpen = false; travelOpen = false; townMenu = null; keys.clear();
      jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false;
    }
    return;
  }
  if (room === 11 && (familyStage === 6 || familyStage === 7)) {
    if (!e.repeat && e.code === 'KeyE') {
      if (familyStage === 6) {
        familyStage = 7; logTimer = 0;
      } else {
        familyStage = 8; health = playerMaxHealth(); steam = 0; player.vx = 0; player.vy = 0;
        Object.assign(player, {x: 330, y: 443, grounded: true, facing: 1});
        logMessage = '媽媽：「早安。你醒了，感覺好些了嗎？」'; logTimer = 240;
      }
      keys.clear(); saveProgress();
    }
    return;
  }
  if (won && !e.repeat && e.code === 'KeyE' && endingTime >= 660) { beginAfterFall(); return; }
  if (paused || helpOpen || deathTimer > 0 || respawnTimer > 0) return;
  if (townMenu) {
    if (!e.repeat && /^Digit[1-6]$/.test(e.code)) townShopAction(Number(e.code.slice(-1)) - 1);
    return;
  }
  if (travelOpen) {
    if (!e.repeat && e.code === 'KeyG') { travelOpen = false; return; }
    if (!e.repeat && e.code === 'KeyI') { travelOpen = false; equipmentOpen = true; equipmentNotice = ''; return; }
    if (!e.repeat && e.code === 'Digit1') travelTo(0);
    if (!e.repeat && e.code === 'Digit2') travelTo(1);
    if (!e.repeat && e.code === 'Digit3') travelTo(2);
    if (!e.repeat && e.code === 'Digit4') travelTo(3);
    if (!e.repeat && e.code === 'Digit5') travelTo(4);
    if (!e.repeat && e.code === 'Digit6') travelTo(5);
    if (!e.repeat && e.code === 'Digit7') travelTo(6);
    return;
  }
  if (shopOpen) {
    if (!e.repeat && e.code === 'KeyI') { shopNotice = '請到已啟動的休息站更換裝備。'; return; }
    if (!e.repeat && e.code === 'Digit1') buyShopItem(0);
    if (!e.repeat && e.code === 'Digit2') buyShopItem(1);
    if (!e.repeat && e.code === 'Digit3') buyShopItem(2);
    return;
  }
  if (e.code === 'KeyI') {
    if (!e.repeat && !gameOver && !won) {
      if (!equipmentOpen && !nearbyStation()) { logMessage = '請到已啟動的休息站附近更換裝備。'; logTimer = 150; return; }
      equipmentOpen = !equipmentOpen; mapOpen = false; journalOpen = false; keys.clear();
      jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false;
      equipmentNotice = '';
    }
    return;
  }
  if (equipmentOpen) {
    if (!e.repeat && e.code === 'Digit1') cycleEquipment('red');
    if (!e.repeat && e.code === 'Digit2') cycleEquipment('blue');
    if (!e.repeat && e.code === 'Digit3') cycleEquipment('yellow');
    return;
  }
  if (e.code === 'KeyJ') {
    if (!e.repeat && !gameOver && !won) {
      journalOpen = !journalOpen; mapOpen = false; keys.clear(); jumpQueued = false; jumpBuffer = 0;
      attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false;
    }
    return;
  }
  if (journalOpen) return;
  if (e.code === 'Tab') {
    if (!e.repeat && !gameOver && !won) {
      mapOpen = !mapOpen; keys.clear(); jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false;
    }
    return;
  }
  if (mapOpen) return;
  if (!e.repeat && e.code === 'KeyG' && !gameOver && !won) {
    if (!nearbyStation()) { logMessage = '請靠近已啟動的休息站使用傳送。'; logTimer = 150; }
    else { travelOpen = true; travelNotice = ''; keys.clear(); healTimer = 0; jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false; }
    return;
  }
  if (!e.repeat && e.code === 'KeyT' && room===34 && !gameOver && !won) { startPogoRun('重新開始下劈試煉。'); return; }
  if (!e.repeat && e.code === 'KeyT' && room === 5 && !gameOver && !won) { startCourse('重新開始跑酷！'); return; }
  if (!e.repeat && e.code === 'KeyE') interactQueued = true;
  if (!e.repeat && e.code === 'KeyQ') healQueued = true;
  if (!e.repeat && e.code==='KeyV') spearQueued=true;
  if (!e.repeat && e.code === 'KeyF') { if (postFall) { logMessage = '工具在墜落時損壞了。'; logTimer = 120; } else toolQueued = true; }
  if (!e.repeat && e.code === 'KeyR' && (gameOver || won)) resetGame();
  if (!e.repeat && (e.code === 'ShiftLeft' || e.code === 'ShiftRight')) { if (postFall && !importantGear1) { logMessage = '蒸汽衝刺在墜落時損壞了。'; logTimer = 120; } else dashQueued = true; }
  if (!e.repeat && ['Space','ArrowUp','KeyW'].includes(e.code)) jumpQueued = true;
  keys.add(e.code);
});
canvas.addEventListener('mousedown', e => {
  unlockAudio();
  if (dockFallTick>=0 || dockArrivalActive() || farewellActive() || reunionActive() || duelIntroActive()) return;
  if (e.button !== 0 || deathTimer > 0 || respawnTimer > 0 || gameOver || won) return;
  if (townMenu) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * canvas.width / rect.width, y = (e.clientY - rect.top) * canvas.height / rect.height;
    if (x >= 220 && x <= 740 && y >= 235 && y < 460) {
      const index = Math.floor((y - 235) / 45);
      if (y < 235 + index * 45 + 40) townShopAction(index);
    } else if (townMenu === 'clothes' && x >= 220 && x <= 740 && y >= 460 && y < 490) townShopAction(5);
    return;
  }
  if (travelOpen) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * canvas.width / rect.width;
    const y = (e.clientY - rect.top) * canvas.height / rect.height;
    const index = Math.floor((y - 125) / 56);
    if (x >= 220 && x <= 740 && index >= 0 && index < travelDestinations.length && y < 125 + index * 56 + 50) travelTo(index);
    return;
  }
  if (shopOpen) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * canvas.width / rect.width;
    const y = (e.clientY - rect.top) * canvas.height / rect.height;
    const index = Math.floor((y - 150) / 75);
    if (x >= 220 && x <= 740 && index >= 0 && index < shopItems.length && y < 150 + index * 75 + 65) buyShopItem(index);
    return;
  }
  if (equipmentOpen) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * canvas.width / rect.width;
    const y = (e.clientY - rect.top) * canvas.height / rect.height;
    const slotIndex = Math.floor((x - 35) / 305);
    const itemIndex = Math.floor((y - 158) / 65);
    if (slotIndex >= 0 && slotIndex < 3 && x >= 35 + slotIndex * 305 && x <= 315 + slotIndex * 305 && itemIndex >= 0 && itemIndex < 3) {
      const slot = ['red', 'blue', 'yellow'][slotIndex];
      selectEquipment(slot, equipmentOptions[slot][itemIndex]);
    }
    return;
  }
  if (!mapOpen && !journalOpen && !helpOpen && !shopOpen && !travelOpen && !paused) attackQueued = true;
});
window.addEventListener('keyup', e => {
  keys.delete(e.code);
  if (!paused && !mapOpen && !journalOpen && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen && variableJump && ['Space', 'ArrowUp', 'KeyW'].includes(e.code)
      && !['Space', 'ArrowUp', 'KeyW'].some(code => keys.has(code))) {
    if (player.vy < -5) player.vy = -5;
    variableJump = false;
  }
});
window.addEventListener('blur', () => { if (!gameOver && !won && !mapOpen && !journalOpen && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen) { paused = true; pauseButton.textContent = '繼續'; } keys.clear(); jumpQueued = false; jumpBuffer = 0; attackQueued = false; dashQueued = false; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false; });
function saveProgress() {
  try {
    localStorage.setItem(saveKey, JSON.stringify({postFall, childConversation, familyStage, townGuideMask, townCloak, townPrizeCount, townCloakOwned, townCloakStyle, townPrizes, visitedRooms, checkpoint: checkpoint.activated, elevatorCheckpoint: elevatorCheckpoint.activated, greenhouseCheckpoint: greenhouseCheckpoint.activated, forestBossKey, forestBossDefeated, forestSeedOwned, forestSeedPlanted, importantGear1, farewellStage, reunionStage, townCheckpoint: townCheckpoint.activated, forestCheckpoint: forestCheckpoint.activated, wildCheckpoint:wildCheckpoint.activated, wildGauntletCleared, wildPogoRewardClaimed, altar1Claimed, duelistDefeated, dockEntered, dockFallPending, dockArrivalStage, dockShortcut, dockCheckpoint:dockCheckpoint.activated, activeCheckpoint, core: coreCollected, reactor: reactorPowered, bossDefeated, money, purchases, courseBestTicks, courseRewardClaimed, doubleJump: doubleJumpUnlocked, loadout: equipment, toolAmmo, gears: memoryGears.map(gear => gear.collected), logs: allLogs.map(log => log.read === true)}));
    storageAvailable = true; saveFeedbackTimer = 120;
  } catch (error) { storageAvailable = false; }
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    storyIntroTimer = 0;
    postFall = saved.postFall === true;
    familyStage = Number.isInteger(saved.familyStage) ? Math.max(0, Math.min(8, saved.familyStage)) : 0;
    townGuideMask = Number.isInteger(saved.townGuideMask) ? saved.townGuideMask & 7 : 0;
    townCloak = saved.townCloak === true;
    townPrizeCount = Number.isSafeInteger(saved.townPrizeCount) ? Math.max(0, Math.min(999, saved.townPrizeCount)) : 0;
    townCloakOwned = Array.isArray(saved.townCloakOwned) ? townClothes.map((_, i) => saved.townCloakOwned[i] === true) : [townCloak, false, false, false, false];
    townCloak = townCloakOwned[0];
    townCloakStyle = Number.isInteger(saved.townCloakStyle) && saved.townCloakStyle >= 0 && saved.townCloakStyle <= 5 && (saved.townCloakStyle === 0 || townCloakOwned[saved.townCloakStyle - 1]) ? saved.townCloakStyle : (townCloak ? 1 : 0);
    townPrizes = Array.isArray(saved.townPrizes) ? townDolls.map((_, i) => Number.isSafeInteger(saved.townPrizes[i]) ? Math.max(0, Math.min(999, saved.townPrizes[i])) : 0) : [townPrizeCount, 0, 0, 0, 0];
    townPrizeCount = townPrizes.reduce((sum, count) => sum + count, 0);
    childConversation = Number.isInteger(saved.childConversation) ? Math.max(0, Math.min(4, saved.childConversation)) : 0;
    checkpoint.activated = saved.checkpoint === true;
    elevatorCheckpoint.activated = saved.elevatorCheckpoint === true;
    greenhouseCheckpoint.activated = saved.greenhouseCheckpoint === true;
    townCheckpoint.activated = saved.townCheckpoint === true;
    forestCheckpoint.activated = saved.forestCheckpoint === true;
    altar1Claimed=saved.altar1Claimed===true;duelistDefeated=saved.duelistDefeated===true;
    wildCheckpoint.activated=saved.wildCheckpoint===true; wildGauntletCleared=saved.wildGauntletCleared===true; wildPogoRewardClaimed=saved.wildPogoRewardClaimed===true;
    dockEntered=saved.dockEntered===true;dockFallPending=duelistDefeated&&!dockEntered;dockFallTick=-1;
    dockArrivalStage=Number.isInteger(saved.dockArrivalStage)?Math.max(0,Math.min(4,saved.dockArrivalStage)):0;
    dockShortcut=dockEntered&&saved.dockShortcut===true;dockCheckpoint.activated=dockEntered;
    activeCheckpoint = ['boiler', 'elevator', 'greenhouse', 'town', 'forest', 'wild', 'dock'].includes(saved.activeCheckpoint) ? saved.activeCheckpoint : null;
    coreCollected = saved.core === true;
    reactorPowered = saved.reactor === true;
    bossDefeated = saved.bossDefeated === true;
    forestBossKey = saved.forestBossKey === true; forestBossDefeated = saved.forestBossDefeated === true;
    importantGear1 = saved.importantGear1 === true || (saved.importantGear1 === undefined && forestBossDefeated);
    forestSeedPlanted = saved.forestSeedPlanted === true;
    farewellStage = Number.isInteger(saved.farewellStage) ? Math.max(0, Math.min(farewellLines.length + 1, saved.farewellStage)) : (forestSeedPlanted ? 1 : 0);
    if (!forestSeedPlanted) farewellStage = 0;
    reunionStage = Number.isInteger(saved.reunionStage) ? Math.max(0, Math.min(reunionLines.length + 1, saved.reunionStage)) : 0;
    forestSeedOwned = !forestSeedPlanted && (saved.forestSeedOwned === true || (saved.forestSeedOwned === undefined && forestBossDefeated));
    courseBestTicks = Number.isSafeInteger(saved.courseBestTicks) && saved.courseBestTicks > 0 ? saved.courseBestTicks : null;
    courseRewardClaimed = saved.courseRewardClaimed === true;
    money = Number.isSafeInteger(saved.money) ? Math.max(0, Math.min(999999, saved.money)) : 0;
    if (saved.purchases && typeof saved.purchases === 'object') { for (const id of ['piercer', 'fortress', 'magnet']) purchases[id] = saved.purchases[id] === true; }
    doubleJumpUnlocked = saved.doubleJump === true;
    if (Array.isArray(saved.gears)) memoryGears.forEach((gear, i) => { gear.collected = saved.gears[i] === true; });
    if (Array.isArray(saved.logs)) allLogs.forEach((log, i) => { log.read = saved.logs[i] === true; });
    if (bossDefeated) bossLog.read = true;
    if (saved.loadout && typeof saved.loadout === 'object') {
      for (const slot of ['red', 'blue', 'yellow']) {
        const selected = equipmentOptions[slot].find(item => item.id === saved.loadout[slot] && item.unlocked());
        if (selected) equipment[slot] = selected.id;
      }
    }
    if (Number.isInteger(saved.toolAmmo)) toolAmmo = Math.max(0, Math.min(4, saved.toolAmmo));
    if (Array.isArray(saved.visitedRooms)) visitedRooms = visitedRooms.map((_, i) => i === 0 || saved.visitedRooms[i] === true);
    else {
      // Older saves did not record visits; restore only places their progress proves were reached.
      visitedRooms = [true, reactorPowered || doubleJumpUnlocked || memoryGears.some(g => g.room === 1 && g.collected) || allLogs[1].read,
        reactorPowered || elevatorCheckpoint.activated || bossDefeated, bossDefeated || allLogs[5].read,
        greenhouseCheckpoint.activated || memoryGears[7].collected || allLogs[6].read || courseRewardClaimed, courseRewardClaimed || courseBestTicks !== null, false, false, false, false, false, false];
    }
    while (visitedRooms.length < roomPlatforms.length) visitedRooms.push(false);
    if (postFall) { doubleJumpUnlocked = false; resetEquipment(); toolAmmo = 0; }
    health=playerMaxHealth();
    const savedSpawn = checkpointSpawn();
    visitedRooms[savedSpawn.room] = true;
    room = savedSpawn.room; player.x = savedSpawn.point.x; player.y = savedSpawn.point.y;
    if (farewellActive()) townChildX = Math.max(60, player.x - 55);
    if (room === 10 && visitedRooms[28] && farewellStage > farewellLines.length && reunionStage === 0) { reunionStage = 1; saveProgress(); }
    if (reunionActive()) townChildX = Math.min(870, player.x + 55);
    if (room === 2) resetDrone();
    resetWildRoom();
  } catch (error) { storageAvailable = false; }
}
function resetGame() {
  resetIronSpear();
  wallJumpLock = 0;
  const returningFromDeath = gameOver;
  if (won) { postFall = false; childConversation = 0; familyStage = 0; townGuideMask = 0; townCloak = false; townPrizeCount = 0; townCloakStyle = 0; townCloakOwned = [false, false, false, false, false]; townPrizes = [0, 0, 0, 0, 0]; storyIntroTimer = 480; visitedRooms = Array.from({length: roomPlatforms.length}, (_, i) => i === 0); checkpoint.activated = false; elevatorCheckpoint.activated = false; greenhouseCheckpoint.activated = false; townCheckpoint.activated = false; forestCheckpoint.activated = false; wildCheckpoint.activated=false; wildGauntletCleared=false; wildPogoRewardClaimed=false; altar1Claimed=false;duelistDefeated=false;dockEntered=false;dockFallPending=false;dockFallTick=-1;dockArrivalStage=0;dockShortcut=false;dockCheckpoint.activated=false; activeCheckpoint = null; coreCollected = false; reactorPowered = false; bossDefeated = false; forestBossKey = false; forestBossDefeated = false; forestSeedOwned = false; forestSeedPlanted = false; importantGear1 = false; farewellStage = 0; reunionStage = 0; doubleJumpUnlocked = false; courseBestTicks = null; courseRewardClaimed = false; money = 0; Object.assign(purchases, {piercer: false, fortress: false, magnet: false}); memoryGears.forEach(gear => { gear.collected = false; }); allLogs.forEach(log => { log.read = false; }); resetEquipment(); saveProgress(); }
  courseRunning = false; courseFinished = false; courseTicks = 0;
  coins.length = 0; sparks.length = 0; endingTime = 0; shakeTimer = 0; roomTitleTimer = 180; controlSwitch.active = false;
  const savedSpawn = checkpointSpawn();
  townMenu = null;
  room = savedSpawn.room; interactQueued = false; logMessage = ''; logTimer = 0; mapOpen = false; journalOpen = false; helpOpen = false; equipmentOpen = false; shopOpen = false; travelOpen = false; paused = false; pauseButton.textContent = '暫停';
  const spawn = savedSpawn.point;
  Object.assign(player, {x: spawn.x, y: spawn.y, vx: 0, vy: 0, grounded: false, facing: 1});
  Object.assign(enemy, {x: 500, direction: 1, health: 3, flash: 0, stun: 0, state: 'patrol', timer: 0, cooldown: 0});
  resetDrone(); resetMovingPlatform(); resetBoss(); resetBranchEnemy(); resetWildRoom(); flowerShot.active = false; flowerCooldown = 120; flowerWarning = 0;
  repair.available = false; vent.cycle = 0; sideVent.cycle = 0; spring.flash = 0; supply.available = true; resetCrates();
  healTimer = 0; healGlowTimer = 0; deathTimer = 0; respawnTimer = returningFromDeath ? RESPAWN_DURATION : 0;
  health = playerMaxHealth(); steam = 0; toolAmmo = postFall ? 0 : 4; toolProjectile.active = false; toolQueued=false; spearQueued=false; saveProgress(); doubleJumpUsed = false; healQueued = false; invulnerability = returningFromDeath ? 60 : 0; gameOver = false; won = false; dashQueued = false; dashTimer = 0; dashCooldown = 0; attackTimer = 0; attackCooldown = 0; attackQueued = false; jumpQueued = false; jumpBuffer = 0; coyoteTime = 0; variableJump = false; keys.clear();
}
function beginAfterFall() {
  postFall = true; importantGear1 = false; activeCheckpoint = null; childConversation = 0; won = false; doubleJumpUnlocked = false; resetEquipment(); toolAmmo = 0;
  health = playerMaxHealth(); steam = 0; invulnerability = 0; keys.clear();
  jumpQueued = false; jumpBuffer = 0; dashQueued = false; dashTimer = 0; attackQueued = false; toolQueued=false; spearQueued=false; healQueued = false; interactQueued = false;
  changeRoom(9);
  Object.assign(player, {x: 425, y: 443, vx: 0, vy: 0, grounded: true, facing: 1});
  logMessage = '墜落損壞了大部分能力；靠近小孩按 E 交談。'; logTimer = 240;
  saveProgress();
}
function changeRoom(nextRoom) {
  resetIronSpear();
  wallJumpLock = 0;
  playSound(220, 0.18, 'triangle', 440);
  const previousRoom = room;
  healTimer = 0; healGlowTimer = 0;
  room = nextRoom;
  townMenu = null;
  if (!visitedRooms[room]) { visitedRooms[room] = true; saveProgress(); }
  courseRunning = room === 5; courseFinished = false; courseTicks = 0; roomTitleTimer = 180; shakeTimer = 0; logMessage = ''; logTimer = 0; coins.length = 0; sparks.length = 0; controlSwitch.active = false;
  if (previousRoom === 10 && nextRoom === 12) {
    townChildX = 125; logMessage = '小孩：「那邊就是水果森林！我陪你一起去。」'; logTimer = 220;
  }
  if (nextRoom === 11 && previousRoom === 10) {
    if (familyStage === 0) familyStage = 1;
    logMessage = '小孩：「爸爸、媽媽！我帶朋友回來了！」'; logTimer = 240; saveProgress();
  }
  if (nextRoom === 10 && previousRoom === 9) {
    townChildX = 130;
    logMessage = '小孩：「歡迎來到鐘樓鎮！跟我一起看看吧。」'; logTimer = 200;
  }
  const enteringFromLeft = nextRoom > previousRoom;
  const branchTransition = (previousRoom === 0 && nextRoom === 6) || (previousRoom >= 6 && previousRoom <= 8 && nextRoom >= 6 && nextRoom <= 8) || (previousRoom === 6 && nextRoom === 0);
  const returningToShaft = previousRoom === 3 && nextRoom === 2;
  Object.assign(player, {x: returningToShaft ? 805 : enteringFromLeft ? 70 : 820, y: returningToShaft ? 143 : 443, vx: 0, vy: 0, grounded: true, facing: enteringFromLeft ? 1 : -1});
  if (previousRoom===34 && nextRoom===31) Object.assign(player,{x:wildPogoGate.x+5,y:298,facing:-1});
  if (previousRoom === 28 && nextRoom === 12) Object.assign(player, {x: seedGate.x + 8, y: 298, facing: -1});
  if (previousRoom === 12 && nextRoom === 10) Object.assign(player, {x: forestGate.x + 8, y: 353, facing: -1});
  if (nextRoom === 10 && visitedRooms[28] && farewellStage > farewellLines.length && reunionStage === 0) {
    reunionStage = 1; townChildX = Math.min(870, player.x + 55); player.vx = 0; keys.clear(); saveProgress();
  }
  if (branchTransition) {
    if (nextRoom === 0) Object.assign(player, {x: branchDoor.x + 10, y: 153, facing: 1});
    else Object.assign(player, {x: nextRoom > previousRoom || previousRoom === 0 ? 820 : 70, y: 443, facing: nextRoom > previousRoom || previousRoom === 0 ? -1 : 1});
  }
  Object.assign(enemy, {x: 500, direction: 1, health: 3, flash: 0, stun: 0, state: 'patrol', timer: 0, cooldown: 0});
  resetDrone(); resetMovingPlatform(); resetBoss(); resetBranchEnemy(); resetWildRoom(); flowerShot.active = false; flowerCooldown = 120; flowerWarning = 0;
  repair.available = false; vent.cycle = 0; sideVent.cycle = 0; spring.flash = 0; supply.available = true; resetRoomCrate(); toolProjectile.active = false; toolQueued=false; spearQueued=false; dashTimer = 0; jumpBuffer = 0; coyoteTime = 0; variableJump = false; doubleJumpUsed = false; attackTimer = 0;
}
function startCourse(message) {
  wallJumpLock = 0;
  if (room !== 5) return;
  courseRunning = true; courseFinished = false; courseTicks = 0; courseVent.cycle = 0;
  const moving = roomPlatforms[5].find(item => item.courseMoving); moving.x = 510; moving.direction = 1;
  Object.assign(player, {x: 70, y: 443, vx: 0, vy: 0, grounded: true, facing: 1});
  keys.clear(); jumpQueued = false; jumpBuffer = 0; coyoteTime = 0; dashQueued = false; dashTimer = 0;
  attackQueued = false; toolQueued=false; spearQueued=false; healQueued = false; healTimer = 0; toolProjectile.active = false;
  logMessage = message; logTimer = 120;
}
function travelTo(index) {
  const destination = travelDestinations[index];
  if (!destination) return;
  if (!destination.station.activated) { travelNotice = '尚未啟動這個休息站。'; return; }
  if (destination.room === room) { travelNotice = '你已經在這個休息站。'; return; }
  travelOpen = false;
  changeRoom(destination.room);
  Object.assign(player, {x: destination.station.x, y: destination.station.y, vx: 0, vy: 0, grounded: false, facing: 1});
  if (reunionActive()) townChildX = Math.min(870, player.x + 55);
  activeCheckpoint = destination.id; respawnTimer = RESPAWN_DURATION; invulnerability = 60;
  saveProgress(); logMessage = '抵達' + destination.name + '休息站；可按 E 休息。'; logTimer = 180;
  playSound(300, .3, 'sine', 650);
}
function sendControl(code, kind) {
  window.dispatchEvent(new KeyboardEvent(kind, {code, bubbles: true, cancelable: true}));
}
pauseButton.addEventListener('click', () => sendControl('Escape', 'keydown'));
helpButton.addEventListener('click', () => sendControl('KeyH', 'keydown'));
equipmentButton.addEventListener('click', () => sendControl('KeyI', 'keydown'));
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
  if (!window.confirm('確定重新開始嗎？已儲存的休息站、能力、齒輪幣、購買與紀錄進度都會清除。')) return;
  storyIntroTimer = 480;
  postFall = false; childConversation = 0; familyStage = 0; townGuideMask = 0; townCloak = false; townPrizeCount = 0; townCloakStyle = 0; townCloakOwned = [false, false, false, false, false]; townPrizes = [0, 0, 0, 0, 0]; townMenu = null;
  visitedRooms = Array.from({length: roomPlatforms.length}, (_, i) => i === 0);
  checkpoint.activated = false; elevatorCheckpoint.activated = false; greenhouseCheckpoint.activated = false; townCheckpoint.activated = false; forestCheckpoint.activated = false; wildCheckpoint.activated=false; wildGauntletCleared=false; wildPogoRewardClaimed=false; altar1Claimed=false;duelistDefeated=false;dockEntered=false;dockFallPending=false;dockFallTick=-1;dockArrivalStage=0;dockShortcut=false;dockCheckpoint.activated=false; activeCheckpoint = null; coreCollected = false; reactorPowered = false; bossDefeated = false; forestBossKey = false; forestBossDefeated = false; forestSeedOwned = false; forestSeedPlanted = false; importantGear1 = false; farewellStage = 0; reunionStage = 0; doubleJumpUnlocked = false; courseBestTicks = null; courseRewardClaimed = false; money = 0; Object.assign(purchases, {piercer: false, fortress: false, magnet: false});
  memoryGears.forEach(gear => { gear.collected = false; }); allLogs.forEach(log => { log.read = false; }); resetEquipment();
  won = false; resetGame(); saveProgress();
});
function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
// The right-hand branch doors are reachable from the adjacent raised platform,
// even before the player has dropped to the bottom of the doorway.
function nearBranchReturnDoor() {
  return overlaps(player, {x: door.x - 40, y: door.y - 55, w: door.w + 40, h: door.h + 55});
}
function addSparks(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    sparks.push({x, y, vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5 - 1, life: 16, color});
  }
}
function damageEnemy(grantsSteam) {
  enemy.health--; if (grantsSteam) steam = Math.min(3, steam + 1);
  enemy.flash = 10; enemy.stun = 12; shakeTimer = 5;
  enemy.x = Math.max(60, Math.min(866, enemy.x + (player.x < enemy.x ? 12 : -12)));
  if (room === 1) { enemy.state = 'patrol'; enemy.cooldown = 60; }
  addSparks(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#f4c575'); playSound(110, .12, 'square', 65);
  if (enemy.health <= 0) {
    if (room === 4) { flowerShot.active = false; flowerWarning = 0; }
    repair.x = enemy.x + (enemy.w - repair.w) / 2; repair.available = true; dropCoins(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 5);
    addSparks(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#f6a957'); playSound(180, .22, 'sawtooth', 55);
  }
}
function damageBranchEnemy(grantsSteam, branchEnemy) {
  if (branchEnemy.health <= 0) return;
  branchEnemy.health--; branchEnemy.flash = 10; branchEnemy.stun = 12;
  branchEnemy.state = 'idle'; branchEnemy.cooldown = 75; branchEnemy.timer = 0;
  if (grantsSteam) steam = Math.min(3, steam + 1);
  shakeTimer = 5; addSparks(branchEnemy.x + branchEnemy.w / 2, branchEnemy.y + branchEnemy.h / 2, '#f4c575');
  playSound(150, .12, 'square', 80);
  if (branchEnemy.health === 0) {
    dropCoins(branchEnemy.x + branchEnemy.w / 2, branchEnemy.y + branchEnemy.h / 2, room === 8 ? 4 : 5);
    addSparks(branchEnemy.x + branchEnemy.w / 2, branchEnemy.y + branchEnemy.h / 2, '#f6a957');
    playSound(180, .22, 'sawtooth', 55);
  }
}
function damageWildEnemy(foe, grantsSteam) {
  if (foe.health<=0) return;
  foe.health--; foe.flash=10; foe.stun=12; foe.state='recover'; foe.timer=65;
  if (grantsSteam) steam=Math.min(3,steam+1);
  addSparks(foe.x+17,foe.y+18,'#b8ef83'); shakeTimer=4; playSound(160,.1,'square',95);
  if (foe.health===0) { foe.shot.active=false; dropCoins(foe.x+17,foe.y+18,5); }
}
function updateDockEnemy(foe){
  if(foe.flash>0)foe.flash--;
  if(foe.cooldown>0)foe.cooldown--;
  if(foe.stun>0)foe.stun--;
  else if(foe.state==='recover'){
    if(--foe.timer<=0){foe.state='patrol';foe.cooldown=115;}
  }else if(foe.state==='warning'){
    if(foe.type===2)foe.x+=Math.max(-2.6,Math.min(2.6,foe.targetX-17-foe.x));
    if(--foe.timer<=0){
      if(foe.type===0)Object.assign(foe.shot,{active:true,kind:'shock',x:foe.x+17,y:469,w:42,h:16,vx:foe.direction*4.3,vy:0,life:55});
      else if(foe.type===1){const dx=foe.targetX-foe.x-17;Object.assign(foe.shot,{active:true,kind:'slag',x:foe.x+9,y:foe.y+5,w:18,h:18,vx:dx/52,vy:-7.8,life:110});}
      else Object.assign(foe.shot,{active:true,kind:'beam',x:foe.x+5,y:foe.y+34,w:24,h:Math.max(16,485-foe.y-34),vx:0,vy:0,life:28});
      foe.state='recover';foe.timer=foe.type===0?85:130;playSound(foe.type===2?640:110,.2,'sawtooth',foe.type===2?220:60);
    }
  }else{
    foe.phase+=.04;
    if(foe.type===0){foe.x+=foe.direction*.45;if(foe.x<=foe.minX||foe.x>=foe.maxX)foe.direction*=-1;}
    if(foe.type===2){foe.x=foe.homeX+Math.sin(foe.phase*.7)*65;foe.y=foe.homeY+Math.sin(foe.phase)*18;}
    const dx=player.x+15-foe.x-17,dy=player.y-foe.y;
    if(foe.cooldown===0&&!foe.shot.active&&Math.abs(dx)<(foe.type===0?185:340)&&(foe.type===2||Math.abs(dy)<85)){
      foe.state='warning';foe.timer=foe.type===0?48:foe.type===1?65:70;foe.direction=dx<0?-1:1;foe.targetX=player.x+15;foe.targetY=485;
    }
  }
  if(overlaps(player,foe))hurtPlayer(foe.x+17);
  const shot=foe.shot;if(!shot.active)return;
  shot.life--;
  if(shot.kind==='slag'){
    shot.x+=shot.vx;shot.y+=shot.vy;shot.vy+=.32;
    if(shot.y+shot.h>=485){Object.assign(shot,{kind:'burn',x:shot.x-29,y:463,w:76,h:22,vx:0,vy:0,life:42});}
  }else if(shot.kind==='shock')shot.x+=shot.vx;
  if(overlaps(player,shot))hurtPlayer(shot.x+shot.w/2);
  if(shot.life<=0||shot.x<-80||shot.x>1040)shot.active=false;
}
function updateWildRoom() {
  if(room===35){updateDuelist();return;}
  wildTicks++;
  wildPogoTargets.forEach(target=>{if(target.flash>0)target.flash--;});
  if (room===33 && !wildGauntletCleared) {
    if (gauntletWait>0) {
      gauntletWait--;
      if (gauntletWait===0) {
        spawnWildEnemies(gauntletWaves[gauntletWave-1]);
        logMessage='輻射獵群來襲：第 '+gauntletWave+' 波！'; logTimer=90;
      }
    } else if (wildEnemies.every(foe=>foe.health<=0)) {
      if (gauntletWave<3) { gauntletWave++; gauntletWait=90; wildEnemies.forEach(foe=>foe.shot.active=false); }
      else { wildGauntletCleared=true; money=Math.min(999999,money+25);saveProgress();logMessage='三波車輪戰完成！獲得 25 枚齒輪幣。';logTimer=240;playSound(400,.3,'triangle',800); }
    }
  }
  for (const foe of wildEnemies) {
    if (foe.health<=0) continue;
    if(isDockRoom()){updateDockEnemy(foe);continue;}
    if (foe.flash>0) foe.flash--;
    if (foe.stun>0) foe.stun--;
    else {
      if (foe.cooldown>0) foe.cooldown--;
      if (foe.state==='recover') {
        if (foe.type===2) { foe.x+=(foe.homeX-foe.x)*.06;foe.y+=(foe.homeY-foe.y)*.06; }
        if (--foe.timer<=0) {foe.state='patrol';foe.cooldown=100;}
      } else if (foe.state==='warning') {
        if (--foe.timer<=0) {
          if (foe.type===1) {
            const dx=foe.targetX-(foe.x+17),dy=foe.targetY-(foe.y+20),distance=Math.max(1,Math.hypot(dx,dy));
            Object.assign(foe.shot,{x:foe.x+9,y:foe.y+17,vx:dx/distance*4.2,vy:dy/distance*4.2,active:true,life:120});
            foe.state='recover';foe.timer=100;playSound(470,.08,'triangle',220);
          } else if (foe.type===2) {
            foe.diveVX=(foe.targetX-(foe.x+17))/36;foe.diveVY=(foe.targetY-(foe.y+20))/36;
            foe.state='dive';foe.timer=36;
          } else {foe.state='lunge';foe.timer=24;}
        }
      } else if (foe.state==='lunge') {
        foe.x+=foe.direction*4.5;
        if (--foe.timer<=0 || foe.x<foe.minX || foe.x>foe.maxX) {foe.x=Math.max(foe.minX,Math.min(foe.maxX,foe.x));foe.state='recover';foe.timer=85;}
      } else if (foe.state==='dive') {
        foe.x+=foe.diveVX;foe.y+=foe.diveVY;
        if (--foe.timer<=0) {foe.state='recover';foe.timer=90;}
      } else {
        foe.phase+=.045;
        foe.x+=foe.direction*(foe.type===0?.75:foe.type===2?1.1:.25);
        if(foe.x<=foe.minX||foe.x>=foe.maxX) {foe.x=Math.max(foe.minX,Math.min(foe.maxX,foe.x));foe.direction*=-1;}
        if(foe.type===2)foe.y=foe.homeY+Math.sin(foe.phase)*22;
        const dx=player.x+15-(foe.x+17),dy=player.y+21-(foe.y+20);
        if(foe.cooldown===0 && !foe.shot.active && Math.abs(dx)<(foe.type===0?165:290) && Math.abs(dy)<(foe.type===2?230:70)) {
          foe.state='warning';foe.timer=foe.type===0?42:55;foe.direction=dx<0?-1:1;
          foe.targetX=player.x+15;foe.targetY=player.y+21;playSound(260,.12,'triangle',390);
        }
      }
    }
    if(overlaps(player,foe))hurtPlayer(foe.x+17);
    if(foe.shot.active) {
      const shot=foe.shot;shot.x+=shot.vx;shot.y+=shot.vy;shot.life--;
      if(overlaps(player,shot)){shot.active=false;hurtPlayer(shot.x+8);}
      else if(shot.life<=0||shot.x<0||shot.x>960||shot.y<0||shot.y>540)shot.active=false;
    }
  }
  if(room===31 && wildTicks%240>=130 && wildTicks%240<185 && overlaps(player,wildTrap))hurtPlayer(wildTrap.x+30);
}
function updateIronSpear() {
  if(spearCooldown>0)spearCooldown--;
  if(spearQueued) {
    if(!altar1Claimed){logMessage='先啟動祭壇 1，才能學會鐵之矛。';logTimer=120;}
    else if(ironSpear.active||spearCooldown>0){logMessage='長矛正在收回，稍等一下。';logTimer=90;}
    else if(steam<2){logMessage='鐵之矛需要 2 格蒸汽，揮劍命中敵人可補充。';logTimer=150;}
    else {
      steam-=2;spearCooldown=48;
      Object.assign(ironSpear,{active:true,x:player.facing>0?player.x+player.w:player.x-48,y:player.y+16,vx:player.facing*14,phase:'out',ticks:0});ironSpear.hit.clear();
      playSound(520,.14,'triangle',180);
    }
  }
  spearQueued=false;
  if(!ironSpear.active)return;
  ironSpear.ticks++;
  if(ironSpear.phase==='back'){
    ironSpear.x+=(player.x+player.w/2-ironSpear.x-24)*.32;
    ironSpear.y+=(player.y+18-ironSpear.y)*.32;
    if(ironSpear.ticks>=15||Math.abs(ironSpear.x+24-player.x-15)<12)ironSpear.active=false;
    return;
  }
  ironSpear.x+=ironSpear.vx;
  if(room===2 && !weakWall.broken && overlaps(ironSpear,weakWall)){ironSpear.phase='back';ironSpear.ticks=0;return;}
  const strike=(target,damage)=>{
    if(target.health<=0||ironSpear.hit.has(target)||!overlaps(ironSpear,target))return;
    ironSpear.hit.add(target);for(let i=0;i<3&&target.health>0;i++)damage();
  };
  if(room<2||room===4)strike(enemy,()=>damageEnemy(false));
  if(room===1||room===2)strike(drone,()=>damageDrone(false));
  if(inBossRoom()&&bossActive)strike(boss,()=>damageBoss(false));
  if(duelistActive())strike(duelist,()=>damageDuelist(false));
  if(combatFoesHere())for(const foe of branchEnemies)strike(foe,()=>damageBranchEnemy(false,foe));
  if(roamingEnemiesHere())for(const foe of wildEnemies)strike(foe,()=>damageWildEnemy(foe,false));
  const crate=crates[room];
  if(crate.health>0&&!ironSpear.hit.has(crate)&&overlaps(ironSpear,crate)){
    ironSpear.hit.add(crate);crate.health=Math.max(0,crate.health-3);crate.flash=10;
    if(crate.health===0){crate.dropped=true;dropCoins(crate.x+17,crate.y+10,2);}
  }
  if(ironSpear.ticks>=23||ironSpear.x<-60||ironSpear.x>980){ironSpear.phase='back';ironSpear.ticks=0;}
}
function drawIronSpear() {
  if(!ironSpear.active)return;
  const headX=ironSpear.x+24,headY=ironSpear.y+7,handX=player.x+15,handY=player.y+22;
  const distance=Math.hypot(headX-handX,headY-handY),links=Math.max(1,Math.floor(distance/13));
  ctx.strokeStyle='#c6d3d2';ctx.lineWidth=1.5;
  for(let i=0;i<links;i++){const t=(i+.5)/links,x=handX+(headX-handX)*t,y=handY+(headY-handY)*t;ctx.beginPath();ctx.ellipse(x,y,4.5,2.2,Math.atan2(headY-handY,headX-handX),0,Math.PI*2);ctx.stroke();}
  ctx.save();ctx.translate(headX,headY);ctx.scale(ironSpear.vx>0?1:-1,1);
  ctx.fillStyle='#8b9d9b';ctx.fillRect(-24,-3,39,6);ctx.fillStyle='#ecf6e9';ctx.beginPath();ctx.moveTo(12,-7);ctx.lineTo(28,0);ctx.lineTo(12,7);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#c5ecb3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-10,0,10,-1.3,1.3);ctx.stroke();ctx.restore();
}
function damageDuelist(grantsSteam) {
  if(!duelistActive())return;
  if(duelist.state==='guard' && grantsSteam){
    duelist.state='counterTell';duelist.timer=22;duelist.direction=player.x<duelist.x?-1:1;duelist.combo=0;playSound(660,.12,'triangle',880);return;
  }
  duelist.health--;duelist.flash=10;shakeTimer=5;if(grantsSteam)steam=Math.min(3,steam+1);
  if(duelist.state==='guard'){duelist.state='recover';duelist.timer=55;}
  addSparks(duelist.x+18,duelist.y+25,'#ded6bd');playSound(240,.08,'triangle',140);
  if(duelist.health>0 && duelist.health<=6 && duelist.phase===1){duelist.phase=2;logMessage='輻射裂痕正在擴散，她的劍變得更快了。';logTimer=180;}
  if(duelist.health<=0){duelist.health=0;duelistDefeated=true;duelist.state='defeated';duelist.y=431;resetIronSpear();money=Math.min(999999,money+35);dockFallPending=!dockEntered;saveProgress();logMessage='她的細劍落下了。主角上前扶住了她。';logTimer=240;playSound(330,.4,'triangle',220);}
}
function beginDockFall(){
  dockFallTick=0;keys.clear();player.vx=0;player.vy=0;healTimer=0;attackTimer=0;
  jumpQueued=attackQueued=dashQueued=interactQueued=toolQueued=spearQueued=healQueued=false;
  toolProjectile.active=false;resetIronSpear();mapOpen=journalOpen=helpOpen=equipmentOpen=shopOpen=travelOpen=false;
  playSound(90,.8,'sawtooth',35);
}
function updateDockFall(){
  dockFallTick++;
  if(dockFallTick===60)playSound(160,.5,'sawtooth',35);
  if(dockFallTick<180)return;
  dockFallTick=-1;dockFallPending=false;dockEntered=true;dockArrivalStage=1;
  dockCheckpoint.activated=true;activeCheckpoint='dock';
  changeRoom(36);Object.assign(player,{x:380,y:443,vx:0,vy:0,grounded:true,facing:1});
  health=Math.max(1,health);invulnerability=90;logMessage='兩人跌落地下熔塢。廢塢休息站已啟動。';logTimer=240;
  saveProgress();
}
function updateDockRoom(){
  if(room===38){
    const lift=roomPlatforms[38].find(p=>p.dockLift);
    const riding=player.grounded&&Math.abs(player.y+player.h-lift.y)<.01&&player.x+player.w>lift.x&&player.x<lift.x+lift.w;
    const oldY=lift.y;lift.y+=lift.direction*1.2;
    if(lift.y<=260||lift.y>=400){lift.y=Math.max(260,Math.min(400,lift.y));lift.direction*=-1;}
    if(riding)player.y+=lift.y-oldY;
  }
  if(room===37&&wildTicks%210>=135&&wildTicks%210<180&&overlaps(player,dockJet))hurtPlayer(dockJet.x+22);
}
function dockLavaRescue(){
  if(!isDockRoom()||player.y+player.h<500)return false;
  // A single hazard hit returns to the bank; a fall cannot chain into instant death.
  hurtPlayer(player.x+15);
  Object.assign(player,{x:70,y:443,vx:0,vy:0,grounded:true});dashTimer=0;resetIronSpear();
  return true;
}
function updateDuelist() {
  if(!duelistActive())return;
  const pace=duelist.phase===2?10:13;
  if(duelist.musicTick%pace===0){const notes=[220,261.63,329.63,293.66,246.94,329.63,392,349.23,220,293.66,369.99,329.63,261.63,246.94,196,220];const step=Math.floor(duelist.musicTick/pace);playSound(notes[step%16],.13,'triangle',notes[step%16]);if(step%4===0)playSound(110,.22,'sine',110);}
  duelist.musicTick++;if(duelist.flash>0)duelist.flash--;
  if(duelist.state==='idle'){
    duelist.direction=player.x+15<duelist.x+18?-1:1;
    if(Math.abs(player.x-duelist.x)>140)duelist.x+=duelist.direction*(duelist.phase===2?1.8:1.1);
    if(--duelist.timer<=0){duelist.move=['dash','leap','guard'][duelist.attackIndex%3];duelist.attackIndex++;duelist.state='warning';duelist.timer=duelist.phase===2?34:48;duelist.combo=0;}
  }else if(duelist.state==='warning'){
    if(--duelist.timer<=0){
      if(duelist.move==='guard'){duelist.state='guard';duelist.timer=58;}
      else if(duelist.move==='leap'){duelist.state='leap';duelist.vy=-10.8;}
      else {duelist.state='thrust';duelist.timer=23;}
    }
  }else if(duelist.state==='guard'){
    if(--duelist.timer<=0){duelist.state='recover';duelist.timer=55;}
  }else if(duelist.state==='counterTell'){
    if(--duelist.timer<=0){duelist.state='thrust';duelist.timer=23;}
  }else if(duelist.state==='thrust'){
    duelist.x+=duelist.direction*(duelist.phase===2?7.6:6.5);
    if(--duelist.timer<=0||duelist.x<=95||duelist.x>=830){
      if(duelist.phase===2 && duelist.combo===0){duelist.combo=1;duelist.state='counterTell';duelist.timer=23;duelist.direction=player.x<duelist.x?-1:1;}
      else {duelist.state='recover';duelist.timer=duelist.phase===2?58:75;}
    }
  }else if(duelist.state==='leap'){
    duelist.x+=duelist.direction*3;duelist.y+=duelist.vy;duelist.vy+=.48;
    if(duelist.y>=431){duelist.y=431;duelist.state='recover';duelist.timer=70;}
  }else if(duelist.state==='recover' && --duelist.timer<=0){duelist.state='idle';duelist.timer=45;}
  duelist.x=Math.max(95,Math.min(830,duelist.x));
  if(overlaps(player,duelist))hurtPlayer(duelist.x+18);
  if(duelist.state==='thrust'){
    const blade={x:duelist.direction>0?duelist.x+36:duelist.x-62,y:duelist.y+17,w:62,h:15};
    if(overlaps(player,blade))hurtPlayer(duelist.x+18);
  }
}
function damageBoss(grantsSteam) {
  boss.health--; boss.flash = 10; shakeTimer = 7; if (grantsSteam) steam = Math.min(3, steam + 1);
  addSparks(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffca77'); playSound(85, .15, 'square', 60);
  if (boss.health > 0 && boss.health <= boss.maxHealth / 2 && boss.phase === 1) {
    boss.phase = 2; logMessage = room === 27 ? '果核機械王的核心加速了！' : '蒸汽守衛的核心過熱了！'; logTimer = 150;
    addSparks(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ff835e'); playSound(140, .35, 'sawtooth', 350);
  }
  if (boss.health <= 0) {
    if (room === 27) { forestBossDefeated = true; importantGear1 = true; if (!forestSeedPlanted) forestSeedOwned = true; }
    else { bossDefeated = true; bossLog.read = true; }
    bossActive = false; dropCoins(boss.x + boss.w / 2, boss.y + boss.h / 2, 25); bossIntroTimer = 0; bossVictoryTimer = 150; bossShot.active = false; forestBossSeeds.length = 0; forestBossWave.active = false; saveProgress();
    logMessage = room === 27 ? (forestSeedPlanted ? '果核機械王已擊敗！' : '獲得生命種子與重要齒輪 1，蒸汽衝刺已修復！') : '蒸汽守衛已倒下，紀錄冊新增守衛記憶。'; logTimer = 240;
    addSparks(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffe3a0'); playSound(180, .35, 'sawtooth', 50);
  }
}
function updateForestBoss() {
  // A brighter clockwork melody and bass pattern accelerates in phase two.
  const beatLength = boss.phase === 2 ? 9 : 12;
  if (boss.musicTick % beatLength === 0) {
    const beat = Math.floor(boss.musicTick / beatLength);
    const note = forestBossMusic.melody[beat % forestBossMusic.melody.length];
    playSound(note, .13, 'triangle', note * 1.005);
    if (beat % 2 === 0) { const bass = forestBossMusic.bass[Math.floor(beat / 2) % forestBossMusic.bass.length]; playSound(bass, .18, 'sine', bass); }
    if (beat % 4 === 2) playSound(740, .045, 'square', 460);
  }
  boss.musicTick++;
  if (boss.flash > 0) boss.flash--;
  if (bossIntroTimer > 0) return;
  if (boss.state === 'idle' && --boss.timer <= 0) {
    boss.state = 'warning'; boss.timer = boss.phase === 2 ? 45 : 60;
    boss.targetX = Math.max(130, Math.min(830, player.x + player.w / 2));
    boss.direction = player.x + player.w / 2 < boss.x + boss.w / 2 ? -1 : 1;
    playSound(300, .18, 'triangle', 430);
  } else if (boss.state === 'warning' && --boss.timer <= 0) {
    if (boss.nextAttack === 'seedRain') {
      for (const offset of [-95, 0, 95]) forestBossSeeds.push({x: boss.targetX + offset - 9, y: 35, w: 18, h: 18, vx: 0, vy: 0, life: 120});
      boss.nextAttack = 'vineWave'; playSound(420, .22, 'triangle', 180);
    } else if (boss.nextAttack === 'vineWave') {
      Object.assign(forestBossWave, {x: boss.targetX < 480 ? 860 : 26, vx: boss.targetX < 480 ? -5 : 5, active: true});
      boss.nextAttack = 'fruitBurst'; playSound(120, .28, 'sawtooth', 70);
    } else {
      for (const velocity of [0, 1.5, 3].map(speed => speed * boss.direction)) forestBossSeeds.push({x: boss.x + 26, y: boss.y + 18, w: 18, h: 18, vx: velocity, vy: -7.5, life: 120});
      boss.nextAttack = 'seedRain'; playSound(220, .25, 'square', 360);
    }
    boss.state = 'recover'; boss.timer = boss.phase === 2 ? 85 : 110;
  } else if (boss.state === 'recover' && --boss.timer <= 0) {
    boss.state = 'idle'; boss.timer = boss.phase === 2 ? 35 : 50;
  }
  for (let i = forestBossSeeds.length - 1; i >= 0; i--) {
    const seed = forestBossSeeds[i]; seed.x += seed.vx; seed.y += seed.vy; seed.vy += .22; seed.life--;
    if (overlaps(player, seed)) { hurtPlayer(seed.x + seed.w / 2); forestBossSeeds.splice(i, 1); }
    else if (seed.life <= 0 || seed.y + seed.h >= 485 || seed.x < -30 || seed.x > 990) forestBossSeeds.splice(i, 1);
  }
  if (forestBossWave.active) {
    forestBossWave.x += forestBossWave.vx;
    if (overlaps(player, forestBossWave)) hurtPlayer(forestBossWave.x + forestBossWave.w / 2);
    if (forestBossWave.x < -forestBossWave.w || forestBossWave.x > canvas.width) forestBossWave.active = false;
  }
  if (overlaps(player, boss)) hurtPlayer(boss.x + boss.w / 2);
}
function damageDrone(grantsSteam) {
  drone.health--; drone.flash = 10; if (grantsSteam) steam = Math.min(3, steam + 1); shakeTimer = 5;
  if (drone.health <= 0) { dropCoins(drone.x + drone.w / 2, drone.y + drone.h / 2, 4); steamShot.active = false; addSparks(drone.x + drone.w / 2, drone.y + drone.h / 2, '#f6a957'); playSound(180, .22, 'sawtooth', 55); }
  addSparks(drone.x + drone.w / 2, drone.y + drone.h / 2, '#a9e1d2'); playSound(180, .12, 'square', 90);
}
function healingGlow() {
  healGlowTimer = 36;
  addSparks(player.x + player.w / 2, player.y + player.h / 2, '#a6edc4');
}
function hurtPlayer(sourceX) {
  if (invulnerability > 0 || deathTimer > 0 || respawnTimer > 0 || gameOver || won) return;
  if (healTimer > 0) { healTimer = 0; logMessage = '修復被打斷，蒸汽未消耗。'; logTimer = 120; }
  shakeTimer = 9; addSparks(player.x + player.w / 2, player.y + player.h / 2, '#f3aa6c');
  health--; invulnerability = equipment.blue === 'fortress' ? 125 : equipment.blue === 'guard' ? 95 : 75; dashTimer = 0; playSound(180, 0.2, 'sawtooth', 75);
  variableJump = false; player.vy = -6; player.vx = player.x + player.w / 2 < sourceX ? -5 : 5;
  if (health <= 0) {
    resetIronSpear();
    health = 0; deathTimer = DEATH_DURATION; healTimer = 0; healGlowTimer = 0;
    keys.clear(); jumpQueued = false; jumpBuffer = 0; attackQueued = false; attackTimer = 0;
    dashQueued = false; dashTimer = 0; interactQueued = false; healQueued = false; toolQueued=false; spearQueued=false; toolProjectile.active = false;
    playSound(130, .4, 'sawtooth', 45);
  }
}
function update() {
  if (farewellActive() || reunionActive() || duelIntroActive() || (room === 11 && (familyStage === 6 || familyStage === 7)) || gameOver || won || mapOpen || journalOpen || helpOpen || equipmentOpen || shopOpen || travelOpen || townMenu || paused) return;
  if(room===35&&dockFallPending&&dockFallTick<0)beginDockFall();
  if(dockFallTick>=0){updateDockFall();return;}
  if(dockArrivalActive())return;
  if (deathTimer > 0) { if (--deathTimer === 0) gameOver = true; return; }
  if (respawnTimer > 0) { respawnTimer--; return; }
  if (healTimer > 0 && (health >= playerMaxHealth() || steam < 3)) healTimer = 0;
  const tryingToMove = keys.has('ArrowLeft') || keys.has('ArrowRight') || keys.has('KeyA') || keys.has('KeyD');
  const interruptsHealing = tryingToMove || spearQueued || jumpQueued || dashQueued || attackQueued || toolQueued || interactQueued;
  if (healTimer > 0 && interruptsHealing) { healTimer = 0; logMessage = '修復中斷，蒸汽未消耗。'; logTimer = 120; }
  if (healQueued && healTimer === 0 && steam >= 3 && health < playerMaxHealth()) {
    if (player.grounded && !interruptsHealing && dashTimer === 0) {
      healTimer = HEAL_DURATION; player.vx = 0; playSound(250, .25, 'sine', 350);
    } else { logMessage = '站穩後按 Q 修復。'; logTimer = 120; }
  }
  healQueued = false;
  if (healGlowTimer > 0) healGlowTimer--;
  for (let i = sparks.length - 1; i >= 0; i--) {
    const spark = sparks[i]; spark.x += spark.vx; spark.y += spark.vy; spark.vy += .12;
    if (--spark.life <= 0) sparks.splice(i, 1);
  }
  if (bossIntroTimer > 0) bossIntroTimer--;
  if (bossVictoryTimer > 0) bossVictoryTimer--;
  if (shakeTimer > 0) shakeTimer--;
  if (roomTitleTimer > 0) roomTitleTimer--;
  if (storyIntroTimer > 0) storyIntroTimer--;
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
  if (room === 10) {
    const targetX = Math.max(75, Math.min(860, player.x + 60));
    townChildX += Math.max(-2.2, Math.min(2.2, targetX - townChildX));
    townShops.forEach((shop, index) => {
      if (!(townGuideMask & (1 << index)) && townShopNear(shop)) {
        const introductions = ['小孩：「這是雜貨店，可以修好受傷的地方！」', '小孩：「服飾店能幫你補披風，一定很適合你！」', '小孩：「這是抓娃娃屋！我家就在前面，帶你去見爸爸媽媽！」'];
        townGuideMask |= 1 << index; logMessage = introductions[index]; logTimer = 220; saveProgress();
      }
    });
  }
  if (room === 17) {
    const bridge = roomPlatforms[17].find(platform => platform.forestMoving);
    const riding = player.grounded && Math.abs(player.y + player.h - bridge.y) < .01 && player.x + player.w > bridge.x && player.x < bridge.x + bridge.w;
    const oldX = bridge.x; bridge.x += bridge.direction * 1.1;
    if (bridge.x <= 390 || bridge.x >= 480) { bridge.x = Math.max(390, Math.min(480, bridge.x)); bridge.direction *= -1; }
    if (riding) player.x = Math.max(0, Math.min(canvas.width - player.w, player.x + bridge.x - oldX));
  }
  if (isForestRoom() && farewellStage <= farewellLines.length) {
    const targetX = Math.max(60, Math.min(870, player.x - 55));
    townChildX += Math.max(-3.5, Math.min(3.5, targetX - townChildX));
  }
  if (room === 7) {
    const platform = roomPlatforms[7].find(item => item.mineMoving);
    const riding = player.grounded && Math.abs(player.y + player.h - platform.y) < .01 && player.x + player.w > platform.x && player.x < platform.x + platform.w;
    const oldX = platform.x; platform.x += platform.direction * 1.2;
    if (platform.x >= 580 || platform.x <= 440) { platform.x = Math.max(440, Math.min(580, platform.x)); platform.direction *= -1; }
    if (riding) player.x = Math.max(0, Math.min(canvas.width - player.w, player.x + platform.x - oldX));
    mineSaw.x = 480 + Math.sin(ambientTime * .025) * 150;
  }
  if(roamingEnemiesHere())updateWildRoom();
  if(isDockRoom())updateDockRoom();
  if (room === 27 && bossActive) updateForestBoss();
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
  if (room === 5) {
    if (courseRunning) courseTicks++;
    courseVent.cycle = (courseVent.cycle + 1) % 220;
    const moving = roomPlatforms[5].find(item => item.courseMoving);
    const riding = player.grounded && Math.abs(player.y + player.h - moving.y) < .01 && player.x + player.w > moving.x && player.x < moving.x + moving.w;
    const oldX = moving.x; moving.x += moving.direction * 1.2;
    if (moving.x <= 500 || moving.x >= 560) { moving.x = Math.max(500, Math.min(560, moving.x)); moving.direction *= -1; }
    if (riding) player.x = Math.max(0, Math.min(canvas.width - player.w, player.x + moving.x - oldX));
    if (courseRunning && courseVent.cycle >= 140 && courseVent.cycle < 185 && overlaps(player, courseVent)) { startCourse('蒸汽擊中你了，回到起點再試一次。'); return; }
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
  if (room >= 6 && room <= 8) for (const foe of branchEnemies) {
    if (foe.health <= 0) continue;
    const branchShot = foe.shot;
    if (foe.flash > 0) foe.flash--;
    if (foe.stun > 0) foe.stun--;
    else {
      if (foe.cooldown > 0) foe.cooldown--;
      if (room === 8) {
        foe.phase += .035; foe.x += foe.direction * .9; foe.y = foe.baseY + Math.sin(foe.phase) * 30;
        if (foe.x <= foe.patrolMin || foe.x >= foe.patrolMax) foe.direction *= -1;
      } else if (room === 7 && foe.state === 'charge') {
        foe.x += foe.direction * 4.5;
        if (--foe.timer <= 0 || foe.x <= 90 || foe.x >= 840) { foe.x = Math.max(90, Math.min(840, foe.x)); foe.state = 'idle'; foe.cooldown = 120; }
      } else if (room === 7 && foe.state === 'idle') {
        foe.x += foe.direction * .65;
        if (foe.x <= foe.patrolMin || foe.x >= foe.patrolMax) foe.direction *= -1;
      }
      if (foe.state === 'warning' && --foe.timer <= 0) {
        if (room === 7) { foe.state = 'charge'; foe.timer = 28; }
        else {
          const dx = player.x + player.w / 2 - (foe.x + foe.w / 2), dy = player.y + player.h / 2 - (foe.y + foe.h / 2);
          const length = Math.max(1, Math.hypot(dx, dy));
          Object.assign(branchShot, {x: foe.x + foe.w / 2 - 6, y: foe.y + foe.h / 2 - 6, vx: dx / length * 3.2, vy: dy / length * 3.2, life: 90, active: true});
          foe.state = 'idle'; foe.cooldown = room === 6 ? 135 : 160; playSound(320, .12, 'triangle', 180);
        }
      } else if (foe.state === 'idle' && foe.cooldown === 0 && !branchShot.active) {
        const dx = player.x + player.w / 2 - (foe.x + foe.w / 2);
        const dy = player.y + player.h / 2 - (foe.y + foe.h / 2);
        if (Math.abs(dx) < (room === 8 ? 240 : 210) && Math.abs(dy) < (room === 8 ? 150 : 55)) {
          foe.direction = dx < 0 ? -1 : 1; foe.state = 'warning'; foe.timer = 45;
          playSound(250, .12, 'triangle', 370);
        }
      }
    }
    if (overlaps(player, foe)) hurtPlayer(foe.x + foe.w / 2);
  }
  if (isForestRoom()) for (const foe of branchEnemies) {
    if (foe.health <= 0) continue;
    const fruit = forestFruit[foe.fruitType], shot = foe.shot;
    if (foe.flash > 0) foe.flash--;
    if (foe.stun > 0) { foe.stun--; continue; }
    if (foe.cooldown > 0) foe.cooldown--;
    if (foe.state === 'charge') {
      foe.x += foe.direction * (fruit.name === '發條草莓' ? 5 : fruit.name === '鐵殼梨' ? 3 : 4);
      if (--foe.timer <= 0 || foe.x <= 65 || foe.x >= 850) { foe.x = Math.max(65, Math.min(850, foe.x)); foe.state = 'idle'; foe.cooldown = 140; }
    } else if (foe.state === 'warning') {
      if (--foe.timer <= 0) {
        if (fruit.attack === 'charge') { foe.state = 'charge'; foe.timer = 22; }
        else {
          Object.assign(shot, {x: foe.x + foe.w / 2, y: foe.y + 10, vx: foe.direction * (foe.fruitType === 4 ? 2.7 : 3.6), vy: 0, life: 85, active: true});
          foe.state = 'idle'; foe.cooldown = 150;
        }
      }
    } else {
      foe.x += foe.direction * fruit.speed;
      if (foe.x <= foe.patrolMin || foe.x >= foe.patrolMax) foe.direction *= -1;
      const dx = player.x + player.w / 2 - (foe.x + foe.w / 2);
      if (foe.cooldown === 0 && !shot.active && Math.abs(dx) < 175 && Math.abs(player.y - foe.y) < 55) {
        foe.direction = dx < 0 ? -1 : 1; foe.state = 'warning'; foe.timer = fruit.name === '發條草莓' ? 35 : 50;
      }
    }
    if (overlaps(player, foe)) hurtPlayer(foe.x + foe.w / 2);
  }
  if (combatFoesHere()) for (const foe of branchEnemies) {
    const branchShot = foe.shot;
    if (!branchShot.active) continue;
    branchShot.x += branchShot.vx; branchShot.y += branchShot.vy; branchShot.life--;
    if (overlaps(player, branchShot)) { branchShot.active = false; hurtPlayer(branchShot.x + branchShot.w / 2); }
    else if (branchShot.life <= 0 || branchShot.x < -12 || branchShot.x > canvas.width || branchShot.y < -12 || branchShot.y > canvas.height) branchShot.active = false;
  }
  if (deathTimer > 0 || gameOver) { attackQueued = false; interactQueued = false; healQueued = false; return; }
  updateIronSpear();
  const toolCost = equipment.red === 'piercer' ? 2 : 1;
  if (toolQueued && toolAmmo >= toolCost && !toolProjectile.active) {
    const pulse = equipment.red === 'pulse', piercer = equipment.red === 'piercer';
    Object.assign(toolProjectile, {w: pulse ? 30 : 18, h: pulse ? 30 : 10,
      vx: player.facing * (pulse ? 5 : piercer ? 7 : 9), life: pulse ? 32 : piercer ? 40 : 48,
      active: true, type: equipment.red});
    toolProjectile.x = player.facing > 0 ? player.x + player.w : player.x - toolProjectile.w;
    toolProjectile.y = player.y + (player.h - toolProjectile.h) / 2;
    toolAmmo -= toolCost; saveProgress(); playSound(pulse ? 220 : 540, .16, 'triangle', pulse ? 130 : 340);
  } else if (toolQueued && toolAmmo < toolCost) { logMessage = '工具次數不足，回休息站補充。'; logTimer = 120; }
  toolQueued=false; spearQueued=false;
  if (toolProjectile.active) {
    toolProjectile.x += toolProjectile.vx; toolProjectile.life--;
    const pulse = toolProjectile.type === 'pulse', piercer = toolProjectile.type === 'piercer';
    let hit = false;
    if (room === 2 && !weakWall.broken && overlaps(toolProjectile, weakWall)) {
      toolProjectile.active = false; addSparks(weakWall.x, toolProjectile.y, '#d5b78c');
    } else {
      if ((room < 2 || room === 4) && enemy.health > 0 && overlaps(toolProjectile, enemy)) {
        damageEnemy(false); if (piercer && enemy.health > 0) damageEnemy(false); hit = true;
      }
      if (roamingEnemiesHere()) for (const foe of wildEnemies) {
        if ((!hit || pulse) && foe.health>0 && overlaps(toolProjectile,foe)) { damageWildEnemy(foe,false); if(piercer && foe.health>0) damageWildEnemy(foe,false); hit=true; }
      }
      if((!hit||pulse)&&duelistActive()&&overlaps(toolProjectile,duelist)) {damageDuelist(false);if(piercer&&duelist.health>0)damageDuelist(false);hit=true;}
    if (combatFoesHere()) for (const foe of branchEnemies) {
        if ((!hit || pulse) && foe.health > 0 && overlaps(toolProjectile, foe)) {
          damageBranchEnemy(false, foe); if (piercer && foe.health > 0) damageBranchEnemy(false, foe); hit = true;
        }
      }
      if ((!hit || pulse) && inBossRoom() && bossActive && overlaps(toolProjectile, boss)) {
        damageBoss(false); if (piercer && bossActive) damageBoss(false); hit = true;
      }
      if ((!hit || pulse) && (room === 1 || room === 2) && drone.health > 0 && overlaps(toolProjectile, drone)) {
        damageDrone(false); if (piercer && drone.health > 0) damageDrone(false); hit = true;
      }
      if ((!hit || pulse) && room === 0 && overlaps(toolProjectile, target)) { target.hits++; target.flash = 10; hit = true; }
      if (pulse) {
        for (const shot of [room === 4 ? flowerShot : null, inBossRoom() ? bossShot : null, (room === 1 || room === 2) ? steamShot : null, ...(combatFoesHere() ? branchEnemies.map(foe => foe.shot) : []), ...(roamingEnemiesHere()?wildEnemies.map(foe=>foe.shot):[])]) {
          if (shot && shot.active && overlaps(toolProjectile, shot)) {
            shot.active = false; hit = true; addSparks(shot.x + shot.w / 2, shot.y + shot.h / 2, '#b5f1dd');
          }
        }
      }
      if (hit) toolProjectile.active = false;
    }
    if (toolProjectile.life <= 0 || toolProjectile.x + toolProjectile.w < 0 || toolProjectile.x > canvas.width) toolProjectile.active = false;
  }
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i], previousBottom = coin.y + coin.h;
    coin.vy = Math.min(coin.vy + .35, 8); coin.y += coin.vy;
    for (const platform of roomPlatforms[room]) {
      if (platform.hidden > 0) continue;
      if (coin.vy >= 0 && previousBottom <= platform.y && coin.y + coin.h >= platform.y && coin.x + coin.w > platform.x && coin.x < platform.x + platform.w) {
        coin.y = platform.y - coin.h; coin.vy = 0;
      }
    }
    if (overlaps(player, coin)) {
      money = Math.min(999999, money + coin.value); coins.splice(i, 1); saveProgress();
      logMessage = '取得 ' + coin.value + ' 枚齒輪幣'; logTimer = 90; playSound(630, .12, 'triangle', 850);
    } else if (coin.y > canvas.height + 50) coins.splice(i, 1);
  }
  const direction = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  if (dashCooldown > 0) dashCooldown--;
  if (direction && dashTimer === 0) player.facing = direction;
  if (dashQueued && dashCooldown === 0) {
    dashFacing = player.facing; dashTimer = 10; dashCooldown = equipment.yellow === 'regulator' ? 40 : 60; playSound(150, 0.12, 'sawtooth', 310);
  }
  dashQueued = false;
  if (player.grounded) wallJumpLock = 0;
  if (dashTimer > 0) { player.vx = dashFacing * 9; dashTimer--; wallJumpLock = 0; }
  else if (wallJumpLock > 0) wallJumpLock--;
  else {
    const moveSpeed = (equipment.yellow === 'springboots' ? 3.9 : 3.5) * (equipment.blue === 'fortress' ? .9 : 1);
    player.vx += (direction * moveSpeed - player.vx) * .25;
  }
  if (player.grounded) coyoteTime = 6;
  else if (coyoteTime > 0) coyoteTime--;
  if (jumpQueued) jumpBuffer = 6;
  else if (jumpBuffer > 0) jumpBuffer--;
  if (jumpBuffer > 0 && coyoteTime > 0) {
    player.vy = -11.5; player.grounded = false; coyoteTime = 0; jumpBuffer = 0; variableJump = true;
    playSound(220, 0.12, 'triangle', 370);
    if (!['Space', 'ArrowUp', 'KeyW'].some(code => keys.has(code))) { player.vy = -5; variableJump = false; }
  } else if (jumpQueued && !postFall && !player.grounded && wallJumpLock === 0) {
    // Only solid walls qualify: room edges, the intact shaft wall, and workshop walls.
    let wallDirection = player.x <= 1 ? -1 : player.x + player.w >= canvas.width - 1 ? 1 : 0;
    if (!wallDirection && room === 2 && !weakWall.broken && player.y < weakWall.y + weakWall.h && player.y + player.h > weakWall.y) {
      if (Math.abs(player.x + player.w - weakWall.x) <= 2) wallDirection = 1;
      else if (Math.abs(player.x - (weakWall.x + weakWall.w)) <= 2) wallDirection = -1;
    }
    if (!wallDirection && room === 8) {
      for (const wall of workshopWalls) {
        if (player.y >= wall.y + wall.h || player.y + player.h <= wall.y) continue;
        if (Math.abs(player.x + player.w - wall.x) <= 2) wallDirection = 1;
        else if (Math.abs(player.x - (wall.x + wall.w)) <= 2) wallDirection = -1;
        if (wallDirection) break;
      }
    }
    if (wallDirection) {
      player.vy = -11.5; player.vx = -wallDirection * 6; player.facing = -wallDirection;
      coyoteTime = 0; jumpBuffer = 0; variableJump = true; wallJumpLock = 10; dashTimer = 0;
      addSparks(wallDirection < 0 ? player.x : player.x + player.w, player.y + player.h / 2, '#e8c07c');
      playSound(250, .12, 'triangle', 440);
    } else if (doubleJumpUnlocked && !doubleJumpUsed) {
      player.vy = -11.5; doubleJumpUsed = true; jumpBuffer = 0; variableJump = true;
      addSparks(player.x + player.w / 2, player.y + player.h, '#a9e1d2');
      playSound(270, 0.18, 'triangle', 540);
    }
  } else if (jumpQueued && !postFall && doubleJumpUnlocked && !doubleJumpUsed && !player.grounded) {
    player.vy = -11.5; doubleJumpUsed = true; jumpBuffer = 0; variableJump = true;
    addSparks(player.x + player.w / 2, player.y + player.h, '#a9e1d2');
    playSound(270, 0.18, 'triangle', 540);
  }
  jumpQueued = false;
  if (attackCooldown > 0) attackCooldown--;
  if (attackTimer > 0) attackTimer--;
  if (target.flash > 0) target.flash--;
  if (attackQueued && attackCooldown === 0) {
    attackTimer = 10; attackCooldown = equipment.blue === 'rotor' ? 17 : 22; attackFacing = player.facing;
    attackDown = !player.grounded && (keys.has('ArrowDown') || keys.has('KeyS'));
    attackUp = !player.grounded && !attackDown && (keys.has('ArrowUp') || keys.has('KeyW'));
    playSound(420, 0.1, 'triangle', 190);
    const hitbox = attackDown
      ? {x: player.x + 2, y: player.y + player.h, w: player.w - 4, h: 48}
      : attackUp ? {x: player.x + 2, y: player.y - 48, w: player.w - 4, h: 48}
      : {x: player.facing > 0 ? player.x + player.w : player.x - 48, y: player.y + 6, w: 48, h: 30};
    let hit = false;
    if ((room < 2 || room === 4) && enemy.health > 0 && overlaps(hitbox, enemy)) { hit = true; damageEnemy(true); }
    if (roamingEnemiesHere()) for (const foe of wildEnemies) {
      if (foe.health>0 && overlaps(hitbox,foe)) { hit=true; damageWildEnemy(foe,true); }
      if (foe.shot.active && overlaps(hitbox,foe.shot)) { hit=true; foe.shot.active=false; addSparks(foe.shot.x,foe.shot.y,'#bce78f'); }
    }
    if (combatFoesHere()) for (const foe of branchEnemies) {
      if (foe.health > 0 && overlaps(hitbox, foe)) { hit = true; damageBranchEnemy(true, foe); }
      if (foe.shot.active && overlaps(hitbox, foe.shot)) { hit = true; foe.shot.active = false; addSparks(foe.shot.x + 6, foe.shot.y + 6, '#b5f1dd'); }
    }
    if(duelistActive()&&overlaps(hitbox,duelist)){damageDuelist(true);hit=true;}
    if (room === 0 && hitbox.x < target.x + target.w && hitbox.x + hitbox.w > target.x && hitbox.y < target.y + target.h && hitbox.y + hitbox.h > target.y) { hit = true; target.hits++; target.flash = 10; }
    if (inBossRoom() && bossActive && overlaps(hitbox, boss)) { hit = true; damageBoss(true); }
    if (room === 4 && flowerShot.active && overlaps(hitbox, flowerShot)) {
      hit = true; flowerShot.active = false; addSparks(flowerShot.x + 7, flowerShot.y + 7, '#b3e8a0'); playSound(430, .12, 'triangle', 600);
    }
    if (room === 27) for (let i = forestBossSeeds.length - 1; i >= 0; i--) {
      if (overlaps(hitbox, forestBossSeeds[i])) { const seed = forestBossSeeds[i]; forestBossSeeds.splice(i, 1); hit = true; addSparks(seed.x + 9, seed.y + 9, '#c6e4a4'); }
    }
    if (inBossRoom() && bossShot.active && overlaps(hitbox, bossShot)) {
      hit = true; bossShot.active = false;
      addSparks(bossShot.x + bossShot.w / 2, bossShot.y + bossShot.h / 2, '#ffd28b'); playSound(440, .13, 'triangle', 700);
    }
    if ((room === 1 || room === 2) && steamShot.active && overlaps(hitbox, steamShot)) {
      hit = true; steamShot.active = false;
      addSparks(steamShot.x + steamShot.w / 2, steamShot.y + steamShot.h / 2, '#b5f1dd');
      playSound(520, 0.13, 'triangle', 820);
    }
    if ((room === 1 || room === 2) && drone.health > 0 && overlaps(hitbox, drone)) { hit = true; damageDrone(true); }
    if (crate.health > 0 && overlaps(hitbox, crate)) {
      crate.health--; crate.flash = 10; hit = true; playSound(150, 0.1, 'square', 90);
      if (crate.health === 0) { crate.dropped = true; dropCoins(crate.x + crate.w / 2, crate.y + 10, 2); }
    }
    const pogoTarget = room===34 && attackDown ? wildPogoTargets.find(target=>player.y+player.h<=target.y+target.h && overlaps(hitbox,target)) : null;
    if (pogoTarget) { player.vy=-12.8;player.grounded=false;variableJump=false;pogoTarget.flash=12;addSparks(pogoTarget.x+27,pogoTarget.y,'#c1edbd');playSound(330,.12,'triangle',650); }
    else if (attackDown && room === 1 && overlaps(hitbox, spring)) {
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
  if (room === 8) {
    for (const wall of workshopWalls) {
      if (!overlaps(player, wall)) continue;
      if (previousX + player.w <= wall.x) { player.x = wall.x - player.w; player.vx = 0; }
      else if (previousX >= wall.x + wall.w) { player.x = wall.x + wall.w; player.vx = 0; }
    }
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
  dockLavaRescue();
  if (isForestRoom() && forestHazards[room] && vent.cycle >= 120 && vent.cycle < 165 && overlaps(player, forestHazards[room])) hurtPlayer(forestHazards[room].x + forestHazards[room].w / 2);
  if (room === 7 && overlaps(player, mineSaw)) hurtPlayer(mineSaw.x + mineSaw.w / 2);
  if (room === 6 && vent.cycle >= 120 && vent.cycle < 165 && overlaps(player, branchVent)) hurtPlayer(branchVent.x + branchVent.w / 2);
  if (room === 1 && sideVent.cycle >= 150 && sideVent.cycle < 195 && overlaps(player, sideVent)) hurtPlayer(sideVent.x + sideVent.w);
  const steamActive = vent.cycle >= 120 && vent.cycle < 165;
  if (room < 2 && steamActive && overlaps(player, {x: vent.x, y: vent.y - vent.h, w: vent.w, h: vent.h})) hurtPlayer(vent.x + vent.w / 2);
  if (deathTimer > 0 || gameOver) { interactQueued = false; return; }
  if (healTimer > 0) {
    if (!player.grounded) { healTimer = 0; logMessage = '修復中斷，蒸汽未消耗。'; logTimer = 120; }
    else if (--healTimer === 0) { steam -= 3; health++; healingGlow(); playSound(400, .25, 'sine', 750); }
    else if (healTimer % 18 === 0) playSound(680, .05, 'triangle', 510);
  }
  if (room === 5 && courseRunning && overlaps(player, courseFinish)) {
    courseRunning = false; courseFinished = true;
    if (courseBestTicks === null || courseTicks < courseBestTicks) courseBestTicks = courseTicks;
    const reward = !courseRewardClaimed;
    if (reward) { courseRewardClaimed = true; money = Math.min(999999, money + 25); }
    saveProgress(); logMessage = reward ? '跑酷完成！獲得 25 枚齒輪幣。' : '跑酷完成！按 T 可再次挑戰。'; logTimer = 240;
    playSound(420, .35, 'triangle', 820);
  }
  if (room===34 && !wildPogoFinished && overlaps(player,wildPogoGoal)) {
    wildPogoFinished=true;
    if(!wildPogoRewardClaimed) {wildPogoRewardClaimed=true;money=Math.min(999999,money+15);saveProgress();logMessage='下劈試煉完成！獲得 15 枚齒輪幣。';}
    else logMessage='下劈試煉完成！按 T 可以再次挑戰。';
    logTimer=220;playSound(500,.25,'triangle',800);
  }
  if(room===34 && !wildPogoFinished && wildPogoTargets.some(target=>overlaps(player,target))) {startPogoRun('碰到齒輪了；在落下前下劈，讓身體反彈。');return;}
  if (room===32 && !wildCheckpoint.activated && overlaps(player,wildCheckpoint)) {wildCheckpoint.activated=true;activeCheckpoint='wild';if(health < playerMaxHealth())healingGlow();health = playerMaxHealth();saveProgress();logMessage='獵者營地休息站已啟動。';logTimer=180;}
  if (room === 18 && !forestBossKey && overlaps(player, forestKeyCard)) { forestBossKey = true; saveProgress(); logMessage = '取得果核王房卡！森林深處的大門可以開啟了。'; logTimer = 240; playSound(420, .25, 'triangle', 720); }
  if (room === 19 && !forestCheckpoint.activated && overlaps(player, forestCheckpoint)) { forestCheckpoint.activated = true; activeCheckpoint = 'forest'; if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); logMessage = '果園休息站已啟動，生命已恢復。'; logTimer = 180; saveProgress(); playSound(390, .22, 'sine', 700); }
  if (room === 10 && !townCheckpoint.activated && overlaps(player, townCheckpoint)) { townCheckpoint.activated = true; activeCheckpoint = 'town'; if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); logMessage = '鐘樓鎮休息站已啟動，生命已恢復。'; logTimer = 180; saveProgress(); playSound(390, .22, 'sine', 700); }
  if (room === 4 && !greenhouseCheckpoint.activated && overlaps(player, greenhouseCheckpoint)) { greenhouseCheckpoint.activated = true; activeCheckpoint = 'greenhouse'; if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); toolAmmo = postFall ? 0 : 4; logMessage = postFall ? '溫室休息站已啟動，生命已恢復；工具仍然損壞。' : '溫室休息站已啟動，生命與工具已恢復。'; logTimer = 180; saveProgress(); playSound(390, 0.22, 'sine', 700); }
  if (room === 2 && !elevatorCheckpoint.activated && overlaps(player, elevatorCheckpoint)) { elevatorCheckpoint.activated = true; activeCheckpoint = 'elevator'; if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); toolAmmo = postFall ? 0 : 4; logMessage = postFall ? '升降機井休息站已啟動，生命已恢復；工具仍然損壞。' : '升降機井休息站已啟動，生命與工具已恢復。'; logTimer = 180; saveProgress(); playSound(390, 0.22, 'sine', 700); }
  if (room === 0 && !checkpoint.activated && overlaps(player, checkpoint)) { checkpoint.activated = true; activeCheckpoint = 'boiler'; if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); toolAmmo = postFall ? 0 : 4; logMessage = postFall ? '鍋爐室休息站已啟動，生命已恢復；工具仍然損壞。' : '鍋爐室休息站已啟動，生命與工具已恢復。'; logTimer = 180; saveProgress(); playSound(390, 0.22, 'sine', 700); }
  if (crate.dropped && health < playerMaxHealth() && overlaps(player, crate)) { health++; crate.dropped = false; healingGlow(); playSound(500, 0.16, 'sine', 750); }
  if (room === 2 && steamCanister.available && steam < 3 && overlaps(player, steamCanister)) { steam++; steamCanister.available = false; logMessage = '取得蒸汽補給。'; logTimer = 120; playSound(300, .18, 'sine', 520); }
  if (room === 1 && supply.available && health < playerMaxHealth() && overlaps(player, supply)) { health++; supply.available = false; healingGlow(); playSound(500, 0.16, 'sine', 750); }
  if (repair.available && health < playerMaxHealth() && overlaps(player, repair)) { health++; repair.available = false; healingGlow(); playSound(500, 0.16, 'sine', 750); }
  if (room === 1 && !postFall && !doubleJumpUnlocked && overlaps(player, jumpUpgrade)) {
    doubleJumpUnlocked = true; saveProgress(); logMessage = '獲得蒸汽雙躍！空中可再按一次跳躍。'; logTimer = 240;
    playSound(360, 0.3, 'sine', 780);
  }
  for (const gear of memoryGears) {
    if (gear.room === room && !gear.collected && overlaps(player, equipment.yellow === 'magnet' ? {x: gear.x - 24, y: gear.y - 24, w: gear.w + 48, h: gear.h + 48} : gear)) {
      gear.collected = true; saveProgress();
      logMessage = '取得記憶齒輪（' + memoryGears.filter(item => item.collected).length + ' / ' + memoryGears.length + '）'; logTimer = 150;
      playSound(560, 0.18, 'sine', 840);
    }
  }
  if (room === 0 && !coreCollected && overlaps(player, core)) { coreCollected = true; saveProgress(); playSound(350, 0.3, 'sine', 700); }
  // Walking into the workshop's right edge also exits, so a mistimed E press
  // cannot leave the player stranded at the doorway.
  if (room === 8 && player.x >= canvas.width - player.w - 1 && direction > 0) {
    changeRoom(7); interactQueued = false; return;
  }
  if (interactQueued) {
    if(room===36&&nearbyStation()?.id==='dock'){
      if(health<playerMaxHealth())healingGlow();health=playerMaxHealth();activeCheckpoint='dock';saveProgress();logMessage='廢塢休息站：修復完畢，同伴正在燈旁休息。';logTimer=180;
    }
    else if(room===36&&Math.abs(player.x-505)<85){logMessage=dockShortcut?'主角：「找到回程升降梯了。別急，我扶你過去。」':'女同事：「我會在這裡等你……小心那些熔爐。」';logTimer=240;}
    else if(room===39&&overlaps(player,{x:dockLever.x-25,y:dockLever.y,w:80,h:55})){
      if(!dockShortcut){dockShortcut=true;saveProgress();playSound(220,.4,'triangle',440);}
      logMessage='回程升降梯已通電！從右側搭乘，或回去找同伴。';logTimer=240;
    }
    else if(isDockRoom()&&overlaps(player,exitDoor)){
      if(room===36){logMessage='上方已被坍塌的地板封死，得從熔塢尋找出路。';logTimer=180;}
      else changeRoom(room-1);
    }
    else if(isDockRoom()&&overlaps(player,door)){
      if(room<39)changeRoom(room+1);
      else if(dockShortcut)changeRoom(35);
      else {logMessage='先啟動旁邊的供電拉桿。';logTimer=180;}
    }
    else if(room===29 && overlaps(player,{x:wildAltar1.x-18,y:wildAltar1.y-5,w:wildAltar1.w+36,h:wildAltar1.h+5})) {
      if(altar1Claimed) logMessage='祭壇 1 的祝福已獲得；按 V 使用鐵之矛。';
      else {altar1Claimed=true;health=playerMaxHealth();steam=3;healingGlow();saveProgress();logMessage='祭壇 1：生命上限 +1，獲得鐵之矛！按 V 投出鐵鍊長矛。';playSound(330,.4,'triangle',660);}
      logTimer=240;
    }
    else if (room === 12 && overlaps(player, seedGate)) {
      if (forestSeedPlanted && farewellStage > farewellLines.length) changeRoom(28);
      else { logMessage = '這條通路尚未長出來，先找到並種下生命種子。'; logTimer = 180; }
    }
    else if (room === 12 && overlaps(player, {x: seedSoil.x - 25, y: seedSoil.y - 10, w: seedSoil.w + 50, h: seedSoil.h + 10})) {
      if (forestSeedPlanted) logMessage = '生命之樹已長成，高處的路已經開啟。';
      else if (!forestSeedOwned) logMessage = '這裡可以種下生命種子；先擊敗森林深處的果核機械王。';
      else { forestSeedOwned = false; forestSeedPlanted = true; farewellStage = 1; townChildX = Math.max(60, player.x - 55); player.vx = 0; keys.clear(); logTimer = 0; saveProgress(); logMessage = '種子發芽了。'; playSound(420, .35, 'triangle', 750); }
      logTimer = 220;
    }
    else if(room===32 && nearbyStation()?.id==='wild') {if(health < playerMaxHealth())healingGlow();health = playerMaxHealth();activeCheckpoint='wild';saveProgress();logMessage='營地休息完畢，重生點已更新。';logTimer=180;}
    else if(room===35 && duelistDefeated && !dockEntered && Math.abs(player.x-duelist.x)<100) {logMessage='主角：「先別動。你的核心還能修好……我會想辦法。」';logTimer=220;}
    else if(room===31 && overlaps(player,wildPogoGate)) changeRoom(34);
    else if(isWildRoom() && overlaps(player,exitDoor)) {
      if((room===33&&!wildGauntletCleared)||duelistActive()) {logMessage=room===35?'先讓她停下來，再離開這裡。':'三波車輪戰結束後才能離開。';logTimer=180;}
      else changeRoom(room===35?33:room===34?31:room===28?12:room-1);
    }
    else if(isWildRoom() && overlaps(player,door)) {
      if(room===33) {if(wildGauntletCleared)changeRoom(35);else {logMessage='擊退三波敵人，守住哨道！';logTimer=180;}}
      else if(room===35) {if(dockShortcut)changeRoom(39);else {logMessage=dockEntered?'回程升降梯尚未通電，可從休息站傳送回廢塢。':'躲開她的突刺，再尋找反擊機會。';logTimer=180;}}
      else if(room===34) {logMessage='完成試煉後從左側返回，或按 T 重試。';logTimer=180;}
      else changeRoom(room+1);
    }
    else if (room === 10 && overlaps(player, forestGate)) {
      if (familyStage >= 8) changeRoom(12);
      else { logMessage = '先和小孩回家，休息後再前往水果森林。'; logTimer = 180; }
    }
    else if (room === 19 && forestCheckpoint.activated && nearbyStation()?.id === 'forest') { if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); activeCheckpoint = 'forest'; saveProgress(); logMessage = '果園休息站：生命已恢復。'; logTimer = 180; }
    else if (isForestRoom() && overlaps(player, exitDoor)) changeRoom(room === 12 ? 10 : room - 1);
    else if (isForestRoom() && overlaps(player, door)) {
      if (room < 21) changeRoom(room + 1);
      else if (forestBossKey) changeRoom(27);
      else { logMessage = '需要果核王房卡，先在森林裡尋找。'; logTimer = 180; }
    }
    else if (room === 27 && overlaps(player, exitDoor)) {
      if (bossActive) { logMessage = '擊敗果核機械王後才能離開！'; logTimer = 150; }
      else changeRoom(21);
    }
    else if (room === 10 && townCheckpoint.activated && nearbyStation()?.id === 'town') { if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); activeCheckpoint = 'town'; saveProgress(); logMessage = '鐘樓鎮休息站：生命已恢復，重生點已更新。'; logTimer = 180; playSound(390, .22, 'sine', 700); }
    else if (room === 10 && player.x + player.w > 875 && player.y + player.h > 405) changeRoom(11);
    else if (room === 11 && overlaps(player, exitDoor)) changeRoom(10);
    else if (room === 11 && familyStage === 8 && Math.abs(player.x + player.w / 2 - 475) < 175 && player.y + player.h > 420) {
      logMessage = '主角：「……好多了。昨晚，謝了。」'; logTimer = 240;
    }
    else if (room === 11 && Math.abs(player.x + player.w / 2 - 475) < 175 && player.y + player.h > 420 && familyStage < 6) {
      const lines = [
        '媽媽：「你受損得很嚴重，今晚就在這裡休息吧。」',
        '爸爸：「外面天色不早了，先住一晚，明天再說。」',
        '主角：「不必了。我還有事要做，不能留下。」',
        '小孩：「可是你連站都站不穩……真的沒關係嗎？」',
        '小孩：「等等！你怎麼了？爸爸、媽媽！」'
      ];
      logMessage = lines[Math.max(0, familyStage - 1)]; logTimer = 240;
      familyStage = Math.min(6, familyStage + 1);
      if (familyStage === 6) { keys.clear(); player.vx = 0; player.vy = 0; attackTimer = 0; attackQueued = false; dashQueued = false; toolQueued=false; spearQueued=false; }
      saveProgress();
    }
    else if (room === 10 && townShops.some(townShopNear)) openTownShop(townShops.find(townShopNear));
    else if (room === 10 && Math.abs(player.x - townChildX) < 70 && player.y + player.h > 420) { logMessage = reunionStage > reunionLines.length ? '小孩：「見到你我好開心！要不要再逛逛鐘樓鎮？」' : '小孩：「鎮上有雜貨、服飾，還有我最喜歡的抓娃娃屋！」'; logTimer = 200; }
    else if (room === 9 && overlaps(player, door)) changeRoom(10);
    else if (room === 10 && overlaps(player, exitDoor)) changeRoom(9);
    else if (room === 9 && overlaps(player, {x: child.x - 55, y: child.y - 10, w: child.w + 110, h: child.h + 10})) {
      const conversation = [
        '小孩：「你終於醒了！你的機械零件好像壞了……」',
        '主角：「……只是零件而已。我還能走。」',
        '小孩：「可是剛才好大一聲，我以為你——」',
        '主角：「你有受傷嗎？這裡不安全，離廢墟遠一點。」',
        '小孩：「我沒事！前面就是鐘樓鎮，我帶你去吧。」'
      ];
      logMessage = conversation[childConversation]; logTimer = 240;
      if (childConversation < conversation.length - 1) { childConversation++; saveProgress(); }
    }
    else if (room === 0 && overlaps(player, branchDoor)) changeRoom(6);
    else if (room === 6 && nearBranchReturnDoor()) changeRoom(0);
    else if (room === 7 && nearBranchReturnDoor()) changeRoom(6);
    else if (room === 8 && nearBranchReturnDoor()) changeRoom(7);
    else if (room === 6 && overlaps(player, exitDoor)) changeRoom(7);
    else if (room === 7 && overlaps(player, exitDoor)) changeRoom(8);
    else if (room === 1 && (reactorPowered || (enemy.health === 0 && controlSwitch.active)) && overlaps(player, goal)) {
      reactorPowered = true; saveProgress(); changeRoom(2);
    }
    else if (room === 2 && overlaps(player, elevatorGoal)) changeRoom(3);
    else if (room === 3 && overlaps(player, arenaExit)) {
      if (bossDefeated && !bossActive) changeRoom(4);
      else { logMessage = '先擊敗蒸汽守衛！'; logTimer = 180; }
    }
    else if (room === 4 && overlaps(player, door)) changeRoom(5);
    else if (room === 5 && overlaps(player, exitDoor)) changeRoom(4);
    else if (room === 4 && !postFall && overlaps(player, greenhouseGoal)) { won = true; endingTime = 0; playSound(450, 0.4, 'triangle', 900); }
    else if (room === 4 && overlaps(player, exitDoor)) changeRoom(3);
    else if (room === 3 && overlaps(player, exitDoor)) changeRoom(2);
    else if (room === 2 && overlaps(player, exitDoor)) changeRoom(1);
    else if (room === 1 && overlaps(player, {x: controlSwitch.x - 15, y: controlSwitch.y - 10, w: controlSwitch.w + 30, h: controlSwitch.h + 10})) {
      if (!controlSwitch.active) { controlSwitch.active = true; playSound(280, 0.2, 'triangle', 560); }
      logMessage = '蒸汽開關已啟動。'; logTimer = 150;
    }
    else if (room === 0 && overlaps(player, {x: merchant.x - 15, y: merchant.y, w: merchant.w + 30, h: merchant.h})) { shopOpen = true; shopNotice = ''; keys.clear(); jumpQueued = false; attackQueued = false; dashQueued = false; toolQueued=false; spearQueued=false; }
    else if (room === 0 && coreCollected && overlaps(player, door)) changeRoom(1);
    else if (room === 1 && overlaps(player, exitDoor)) changeRoom(0);
    else if (room === 4 && greenhouseCheckpoint.activated && overlaps(player, {x: greenhouseCheckpoint.x - 20, y: greenhouseCheckpoint.y, w: greenhouseCheckpoint.w + 40, h: greenhouseCheckpoint.h})) {
      if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); toolAmmo = postFall ? 0 : 4; activeCheckpoint = 'greenhouse'; saveProgress(); logMessage = postFall ? '溫室休息站：生命已恢復，工具仍然損壞。' : '溫室休息站：生命與工具已恢復，重生點已更新。'; logTimer = 180; playSound(390, 0.22, 'sine', 700);
    }
    else if (room === 2 && elevatorCheckpoint.activated && overlaps(player, {x: elevatorCheckpoint.x - 20, y: elevatorCheckpoint.y, w: elevatorCheckpoint.w + 40, h: elevatorCheckpoint.h})) {
      if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); toolAmmo = postFall ? 0 : 4; activeCheckpoint = 'elevator'; saveProgress(); logMessage = postFall ? '升降機井休息站：生命已恢復，工具仍然損壞。' : '升降機井休息站：生命與工具已恢復，重生點已更新。'; logTimer = 180; playSound(390, 0.22, 'sine', 700);
    }
    else if (room === 0 && checkpoint.activated && overlaps(player, {x: checkpoint.x - 20, y: checkpoint.y, w: checkpoint.w + 40, h: checkpoint.h})) {
      if (health < playerMaxHealth()) healingGlow(); health = playerMaxHealth(); toolAmmo = postFall ? 0 : 4; activeCheckpoint = 'boiler'; saveProgress(); logMessage = postFall ? '鍋爐室休息站：生命已恢復，工具仍然損壞。' : '鍋爐室休息站：生命與工具已恢復，重生點已更新。'; logTimer = 180;
      playSound(390, 0.22, 'sine', 700);
    }
    else {
      const availableLogs = room === 0 ? [logs[room], secretLog] : room === 2 ? [logs[room], shaftLog] : room === 3 || room >= 5 ? [] : [logs[room]];
      const log = availableLogs.find(item => overlaps(player, {x: item.x - 30, y: item.y - 15, w: item.w + 60, h: item.h + 15}));
      if (log) { logMessage = log.text; logTimer = 300; if (!log.read) { log.read = true; saveProgress(); } playSound(450, 0.12, 'sine', 600); }
    }
  }
  interactQueued = false;
  if (player.y > canvas.height + 100) {
    if(room===34) startPogoRun('掉落了，回到起點重試；下劈時按住 S。');
    else if (room === 5) startCourse('掉落了，回到起點再試一次。');
    else { player.x = 90; player.y = 420; player.vx = 0; player.vy = 0; }
  }
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
// Draw the robot as separate parts so the same pieces scatter and reassemble.
function drawRobotFragments(spread) {
  const ease = spread * spread * (3 - 2 * spread);
  const facing = player.facing;
  function part(x, y, dx, dy, rotation, paint) {
    ctx.save(); ctx.translate(x + dx * ease * facing, y + dy * ease); ctx.rotate(rotation * ease * facing);
    paint(); ctx.restore();
  }
  part(5, 24, -37, 13, -.8, () => {
    ctx.scale(facing, 1); ctx.fillStyle = '#51483d'; ctx.beginPath();
    ctx.moveTo(6, -12); ctx.lineTo(-8, -7); ctx.lineTo(-20, 13); ctx.lineTo(-12, 10);
    ctx.lineTo(-9, 16); ctx.lineTo(-4, 12); ctx.lineTo(1, 16); ctx.lineTo(8, 9); ctx.closePath(); ctx.fill();
  });
  part(15, 0, -28, -32, -.7, () => {
    ctx.fillStyle = '#705638'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-21, 5); ctx.lineTo(21, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c2a16a'; ctx.fillRect(-21, 4, 42, 3);
  });
  part(15, 12, 30, -22, .9, () => {
    ctx.fillStyle = '#91a49b'; ctx.fillRect(-11, -8, 22, 16);
    ctx.fillStyle = '#52645e'; ctx.fillRect(-11, -7, 22, 4); ctx.fillRect(-11, 5, 22, 3);
    ctx.fillStyle = '#263e3b'; ctx.fillRect(facing > 0 ? 1 : -9, -3, 8, 7);
    ctx.fillStyle = '#aeeedb'; ctx.fillRect(facing > 0 ? 3 : -8, -2, 5, 5);
  });
  part(15, 25, 0, 17, .25, () => {
    ctx.fillStyle = '#5d716b'; ctx.fillRect(-10, -10, 20, 21);
    ctx.fillStyle = '#81928a'; ctx.fillRect(-8, -8, 16, 14);
    ctx.fillStyle = '#c7a36b'; ctx.fillRect(-2, -6, 5, 7);
    ctx.fillStyle = '#a6e4cd'; ctx.fillRect(-1, -4, 3, 3);
  });
  part(facing > 0 ? 3 : 27, 25, 42, 2, 1.1, () => { ctx.fillStyle = '#5d716b'; ctx.fillRect(-3, -7, 6, 14); });
  part(9, 38, -33, 26, -1.2, () => { ctx.fillStyle = '#292622'; ctx.fillRect(-4, -4, 8, 8); });
  part(22, 38, 35, 23, 1.1, () => { ctx.fillStyle = '#292622'; ctx.fillRect(-4, -4, 8, 8); });
}
function drawRepairWrench() {
  // A cracked chest plate and a small wrench move together during the channel.
  ctx.strokeStyle = '#35433e'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(11, 20); ctx.lineTo(14, 23); ctx.lineTo(12, 26); ctx.lineTo(16, 29); ctx.stroke();
  ctx.save(); ctx.translate(15, 23); ctx.scale(player.facing, 1);
  ctx.rotate(-.25 + Math.sin((HEAL_DURATION - healTimer) * .3) * .4);
  ctx.strokeStyle = '#d5ded1'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(-1, 5); ctx.lineTo(12, -8); ctx.stroke();
  ctx.beginPath(); ctx.arc(14, -10, 4, -2.5, 2.2); ctx.stroke();
  ctx.fillStyle = '#7e9388'; ctx.fillRect(-3, 3, 5, 5);
  ctx.fillStyle = '#f0c879';
  if (Math.floor((HEAL_DURATION - healTimer) / 6) % 2 === 0) { ctx.fillRect(4, -4, 3, 3); ctx.fillRect(1, -8, 2, 2); }
  ctx.restore();
}
function drawDockBackdrop(){
  const bg=ctx.createLinearGradient(0,0,0,540);bg.addColorStop(0,'#151b23');bg.addColorStop(.6,'#34272b');bg.addColorStop(1,'#8c422d');ctx.fillStyle=bg;ctx.fillRect(0,0,960,540);
  // Layered gantries, riveted pipes and distant furnace mouths.
  for(let i=0;i<7;i++){
    const x=i*155-30;ctx.fillStyle='#20232a';ctx.fillRect(x,90+(i%2)*40,80,395);
    ctx.strokeStyle='#454046';ctx.lineWidth=7;ctx.strokeRect(x+9,115,62,370);
    ctx.beginPath();ctx.moveTo(x+10,210);ctx.lineTo(x+70,280);ctx.moveTo(x+70,280);ctx.lineTo(x+10,350);ctx.stroke();
    ctx.fillStyle='#ad5d35';ctx.fillRect(x+28,350,30,100);ctx.fillStyle='#e7974e';ctx.fillRect(x+35,375,7,60);
  }
  ctx.fillStyle='#191c22';ctx.fillRect(0,145,960,19);ctx.fillRect(0,280,960,10);
  for(let i=0;i<5;i++){
    const x=95+i*195;ctx.strokeStyle='#807366';ctx.lineWidth=2;
    for(let y=0;y<210+(i%2)*90;y+=13){ctx.beginPath();ctx.ellipse(x,y,4,7,0,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle='#514743';ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,232+(i%2)*90,27,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#96714f';ctx.lineWidth=3;for(let a=0;a<4;a++){const angle=ambientTime*.008+a*Math.PI/2;ctx.beginPath();ctx.moveTo(x,232+(i%2)*90);ctx.lineTo(x+Math.cos(angle)*25,232+(i%2)*90+Math.sin(angle)*25);ctx.stroke();}
  }
  if(room===37||room===38){
    ctx.fillStyle='#b94925';ctx.fillRect(0,500,960,40);ctx.fillStyle='#f6a34d';
    for(let x=0;x<960;x+=12)ctx.fillRect(x,499+Math.sin(x*.03+ambientTime*.06)*3,12,5);
    ctx.fillStyle='rgba(236,105,42,.13)';ctx.fillRect(0,445,960,55);
  }
  for(let i=0;i<22;i++){const x=(i*83+ambientTime*.18)%960,y=490-(i*59+ambientTime*.35)%370;ctx.fillStyle=i%3?'#bb7844':'#ffcb72';ctx.fillRect(x,y,2,3);}
}
function drawDockCompanion(x,y,falling=false){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#d6c8b5';ctx.beginPath();ctx.moveTo(-12,13);ctx.lineTo(-22,40);ctx.lineTo(-10,36);ctx.lineTo(3,44);ctx.lineTo(15,35);ctx.lineTo(10,13);ctx.closePath();ctx.fill();
  ctx.fillStyle='#96556c';ctx.fillRect(-14,13,28,5);ctx.fillRect(-21,25,9,5);ctx.fillStyle='#70837d';ctx.fillRect(-9,18,18,19);
  ctx.fillStyle='#bac3b5';ctx.fillRect(-9,0,18,14);ctx.fillStyle='#283837';ctx.fillRect(0,5,8,6);ctx.fillStyle='#c5ea8e';ctx.fillRect(2,7,4,3);
  ctx.strokeStyle='#bc986b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-10,4,5,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#3d4547';ctx.fillRect(-9,37,7,falling?14:6);ctx.fillRect(3,37,7,falling?14:6);ctx.restore();
}
function drawDockActors(){
  if(room===36){
    ctx.fillStyle='#80654c';ctx.fillRect(465,479,95,6);drawDockCompanion(505,438);
    ctx.fillStyle='#f7bf68';ctx.fillRect(561,360,5,125);ctx.fillStyle='#dd9a4c';ctx.fillRect(552,358,23,30);
    ctx.fillStyle='rgba(255,192,106,.08)';ctx.beginPath();ctx.arc(564,373,88,0,Math.PI*2);ctx.fill();
    ctx.textAlign='center';ctx.fillStyle='#ecd1b3';ctx.font='13px sans-serif';ctx.fillText('E 與女同事交談',505,422);
    ctx.fillStyle='#4d5150';ctx.fillRect(dockCheckpoint.x,443,32,42);ctx.fillStyle='#b4e3c3';ctx.fillRect(dockCheckpoint.x+7,451,18,20);
    ctx.fillStyle='#ded4b5';ctx.fillText('E 休息 · G 傳送',dockCheckpoint.x+16,425);
    ctx.fillStyle='#66594f';for(let i=0;i<7;i++)ctx.fillRect(20+i*10,420+(i%3)*15,15,65);
    ctx.textAlign='left';ctx.fillStyle='#cbb79b';ctx.fillText('坍塌封路',12,395);
  }
  if(room===37){
    const cycle=wildTicks%210;ctx.fillStyle='#543e36';ctx.fillRect(dockJet.x-5,477,55,8);
    if(cycle>=100&&cycle<135){ctx.strokeStyle='#f3be66';ctx.setLineDash([4,5]);ctx.strokeRect(dockJet.x,dockJet.y,dockJet.w,dockJet.h);ctx.setLineDash([]);ctx.textAlign='center';ctx.fillStyle='#ffd37d';ctx.font='14px sans-serif';ctx.fillText('爐口即將噴發',582,380);}
    if(cycle>=135&&cycle<180){ctx.fillStyle='rgba(255,130,51,.65)';ctx.fillRect(dockJet.x,dockJet.y,dockJet.w,dockJet.h);ctx.fillStyle='#ffe08a';ctx.fillRect(dockJet.x+14,dockJet.y+13,15,77);}
  }
  for(const platform of roomPlatforms[room])if(platform.dockLift){ctx.strokeStyle='#a99070';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(platform.x+12,0);ctx.lineTo(platform.x+12,platform.y);ctx.moveTo(platform.x+platform.w-12,0);ctx.lineTo(platform.x+platform.w-12,platform.y);ctx.stroke();ctx.fillStyle='#e5ce9c';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('吊鏈升降台',platform.x+platform.w/2,platform.y+32);}
  if(room===39){ctx.fillStyle='#5b665a';ctx.fillRect(830,452,40,33);ctx.strokeStyle=dockShortcut?'#c4e5a0':'#d7a26d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(850,461);ctx.lineTo(dockShortcut?866:835,430);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#ebce9f';ctx.font='13px sans-serif';ctx.fillText(dockShortcut?'回程梯已通電':'E 啟動供電拉桿',840,415);}
  if(room>36){ctx.strokeStyle='#ad8a67';ctx.lineWidth=2;ctx.strokeRect(5,405,48,80);ctx.textAlign='left';ctx.fillStyle='#e8cfaa';ctx.font='13px sans-serif';ctx.fillText('E 返回',5,395);}
  ctx.strokeStyle='#b99b78';ctx.lineWidth=2;ctx.strokeRect(907,405,46,80);ctx.textAlign='right';ctx.fillStyle='#ead4ae';ctx.font='13px sans-serif';ctx.fillText(room===39?'E 回程升降梯':'E 前往下一區',952,395);
}
function drawDockArrival(){
  ctx.fillStyle='rgba(19,22,27,.96)';ctx.fillRect(85,335,790,175);ctx.strokeStyle='#c09367';ctx.lineWidth=2;ctx.strokeRect(85,335,790,175);
  ctx.textAlign='center';ctx.fillStyle='#efc58d';ctx.font='bold 22px sans-serif';ctx.fillText('區域 4 · 地下熔塢',480,375);
  ctx.fillStyle='#e7ded0';ctx.font='18px sans-serif';ctx.fillText(dockArrivalLines[dockArrivalStage-1],480,428);ctx.font='14px sans-serif';ctx.fillText('按 E 繼續',480,483);
}
function drawDockMap(){
  ctx.fillStyle='rgba(17,20,26,.97)';ctx.fillRect(0,0,960,540);ctx.textAlign='center';ctx.fillStyle='#e9c79b';ctx.font='bold 26px sans-serif';ctx.fillText('區域 4 · 地下熔塢',480,76);
  const points=[{x:70,y:160},{x:310,y:160},{x:550,y:275},{x:310,y:370}];
  ctx.strokeStyle='#ad8461';ctx.lineWidth=3;
  for(let i=0;i<3;i++)if(visitedRooms[36+i]&&visitedRooms[37+i]){ctx.beginPath();ctx.moveTo(points[i].x+90,points[i].y+35);ctx.lineTo(points[i+1].x+90,points[i+1].y+35);ctx.stroke();}
  points.forEach((point,i)=>{if(!visitedRooms[36+i])return;ctx.fillStyle=room===36+i?'#75503c':'#33343b';ctx.fillRect(point.x,point.y,180,70);ctx.strokeStyle='#c69a6a';ctx.strokeRect(point.x,point.y,180,70);ctx.fillStyle='#efdab9';ctx.font='16px sans-serif';ctx.fillText(dockZones[i].name,point.x+90,point.y+28);ctx.font='12px sans-serif';ctx.fillText(i===0?'同伴 · 休息傳送站':i===3?(dockShortcut?'回程捷徑已開啟':'回程升降梯供電'):'已探索',point.x+90,point.y+52);});
  ctx.fillStyle='#c8b79d';ctx.font='14px sans-serif';ctx.fillText('坍塌處無法攀回；舊泵房的升降梯通往故人決鬥場。',480,487);ctx.fillText('Tab 關閉',480,517);
}
function drawDockFall(){
  const t=dockFallTick;ctx.textAlign='center';
  if(t<60){
    ctx.strokeStyle='#17171c';ctx.lineWidth=4;
    for(let i=0;i<7;i++){const x=140+i*110;ctx.beginPath();ctx.moveTo(x,485);ctx.lineTo(x+24,496);ctx.lineTo(x+6,508);ctx.lineTo(x+35,532);ctx.stroke();}
    ctx.fillStyle='rgba(17,18,22,.85)';ctx.fillRect(180,315,600,80);ctx.fillStyle='#f1d5ad';ctx.font='21px sans-serif';ctx.fillText(t<30?'女同事：「等等……地板在震動！」':'主角：「抓緊我！」',480,363);return;
  }
  const fall=t-60;ctx.fillStyle='#10151d';ctx.fillRect(0,0,960,540);
  ctx.fillStyle='#352d30';ctx.fillRect(0,0,155,540);ctx.fillRect(805,0,155,540);
  ctx.strokeStyle='#65554a';ctx.lineWidth=12;for(let i=0;i<5;i++){const y=(i*160-fall*8)%800;ctx.strokeRect(20,y,100,100);ctx.strokeRect(840,y+40,100,100);}
  for(let i=0;i<17;i++){const x=165+(i*83)%625,y=((i*57-fall*5)%620+620)%620-40;ctx.fillStyle=i%2?'#79624b':'#534637';ctx.save();ctx.translate(x,y);ctx.rotate(fall*.03+i);ctx.fillRect(-8,-6,16+(i%3)*8,12);ctx.restore();}
  const y=180+Math.min(fall,75)*1.1;
  ctx.save();ctx.translate(425,y);ctx.rotate(-.12);ctx.fillStyle='#626b63';ctx.fillRect(-12,7,27,30);ctx.fillStyle='#49483e';ctx.beginPath();ctx.moveTo(-14,12);ctx.lineTo(-27,42);ctx.lineTo(5,35);ctx.closePath();ctx.fill();ctx.fillStyle='#758c81';ctx.fillRect(-10,-5,23,17);ctx.fillStyle='#c9b27a';ctx.beginPath();ctx.moveTo(-25,-4);ctx.lineTo(0,-20);ctx.lineTo(26,-4);ctx.closePath();ctx.fill();ctx.fillStyle='#b9e4b0';ctx.fillRect(4,1,7,4);ctx.fillStyle='#4b5250';ctx.fillRect(-9,35,8,17);ctx.fillRect(8,35,8,17);ctx.strokeStyle='#8d9e91';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(12,19);ctx.lineTo(58,23);ctx.stroke();ctx.restore();
  drawDockCompanion(495,y+8,true);ctx.fillStyle='#edc391';ctx.font='22px sans-serif';ctx.fillText('兩人墜入熔爐深處……',480,450);
  if(t>155){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,(t-155)/24)+')';ctx.fillRect(0,0,960,540);}
}
function drawWildBackdrop() {
  const kind=room===35?'duel':room===34?'gorge':wildZones[room-28].kind, trail=kind==='trail'||kind==='camp'||kind==='duel';
  const sky=ctx.createLinearGradient(0,0,0,540);
  sky.addColorStop(0,trail?'#1d3836':'#6a8976');sky.addColorStop(.62,trail?'#5d7560':'#c5c994');sky.addColorStop(1,'#494f39');
  ctx.fillStyle=sky;ctx.fillRect(0,0,960,540);
  ctx.fillStyle=trail?'#6c8670':'#e1d3a0';ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(725,155,45,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  for(let layer=0;layer<3;layer++){
    ctx.fillStyle=['#627e67','#506f5c','#405d4e'][layer];ctx.globalAlpha=.45+layer*.13;
    ctx.beginPath();ctx.moveTo(0,540);
    for(let x=0;x<=1000;x+=80)ctx.lineTo(x,280+layer*62+Math.sin(x*.009+layer+(room-28)*.6)*(28-layer*5));
    ctx.lineTo(1000,540);ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=1;
  if(trail) for(let i=0;i<7;i++){
    const x=30+i*155+(room%2)*25;ctx.fillStyle='#293f36';
    ctx.beginPath();ctx.moveTo(x,485);ctx.lineTo(x+26,70+i%3*30);ctx.lineTo(x+45,100);ctx.lineTo(x+60,485);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#4b6250';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x+32,185);ctx.lineTo(x-30,130);ctx.moveTo(x+35,230);ctx.lineTo(x+105,160);ctx.stroke();
  }
  // Wind-bent reed silhouettes replace the pipes beyond the town.
  ctx.strokeStyle=trail?'#6c805a':'#8c9562';ctx.lineWidth=3;
  for(let i=0;i<20;i++){
    const x=i*53+(room%3)*9, sway=Math.sin(ambientTime*.024+i)*9;
    ctx.beginPath();ctx.moveTo(x,485);ctx.lineTo(x+8+sway,365-i%4*22);ctx.stroke();
    ctx.fillStyle='#b6b67c';ctx.beginPath();ctx.ellipse(x+9+sway,355-i%4*22,3,14,.3,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<14;i++){
    const x=(i*79+ambientTime*(.35+i%3*.12))%1000-20,y=170+(i*47)%260;
    ctx.fillStyle=i%3===0?'rgba(184,238,108,.55)':'rgba(231,224,166,.35)';ctx.fillRect(x,y,3,2);
  }
  if(kind==='gorge'){
    ctx.fillStyle='#263b36';ctx.fillRect(350,485,220,55);
    ctx.strokeStyle='#bdad7b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(305,485);ctx.lineTo(305,445);ctx.moveTo(600,485);ctx.lineTo(600,445);ctx.stroke();
  }
  if(kind==='camp'){
    ctx.fillStyle='#484936';ctx.beginPath();ctx.moveTo(330,465);ctx.lineTo(470,260);ctx.lineTo(620,465);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#bbad76';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#1f332d';ctx.fillRect(450,367,55,98);
    ctx.fillStyle='#d9a05e';ctx.beginPath();ctx.arc(585,456,11+Math.sin(ambientTime*.12)*2,0,Math.PI*2);ctx.fill();
  }
  if(trail){ctx.fillStyle='rgba(176,198,165,.09)';for(let i=0;i<4;i++)ctx.fillRect(-30+Math.sin(ambientTime*.006+i)*35,230+i*48,1050,24);}
  if(room===28){ctx.textAlign='center';ctx.fillStyle='#e6e3b9';ctx.font='16px sans-serif';ctx.fillText('樹根之路 · 新旅程的入口',480,160);}
}
function drawWildActors() {
  if(isWildRoom())for(const platform of roomPlatforms[room]){
    ctx.strokeStyle=room<=30?'#acb77b':'#8ea078';ctx.lineWidth=1.5;
    for(let x=platform.x+5;x<platform.x+platform.w-3;x+=11){
      const h=5+(Math.floor(x)%13),sway=Math.sin(ambientTime*.035+x*.04)*4;
      ctx.beginPath();ctx.moveTo(x,platform.y);ctx.lineTo(x+sway,platform.y-h);ctx.stroke();
    }
  }
  for(const foe of wildEnemies){
    const shot=foe.shot;
    if(shot.active){ctx.fillStyle='#c5f48b';ctx.fillRect(shot.x,shot.y,shot.w,shot.h);ctx.strokeStyle='#7fa962';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(shot.x+8-shot.vx*3,shot.y+4);ctx.lineTo(shot.x+8,shot.y+4);ctx.stroke();}
    if(foe.health<=0)continue;
    const spec=(isDockRoom()?dockEnemyTypes:wildEnemyTypes)[foe.type];ctx.fillStyle='rgba(170,237,104,.15)';ctx.beginPath();ctx.arc(foe.x+17,foe.y+20,27,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=foe.flash?'#f4f5b6':spec.color;
    ctx.beginPath();ctx.moveTo(foe.x+5,foe.y+31);ctx.lineTo(foe.x+8,foe.y+9);ctx.lineTo(foe.x+17,foe.y);ctx.lineTo(foe.x+27,foe.y+10);ctx.lineTo(foe.x+31,foe.y+31);ctx.closePath();ctx.fill();
    ctx.fillStyle='#293f36';ctx.fillRect(foe.x+8,foe.y+13,18,9);ctx.fillRect(foe.x+6,foe.y+31,7,9);ctx.fillRect(foe.x+23,foe.y+31,7,9);
    ctx.fillStyle='#ceff89';ctx.fillRect(foe.x+(foe.direction>0?20:10),foe.y+15,5,4);
    ctx.strokeStyle='#b3ef79';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(foe.x+18,foe.y+22);ctx.lineTo(foe.x+14,foe.y+27);ctx.lineTo(foe.x+21,foe.y+30);ctx.stroke();
    if(!isDockRoom()&&foe.type===0){ctx.strokeStyle='#d8d9af';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(foe.x+17+foe.direction*13,foe.y+25);ctx.lineTo(foe.x+17+foe.direction*34,foe.y+7);ctx.stroke();}
    if(!isDockRoom()&&foe.type===1){ctx.strokeStyle='#b7c89a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(foe.x+17+foe.direction*21,foe.y+22,14,-1.4,1.4);ctx.stroke();}
    if(!isDockRoom()&&foe.type===2){ctx.fillStyle='rgba(202,221,173,.6)';ctx.beginPath();ctx.ellipse(foe.x-2,foe.y+5,17,5,Math.sin(ambientTime*.4)*.5,0,Math.PI*2);ctx.ellipse(foe.x+36,foe.y+5,17,5,-Math.sin(ambientTime*.4)*.5,0,Math.PI*2);ctx.fill();}
    if(isDockRoom()){
      if(foe.type===0){
        ctx.fillStyle='#684737';ctx.fillRect(foe.x+2,foe.y+9,31,23);ctx.strokeStyle='#ad9474';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(foe.x+17,foe.y+25);ctx.lineTo(foe.x+17+foe.direction*27,foe.y+(foe.state==='warning'?-13:30));ctx.stroke();ctx.fillStyle='#df9d58';ctx.fillRect(foe.x+5+foe.direction*27,foe.y+(foe.state==='warning'?-23:20),25,20);
      }else if(foe.type===1){
        ctx.fillStyle='#4a4b47';ctx.fillRect(foe.x+2,foe.y+6,30,25);ctx.fillStyle='#d98c48';ctx.fillRect(foe.x+7,foe.y+11,20,14);ctx.fillStyle='#71776c';ctx.fillRect(foe.x+9,foe.y-9,16,19);
      }else{
        ctx.fillStyle='#535f60';ctx.fillRect(foe.x-5,foe.y+4,44,27);ctx.strokeStyle='#b6a281';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(foe.x+17,foe.y+4);ctx.lineTo(foe.x+17,foe.y-20);ctx.stroke();ctx.fillStyle='#eab16a';ctx.fillRect(foe.x+8,foe.y+28,18,8);
      }
      if(shot.active){ctx.fillStyle=shot.kind==='beam'?'rgba(255,185,91,.75)':'#f2a34d';ctx.fillRect(shot.x,shot.y,shot.w,shot.h);ctx.fillStyle='#ffe3a3';if(shot.kind==='beam')ctx.fillRect(shot.x+9,shot.y,6,shot.h);}
      if(foe.state==='warning'){
        ctx.strokeStyle='#f8b86a';ctx.fillStyle='#f6cc86';ctx.textAlign='center';ctx.font='12px sans-serif';
        if(foe.type===0){ctx.strokeRect(foe.direction>0?foe.x+34:foe.x-120,469,120,16);ctx.fillText('熔錘震地',foe.x+17,foe.y-35);}
        else if(foe.type===1){ctx.beginPath();ctx.ellipse(foe.targetX,480,38,7,0,0,Math.PI*2);ctx.stroke();ctx.fillText('熔渣拋射',foe.x+17,foe.y-35);}
        else {ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(foe.x+17,foe.y+34);ctx.lineTo(foe.x+17,485);ctx.stroke();ctx.setLineDash([]);ctx.fillText('熱束鎖定',foe.x+17,foe.y-35);}
      }
    }
    ctx.fillStyle='#334235';ctx.fillRect(foe.x,foe.y-9,34,3);ctx.fillStyle='#c5db87';ctx.fillRect(foe.x,foe.y-9,34*foe.health/foe.maxHealth,3);
    if(foe.state!=='warning' && Math.abs(player.x-foe.x)<180){ctx.textAlign='center';ctx.fillStyle='#cfe69b';ctx.font='11px sans-serif';ctx.fillText(spec.name,foe.x+17,foe.y-17);}
    if(foe.state==='warning'){
      ctx.textAlign='center';ctx.fillStyle='#f1d692';ctx.font='bold 18px sans-serif';ctx.fillText('！',foe.x+17,foe.y-17);
      if(!isDockRoom()&&foe.type===1){ctx.strokeStyle='rgba(198,240,135,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(foe.x+17,foe.y+20);ctx.lineTo(foe.targetX,foe.targetY);ctx.stroke();}
      if(!isDockRoom()&&foe.type===2){ctx.strokeStyle='#a7cc80';ctx.strokeRect(foe.targetX-20,foe.targetY-12,40,32);}
    }
  }
  if(room===29){
    ctx.fillStyle='#485946';ctx.fillRect(wildAltar1.x-9,wildAltar1.y+43,58,11);ctx.fillStyle='#7c8d70';ctx.fillRect(wildAltar1.x+5,wildAltar1.y+12,30,35);
    ctx.strokeStyle=altar1Claimed?'#c1e2a2':'#c1ae7c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(wildAltar1.x+20,wildAltar1.y+13,17,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=altar1Claimed?'#d9f6ae':'#cfbb7e';ctx.fillRect(wildAltar1.x+17,wildAltar1.y-7,6,37);
    ctx.textAlign='center';ctx.fillStyle='#e9e3b7';ctx.font='13px sans-serif';ctx.fillText(altar1Claimed?'祭壇 1 · 已啟動':'E 啟動祭壇 1',wildAltar1.x+20,wildAltar1.y-18);
  }
  if(room===30){ctx.textAlign='center';ctx.fillStyle='#e6dbad';ctx.font='14px sans-serif';ctx.fillText('跳躍後按 Shift 衝過斷崖',460,315);}
  if(room===31){
    const cycle=wildTicks%240;ctx.fillStyle=cycle>=100&&cycle<130?'#e4b577':'#65864f';ctx.fillRect(wildTrap.x,wildTrap.y+14,wildTrap.w,6);
    if(cycle>=130&&cycle<185){ctx.fillStyle='#b1d875';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(wildTrap.x+i*12,wildTrap.y+20);ctx.lineTo(wildTrap.x+i*12+6,wildTrap.y-4);ctx.lineTo(wildTrap.x+i*12+12,wildTrap.y+20);ctx.fill();}}
    ctx.fillStyle='#3a5441';ctx.fillRect(wildPogoGate.x,wildPogoGate.y,wildPogoGate.w,wildPogoGate.h);ctx.strokeStyle='#b5cf92';ctx.strokeRect(wildPogoGate.x,wildPogoGate.y,wildPogoGate.w,wildPogoGate.h);
    ctx.textAlign='center';ctx.fillStyle='#e2e6be';ctx.font='13px sans-serif';ctx.fillText('E 下劈試煉',wildPogoGate.x+22,wildPogoGate.y-8);
  }
  if(room===32){
    ctx.fillStyle='#5e4935';ctx.fillRect(wildCheckpoint.x+3,wildCheckpoint.y+7,26,39);ctx.fillStyle=wildCheckpoint.activated?'#b4f2de':'#ac8a59';ctx.fillRect(wildCheckpoint.x+8,wildCheckpoint.y+12,16,20);
    ctx.fillStyle='#d7b577';ctx.fillRect(wildCheckpoint.x,wildCheckpoint.y+3,32,5);ctx.textAlign='center';ctx.fillStyle='#e7e6c3';ctx.font='13px sans-serif';ctx.fillText(wildCheckpoint.activated?'E 休息 · G 傳送':'獵者營地休息站',wildCheckpoint.x+16,wildCheckpoint.y-10);
  }
  if(room===33){
    if(!wildGauntletCleared && gauntletWait>0) for(const spawn of gauntletWaves[gauntletWave-1]) {ctx.strokeStyle='#bada7f';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(spawn.x+17,480,28,6,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#cbdb9a';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('輻射反應',spawn.x+17,spawn.type===2?270:433);}
    ctx.textAlign='center';ctx.font='17px sans-serif';ctx.fillStyle='#e3d3a9';ctx.fillText(wildGauntletCleared?'三波車輪戰完成':gauntletWait>0?'第 '+gauntletWave+' 波即將來襲':'第 '+gauntletWave+' 波 · 剩餘 '+wildEnemies.filter(foe=>foe.health>0).length+' 名',480,235);
    if(!wildGauntletCleared){ctx.fillStyle='#5a7050';ctx.fillRect(8,405,44,80);ctx.fillRect(908,405,44,80);ctx.strokeStyle='#b6c28e';ctx.lineWidth=3;for(let y=410;y<485;y+=17){ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(52,y+15);ctx.moveTo(908,y);ctx.lineTo(952,y+15);ctx.stroke();}}
  }
  if(room===35&&!dockEntered)drawDuelist();
  if(room===34){
    for(const target of wildPogoTargets){drawGear(target.x+27,target.y+9,24,ambientTime*.035);ctx.fillStyle=target.flash?'#f0ffc4':'#a6d49b';ctx.fillRect(target.x,target.y,target.w,5);}
    ctx.fillStyle='#9bc58c';ctx.fillRect(wildPogoGoal.x,wildPogoGoal.y,wildPogoGoal.w,wildPogoGoal.h);ctx.textAlign='center';ctx.fillStyle='#e9e6bc';ctx.font='13px sans-serif';ctx.fillText('試煉終點',wildPogoGoal.x+17,wildPogoGoal.y-10);
  }
  if(room<34){ctx.fillStyle='#364e3f';ctx.fillRect(905,405,50,80);ctx.strokeStyle='#b6c697';ctx.lineWidth=3;ctx.strokeRect(907,407,46,76);ctx.textAlign='right';ctx.fillStyle='#e6ddbb';ctx.font='13px sans-serif';ctx.fillText(room===33?'E 故人決鬥場':'E 前往下一區',950,395);}
}
function drawDuelist() {
  const x=duelist.x,y=duelistDefeated?duelist.y+15:duelist.y;
  ctx.fillStyle='rgba(159,215,126,.12)';ctx.beginPath();ctx.arc(x+18,y+26,38,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(x+18,y);ctx.scale(duelist.direction,1);
  ctx.fillStyle=duelist.flash?'#fff3d6':'#ddd4c2';ctx.beginPath();ctx.moveTo(-9,14);ctx.lineTo(-25,45);ctx.lineTo(-14,40);ctx.lineTo(-11,50);ctx.lineTo(9,41);ctx.lineTo(8,16);ctx.closePath();ctx.fill();
  ctx.fillStyle='#985c72';ctx.fillRect(-11,15,22,5);ctx.fillRect(-20,35,10,5);
  ctx.fillStyle='#617b76';ctx.fillRect(-9,17,18,23);ctx.fillStyle='#b0bdb1';ctx.fillRect(-8,1,17,15);
  ctx.fillStyle='#374f4e';ctx.fillRect(0,7,8,6);ctx.fillStyle='#bfe98c';ctx.fillRect(3,8,4,3);
  ctx.strokeStyle='#ba9b70';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-9,5,6,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#b8ed83';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,23);ctx.lineTo(2,28);ctx.lineTo(-2,32);ctx.lineTo(4,36);ctx.stroke();
  ctx.fillStyle='#3e4240';ctx.fillRect(-8,40,6,duelistDefeated?0:14);ctx.fillRect(4,40,6,duelistDefeated?0:14);
  ctx.strokeStyle='#eee9d5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,25);
  if(duelist.state==='guard')ctx.lineTo(26,-5);else if(duelist.state==='leap')ctx.lineTo(41,53);else ctx.lineTo(duelist.state==='thrust'?78:42,duelist.state==='thrust'?24:6);ctx.stroke();
  ctx.strokeStyle='#b99868';ctx.lineWidth=3;ctx.beginPath();ctx.arc(13,24,6,-1.5,1.5);ctx.stroke();ctx.restore();
  ctx.textAlign='center';ctx.font='14px sans-serif';ctx.fillStyle='#e2d0be';
  if(duelistDefeated)ctx.fillText('她跪坐在地，仍有微弱的核心光。',480,260);
  else if(duelist.state==='warning'||duelist.state==='counterTell'){
    ctx.fillText(duelist.state==='counterTell'?'反擊突刺！':{dash:'細劍突刺！',leap:'空中穿刺！',guard:'招架姿勢：等待破綻'}[duelist.move],x+18,y-18);
    ctx.fillStyle='rgba(201,145,169,.3)';ctx.fillRect(duelist.direction>0?x+36:x-100,455,100,30);
  } else if(duelist.state==='guard'){ctx.strokeStyle='#e6c18e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+18,y+25,33,0,Math.PI*2);ctx.stroke();}
}
function drawWildMap() {
  ctx.fillStyle='rgba(18,29,25,.98)';ctx.fillRect(0,0,960,540);ctx.textAlign='center';ctx.fillStyle='#e8d4a4';ctx.font='bold 26px sans-serif';ctx.fillText('區域 3 · 風原與獵徑',480,65);
  ctx.fillStyle='#b4ca9a';ctx.font='14px sans-serif';ctx.fillText('此地的獵者已遭輻射感染',480,95);
  const points=wildZones.map((_,i)=>({x:120+(i<3?i:5-i)*250,y:145+Math.floor(i/3)*125}));
  ctx.strokeStyle='#859d6c';ctx.lineWidth=4;
  for(let i=0;i<5;i++){if(!visitedRooms[28+i]||!visitedRooms[29+i])continue;ctx.beginPath();ctx.moveTo(points[i].x+95,points[i].y+35);ctx.lineTo(points[i+1].x+95,points[i+1].y+35);ctx.stroke();}
  points.forEach((point,i)=>{if(!visitedRooms[28+i])return;ctx.fillStyle=room===28+i?'#626c45':'#354d3c';ctx.fillRect(point.x,point.y,190,70);ctx.strokeStyle=room===28+i?'#e3c88b':'#95ac7d';ctx.lineWidth=2;ctx.strokeRect(point.x,point.y,190,70);ctx.fillStyle='#e2d6b3';ctx.font='16px sans-serif';ctx.fillText(wildZones[i].name,point.x+95,point.y+28);ctx.fillStyle='#bace9b';ctx.font='12px sans-serif';ctx.fillText(i===4&&wildCheckpoint.activated?'休息傳送站':i===5?(wildGauntletCleared?'車輪戰已完成':'三波車輪戰'):'已探索',point.x+95,point.y+53);});
  if(visitedRooms[34]){ctx.fillStyle=room===34?'#626c45':'#354d3c';ctx.fillRect(120,395,190,60);ctx.strokeStyle='#b5ca89';ctx.strokeRect(120,395,190,60);ctx.fillStyle='#e2d6b3';ctx.font='15px sans-serif';ctx.fillText('齒輪下劈試煉',215,422);ctx.font='12px sans-serif';ctx.fillText(wildPogoRewardClaimed?'已領取首次獎勵':'可從獵痕小徑進入',215,443);}
  if(visitedRooms[35]){ctx.fillStyle=room===35?'#705665':'#354d3c';ctx.fillRect(620,395,190,60);ctx.strokeStyle='#c6a1ad';ctx.strokeRect(620,395,190,60);ctx.textAlign='center';ctx.fillStyle='#e2d6b3';ctx.font='15px sans-serif';ctx.fillText('故人決鬥場',715,422);ctx.font='12px sans-serif';ctx.fillText(duelistDefeated?'女同事已停下攻擊':'染疫細劍使',715,443);}
  ctx.fillStyle='#c6cbaa';ctx.font='14px sans-serif';ctx.fillText('樹根之路可返回水果森林 · 按 Tab 或 Esc 關閉',480,500);
}
function draw() {
  ctx.save();
  if (shakeEnabled && shakeTimer > 0 && !paused && !mapOpen && !journalOpen && !helpOpen && !gameOver && !won) {
    const strength = Math.min(3, shakeTimer * .5);
    ctx.translate(Math.sin(ambientTime * 2.3) * strength, Math.cos(ambientTime * 2.9) * strength);
  }
  const bg = ctx.createLinearGradient(0, 0, 0, 540);
  bg.addColorStop(0, room === 0 ? '#252b2b' : room === 1 ? '#1b3031' : room === 2 ? '#20262b' : room === 3 ? '#301d1b' : room === 5 ? '#232d3b' : '#233b36');
  bg.addColorStop(1, room === 0 ? '#514635' : room === 1 ? '#344b45' : room === 2 ? '#3a3b3a' : room === 3 ? '#62402c' : room === 5 ? '#46515a' : '#435c43');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle='#202524'; for(let x=30;x<960;x+=150){ctx.fillRect(x,0,55,485);ctx.fillStyle='#584b38';ctx.fillRect(x+5,0,5,485);ctx.fillStyle='#202524';}
  if (isForestRoom()) {
    const i = room - 12, fruit = forestFruit[i % forestFruit.length];
    ctx.fillStyle = ['#273c32','#344238','#303c37','#393d35','#283a35'][i % 5]; ctx.fillRect(0, 0, 960, 485);
    for (let j = 0; j < 6; j++) {
      const x = 20 + j * 180 + (i % 3) * 18;
      ctx.fillStyle = '#665640'; ctx.fillRect(x + 48, 180 + (j % 2) * 30, 26, 305);
      ctx.fillStyle = ['#506c48','#668052','#4e7058','#637d49','#5b6b50'][i % 5]; ctx.beginPath(); ctx.arc(x + 60, 165 + (j % 2) * 30, 72 + i % 4 * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = fruit.color; ctx.beginPath(); ctx.arc(x + 35, 190 + (j % 2) * 30, 7, 0, Math.PI * 2); ctx.arc(x + 80, 160 + (j % 2) * 30, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c0a67b'; ctx.fillRect(x + 51, 320, 20, 5);
    }
  }
  if (room === 6) {
    ctx.strokeStyle = '#8a5c41'; ctx.lineWidth = 22;
    for (const y of [160, 300, 390]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
    ctx.strokeStyle = '#c08052'; ctx.lineWidth = 3;
    for (let x = 80; x < 960; x += 180) { ctx.beginPath(); ctx.arc(x, 300, 30, 0, Math.PI * 2); ctx.stroke(); }
  }
  if (room === 7) {
    ctx.fillStyle = '#27252c'; ctx.fillRect(75, 45, 810, 375); ctx.strokeStyle = '#89735c'; ctx.lineWidth = 7;
    for (let x = 120; x < 900; x += 160) { ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x + 60, 425); ctx.stroke(); }
    ctx.fillStyle = '#c78d59'; for (let x = 140; x < 900; x += 160) { ctx.fillRect(x, 100, 14, 35); ctx.fillRect(x - 8, 111, 30, 12); }
  }
  if (room === 8) {
    ctx.fillStyle = '#243c40'; ctx.fillRect(300, 45, 320, 400); ctx.strokeStyle = '#789e96'; ctx.lineWidth = 5; ctx.strokeRect(300, 45, 320, 400);
    ctx.fillStyle = '#ad9c72'; for (let x = 325; x < 620; x += 65) { ctx.fillRect(x, 75, 36, 25); ctx.fillRect(x + 14, 60, 8, 15); }
  }
  if (room === 10) {
    ctx.fillStyle = '#343d38'; ctx.fillRect(0, 45, 960, 440);
    ctx.fillStyle = '#594d3d'; ctx.fillRect(350, 105, 260, 380);
    ctx.fillStyle = '#302d29'; ctx.fillRect(385, 55, 190, 80); ctx.fillRect(465, 20, 30, 40);
    ctx.fillStyle = '#c5ab7c'; ctx.beginPath(); ctx.arc(480, 195, 54, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#53665c'; ctx.beginPath(); ctx.arc(480, 195, 44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e6d4a7'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(480, 166); ctx.lineTo(480, 195); ctx.lineTo(505, 207); ctx.stroke();
    ctx.fillStyle = '#4b4033'; ctx.fillRect(70, 220, 190, 265); ctx.fillRect(700, 205, 190, 280);
    ctx.fillStyle = '#e5b66d'; for (const x of [110, 185, 740, 815]) { ctx.fillRect(x, 275, 25, 35); ctx.fillRect(x, 350, 25, 35); }
  }
  if (room === 11) {
    ctx.fillStyle = '#594638'; ctx.fillRect(0, 0, 960, 485);
    ctx.fillStyle = '#79604a'; ctx.fillRect(90, 95, 780, 300);
    ctx.fillStyle = '#3d4840'; ctx.fillRect(90, 105, 180, 150); ctx.fillRect(690, 105, 180, 150);
    ctx.strokeStyle = '#b69b70'; ctx.lineWidth = 6; ctx.strokeRect(90, 105, 180, 150); ctx.strokeRect(690, 105, 180, 150);
    ctx.fillStyle = '#71513c'; ctx.fillRect(360, 350, 240, 18); ctx.fillRect(380, 368, 12, 65); ctx.fillRect(568, 368, 12, 65);
    ctx.fillStyle = '#e8bd78'; ctx.fillRect(455, 329, 45, 20); ctx.fillStyle = '#c8dbc6'; ctx.fillRect(470, 315, 10, 15);
    ctx.fillStyle = '#674b38'; ctx.fillRect(145, 385, 150, 66); ctx.fillStyle = '#c5ad8e'; ctx.fillRect(150, 375, 140, 45);
    ctx.fillStyle = '#eee0c4'; ctx.fillRect(157, 377, 38, 20); ctx.fillStyle = '#788e7e'; ctx.fillRect(195, 388, 94, 32);
  }
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
  if(isWildRoom()) drawWildBackdrop();
  if(isDockRoom())drawDockBackdrop();
  for (const p of roomPlatforms[room]) {
    if (p.hidden > 0) {
      ctx.strokeStyle = 'rgba(201, 174, 121, .25)'; ctx.lineWidth = 1; ctx.strokeRect(p.x, p.y, p.w, p.h);
      continue;
    }
    ctx.fillStyle = p.crumble && p.standTime > 25 && Math.floor(p.standTime / 5) % 2 === 0 ? '#a2734b' : '#594a36';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = p.moving || p.lift || p.courseMoving || p.mineMoving || p.forestMoving || p.dockLift ? '#add6c2' : isWildRoom() ? '#a9ad78' : p.crumble ? '#d7a865' : '#a88451'; ctx.fillRect(p.x, p.y, p.w, 5);
    ctx.fillStyle = '#302e29'; for (let x = p.x + 12; x < p.x + p.w; x += 40) ctx.fillRect(x, p.y + 9, 4, 4);
    if (p.forestMoving) { ctx.fillStyle = '#b5d8c6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('移動藤橋', p.x + p.w / 2, p.y + 33); }
    if (p.mineMoving) { ctx.fillStyle = '#b5d8c6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('礦車平台', p.x + p.w / 2, p.y + 33); }
    if (p.courseMoving) { ctx.fillStyle = '#b5d8c6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('移動平台', p.x + p.w / 2, p.y + 33); }
    if (p.lift) { ctx.fillStyle = '#b5d8c6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('升降平台', p.x + p.w / 2, p.y + 33); }
    if (p.crumble) { ctx.fillStyle = '#dfc49b'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('鬆動平台', p.x + p.w / 2, p.y + 33); }
  }
  if(roamingEnemiesHere())drawWildActors();
  if(isDockRoom())drawDockActors();
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
  ctx.fillText(checkpoint.activated ? 'E 休息 · G 傳送' : '蒸汽休息站', checkpoint.x + 16, checkpoint.y - 10);
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
  if (room === 12) {
    ctx.fillStyle = '#76553b'; ctx.fillRect(seedSoil.x, seedSoil.y + 20, seedSoil.w, 10);
    if (forestSeedPlanted) {
      ctx.strokeStyle = '#72935b'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(seedSoil.x + 20, 475); ctx.lineTo(seedSoil.x + 20, 310); ctx.lineTo(seedGate.x + 25, 280); ctx.stroke();
      ctx.fillStyle = '#8cb878'; for (const leaf of [[510,400],[535,370],[500,335],[475,290]]) { ctx.beginPath(); ctx.arc(leaf[0], leaf[1], 16, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#355f49'; ctx.fillRect(seedGate.x, seedGate.y, seedGate.w, seedGate.h); ctx.strokeStyle = '#b4d49c'; ctx.lineWidth = 3; ctx.strokeRect(seedGate.x, seedGate.y, seedGate.w, seedGate.h);
      ctx.fillStyle = '#e7e4ce'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E 前往新區域', seedGate.x + 25, seedGate.y - 8);
    } else {
      ctx.fillStyle = '#d8c99b'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(forestSeedOwned ? 'E 種下生命種子' : '生命種植點', seedSoil.x + 20, seedSoil.y - 8);
    }
  }
  if (isForestRoom()) {
    const hazard = forestHazards[room];
    if (hazard) {
      ctx.fillStyle = '#6c6248'; ctx.fillRect(hazard.x, 479, hazard.w, 6);
      if (vent.cycle >= 90 && vent.cycle < 120) { ctx.fillStyle = '#ffca7e'; ctx.fillRect(hazard.x + 4, 475, hazard.w - 8, 4); }
      if (vent.cycle >= 120 && vent.cycle < 165) { ctx.fillStyle = 'rgba(210, 234, 206, .75)'; ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h); }
    }
    for (const foe of branchEnemies) {
      const fruit = forestFruit[foe.fruitType];
      if (foe.shot.active) { ctx.fillStyle = fruit.color; ctx.beginPath(); ctx.arc(foe.shot.x + 6, foe.shot.y + 6, 6, 0, Math.PI * 2); ctx.fill(); }
      if (foe.health <= 0) continue;
      ctx.fillStyle = foe.flash ? '#fff0bb' : fruit.color; ctx.beginPath(); ctx.arc(foe.x + 18, foe.y + 18, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a9bd80'; ctx.fillRect(foe.x + 15, foe.y - 5, 5, 10); ctx.fillRect(foe.x + 18, foe.y - 5, 10, 4);
      ctx.fillStyle = '#445c52'; ctx.fillRect(foe.x + 5, foe.y + 13, 26, 8); ctx.fillStyle = '#f0df9a'; ctx.fillRect(foe.x + (foe.direction > 0 ? 23 : 8), foe.y + 15, 5, 4);
      ctx.fillStyle = '#30332d'; ctx.fillRect(foe.x + 5, foe.y + 30, 7, 5); ctx.fillRect(foe.x + 24, foe.y + 30, 7, 5);
      ctx.fillStyle = '#e2d5ac'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(foe.state === 'warning' ? '！' : fruit.name, foe.x + 18, foe.y - 11);
      ctx.fillStyle = '#49362c'; ctx.fillRect(foe.x, foe.y - 7, foe.w, 3); ctx.fillStyle = '#dc9a57'; ctx.fillRect(foe.x, foe.y - 7, foe.w * foe.health / foe.maxHealth, 3);
    }
    if (farewellStage <= farewellLines.length) {
      ctx.fillStyle = '#9e7354'; ctx.beginPath(); ctx.arc(townChildX + 12, 455, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b66f50'; ctx.fillRect(townChildX + 4, 464, 16, 15); ctx.fillStyle = '#82705b'; ctx.fillRect(townChildX + 5, 479, 5, 6); ctx.fillRect(townChildX + 14, 479, 5, 6);
    }
    if (room === 19) {
      ctx.fillStyle = '#5e4935'; ctx.fillRect(forestCheckpoint.x + 3, forestCheckpoint.y + 7, 26, 39);
      ctx.fillStyle = forestCheckpoint.activated ? '#b4f2de' : '#ac8a59'; ctx.fillRect(forestCheckpoint.x + 8, forestCheckpoint.y + 12, 16, 20);
      ctx.fillStyle = '#d7e8d1'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(forestCheckpoint.activated ? 'E 休息 · G 傳送' : '果園休息站', forestCheckpoint.x + 16, forestCheckpoint.y - 10);
    }
    if (room === 18 && !forestBossKey) { ctx.fillStyle = '#e5c86c'; ctx.fillRect(forestKeyCard.x, forestKeyCard.y, forestKeyCard.w, forestKeyCard.h); ctx.fillStyle = '#526454'; ctx.fillRect(forestKeyCard.x + 5, forestKeyCard.y + 8, 14, 5); ctx.textAlign = 'center'; ctx.fillStyle = '#f0d9a5'; ctx.fillText('果核王房卡', forestKeyCard.x + 12, forestKeyCard.y - 8); }
    ctx.fillStyle = '#30483e'; ctx.fillRect(door.x + 5, door.y, 50, 80); ctx.strokeStyle = '#b6d9c3'; ctx.strokeRect(door.x + 7, door.y + 2, 46, 78); ctx.textAlign = 'right'; ctx.fillStyle = '#e7e4ce';
    ctx.fillText(room < 21 ? 'E 前往下一區' : forestBossKey ? 'E 進入果核王房間' : '需要果核王房卡', 950, 395);
  }
  if (room >= 6 && room <= 8) for (const foe of branchEnemies) {
    const branchShot = foe.shot;
    if (!branchShot.active) continue;
    ctx.fillStyle = room === 8 ? '#d2f0db' : '#f5ba7d'; ctx.beginPath(); ctx.arc(branchShot.x + 6, branchShot.y + 6, 6, 0, Math.PI * 2); ctx.fill();
  }
  if (room >= 6 && room <= 8) for (const foe of branchEnemies) {
    if (foe.health <= 0) continue;
    if (foe.state === 'warning') { ctx.fillStyle = '#ffd17d'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', foe.x + foe.w / 2, foe.y - 15); }
    ctx.fillStyle = foe.flash ? '#fff0bb' : room === 6 ? '#9a6545' : room === 7 ? '#665d68' : '#698e86';
    ctx.fillRect(foe.x + 2, foe.y + 7, foe.w - 4, foe.h - 10);
    ctx.fillStyle = room === 6 ? '#c39160' : room === 7 ? '#d0a76f' : '#a6d9c3'; ctx.fillRect(foe.x + 4, foe.y + 3, foe.w - 8, 7);
    ctx.fillStyle = '#f4bd71'; ctx.fillRect(foe.x + (foe.direction > 0 ? 24 : 7), foe.y + 14, 6, 5);
    if (room === 6) { ctx.fillStyle = '#c9ad7c'; ctx.fillRect(foe.x + 12, foe.y - 4, 12, 9); }
    if (room === 7) { ctx.fillStyle = '#cfab76'; ctx.fillRect(foe.x - 5, foe.y + 10, 6, 14); ctx.fillRect(foe.x + 35, foe.y + 10, 6, 14); }
    if (room === 8) { ctx.fillStyle = '#a6d9c3'; ctx.fillRect(foe.x - 7, foe.y + 4, 50, 3); ctx.fillRect(foe.x + 14, foe.y - 3, 8, 5); }
    ctx.fillStyle = '#49362c'; ctx.fillRect(foe.x, foe.y - 10, foe.w, 4);
    ctx.fillStyle = '#dc9a57'; ctx.fillRect(foe.x, foe.y - 10, foe.w * foe.health / foe.maxHealth, 4);
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
  for (const log of (room === 0 ? [logs[room], secretLog] : room === 2 ? [logs[room], shaftLog] : room === 3 || room >= 5 ? [] : [logs[room]])) {
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
  if (room !== 9 && !isDockRoom()) {
  ctx.fillStyle = '#302c27'; ctx.fillRect(currentDoor.x + 5, currentDoor.y, 50, 80);
  ctx.strokeStyle = room === 0 && !coreCollected ? '#72563d' : '#b6d9c3'; ctx.lineWidth = 4; ctx.strokeRect(currentDoor.x + 7, currentDoor.y + 2, 46, 78);
  ctx.fillStyle = '#ead5ae'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(room === 0 && !coreCollected ? '需要核心' : '按 E 開門', currentDoor.x + 30, currentDoor.y - 10);
  }
  if((room===33&&!wildGauntletCleared)||duelistActive()) {
    ctx.fillStyle='#3c5140';ctx.strokeStyle='#bfcb8d';ctx.lineWidth=3;
    for(const gateX of [7,907]) {ctx.fillRect(gateX,405,46,80);for(let y=410;y<480;y+=17){ctx.beginPath();ctx.moveTo(gateX,y);ctx.lineTo(gateX+46,y+15);ctx.stroke();}}
  }
  if (room === 11) {
    const family = [{x: 480, color: '#9b6d53', label: '媽媽'}, {x: 570, color: '#657b73', label: '爸爸'}, {x: 650, color: '#b66f50', label: '小孩'}];
    family.forEach(person => {
      const small = person.label === '小孩', y = small ? 447 : 432;
      ctx.fillStyle = '#c99d7a'; ctx.beginPath(); ctx.arc(person.x + 12, y + 8, small ? 9 : 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = person.color; ctx.fillRect(person.x + 2, y + 19, 21, small ? 18 : 28);
      ctx.fillStyle = '#443e36'; ctx.fillRect(person.x + 4, y + (small ? 35 : 45), 6, 8); ctx.fillRect(person.x + 15, y + (small ? 35 : 45), 6, 8);
      ctx.fillStyle = '#e8d7b4'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(person.label, person.x + 12, y - 10);
    });
    if (familyStage < 6 || familyStage === 8) { ctx.fillStyle = '#e8d7b4'; ctx.textAlign = 'center'; ctx.fillText('靠近家人按 E 交談', 480, 395); }
  }
  if (room === 10) {
    ctx.fillStyle = '#335241'; ctx.fillRect(forestGate.x, forestGate.y, forestGate.w, forestGate.h);
    ctx.strokeStyle = '#b6d9c3'; ctx.lineWidth = 3; ctx.strokeRect(forestGate.x, forestGate.y, forestGate.w, forestGate.h);
    ctx.fillStyle = '#e2e6c8'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(familyStage >= 8 ? 'E 前往水果森林' : '休息後再前往森林', forestGate.x + 25, forestGate.y - 10);
    ctx.fillStyle = '#5e4935'; ctx.fillRect(townCheckpoint.x + 3, townCheckpoint.y + 7, 26, 39);
    ctx.fillStyle = townCheckpoint.activated ? '#b4f2de' : '#ac8a59'; ctx.fillRect(townCheckpoint.x + 8, townCheckpoint.y + 12, 16, 20);
    ctx.fillStyle = '#d7b577'; ctx.fillRect(townCheckpoint.x, townCheckpoint.y + 3, 32, 5); ctx.fillRect(townCheckpoint.x, townCheckpoint.y + 39, 32, 7);
    ctx.textAlign = 'center'; ctx.font = '13px sans-serif'; ctx.fillStyle = '#d7e8d1'; ctx.fillText(townCheckpoint.activated ? 'E 休息 · G 傳送' : '鐘樓鎮休息站', townCheckpoint.x + 16, townCheckpoint.y - 10);
    ctx.fillStyle = '#644936'; ctx.fillRect(870, 370, 80, 115); ctx.strokeStyle = '#d1ac79'; ctx.lineWidth = 3; ctx.strokeRect(870, 370, 80, 115);
    ctx.fillStyle = '#eedbb3'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('E 小孩的家', 950, 355);
    townShops.forEach((shop, i) => {
      const x = shop.x;
      ctx.fillStyle = ['#765444', '#655369', '#557573'][i]; ctx.fillRect(x - 52, 360, 104, 85);
      ctx.fillStyle = ['#d4a874', '#d0a3ae', '#b4d6b9'][i]; ctx.fillRect(x - 58, 349, 116, 13);
      ctx.fillStyle = '#26352e'; ctx.fillRect(x - 38, 375, 76, 45);
      ctx.fillStyle = '#f1d3a0'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(shop.name, x, 344);
      ctx.fillStyle = townShopNear(shop) ? '#ffe3a0' : '#c9d4bd'; ctx.fillText('E 進店', x, 438);
    });
    // Townspeople walk in the background while the child keeps pace with the player.
    for (let i = 0; i < 5; i++) {
      const x = 80 + ((ambientTime * (.25 + i * .03) + i * 167) % 820);
      ctx.fillStyle = ['#aa8468', '#879f89', '#c19776'][i % 3]; ctx.beginPath(); ctx.arc(x, 400, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ['#675747', '#506961', '#815d4d'][i % 3]; ctx.fillRect(x - 6, 407, 12, 22);
    }
    ctx.fillStyle = '#9e7354'; ctx.beginPath(); ctx.arc(townChildX + 12, 455, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#514638'; ctx.fillRect(townChildX + 3, 447, 18, 5);
    ctx.fillStyle = '#b66f50'; ctx.fillRect(townChildX + 4, 464, 16, 15);
    ctx.fillStyle = '#82705b'; ctx.fillRect(townChildX + 5, 479, 5, 6); ctx.fillRect(townChildX + 14, 479, 5, 6);
  }
  if (room === 9) {
    ctx.fillStyle = '#302c27'; ctx.fillRect(door.x + 5, door.y, 50, 80);
    ctx.strokeStyle = '#b6d9c3'; ctx.lineWidth = 3; ctx.strokeRect(door.x + 7, door.y + 2, 46, 78);
    ctx.fillStyle = '#ead5ae'; ctx.textAlign = 'right'; ctx.font = '13px sans-serif'; ctx.fillText('E 前往鐘樓鎮', 950, 395);
    ctx.fillStyle = '#9e7354'; ctx.beginPath(); ctx.arc(child.x + 12, child.y + 8, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#514638'; ctx.fillRect(child.x + 3, child.y, 18, 5);
    ctx.fillStyle = '#b66f50'; ctx.fillRect(child.x + 4, child.y + 17, 16, 15);
    ctx.fillStyle = '#82705b'; ctx.fillRect(child.x + 5, child.y + 32, 5, 6); ctx.fillRect(child.x + 14, child.y + 32, 5, 6);
    ctx.fillStyle = '#ead5ae'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(childConversation > 0 && childConversation < 4 ? 'E 繼續交談' : 'E 和小孩交談', child.x + 12, child.y - 12);
  }
  if (room === 0) {
    ctx.fillStyle = '#302c27'; ctx.fillRect(branchDoor.x, branchDoor.y, branchDoor.w, branchDoor.h);
    ctx.strokeStyle = '#b6d9c3'; ctx.lineWidth = 3; ctx.strokeRect(branchDoor.x, branchDoor.y, branchDoor.w, branchDoor.h);
    ctx.fillStyle = '#ead5ae'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E 探索支線', branchDoor.x + branchDoor.w / 2, branchDoor.y - 8);
  }
  if (room >= 6 && room <= 8) {
    ctx.fillStyle = '#302c27'; ctx.fillRect(door.x + 5, door.y, 50, 80); ctx.strokeStyle = '#b6d9c3'; ctx.strokeRect(door.x + 7, door.y + 2, 46, 78);
    ctx.fillStyle = '#ead5ae'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = nearBranchReturnDoor() ? '#ffe5a4' : '#ead5ae'; ctx.textAlign = 'right'; ctx.fillText(room === 8 ? 'E 或走到底返回礦道' : room === 7 ? 'E 返回管道' : 'E 返回鍋爐室', 950, door.y - 10); ctx.textAlign = 'center';
    if (room === 8) { ctx.fillStyle = '#49433a'; ctx.fillRect(exitDoor.x, exitDoor.y, 60, 80); ctx.fillStyle = '#ead5ae'; ctx.fillText('支線盡頭', 30, 395); }
    if (room === 7) { drawGear(mineSaw.x + 20, mineSaw.y + 20, 20, ambientTime * .09); ctx.fillStyle = '#f2c488'; ctx.fillText('滾動齒輪', mineSaw.x + 20, mineSaw.y - 8); }
    if (room === 8) {
      for (const wall of workshopWalls) { ctx.fillStyle = '#657e73'; ctx.fillRect(wall.x, wall.y, wall.w, wall.h); ctx.fillStyle = '#a8c9b2'; ctx.fillRect(wall.x + 3, wall.y, 4, wall.h); ctx.fillRect(wall.x + 11, wall.y, 4, wall.h); }
      ctx.fillStyle = '#d8e5cb'; ctx.fillText('貼牆後再按跳躍，左右交替攀爬', 459, 130);
    }
    if (room === 6) {
    ctx.fillStyle = '#6f6251'; ctx.fillRect(branchVent.x, 479, branchVent.w, 6);
    if (vent.cycle >= 90 && vent.cycle < 120) { ctx.fillStyle = '#e7b671'; ctx.fillRect(branchVent.x + 5, 475, branchVent.w - 10, 4); }
    if (vent.cycle >= 120 && vent.cycle < 165) { ctx.fillStyle = 'rgba(200, 232, 220, .75)'; ctx.fillRect(branchVent.x, branchVent.y, branchVent.w, branchVent.h); }
    }
  }
  if (room === 1) {
    ctx.fillStyle = '#d0a45f'; ctx.fillRect(goal.x, goal.y + 8, goal.w, goal.h - 8);
    const consoleReady = reactorPowered || (enemy.health === 0 && controlSwitch.active);
    ctx.fillStyle = consoleReady ? '#b4f2de' : '#bd7055'; ctx.fillRect(goal.x + 8, goal.y + 14, 20, 20);
    ctx.fillStyle = '#ead5ae'; ctx.fillText(consoleReady ? '按 E 前往升降機井' : (enemy.health > 0 ? '先擊敗守衛' : '先啟動蒸汽開關'), goal.x + 18, goal.y - 4);
  }
  if (room === 0) {
    ctx.fillStyle = '#4b5b55'; ctx.fillRect(merchant.x + 3, merchant.y + 8, 22, 30);
    ctx.fillStyle = '#ad8d5b'; ctx.fillRect(merchant.x + 2, merchant.y + 2, 24, 9);
    ctx.fillStyle = '#d2e5bd'; ctx.fillRect(merchant.x + 12, merchant.y + 14, 5, 5);
    ctx.fillStyle = '#d6be91'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E 補給商', merchant.x + 14, merchant.y - 8);
  }
  for (const coin of coins) {
    ctx.fillStyle = '#d8aa59'; ctx.beginPath(); ctx.arc(coin.x + 7, coin.y + 7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3dfa0'; ctx.fillRect(coin.x + 5, coin.y + 3, 4, 8);
  }
  if (toolProjectile.active) {
    ctx.fillStyle = toolProjectile.type === 'pulse' ? '#e5ad78' : '#d9e6d5';
    if (toolProjectile.type === 'pulse') { ctx.beginPath(); ctx.arc(toolProjectile.x + toolProjectile.w / 2, toolProjectile.y + toolProjectile.h / 2, toolProjectile.w / 2, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(toolProjectile.x, toolProjectile.y + 3, toolProjectile.w, 4);
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
    ctx.fillStyle = '#d7e8d1'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(elevatorCheckpoint.activated ? 'E 休息 · G 傳送' : '蒸汽休息站', elevatorCheckpoint.x + 16, elevatorCheckpoint.y - 10);
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
  if (room === 27) {
    ctx.fillStyle = '#394d35'; ctx.fillRect(280, 85, 400, 335); ctx.strokeStyle = '#b2935b'; ctx.lineWidth = 8; ctx.strokeRect(280, 85, 400, 335);
    if (bossShot.active) drawGear(bossShot.x + 12, bossShot.y + 12, 9, ambientTime * .2);
    if (bossActive) {
      if (boss.state === 'warning') {
        ctx.fillStyle = 'rgba(245, 177, 95, .35)';
        if (boss.nextAttack === 'seedRain') for (const offset of [-95, 0, 95]) ctx.fillRect(boss.targetX + offset - 18, 445, 36, 40);
        else if (boss.nextAttack === 'vineWave') ctx.fillRect(0, 463, canvas.width, 22);
        else ctx.fillRect(boss.direction > 0 ? boss.x + boss.w : boss.x - 210, 440, 210, 45);
        ctx.fillStyle = '#ffe2a2'; ctx.textAlign = 'center'; ctx.font = 'bold 18px sans-serif';
        ctx.fillText({seedRain: '果核雨！', vineWave: '藤蔓橫掃！', fruitBurst: '果實散彈！'}[boss.nextAttack], boss.x + 35, boss.y - 15);
      }
      for (const seed of forestBossSeeds) { ctx.fillStyle = '#d5aa67'; ctx.beginPath(); ctx.arc(seed.x + 9, seed.y + 9, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#718f57'; ctx.fillRect(seed.x + 6, seed.y + 3, 5, 5); }
      if (forestBossWave.active) { ctx.fillStyle = '#72944c'; ctx.fillRect(forestBossWave.x, forestBossWave.y, forestBossWave.w, forestBossWave.h); ctx.fillStyle = '#c1d487'; for (let x = forestBossWave.x + 4; x < forestBossWave.x + forestBossWave.w; x += 16) ctx.fillRect(x, forestBossWave.y - 7, 8, 8); }
      ctx.fillStyle = boss.flash > 0 ? '#ffe7a2' : '#ad554b'; ctx.beginPath(); ctx.arc(boss.x + 35, boss.y + 40, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#859d58'; ctx.fillRect(boss.x + 30, boss.y - 4, 10, 18); ctx.fillRect(boss.x + 37, boss.y - 4, 25, 8);
      ctx.fillStyle = '#405c50'; ctx.fillRect(boss.x + 12, boss.y + 30, 46, 15); ctx.fillStyle = '#ffe6a5'; ctx.fillRect(boss.x + (boss.direction > 0 ? 44 : 17), boss.y + 34, 9, 7);
      ctx.fillStyle = '#493e2f'; ctx.fillRect(boss.x + 8, boss.y + 62, 17, 14); ctx.fillRect(boss.x + 46, boss.y + 62, 17, 14); drawGear(boss.x + 35, boss.y + 52, 10, ambientTime * .025);
    }
    ctx.fillStyle = '#b66f50'; ctx.fillRect(110, 464, 16, 21); ctx.fillStyle = '#cfac8b'; ctx.beginPath(); ctx.arc(118, 455, 9, 0, Math.PI * 2); ctx.fill();
  }
  if (room === 5) {
    ctx.fillStyle = '#4d5c58'; ctx.fillRect(courseVent.x, courseVent.y + courseVent.h - 6, courseVent.w, 6);
    if (courseVent.cycle >= 100 && courseVent.cycle < 140) { ctx.fillStyle = '#f0b66f'; ctx.fillRect(courseVent.x + 5, courseVent.y + courseVent.h - 6, courseVent.w - 10, 4); }
    if (courseVent.cycle >= 140 && courseVent.cycle < 185) { ctx.fillStyle = 'rgba(201, 232, 220, .75)'; ctx.fillRect(courseVent.x, courseVent.y, courseVent.w, courseVent.h); }
    ctx.fillStyle = '#b99862'; ctx.fillRect(courseFinish.x, courseFinish.y + 4, courseFinish.w, courseFinish.h - 4);
    ctx.fillStyle = '#b8efd8'; ctx.fillRect(courseFinish.x + 8, courseFinish.y + 11, 22, 17);
    ctx.fillStyle = '#e7e4ce'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('試煉終點', courseFinish.x + 19, courseFinish.y - 8);
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
    ctx.fillStyle = '#d7e8d1'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(greenhouseCheckpoint.activated ? 'E 休息 · G 傳送' : '蒸汽休息站', greenhouseCheckpoint.x + 16, greenhouseCheckpoint.y - 10);
    ctx.fillStyle = '#30483e'; ctx.fillRect(door.x + 5, door.y, 50, 80);
    ctx.strokeStyle = '#acd3b5'; ctx.lineWidth = 4; ctx.strokeRect(door.x + 7, door.y + 2, 46, 78);
    ctx.fillStyle = '#e7e4ce'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E 跑酷試煉', door.x + 30, door.y - 10);
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
  drawIronSpear();
  if (dashTimer > 0) {
    ctx.fillStyle = 'rgba(202, 224, 214, 0.4)';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath(); ctx.arc(player.x + player.w / 2 - dashFacing * (12 + i * 10), player.y + 28, 7 - i, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (healTimer > 0 || healGlowTimer > 0 || respawnTimer > 0) {
    const pulse = 20 + Math.sin(ambientTime * .18) * 3;
    ctx.strokeStyle = respawnTimer > 0 ? '#c8eadb' : '#9fe6c0'; ctx.lineWidth = 3;
    ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(player.x + 15, player.y + 21, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (healTimer > 0) {
    ctx.fillStyle = '#303c34'; ctx.fillRect(player.x - 9, player.y - 22, 48, 6);
    ctx.fillStyle = '#a6edc4'; ctx.fillRect(player.x - 9, player.y - 22, 48 * (1 - healTimer / HEAL_DURATION), 6);
  }
  if (room === 11 && (familyStage === 6 || familyStage === 7)) {
    ctx.save(); if (familyStage === 7) ctx.translate(185, 410); else ctx.translate(player.x + 30, player.y + 40); ctx.rotate(-Math.PI / 2); drawRobotFragments(0); ctx.restore();
  } else if (deathTimer > 0 || respawnTimer > 0 || gameOver) {
    const spread = gameOver ? 1 : deathTimer > 0 ? 1 - deathTimer / DEATH_DURATION : respawnTimer / RESPAWN_DURATION;
    ctx.globalAlpha = gameOver || deathTimer > 0 ? 1 - .35 * spread : 1 - .25 * spread;
    ctx.save(); ctx.translate(player.x, player.y); drawRobotFragments(spread); ctx.restore();
  } else {
    ctx.globalAlpha = invulnerability > 0 && Math.floor(invulnerability / 5) % 2 === 0 ? 0.35 : 1;
    const walking = player.grounded && Math.abs(player.vx) > .45;
    const stride = walking ? Math.sin(ambientTime * .25) * 4 : 0;
    const bob = player.grounded ? (walking ? -Math.abs(Math.sin(ambientTime * .25)) * 2 : Math.sin(ambientTime * .04) * .7) : -2;
    ctx.save(); ctx.translate(player.x, player.y);
    // The torn cloak trails behind the direction the character faces.
    const cloakWind = (walking ? 2 + Math.abs(stride) * .5 : 0) + (dashTimer > 0 ? 5 : 0) + (player.grounded ? 0 : 2);
    ctx.save(); ctx.translate(15, bob); ctx.scale(player.facing, 1);
    ctx.fillStyle = townCloakStyle ? townClothes[townCloakStyle - 1].color : '#51483d'; ctx.beginPath();
    ctx.moveTo(-7, 13); ctx.lineTo(-12, 16); ctx.lineTo(-19 - cloakWind, 35);
    ctx.lineTo(-13 - cloakWind, 33); ctx.lineTo(-10 - cloakWind, 39);
    ctx.lineTo(-5 - cloakWind, 35); ctx.lineTo(-1, 39); ctx.lineTo(4, 33);
    ctx.lineTo(7, 16); ctx.closePath(); ctx.fill();
    if (townCloakStyle) { ctx.fillStyle = '#e2c69a'; ctx.fillRect(-13 - cloakWind * .4, 25, 8, 6); }
    ctx.strokeStyle = '#8b795e'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(-10, 20); ctx.lineTo(-13 - cloakWind * .5, 30); ctx.stroke(); ctx.restore();

    // Boots move independently while the body and head subtly bob.
    ctx.fillStyle = '#292622';
    if (player.grounded) {
      ctx.fillRect(5 + stride, 34, 8, 8); ctx.fillRect(18 - stride, 34, 8, 8);
    } else {
      ctx.fillRect(5, 32, 8, 7); ctx.fillRect(18, 35, 8, 7);
    }
    ctx.translate(0, bob);
    // A metal chassis, rivets and a glowing lens make the repairer visibly robotic.
    ctx.fillStyle = '#485650'; ctx.fillRect(player.facing > 0 ? 1 : 23, 19, 6, 15);
    ctx.fillStyle = '#5d716b'; ctx.fillRect(5, 14, 20, 21);
    ctx.fillStyle = '#81928a'; ctx.fillRect(7, 16, 16, 14);
    ctx.fillStyle = '#394b46'; ctx.fillRect(5, 28, 20, 4);
    ctx.fillStyle = '#c7a36b'; ctx.fillRect(13, 18, 5, 7);
    ctx.fillStyle = '#a6e4cd'; ctx.fillRect(14, 20, 3, 3);
    ctx.fillStyle = '#d1b17a'; ctx.fillRect(7, 17, 2, 2); ctx.fillRect(21, 17, 2, 2);
    ctx.fillStyle = '#91a49b'; ctx.fillRect(4, 4, 22, 16);
    ctx.fillStyle = '#52645e'; ctx.fillRect(4, 5, 22, 4); ctx.fillRect(4, 17, 22, 3);
    ctx.fillStyle = '#c4a46d'; ctx.fillRect(5, 14, 2, 2); ctx.fillRect(23, 14, 2, 2);
    ctx.fillStyle = '#263e3b'; ctx.fillRect(player.facing > 0 ? 16 : 6, 9, 8, 7);
    ctx.fillStyle = '#aeeedb'; ctx.fillRect(player.facing > 0 ? 18 : 7, 10, 5, 5);
    ctx.fillStyle = '#effff3'; ctx.fillRect(player.facing > 0 ? 19 : 8, 11, 2, 2);

    // Brass-edged conical hat with a worn cloth-and-metal finish.
    ctx.fillStyle = '#705638'; ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(-6, 5); ctx.lineTo(36, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a98957'; ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(1, 4); ctx.lineTo(15, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c2a16a'; ctx.fillRect(-6, 4, 42, 3);
    ctx.fillStyle = '#57452f'; ctx.fillRect(13, -9, 4, 3);
    if (healTimer > 0) drawRepairWrench();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if(isDockRoom()){ctx.fillStyle='rgba(15,19,25,.9)';ctx.fillRect(0,0,960,110);}
  ctx.fillStyle = health === 1 && Math.floor(ambientTime / 20) % 2 === 0 ? '#ff9c7d' : '#ead5ae'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText((isDockRoom()?'區域 4・'+dockZones[room-36].name:isWildRoom() ? '區域 3・'+wildRoomName() : room === 27 ? '水果森林・果核王房間' : isForestRoom() ? '水果森林・' + forestNames[room - 12] : ['鍋爐室', '機械控制室', '升降機井', '蒸汽守衛房間', '廢棄溫室', '空中跑酷', '鏽蝕管道', '齒輪礦道', '失落工坊', '鐘樓鎮・墜落處', '鐘樓鎮', '小孩的家'][room]) + '   生命  ' + '♥ '.repeat(health) + '♡ '.repeat(Math.max(0, playerMaxHealth() - health)), 24, 32);
  ctx.fillStyle = '#ead5ae'; ctx.font = '14px sans-serif'; ctx.fillText(postFall && !importantGear1 ? '衝刺：損壞' : '蒸汽衝刺', 24, 57);
  ctx.textAlign = 'right'; ctx.fillText('記憶齒輪 ' + memoryGears.filter(gear => gear.collected).length + ' / ' + memoryGears.length, 936, 57); ctx.textAlign = 'left';
  if(altar1Claimed){ctx.fillStyle=steam>=2?'#d8efb2':'#9caa91';ctx.font='13px sans-serif';ctx.fillText('V 鐵之矛 · 蒸汽 2',490,57);ctx.fillStyle='#ead5ae';ctx.font='14px sans-serif';}
  ctx.fillText('修復蒸汽 ' + '● '.repeat(steam) + '○ '.repeat(3 - steam) + (steam === 3 ? ' Q 修復' : ''), 220, 57);
  ctx.textAlign = 'right'; ctx.fillStyle = '#e7b596'; ctx.fillText(postFall ? '工具：損壞' : 'F ' + equipmentOptions.red.find(item => item.id === equipment.red).name + ' ' + toolAmmo + '/4' + (equipment.red === 'piercer' ? '（耗 2）' : ''), 936, 81); ctx.textAlign = 'left';
  ctx.fillStyle = '#e9c594';
  const objective = isDockRoom()?(room===36?'目標：確認同伴平安，探索地下熔塢':dockShortcut?'目標：返回同伴身邊，或搭升降梯回到上層':'目標：穿過熔爐，啟動舊泵房的回程升降梯'):isWildRoom() ? (room===35?(duelistDefeated?'目標：確認女同事的狀況':'目標：阻止受輻射感染的女同事'):room===34?'目標：下劈齒輪反彈，抵達高處終點':room===33?(wildGauntletCleared?'三波車輪戰完成':'車輪戰：第 '+gauntletWave+' / 3 波'):room===30?'目標：跳躍後按 Shift 衝過斷風峽口':'目標：穿越原野，抵達獵者營地') : room === 27 ? (bossActive ? '目標：擊敗果核機械王' : '目標：返回森林深處') : isForestRoom() ? '區域 2：水果森林（' + (room - 11) + ' / 10）' : room === 11 ? (familyStage === 8 ? '目標：向家人道謝，繼續探索鐘樓鎮' : '目標：與小孩的父母交談') : room === 10 ? (familyStage >= 8 ? '目標：到右側高處，和小孩前往水果森林' : '目標：參觀鐘樓鎮，前往右側小孩的家') : room === 9 ? '目標：和小孩交談，從右側前往鐘樓鎮' : room === 0
    ? (coreCollected ? '目標：前往右側大門，按 E 進入控制室' : '目標：前往高處，取得動力核心')
    : room === 1 ? (reactorPowered ? '目標：按 E 前往升降機井' : enemy.health > 0 ? '目標：擊敗守衛（留意衝刺警示）' : !controlSwitch.active ? '目標：到平台上啟動蒸汽開關' : '目標：按 E 啟動控制台') : room === 2 ? '目標：登上井頂，按 E 進入守衛房間' : room === 4 ? '目標：登上溫室高處，查看地表' : room === 5 ? (courseFinished ? '試煉完成：按 T 再次挑戰' : '目標：穿越平台，抵達右上方終點') : room >= 6 && room <= 8 ? '目標：探索支線並避開蒸汽機關' : (!bossActive && bossDefeated ? '目標：到右側按 E 前往廢棄溫室' : '目標：擊敗蒸汽守衛');
  ctx.fillText(objective, 24, 81);
  if (room === 5) { ctx.textAlign = 'center'; ctx.fillStyle = '#d9e5c8'; ctx.fillText('時間 ' + (courseTicks / 60).toFixed(2) + ' 秒  ·  最佳 ' + (courseBestTicks === null ? '--' : (courseBestTicks / 60).toFixed(2) + ' 秒') + '  ·  T 重試', 480, 108); ctx.textAlign = 'left'; }
  ctx.textAlign = 'right'; ctx.fillStyle = '#e4bf72'; ctx.fillText('齒輪幣 ' + money, 936, 104); ctx.textAlign = 'left';
  if (health === 1) { ctx.fillStyle = '#ffb09a'; ctx.fillText('生命危急', 24, 104); }
  if (doubleJumpUnlocked) { ctx.fillStyle = doubleJumpUsed ? '#8e9b90' : '#b5e6d0'; ctx.fillText(doubleJumpUsed ? '雙躍：落地後恢復' : '雙躍：就緒', 220, 104); }
  if (storyIntroTimer > 0 && room === 0 && !mapOpen && !journalOpen && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen && !paused && !gameOver && !won) {
    ctx.fillStyle = 'rgba(20, 24, 22, .86)'; ctx.fillRect(170, 160, 620, 100);
    ctx.strokeStyle = '#907858'; ctx.lineWidth = 1; ctx.strokeRect(170, 160, 620, 100);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ead9b7'; ctx.font = '16px sans-serif';
    ctx.fillText('十年前，這座曾是我家園的大樓倒塌了。', 480, 190);
    ctx.fillText('我幸運地活了下來，然後離開了這裡。', 480, 218);
    ctx.fillStyle = '#b7d3c3'; ctx.fillText('如今，我回來了。', 480, 246);
    ctx.textAlign = 'left';
  }
  if (roomTitleTimer > 0 && bossIntroTimer === 0 && bossVictoryTimer === 0 && !mapOpen && !journalOpen && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen && !paused) {
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(18, 23, 21, .75)'; ctx.fillRect(350, 108, 260, 44);
    ctx.fillStyle = '#e6d4ad'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(isDockRoom()?dockZones[room-36].name:isWildRoom() ? wildRoomName() : room === 27 ? '果核王房間' : isForestRoom() ? forestNames[room - 12] : ['鍋爐室', '機械控制室', '升降機井', '蒸汽守衛房間', '廢棄溫室', '空中跑酷', '鏽蝕管道', '齒輪礦道', '失落工坊', '鐘樓鎮・墜落處', '鐘樓鎮', '小孩的家'][room], 480, 137);
    ctx.textAlign = 'left'; ctx.font = '14px sans-serif';
  }
  ctx.textAlign = 'right'; ctx.fillStyle = storageAvailable ? '#b4d3bb' : '#e8aa81';
  ctx.fillText(storageAvailable ? (saveFeedbackTimer > 0 ? '進度已儲存 ✓' : '進度自動儲存') : '無法儲存進度', 936, 32); ctx.textAlign = 'left';
  ctx.fillStyle = '#3e3a30'; ctx.fillRect(94, 46, 100, 10);
  ctx.fillStyle = '#9bcbbb'; ctx.fillRect(94, 46, 100 * Math.max(0, 1 - dashCooldown / (equipment.yellow === 'regulator' ? 40 : 60)), 10);
  if (inBossRoom() && bossActive && bossIntroTimer > 0 && !mapOpen && !journalOpen && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen && !paused && !gameOver && !won) {
    ctx.fillStyle = 'rgba(29, 20, 18, .82)'; ctx.fillRect(290, 125, 380, 83);
    ctx.strokeStyle = '#bc8a5c'; ctx.lineWidth = 2; ctx.strokeRect(290, 125, 380, 83);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f3d7a9'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(room === 27 ? '果核機械王' : '蒸汽守衛', 480, 160);
    ctx.fillStyle = '#cfaa83'; ctx.font = '15px sans-serif'; ctx.fillText(room === 27 ? '水果森林深處的守護者' : '升降機井的看守者', 480, 187);
  }
  if (inBossRoom() && bossVictoryTimer > 0 && !mapOpen && !journalOpen && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen && !paused && !gameOver && !won) {
    ctx.fillStyle = 'rgba(29, 20, 18, .85)'; ctx.fillRect(290, 125, 380, 83);
    ctx.strokeStyle = '#d0ac71'; ctx.lineWidth = 2; ctx.strokeRect(290, 125, 380, 83);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f4dfb8'; ctx.font = 'bold 25px sans-serif'; ctx.fillText(room === 27 ? '果核機械王已擊敗' : '蒸汽守衛已擊敗', 480, 160);
    ctx.fillStyle = '#bfe7cf'; ctx.font = '15px sans-serif'; ctx.fillText(room === 27 ? '可從左側返回森林' : '右側升降機已解鎖', 480, 187);
  }
  if (inBossRoom() && bossActive && !gameOver && !won) {
    ctx.fillStyle = '#e8d2ad'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(room === 27 ? (boss.phase === 2 ? '果核機械王 · 核心加速' : '果核機械王') : (boss.phase === 2 ? '蒸汽守衛 · 核心過熱' : '蒸汽守衛'), 480, 438);
    ctx.fillStyle = '#3a3029'; ctx.fillRect(300, 445, 360, 14);
    ctx.fillStyle = '#c66c4b'; ctx.fillRect(303, 448, 354 * boss.health / boss.maxHealth, 8);
    ctx.textAlign = 'left';
  }
  if (logTimer <= 0 && !gameOver && !won && !mapOpen && !journalOpen && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen && !paused) {
    const tutorialTips = [
      '教學：A / D 移動，空白鍵跳躍；滑鼠左鍵揮劍。',
      '教學：留意敵人的攻擊警示，並用衝刺閃避。',
      '教學：跳上升降平台；靠近休息站按 E 休息。',
      '教學：觀察守衛動作，避開攻擊後再反擊。',
      '教學：按 Tab 查看已探索地圖；高處通向教學終點。',
      '教學：運用跳躍通過機關；按 T 可以重新挑戰。',
      '教學：觀察蒸汽警示，避開噴口與炮手。',
      '教學：利用移動平台，留意礦工的衝刺。',
      '教學：貼住牆後再按跳躍，在雙牆間交替攀爬。',
      '墜落後，移動與揮劍仍可使用；其他能力需要修復。',
      '跟著小孩參觀鐘樓鎮，右側可前往小孩的家。',
      '靠近家人按 E 交談。'
    ];
    ctx.fillStyle = 'rgba(20, 25, 23, .8)'; ctx.fillRect(165, 509, 630, 25);
    ctx.fillStyle = '#d6dec4'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(isDockRoom()?'熔漿不能停留；觀察爐口預警，搭乘吊鏈平台前進。':isWildRoom() ? (room===34?'S + 滑鼠左鍵：下劈反彈；T 重試。':'原野與獵徑的敵人已被輻射感染，留意出招警示。') : room === 27 ? '擊敗果核機械王後可以返回森林。' : isForestRoom() ? '小孩：「小心水果機械！按 E 從兩側出口前往其他區域。」' : tutorialTips[room], 480, 527);
  }
  if (logTimer > 0 && !gameOver && !won) {
    ctx.fillStyle = 'rgba(25, 28, 27, .9)'; ctx.fillRect(100, 470, 760, 48);
    ctx.strokeStyle = '#a7895d'; ctx.lineWidth = 1; ctx.strokeRect(100, 470, 760, 48);
    ctx.fillStyle = '#f0dfc1'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(logMessage, 480, 500);
  }
  if (room === 11 && familyStage === 6) {
    ctx.fillStyle = 'rgba(16, 19, 18, .8)'; ctx.fillRect(190, 150, 580, 115);
    ctx.strokeStyle = '#b99b71'; ctx.lineWidth = 2; ctx.strokeRect(190, 150, 580, 115);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ead8b6'; ctx.font = '20px sans-serif';
    ctx.fillText('主角突然失去意識，倒了下去。', 480, 195);
    ctx.fillStyle = '#c1d4c4'; ctx.font = '16px sans-serif'; ctx.fillText('小孩：「爸爸、媽媽，快幫幫他！」', 480, 225);
    ctx.fillStyle = '#e2c79b'; ctx.fillText('按 E 繼續', 480, 250);
  }
  if (room === 11 && familyStage === 7) {
    ctx.fillStyle = 'rgba(16, 19, 18, .88)'; ctx.fillRect(140, 140, 680, 145);
    ctx.strokeStyle = '#b99b71'; ctx.lineWidth = 2; ctx.strokeRect(140, 140, 680, 145);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ead8b6'; ctx.font = '18px sans-serif';
    ctx.fillText('父母合力將昏迷的機器人安置到床上。', 480, 177);
    ctx.fillText('一夜過去，晨光照進了房間。', 480, 210);
    ctx.fillStyle = '#c1d4c4'; ctx.font = '16px sans-serif'; ctx.fillText('按 E 醒來', 480, 255);
  }
  if (farewellActive()) {
    ctx.fillStyle = 'rgba(15, 22, 19, .94)'; ctx.fillRect(105, 345, 750, 160);
    ctx.strokeStyle = '#b9a078'; ctx.lineWidth = 2; ctx.strokeRect(105, 345, 750, 160);
    ctx.fillStyle = '#e4d4b3'; ctx.textAlign = 'center'; ctx.font = 'bold 19px sans-serif';
    ctx.fillText('林緣的道別', 480, 382);
    ctx.fillStyle = '#eff0d7'; ctx.font = '18px sans-serif'; ctx.fillText(farewellLines[farewellStage - 1], 480, 428);
    ctx.fillStyle = '#b9cdb7'; ctx.font = '14px sans-serif'; ctx.fillText('按 E 繼續（' + farewellStage + ' / ' + farewellLines.length + '）', 480, 480);
  }
  if (reunionActive()) {
    ctx.fillStyle = 'rgba(15, 22, 19, .95)'; ctx.fillRect(105, 345, 750, 160);
    ctx.strokeStyle = '#d0ad78'; ctx.lineWidth = 2; ctx.strokeRect(105, 345, 750, 160);
    ctx.fillStyle = '#efce9c'; ctx.textAlign = 'center'; ctx.font = 'bold 19px sans-serif'; ctx.fillText('鐘樓鎮的重逢', 480, 382);
    ctx.fillStyle = '#eff0d7'; ctx.font = '18px sans-serif'; ctx.fillText(reunionLines[reunionStage - 1], 480, 428);
    ctx.fillStyle = '#b9cdb7'; ctx.font = '14px sans-serif'; ctx.fillText('按 E 繼續（' + reunionStage + ' / ' + reunionLines.length + '）', 480, 480);
  }
  if(dockArrivalActive())drawDockArrival();
  if(duelIntroActive()) {
    ctx.fillStyle='rgba(23,24,29,.95)';ctx.fillRect(95,345,770,165);ctx.strokeStyle='#c6a1a9';ctx.lineWidth=2;ctx.strokeRect(95,345,770,165);
    ctx.textAlign='center';ctx.fillStyle='#ead6c0';ctx.font='bold 20px sans-serif';ctx.fillText('故人相逢',480,382);
    ctx.fillStyle='#f0e5d2';ctx.font='18px sans-serif';ctx.fillText(duelistLines[duelIntroIndex],480,430);
    ctx.fillStyle='#c8bfa4';ctx.font='14px sans-serif';ctx.fillText('按 E 繼續',480,485);
  }
  if(duelistActive()) {
    ctx.textAlign='center';ctx.fillStyle='#e7d2cb';ctx.font='bold 15px sans-serif';ctx.fillText(duelist.phase===2?'昔日女同事 · 核心失控':'昔日女同事 · 染疫細劍使',480,115);
    ctx.fillStyle='#3e353c';ctx.fillRect(300,122,360,14);ctx.fillStyle='#b58c9b';ctx.fillRect(303,125,354*duelist.health/duelist.maxHealth,8);
  }
  if (mapOpen && !isForestRoom() && room !== 27 && !isWildRoom() && !isDockRoom()) {
    ctx.fillStyle = 'rgba(15, 19, 19, .97)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8d5aa'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('機械城探索地圖', 480, 65);
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#a8a997'; ctx.fillText('踏入新區域後，地圖會自動記錄路線', 480, 93);
    // Each shape represents an actual game room; the shaft is taller to echo its vertical route.
    const mapRooms = [
      {x: 55, y: 286, w: 125, h: 76, name: '鍋爐室'},
      {x: 220, y: 286, w: 130, h: 76, name: '機械控制室'},
      {x: 390, y: 207, w: 92, h: 155, name: '升降機井'},
      {x: 522, y: 165, w: 116, h: 76, name: '守衛房間'},
      {x: 678, y: 165, w: 120, h: 76, name: '廢棄溫室'},
      {x: 798, y: 286, w: 120, h: 76, name: '空中跑酷'},
      {x: 55, y: 155, w: 125, h: 76, name: '鏽蝕管道'},
      {x: 220, y: 155, w: 130, h: 76, name: '齒輪礦道'},
      {x: 390, y: 104, w: 120, h: 76, name: '失落工坊'},
      {x: 555, y: 345, w: 120, h: 65, name: '鐘樓鎮・墜落處'},
      {x: 720, y: 345, w: 120, h: 65, name: '鐘樓鎮'},
      {x: 845, y: 380, w: 85, h: 40, name: '小孩的家'}
    ];
    const links = [
      [[180,324],[220,324]], [[350,324],[390,324]],
      [[482,222],[522,222]], [[638,203],[678,203]],
      [[798,203],[858,203],[858,286]]
    ];
    ctx.lineWidth = 5; ctx.strokeStyle = '#a99672';
    links.forEach((points, i) => {
      if (!visitedRooms[i] || !visitedRooms[i + 1]) return;
      ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
      for (const point of points.slice(1)) ctx.lineTo(point[0], point[1]);
      ctx.stroke();
    });
    const branches = [
      [0, 6, [[118,286],[118,231]]],
      [6, 7, [[180,193],[220,193]]],
      [7, 8, [[350,193],[365,193],[365,142],[390,142]]]
    ];
    branches.forEach(([from, to, points]) => {
      if (!visitedRooms[from] || !visitedRooms[to]) return;
      ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
      for (const point of points.slice(1)) ctx.lineTo(point[0], point[1]);
      ctx.stroke();
    });
    if (visitedRooms[9] && visitedRooms[10]) { ctx.beginPath(); ctx.moveTo(675, 377); ctx.lineTo(720, 377); ctx.stroke(); }
    if (visitedRooms[10] && visitedRooms[11]) { ctx.beginPath(); ctx.moveTo(840, 395); ctx.lineTo(845, 395); ctx.stroke(); }
    mapRooms.forEach((box, i) => {
      if (!visitedRooms[i]) return;
      ctx.fillStyle = i === room ? '#554f3d' : '#303b38'; ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = i === room ? '#f0d095' : '#9b9d87'; ctx.lineWidth = i === room ? 3 : 2; ctx.strokeRect(box.x, box.y, box.w, box.h);
      // Small ledges give each room a hand-drawn floor-plan character.
      ctx.strokeStyle = '#63746a'; ctx.lineWidth = 1;
      roomPlatforms[i].slice(1).forEach(platform => {
        if (platform.hidden > 0) return;
        const px = box.x + 8 + platform.x / 960 * (box.w - 16);
        const py = box.y + 10 + platform.y / 540 * (box.h - 20);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.max(5, platform.w / 960 * (box.w - 16)), py); ctx.stroke();
      });
      ctx.fillStyle = '#e4d8bf'; ctx.font = '13px sans-serif'; ctx.fillText(box.name, box.x + box.w / 2, box.y - 10);
    });
    [{index: 0, station: checkpoint}, {index: 2, station: elevatorCheckpoint}, {index: 4, station: greenhouseCheckpoint}, {index: 10, station: townCheckpoint}].forEach(({index, station}) => {
      if (!visitedRooms[index] || !station.activated) return;
      const box = mapRooms[index], x = box.x + 8 + (station.x + station.w / 2) / 960 * (box.w - 16), y = box.y + box.h - 12;
      ctx.fillStyle = '#83d7c0'; ctx.fillRect(x - 4, y - 4, 8, 8);
    });
    if (visitedRooms[room]) {
      const box = mapRooms[room];
      const x = box.x + 8 + (player.x + player.w / 2) / canvas.width * (box.w - 16);
      const y = box.y + 8 + Math.max(0, Math.min(1, (player.y + player.h / 2) / canvas.height)) * (box.h - 16);
      ctx.fillStyle = '#ffe7a4'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#413225'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = '#ffe7a4'; ctx.beginPath(); ctx.arc(250, 445, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7c8a9'; ctx.font = '15px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('目前位置', 263, 450);
    ctx.fillStyle = '#83d7c0'; ctx.fillRect(385, 440, 9, 9); ctx.fillStyle = '#d7c8a9'; ctx.fillText('已啟動的休息站', 403, 450);
    ctx.textAlign = 'center'; ctx.fillStyle = '#a79d8a'; ctx.fillText('按 Tab 或 Esc 關閉地圖', 480, 500);
  }
  if (mapOpen && (isForestRoom() || room === 27)) {
    ctx.fillStyle = 'rgba(15, 19, 19, .97)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8d5aa'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('水果森林探索地圖', 480, 55);
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#b8c8af'; ctx.fillText('由左至右探索，已走過的區域會顯示在地圖上', 480, 82);
    const forestMapPoint = i => ({x: 58 + (i < 5 ? i : 9 - i) * 180, y: 112 + Math.floor(i / 5) * 105});
    ctx.strokeStyle = '#8aa388'; ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      if (!visitedRooms[12 + i] || !visitedRooms[13 + i]) continue;
      const from = forestMapPoint(i), to = forestMapPoint(i + 1);
      ctx.beginPath(); ctx.moveTo(from.x + 77, from.y + 33); ctx.lineTo(to.x + 77, to.y + 33); ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const {x, y} = forestMapPoint(i);
      if (!visitedRooms[12 + i]) continue;
      ctx.fillStyle = room === 12 + i ? '#59694b' : '#303f36'; ctx.fillRect(x, y, 154, 66);
      ctx.strokeStyle = room === 12 + i ? '#eed393' : '#7c9676'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 154, 66);
      ctx.fillStyle = '#e6d9bd'; ctx.font = '14px sans-serif'; ctx.fillText((i + 1) + ' ' + forestNames[i], x + 77, y + 28);
      ctx.fillStyle = '#b9d6c0'; ctx.font = '12px sans-serif'; ctx.fillText(room === 12 + i ? '你在這裡' : (i === 7 && forestCheckpoint.activated ? '休息傳送站' : '已探索'), x + 77, y + 50);
    }
    ctx.fillStyle = '#b7c3aa'; ctx.font = '15px sans-serif'; ctx.fillText((room === 28 ? '目前：樹根之路' : room === 27 ? '目前：果核王房間' : forestSeedPlanted ? '林緣的樹門已開啟' : forestSeedOwned ? '帶種子回林緣' : forestBossKey ? '已取得果核王房卡' : '房卡藏在森林中') + ' · 按 Tab 或 Esc 關閉地圖', 480, 490);
  }
  if(mapOpen && isWildRoom()) drawWildMap();
  if(mapOpen && isDockRoom())drawDockMap();
  if (travelOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .96)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('休息站傳送', 480, 85);
    ctx.fillStyle = '#b8d8c6'; ctx.font = '16px sans-serif'; ctx.fillText('選擇已啟動的休息站 · G / Esc 關閉', 480, 115);
    travelDestinations.forEach((destination, i) => {
      const y = 125 + i * 56, active = destination.station.activated;
      ctx.fillStyle = '#303731'; ctx.fillRect(220, y, 520, 50);
      ctx.strokeStyle = active ? '#91c2a8' : '#615e52'; ctx.lineWidth = 1; ctx.strokeRect(220, y, 520, 50);
      ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = active ? '#e6dfbd' : '#817f74';
      ctx.fillText((i + 1) + '　' + destination.name + '　' + (active ? (destination.room === room ? '目前位置' : '可傳送') : '尚未啟動'), 480, y + 33);
    });
    ctx.font = '15px sans-serif'; ctx.fillStyle = '#dfc797'; ctx.fillText(travelNotice || '點選地點或按 1–7；傳送後重生點會更新', 480, 532);

  }
  if (shopOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .96)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('機械補給商', 480, 85);
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#e4bf72'; ctx.fillText('持有齒輪幣：' + money, 480, 120);
    shopItems.forEach((offer, index) => {
      const y = 150 + index * 75;
      const item = equipmentOptions[offer.slot].find(option => option.id === offer.id);
      const unlocked = item.unlocked();
      ctx.fillStyle = '#303731'; ctx.fillRect(220, y, 520, 65);
      ctx.strokeStyle = '#90744d'; ctx.lineWidth = 1; ctx.strokeRect(220, y, 520, 65);
      ctx.fillStyle = unlocked ? '#a8bb9f' : '#efdbb1'; ctx.font = 'bold 17px sans-serif';
      ctx.fillText((index + 1) + '　' + offer.name + '　' + (unlocked ? '已解鎖' : offer.price + ' 齒輪幣'), 480, y + 25);
      ctx.fillStyle = '#bcc8b9'; ctx.font = '13px sans-serif'; ctx.fillText(item.description, 480, y + 49);
    });
    ctx.fillStyle = '#dfc797'; ctx.font = '15px sans-serif'; ctx.fillText(shopNotice || '點選商品或按 1、2、3 購買；也可透過探索解鎖', 480, 412);
    ctx.fillStyle = '#aebbaa'; ctx.fillText('按 Esc 關閉；到休息站按 I 更換裝備', 480, 450);
  }
  if (townMenu) {
    const title = {general: '齒輪雜貨店', clothes: '縫時服飾店', claw: '星星抓娃娃屋'}[townMenu];
    ctx.fillStyle = 'rgba(15, 18, 17, .97)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(title, 480, 75);
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#e4bf72'; ctx.fillText('齒輪幣：' + money, 480, 105);
    if (townMenu === 'claw') {
      ctx.fillStyle = '#43514b'; ctx.fillRect(280, 140, 400, 18);
      ctx.fillStyle = '#a9d4ae'; ctx.fillRect(430, 140, 100, 18);
      ctx.fillStyle = '#f7d69d'; ctx.fillRect(280 + (ambientTime % 120) / 120 * 400 - 3, 134, 6, 30);
      ctx.fillStyle = '#d9d9c5'; ctx.fillText('光標進入綠色區域時，選擇想抓的娃娃', 480, 190);
    } else {
      ctx.fillStyle = '#d9d9c5'; ctx.fillText(townMenu === 'general' ? '修理包與蒸汽罐會立即使用。' : '選擇披風後立刻換穿；保留斗笠和破損造型。', 480, 170);
    }
    for (let i = 0; i < 5; i++) {
      const y = 235 + i * 45;
      ctx.fillStyle = '#34433b'; ctx.fillRect(220, y, 520, 40); ctx.strokeStyle = '#b79b6a'; ctx.strokeRect(220, y, 520, 40);
      ctx.fillStyle = '#f2deb7'; ctx.font = '16px sans-serif';
      let label;
      if (townMenu === 'general') label = townGoods[i].name + ' · ' + townGoods[i].price + ' 齒輪幣';
      else if (townMenu === 'clothes') {
        label = townClothes[i].name + ' · ' + (townCloakStyle === i + 1 ? '穿著中' : townCloakOwned[i] ? '免費換穿' : townClothes[i].price + ' 齒輪幣');
        ctx.fillStyle = townClothes[i].color; ctx.fillRect(235, y + 7, 26, 26); ctx.fillStyle = '#f2deb7';
      } else label = townDolls[i] + ' · 5 齒輪幣 · 收藏 ' + townPrizes[i] + ' 隻';
      ctx.fillText((i + 1) + '　' + label, 490, y + 26);
    }
    if (townMenu === 'clothes') { ctx.fillStyle = '#b9d8c3'; ctx.fillText('6　換回原本的破披風（免費）', 480, 479); }
    ctx.fillStyle = '#e1c9a0'; ctx.font = '14px sans-serif'; ctx.fillText(townNotice || '點選選項或按數字鍵', 480, 505);
    ctx.fillStyle = '#aebbaa'; ctx.fillText('按 Esc 關閉', 480, 528);
  }
  if (equipmentOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .96)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('機械工具裝備', 480, 85);
    const slots = [['red', '1 攻擊工具', '#dc906f'], ['blue', '2 防護工具', '#91bdda'], ['yellow', '3 探索工具', '#dbbf79']];
    slots.forEach(([slot, title, color], i) => {
      const x = 35 + i * 305; const items = equipmentOptions[slot];
      ctx.fillStyle = '#292e2b'; ctx.fillRect(x, 115, 280, 265); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(x, 115, 280, 265);
      ctx.fillStyle = color; ctx.font = 'bold 19px sans-serif'; ctx.fillText(title, x + 140, 148);
      items.forEach((item, j) => {
        const y = 180 + j * 65; const selected = equipment[slot] === item.id; const available = item.unlocked();
        ctx.fillStyle = selected ? '#f1dbad' : available ? '#c2c8b8' : '#817f74'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText((selected ? '● ' : '○ ') + item.name, x + 140, y);
        ctx.font = '13px sans-serif'; ctx.fillText(available ? item.description : item.hint, x + 140, y + 24);
      });
    });
    ctx.fillStyle = '#ddc9a6'; ctx.font = '15px sans-serif'; ctx.fillText('點選工具或按 1、2、3 切換；F 使用攻擊工具（剩餘 ' + toolAmmo + '/4）', 480, 420);
    ctx.fillStyle = '#aebbaa'; ctx.fillText(equipmentNotice || '在休息站休息可補滿工具次數；按 I 或 Esc 關閉', 480, 456);
  }
  if (journalOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .94)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('機械城紀錄冊', 480, 80);
    ctx.font = '15px sans-serif'; ctx.fillStyle = '#bcd4c4';
    ctx.fillText('十年前，大樓倒塌；我幸運生還，離開了這裡。', 480, 111);
    ctx.fillText('十年後，我再次回到這片廢墟。', 480, 135);
    ctx.font = '16px sans-serif';
    allLogs.forEach((log, i) => {
      ctx.fillStyle = log.read ? '#e4d8bc' : '#857e70';
      ctx.fillText(log.read ? log.text : '尚未發現的紀錄', 480, 170 + i * 42);
    });
    if (importantGear1) { ctx.fillStyle = '#e6c680'; ctx.fillText('重要齒輪 1：已修復蒸汽衝刺', 480, 450); }
    if(altar1Claimed){ctx.fillStyle='#c4e4ae';ctx.fillText('祭壇 1：生命上限 +1 · V 鐵之矛',480,475);}
    ctx.fillStyle = '#a79d8a'; ctx.fillText('按 J 或 Esc 關閉紀錄冊', 480, 515);
  }
  if (helpOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .95)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eed7aa'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('操作說明', 480, 90);
    ctx.font = '17px sans-serif'; ctx.fillStyle = '#e4d8bc';
    const lines = ['A / D 或 ← / →：移動　　W / ↑ / 空白鍵：跳躍', '滑鼠左鍵：攻擊　　空中按住上或下：改變攻擊方向', 'Shift：衝刺　 E：互動　 Q：蓄力修復　 G：休息站傳送', 'Tab：地圖　 J：紀錄冊　 I：休息站更換裝備　 F：工具　 V：鐵之矛',
      'Esc：暫停　　M：聲音開關', '空中貼住房間邊牆、升降井或工坊牆壁時再按跳躍：蹬牆跳。', '取得雙躍後，在空中再按一次跳躍鍵。'];
    lines.forEach((line, i) => ctx.fillText(line, 480, 150 + i * 42));
    ctx.fillStyle = '#a79d8a'; ctx.fillText('按 H 或 Esc 關閉', 480, 455);
  }
  if (paused && !gameOver && !won && !helpOpen && !equipmentOpen && !shopOpen && !travelOpen) {
    ctx.fillStyle = 'rgba(15, 18, 17, .86)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f0d5a2'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('遊戲暫停', 480, 250);
    ctx.font = '18px sans-serif'; ctx.fillText('按 Esc 繼續', 480, 290);
  }
  if (won) {
    ctx.fillStyle = '#111917'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    if (endingTime < 330) {
      // The old lift rises, the cable breaks, then the cabin drops out of view.
      ctx.strokeStyle = '#61746b'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(380, 0); ctx.lineTo(380, 540); ctx.moveTo(580, 0); ctx.lineTo(580, 540); ctx.stroke();
      const cabinY = endingTime < 120 ? 250 - endingTime * .6 : endingTime < 200 ? 178 : 178 + Math.pow((endingTime - 200) / 7, 2);
      ctx.strokeStyle = endingTime < 160 ? '#a79271' : '#a96f4d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(480, 0); ctx.lineTo(480, endingTime < 160 ? cabinY : 70); ctx.stroke();
      ctx.fillStyle = '#735e45'; ctx.fillRect(422, cabinY, 116, 75);
      ctx.fillStyle = '#9ccdb5'; ctx.fillRect(435, cabinY + 10, 90, 40);
      ctx.fillStyle = '#39433c'; ctx.fillRect(472, cabinY + 24, 16, 26);
      ctx.fillStyle = '#e5d0a4'; ctx.fillRect(474, cabinY + 20, 12, 11);
      if (endingTime >= 120 && endingTime < 200) {
        ctx.fillStyle = '#ffc078'; ctx.font = 'bold 27px sans-serif'; ctx.fillText('喀——！', 480, 120);
        ctx.fillStyle = '#e5c9a4'; ctx.font = '17px sans-serif'; ctx.fillText('電梯的鋼纜斷裂了……', 480, 430);
      } else if (endingTime >= 200) {
        ctx.fillStyle = '#e5c9a4'; ctx.font = '18px sans-serif'; ctx.fillText('電梯墜向黑暗。', 480, 430);
      } else {
        ctx.fillStyle = '#e5c9a4'; ctx.font = '18px sans-serif'; ctx.fillText('電梯緩緩啟動。', 480, 430);
      }
    } else if (endingTime < 410) {
      ctx.fillStyle = '#e0d8bf'; ctx.font = '18px sans-serif'; ctx.fillText('……', 480, 270);
    } else {
      // A child finds the unconscious robot among the fallen lift's debris.
      ctx.fillStyle = '#29302c'; ctx.fillRect(0, 385, 960, 155);
      ctx.fillStyle = '#635746'; ctx.fillRect(245, 370, 135, 24); ctx.fillRect(630, 370, 130, 22);
      ctx.strokeStyle = '#8d7b5f'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(240, 340); ctx.lineTo(325, 386); ctx.moveTo(735, 330); ctx.lineTo(660, 386); ctx.stroke();
      ctx.save(); ctx.translate(425, 389); ctx.rotate(-Math.PI / 2); drawRobotFragments(0); ctx.restore();
      // The child approaches and calls out; the robot's eye lights when it wakes.
      const childX = 600 - Math.min(90, (endingTime - 410) * 1.2);
      ctx.fillStyle = '#9e7354'; ctx.beginPath(); ctx.arc(childX, 337, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#514638'; ctx.fillRect(childX - 12, 325, 24, 8);
      ctx.fillStyle = '#b66f50'; ctx.fillRect(childX - 12, 350, 24, 27);
      ctx.fillStyle = '#82705b'; ctx.fillRect(childX - 10, 377, 7, 14); ctx.fillRect(childX + 3, 377, 7, 14);
      if (endingTime >= 555) { ctx.fillStyle = '#b4f2de'; ctx.fillRect(424, 374, 6, 4); }
      ctx.fillStyle = 'rgba(20, 25, 23, .92)'; ctx.fillRect(150, 410, 660, 100);
      ctx.strokeStyle = '#a78d69'; ctx.lineWidth = 2; ctx.strokeRect(150, 410, 660, 100);
      ctx.fillStyle = '#f2d5aa'; ctx.font = 'bold 19px sans-serif';
      if (endingTime < 470) ctx.fillText('小孩', 480, 440);
      else if (endingTime < 555) ctx.fillText('小孩：「喂！你聽得見嗎？快醒醒！」', 480, 440);
      else ctx.fillText('小孩：「太好了……你終於醒了。」', 480, 440);
      ctx.fillStyle = '#bcd6c4'; ctx.font = '16px sans-serif';
      if (endingTime < 470) ctx.fillText('腳步聲由遠而近。', 480, 476);
      else if (endingTime < 555) ctx.fillText('機器人仍然一動也不動。', 480, 476);
      else ctx.fillText('機器人的眼睛微微亮起。', 480, 476);
      if (endingTime >= 660) {
        ctx.fillStyle = '#e8d4aa'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('新手教學完成', 480, 92);
        ctx.font = '15px sans-serif'; ctx.fillStyle = '#c8d4bc'; ctx.fillText('按 E 醒來 · 按 R 重新開始教學（會清除進度）', 480, 125);
      }
    }
  } else if (gameOver) {
    ctx.fillStyle = 'rgba(15, 15, 14, .78)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f0d5a2'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('機械修復者倒下了', 480, 250);
    ctx.font = '18px sans-serif'; ctx.fillText(checkpoint.activated || elevatorCheckpoint.activated || greenhouseCheckpoint.activated || townCheckpoint.activated ? '按 R 從休息站重新出發' : '按 R 重新開始', 480, 290);
  }
  if(dockFallTick>=0)drawDockFall();
}
let last = 0, accumulator = 0;
function frame(time){ if (!last) last=time; accumulator += Math.min(time-last,100); last=time; while(accumulator >= 1000/60){update();ambientTime++;if(won) endingTime++;accumulator-=1000/60} draw();requestAnimationFrame(frame); }
loadProgress();
requestAnimationFrame(frame);
