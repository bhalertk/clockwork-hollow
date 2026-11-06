const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');

function createGame(storageData = {}) {
  const handlers = {};
  const labels = [];
  const gradient = {addColorStop() {}};
  const ctx = new Proxy({createLinearGradient: () => gradient, fillText: text => labels.push(text)}, {
    get: (target, key) => key in target ? target[key] : () => {},
    set: (target, key, value) => { target[key] = value; return true; }
  });
  const canvas = {width: 960, height: 540, getContext: () => ctx, getBoundingClientRect: () => ({left: 10, top: 20, width: 480, height: 270}), addEventListener: (name, fn) => { handlers['canvas:' + name] = fn; }};
  const buttons = {};
  function button(selector) {
    if (!buttons[selector]) buttons[selector] = {
      addEventListener(name, fn) { this[name] = fn; },
      setAttribute(name, value) { this[name] = value; },
      click() { if (this.clickHandler) this.clickHandler(); else if (this._click) this._click(); }
    };
    return buttons[selector];
  }
  // Keep click() as a method while retaining the registered event callback.
  const makeButton = selector => {
    const result = button(selector);
    result.addEventListener = function(name, fn) { this['_' + name] = fn; };
    return result;
  };
  const context = {
    document: {querySelector: selector => selector === '#game' ? canvas : makeButton(selector), querySelectorAll: () => []},
    window: {addEventListener: (name, fn) => { handlers[name] = fn; }, dispatchEvent: event => handlers[event.type](event), confirm: () => true},
    KeyboardEvent: class { constructor(type, fields) { this.type = type; Object.assign(this, fields); this.repeat = false; } preventDefault() {} },
    localStorage: {getItem: key => storageData[key] ?? null, setItem: (key, value) => { storageData[key] = value; }},
    requestAnimationFrame() {}
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  const key = code => handlers.keydown({code, repeat: false, preventDefault() {}});
  const keyup = code => handlers.keyup({code});
  const attack = () => handlers['canvas:mousedown']({button: 0});
  const clickCanvas = (x, y) => handlers['canvas:mousedown']({button: 0, clientX: 10 + x / 2, clientY: 20 + y / 2});
  return {run, key, keyup, attack, clickCanvas, labels, buttons, storageData, ctx};
}

// Exercise the full critical route, including its locked gates and Boss.
const game = createGame();
const {run, key, attack} = game;
run('player.x=door.x;player.y=443'); key('KeyE'); run('update()');
assert.equal(run('room'), 0, 'door must stay locked without the core');
run('player.x=core.x;player.y=core.y;update();player.x=door.x;player.y=443'); key('KeyE'); run('update()');
assert.equal(run('room'), 1, 'core opens the control room');
run('enemy.health=0;player.x=controlSwitch.x;player.y=controlSwitch.y'); key('KeyE'); run('update()');
assert.equal(run('controlSwitch.active'), true);
run('player.x=goal.x;player.y=goal.y'); key('KeyE'); run('update()');
assert.equal(run('room'), 2, 'control room leads to the shaft');
run('drone.health=0;player.x=elevatorCheckpoint.x;player.y=elevatorCheckpoint.y;update()');
assert.equal(run('activeCheckpoint'), 'elevator');
run('player.x=elevatorGoal.x;player.y=elevatorGoal.y'); key('KeyE'); run('update()');
assert.equal(run('room'), 3, 'shaft leads to the dedicated Boss room');
run('player.x=arenaExit.x;player.y=443'); key('KeyE'); run('update()');
assert.equal(run('room'), 3, 'Boss room exit stays locked during the fight');
run('boss.health=1;boss.x=650;boss.state="recover";boss.timer=80;player.x=600;player.y=443;player.facing=1;attackCooldown=0;invulnerability=75'); attack(); run('update()');
assert.equal(run('bossDefeated && !bossActive && bossLog.read'), true, 'victory unlocks the route and story');
run('player.x=arenaExit.x;player.y=443'); key('KeyE'); run('update()');
assert.equal(run('room'), 4, 'defeating the Boss opens the greenhouse');
run('enemy.health=0;player.x=greenhouseCheckpoint.x;player.y=greenhouseCheckpoint.y;update()');
assert.equal(run('activeCheckpoint'), 'greenhouse');
run('player.x=logs[4].x;player.y=logs[4].y'); key('KeyE'); run('update()');
assert.equal(run('logs[4].read'), true);
run('player.x=memoryGears[7].x;player.y=memoryGears[7].y;update()');
assert.equal(run('memoryGears[7].collected'), true);
run('player.x=greenhouseGoal.x;player.y=greenhouseGoal.y'); key('KeyE'); run('update()');
assert.equal(run('won'), true, 'greenhouse goal completes the demo');

// Reload keeps exploration and the currently selected checkpoint.
const loaded = createGame(game.storageData);
assert.equal(loaded.run('room'), 4);
assert.equal(loaded.run('bossDefeated && logs[4].read && memoryGears[7].collected'), true);
loaded.run('changeRoom(0);player.x=checkpoint.x;player.y=checkpoint.y;update()');
assert.equal(loaded.run('activeCheckpoint'), 'boiler');
loaded.run('changeRoom(4);player.x=greenhouseCheckpoint.x;player.y=greenhouseCheckpoint.y'); loaded.key('KeyE'); loaded.run('update()');
assert.equal(loaded.run('activeCheckpoint'), 'greenhouse', 'resting selects a previously activated checkpoint');
loaded.run('changeRoom(0);player.x=checkpoint.x;player.y=checkpoint.y'); loaded.key('KeyE'); loaded.run('update();gameOver=true;resetGame()');
assert.equal(loaded.run('room'), 0, 'respawn uses the most recently selected checkpoint');
assert.equal(createGame(game.storageData).run('room'), 0, 'selected checkpoint persists after reload');

// Existing saves without a selected checkpoint use the previous fallback order.
const old = createGame({'steam-city-progress-v1': JSON.stringify({checkpoint:true, elevatorCheckpoint:true, greenhouseCheckpoint:true})});
assert.equal(old.run('room'), 4, 'older saves keep their previous spawn');

// Returning to a previously defeated Boss still starts a replayable encounter.
const replay = createGame(game.storageData);
replay.run('changeRoom(3)');
assert.equal(replay.run('bossDefeated && bossActive && boss.health===boss.maxHealth'), true);
replay.run('mapOpen=true;draw()');
assert.ok(replay.labels.includes('守衛房間'), 'map includes the current room');

// Audio and screen-shake preferences persist independently of game progress.
const prefs = createGame();
prefs.buttons['#sound-toggle']._click();
prefs.buttons['#shake-toggle']._click();
const prefsReloaded = createGame(prefs.storageData);
assert.equal(prefsReloaded.run('muted && !shakeEnabled'), true);
// A lethal hazard must not also allow the ending interaction in the same update.
const lethal = createGame();
lethal.run('changeRoom(4);enemy.health=0;health=1;player.x=greenhouseGoal.x;player.y=greenhouseGoal.y;thorns.x=greenhouseGoal.x;thorns.y=greenhouseGoal.y;thorns.cycle=139');
lethal.key('KeyE'); lethal.run('update()');
assert.equal(lethal.run('deathTimer>0 && !won'), true, 'a lethal hit starts the death animation instead of completing the game');
lethal.run('for(let i=0;i<DEATH_DURATION;i++)update()');
assert.equal(lethal.run('gameOver && !won'), true, 'the game-over screen appears after the death animation');
// Equipment unlocks, loadouts, resource use and persistence.
const equipmentGame = createGame();
equipmentGame.run('checkpoint.activated=true;player.x=checkpoint.x;player.y=checkpoint.y');
equipmentGame.key('KeyI');
assert.equal(equipmentGame.run('equipmentOpen'), true, 'equipment menu opens');
equipmentGame.key('Digit1');
assert.equal(equipmentGame.run('equipment.red'), 'pulse', 'starter tools can be switched immediately');
equipmentGame.key('Digit1');
assert.equal(equipmentGame.run('equipment.red'), 'needle', 'keyboard cycles through unlocked tools');
equipmentGame.run('coreCollected=true;memoryGears[0].collected=true;memoryGears[1].collected=true;bossDefeated=true');
equipmentGame.key('Digit1'); equipmentGame.key('Digit2'); equipmentGame.key('Digit3'); equipmentGame.key('Digit3');
assert.equal(equipmentGame.run("equipment.red==='pulse' && equipment.blue==='rotor' && equipment.yellow==='magnet'"), true, 'unlocked options can be equipped');
const restoredEquipment = createGame(equipmentGame.storageData);
assert.equal(restoredEquipment.run("equipment.red==='pulse' && equipment.blue==='rotor' && equipment.yellow==='magnet'"), true, 'equipped tools survive reload');
equipmentGame.key('KeyI');
equipmentGame.run('room=0;player.x=450;player.y=443;player.facing=1;enemy.x=500;enemy.health=3;invulnerability=75');
equipmentGame.key('KeyF'); equipmentGame.run('update()');
assert.equal(equipmentGame.run('toolAmmo===3 && enemy.health===2 && steam===0'), true, 'active tool damages enemies without granting sword steam');
assert.equal(createGame(equipmentGame.storageData).run('toolAmmo'), 3, 'tool uses persist after reload');
equipmentGame.run('checkpoint.activated=true;player.x=checkpoint.x;player.y=checkpoint.y');
equipmentGame.key('KeyE'); equipmentGame.run('update()');
assert.equal(equipmentGame.run('toolAmmo'), 4, 'rest replenishes active tools');
equipmentGame.run('changeRoom(3);boss.x=650;boss.health=1;boss.state="recover";boss.timer=80;player.x=600;player.y=443;player.facing=1;invulnerability=75');
equipmentGame.key('KeyF'); equipmentGame.run('update()');
assert.equal(equipmentGame.run('bossDefeated && !bossActive'), true, 'active tools use the normal Boss victory flow');
const piercingGame = createGame({'steam-city-progress-v1': JSON.stringify({core:true, loadout:{red:'piercer', blue:'guard', yellow:'regulator'}})});
piercingGame.run('player.x=450;player.y=443;player.facing=1;enemy.x=500;enemy.health=3;invulnerability=75');
piercingGame.key('KeyF'); piercingGame.run('update()');
assert.equal(piercingGame.run('enemy.health'), 1, 'unlocked piercing tool deals two damage');
assert.equal(piercingGame.run('toolAmmo'), 2, 'piercing tool costs two uses');
piercingGame.run('toolAmmo=1;toolProjectile.active=false'); piercingGame.key('KeyF'); piercingGame.run('update()');
assert.equal(piercingGame.run('toolAmmo===1 && !toolProjectile.active && logMessage.includes("不足")'), true, 'piercing tool cannot fire with insufficient uses');
piercingGame.run('changeRoom(3);toolAmmo=2;boss.x=650;boss.health=6;boss.state="recover";boss.timer=80;player.x=600;player.y=443;player.facing=1;invulnerability=75');
piercingGame.key('KeyF'); piercingGame.run('update()');
assert.equal(piercingGame.run('boss.health===4 && boss.phase===2 && toolAmmo===0'), true, 'piercing tool damages the Boss and preserves phase transitions');
const pulseDefense = createGame();
pulseDefense.run('changeRoom(4);enemy.health=0;equipment.red="pulse";player.x=300;player.y=443;player.facing=1;flowerShot.active=true;flowerShot.x=350;flowerShot.y=455;flowerShot.direction=-1');
pulseDefense.key('KeyF'); pulseDefense.run('update()');
assert.equal(pulseDefense.run('!flowerShot.active && toolAmmo===3 && health===3'), true, 'pulse blocks enemy projectiles');
const pulseArea = createGame();
pulseArea.run('changeRoom(1);equipment.red="pulse";player.x=450;player.y=260;player.facing=1;enemy.x=500;enemy.y=270;drone.x=500;drone.phase=0;invulnerability=75');
pulseArea.key('KeyF'); pulseArea.run('update()');
assert.equal(pulseArea.run('enemy.health===2 && drone.health===1'), true, 'pulse can hit overlapping enemies');
const oldEquipmentSave = createGame({'steam-city-progress-v1': JSON.stringify({core:true})});
assert.equal(oldEquipmentSave.run("equipment.red==='needle' && equipment.blue==='guard' && equipment.yellow==='regulator' && toolAmmo===4"), true, 'older saves receive valid starter equipment');
// The menu pauses gameplay and shows all three slots and locked requirements.
const equipmentUi = createGame();
equipmentUi.run('checkpoint.activated=true;player.x=checkpoint.x;player.y=checkpoint.y');
equipmentUi.buttons['#equipment-button']._click();
assert.equal(equipmentUi.run('equipmentOpen'), true, 'equipment button opens the screen');
const enemyPosition = equipmentUi.run('enemy.x');
equipmentUi.run('update();draw()');
assert.equal(equipmentUi.run('enemy.x'), enemyPosition, 'equipment menu pauses the game');
for (const label of ['1 攻擊工具', '2 防護工具', '3 探索工具', '取得動力核心或向商人購買']) {
  assert.ok(equipmentUi.labels.includes(label), 'equipment screen displays ' + label);
}
equipmentUi.clickCanvas(175, 245);
assert.equal(equipmentUi.run("equipment.red==='pulse'"), true, 'mouse selects a tool on a scaled canvas');
equipmentUi.clickCanvas(480, 245);
assert.equal(equipmentUi.run("equipment.blue==='rotor'"), true, 'mouse selects a defense tool');
equipmentUi.clickCanvas(785, 245);
assert.equal(equipmentUi.run("equipment.yellow==='springboots'"), true, 'mouse selects an exploration tool');
equipmentUi.clickCanvas(175, 310);
assert.equal(equipmentUi.run("equipment.red==='pulse' && equipmentNotice.includes('取得動力核心')"), true, 'locked tools show their unlock requirement');
equipmentUi.key('Escape');
assert.equal(equipmentUi.run('equipmentOpen'), false, 'Escape closes the equipment screen');
equipmentUi.run('toolAmmo=0;player.x=100;player.y=443');
equipmentUi.key('KeyF'); equipmentUi.run('update()');
assert.equal(equipmentUi.run('toolAmmo===0 && !toolProjectile.active'), true, 'empty tools do not fire');
equipmentUi.run('equipment.blue="rotor";attackCooldown=0;player.x=100;player.y=443');
equipmentUi.attack(); equipmentUi.run('update()');
assert.equal(equipmentUi.run('attackCooldown'), 17, 'rotor shortens the sword cooldown');
equipmentUi.run('equipment.blue="fortress";invulnerability=0;hurtPlayer(200)');
assert.equal(equipmentUi.run('invulnerability'), 125, 'fortress adds stronger protection');
equipmentUi.run('equipment.yellow="regulator";player.x=100;player.y=443;player.vx=0;player.grounded=true;keys.clear();keys.add("KeyD");update()');
assert.ok(Math.abs(equipmentUi.run('player.vx') - 3.5 * .9 * .25) < .0001, 'fortress reduces walking speed by 10 percent');
equipmentUi.run('keys.clear()');
equipmentUi.run('equipment.blue="guard";invulnerability=0;hurtPlayer(200)');
assert.equal(equipmentUi.run('invulnerability'), 95, 'guard extends damage protection');
equipmentUi.run('equipment.yellow="regulator";dashCooldown=0;dashTimer=0;invulnerability=75');
equipmentUi.key('ShiftLeft'); equipmentUi.run('update()');
assert.equal(equipmentUi.run('dashCooldown'), 40, 'regulator shortens dash recharge');
equipmentUi.run('equipment.yellow="magnet";room=0;memoryGears[0].collected=false;player.x=memoryGears[0].x-45;player.y=memoryGears[0].y;player.vx=0;update()');
assert.equal(equipmentUi.run('memoryGears[0].collected'), true, 'magnet extends gear pickup range');
// Steam repair is a timed channel and never spends steam when interrupted.
const healing = createGame();
healing.run('player.x=100;player.y=443;player.grounded=true;player.vx=0;enemy.health=0;health=2;steam=3');
healing.key('KeyQ'); healing.run('update()');
assert.equal(healing.run('healTimer>0 && health===2 && steam===3'), true, 'healing starts without consuming steam');
const repairRotations = [];
healing.ctx.rotate = angle => repairRotations.push(angle);
healing.run('draw()');
const firstRepairFrame = [...repairRotations];
repairRotations.length = 0;
healing.run('healTimer=55;draw();healTimer=74');
assert.notDeepEqual(repairRotations, firstRepairFrame, 'repair motion changes during the healing channel');
healing.run('paused=true;update();paused=false');
assert.equal(healing.run('healTimer'), 74, 'pausing freezes healing progress');
healing.run('for(let i=0;i<73;i++) update()');
assert.equal(healing.run('health===2 && steam===3 && healTimer===1'), true, 'healing does not finish early');
healing.run('update()');
assert.equal(healing.run('health===3 && steam===0 && healGlowTimer>0'), true, 'completed healing consumes steam and plays its effect');
healing.run('health=2;steam=3;player.x=100;player.y=443;player.grounded=true;player.vx=0;keys.clear()');
healing.key('KeyQ'); healing.run('update()'); healing.key('KeyD'); healing.run('update()');
assert.equal(healing.run('healTimer===0 && steam===3 && health===2'), true, 'moving cancels healing without spending steam');
healing.run('keys.clear();player.x=100;player.y=443;player.grounded=true;player.vx=0;invulnerability=0');
healing.key('KeyQ'); healing.run('update();hurtPlayer(200)');
assert.equal(healing.run('healTimer===0 && steam===3 && health===1'), true, 'damage interrupts healing without spending steam');
healing.run('player.y=300;player.grounded=false;invulnerability=0;keys.clear()');
healing.key('KeyQ'); healing.run('update()');
assert.equal(healing.run('healTimer'), 0, 'healing cannot start in the air');
healing.run('player.x=100;player.y=443;player.grounded=true;player.vx=0;health=2;steam=3;keys.clear()');
healing.key('KeyQ'); healing.run('update();health=3;for(let i=0;i<HEAL_DURATION;i++)update()');
assert.equal(healing.run('health===3 && steam===3 && healTimer===0'), true, 'other healing cannot cause over-healing or spend steam');
// Death and respawn animate without allowing combat or unsafe movement.
const animation = createGame();
animation.run('checkpoint.activated=true;activeCheckpoint="boiler";health=1;invulnerability=0;hurtPlayer(200)');
assert.equal(animation.run('deathTimer===DEATH_DURATION && !gameOver'), true, 'lethal damage starts the death animation');
const pieceTranslations = [];
animation.ctx.translate = (x, y) => pieceTranslations.push([x, y]);
animation.run('draw()');
const assembledDeathFrame = JSON.stringify(pieceTranslations);
pieceTranslations.length = 0;
animation.run('deathTimer=27;draw();deathTimer=DEATH_DURATION');
assert.notEqual(JSON.stringify(pieceTranslations), assembledDeathFrame, 'robot parts scatter as death progresses');
animation.run('paused=true;update();paused=false');
assert.equal(animation.run('deathTimer'), 54, 'pausing freezes the death animation');
animation.run('for(let i=0;i<DEATH_DURATION;i++)update()');
assert.equal(animation.run('gameOver'), true, 'death animation ends at the game-over screen');
pieceTranslations.length = 0;
animation.run('draw()');
const fallenParts = JSON.stringify(pieceTranslations.slice(-7));
animation.key('KeyR');
assert.equal(animation.run('respawnTimer===RESPAWN_DURATION && health===3 && player.x===checkpoint.x'), true, 'respawn starts at the selected checkpoint');
pieceTranslations.length = 0;
animation.run('draw()');
const scatteredRespawnFrame = JSON.stringify(pieceTranslations);
assert.equal(JSON.stringify(pieceTranslations.slice(-7)), fallenParts, 'respawn begins with the same scattered parts visible at game over');
pieceTranslations.length = 0;
animation.run('respawnTimer=24;draw();respawnTimer=RESPAWN_DURATION');
assert.notEqual(JSON.stringify(pieceTranslations), scatteredRespawnFrame, 'robot parts move together during respawn');
const spawnX = animation.run('player.x');
animation.key('KeyD'); animation.attack(); animation.run('update()');
assert.equal(animation.run('player.x'), spawnX, 'movement is blocked during the respawn animation');
assert.equal(animation.run('attackTimer'), 0, 'attacks are blocked during respawn');
animation.run('for(let i=0;i<RESPAWN_DURATION;i++)update()');
assert.equal(animation.run('respawnTimer===0 && invulnerability>0'), true, 'respawn ends with temporary protection');
// Currency drops are collected explicitly and survive reload and death.
const economy = createGame();
economy.run('player.x=450;player.y=443;player.facing=1;enemy.x=500;enemy.health=1;invulnerability=75');
economy.attack(); economy.run('update()');
assert.equal(economy.run('coins.length===1 && coins[0].value===5 && money===0'), true, 'defeated enemy drops uncollected money');
economy.run('player.x=coins[0].x;player.y=coins[0].y;update()');
assert.equal(economy.run('money===5 && coins.length===0'), true, 'touching a drop adds money');
assert.equal(createGame(economy.storageData).run('money'), 5, 'collected money persists');
economy.run('dropCoins(300,450,4);gameOver=true;resetGame()');
assert.equal(economy.run('money===5 && coins.length===0'), true, 'death preserves collected money but removes uncollected drops');
const oldEconomySave = createGame({'steam-city-progress-v1': JSON.stringify({core:true})});
assert.equal(oldEconomySave.run('money===0 && !purchases.piercer'), true, 'old saves start with zero money');
// The merchant pauses play and supports both keyboard and scaled mouse purchases.
const shop = createGame();
shop.run('player.x=30;player.y=443;player.grounded=true;enemy.health=0;money=65');
shop.key('KeyE'); shop.run('update()');
assert.equal(shop.run('shopOpen'), true, 'merchant opens the shop');
const shopEnemyX = shop.run('enemy.x'); shop.run('update();draw()');
assert.equal(shop.run('enemy.x'), shopEnemyX, 'shop pauses gameplay');
assert.ok(shop.labels.includes('機械補給商'), 'shop interface is rendered');
shop.key('Digit1');
assert.equal(shop.run('money===40 && purchases.piercer'), true, 'keyboard purchase deducts the price');
shop.key('Digit1');
assert.equal(shop.run('money'), 40, 'already unlocked items do not charge twice');
shop.clickCanvas(480, 240);
assert.equal(shop.run('money===10 && purchases.fortress'), true, 'mouse purchase works on a scaled canvas');
shop.key('Digit3');
assert.equal(shop.run('money===10 && !purchases.magnet && shopNotice.includes("不足")'), true, 'insufficient money does not purchase');
const shopReloaded = createGame(shop.storageData);
assert.equal(shopReloaded.run('money===10 && purchases.piercer && purchases.fortress'), true, 'balance and purchases persist');
shop.key('KeyI');
assert.equal(shop.run('shopOpen && !equipmentOpen && shopNotice.includes("休息站")'), true, 'equipment cannot be changed at the shop');
shop.key('Escape');
shop.run('checkpoint.activated=true;player.x=checkpoint.x;player.y=checkpoint.y');
shop.key('KeyI');
assert.equal(shop.run('equipmentOpen'), true, 'purchased equipment can be changed at a rest station');
shop.key('Digit1'); shop.key('Digit1');
assert.equal(shop.run('equipment.red'), 'piercer', 'purchased tools can be equipped before milestone unlock');
const purchasedLoadout = createGame(shop.storageData);
assert.equal(purchasedLoadout.run('equipment.red'), 'piercer', 'purchased loadout survives reload without the milestone');
shop.run('won=true;resetGame()');
assert.equal(shop.run('money===0 && !purchases.piercer && !purchases.fortress'), true, 'starting a new game clears currency and purchases');
// Different sources yield their stated rewards and drops land on platforms.
const rewards = createGame();
rewards.run('changeRoom(3);boss.health=1;damageBoss(false)');
assert.equal(rewards.run('coins.length===1 && coins[0].value===25'), true, 'Boss drops 25 coins');
rewards.run('changeRoom(2);drone.health=1;damageDrone(false)');
assert.equal(rewards.run('coins.length===1 && coins[0].value===4'), true, 'drone drops 4 coins');
rewards.run('coins.length=0;drone.health=0;player.x=70;dropCoins(450,300,4);for(let i=0;i<60;i++)update()');
assert.equal(rewards.run('coins.length===1 && coins[0].y===316'), true, 'falling coins land on platforms');
const milestoneShop = createGame();
milestoneShop.run('coreCollected=true;money=100;player.x=30;player.y=443');
milestoneShop.key('KeyE'); milestoneShop.run('update()'); milestoneShop.key('Digit1');
assert.equal(milestoneShop.run('money===100 && !purchases.piercer'), true, 'milestone-unlocked equipment cannot be charged again');
// The optional parkour course connects to the greenhouse and persists its results.
const parkour = createGame();
parkour.run('changeRoom(4);enemy.health=0;player.x=door.x;player.y=443');
parkour.key('KeyE'); parkour.run('update()');
assert.equal(parkour.run('room===5 && courseRunning && courseTicks===0'), true, 'greenhouse door enters the course');
parkour.run('for(let i=0;i<120;i++)update()');
assert.equal(parkour.run('courseTicks'), 120, 'course timer runs while playing');
parkour.run('mapOpen=true;update();draw();mapOpen=false');
assert.equal(parkour.run('courseTicks'), 120, 'course timer pauses while map is open');
assert.ok(parkour.labels.includes('空中跑酷'), 'map includes the course');
parkour.run('player.x=courseVent.x;player.y=courseVent.y;courseVent.cycle=139;update()');
assert.equal(parkour.run('courseTicks===0 && player.x===70 && health===3'), true, 'steam returns the player to the start without damage');
parkour.run('player.y=canvas.height+101;update()');
assert.equal(parkour.run('player.x===70 && player.y===443 && courseTicks===0'), true, 'falling restarts the course');
parkour.run('courseTicks=300;player.x=courseFinish.x;player.y=courseFinish.y;update()');
assert.equal(parkour.run('courseFinished && !courseRunning && courseBestTicks===301 && money===25 && courseRewardClaimed'), true, 'first finish records time and grants reward');
parkour.key('KeyT');
assert.equal(parkour.run('courseRunning && courseTicks===0 && player.x===70'), true, 'retry returns to the start');
parkour.run('courseTicks=480;player.x=courseFinish.x;player.y=courseFinish.y;update()');
assert.equal(parkour.run('money===25 && courseBestTicks===301'), true, 'slower repeat cannot duplicate rewards or worsen the best time');
parkour.key('KeyT'); parkour.run('courseTicks=100;player.x=courseFinish.x;player.y=courseFinish.y;update()');
assert.equal(parkour.run('money===25 && courseBestTicks===101'), true, 'faster repeat improves the best time');
const parkourReloaded = createGame(parkour.storageData);
assert.equal(parkourReloaded.run('courseBestTicks===101 && courseRewardClaimed && money===25'), true, 'course best and reward persist');
parkour.run('player.x=5;player.y=443'); parkour.key('KeyE'); parkour.run('update()');
assert.equal(parkour.run('room'), 4, 'course returns to greenhouse');
// Equipment and fast travel are only available near activated rest stations.
const travel = createGame();
travel.key('KeyI');
assert.equal(travel.run('!equipmentOpen && logMessage.includes("休息站")'), true, 'equipment is blocked away from a rest station');
travel.key('KeyG');
assert.equal(travel.run('!travelOpen && logMessage.includes("休息站")'), true, 'travel is blocked away from a rest station');
travel.run('player.x=checkpoint.x;player.y=checkpoint.y;checkpoint.activated=false');
travel.key('KeyI'); travel.key('KeyG');
assert.equal(travel.run('!equipmentOpen && !travelOpen'), true, 'inactive stations cannot be used');
travel.run('checkpoint.activated=true;health=2;steam=1;toolAmmo=2');
travel.key('KeyG');
assert.equal(travel.run('travelOpen'), true, 'activated station opens travel menu');
const frozenX = travel.run('enemy.x'); travel.run('update();draw()');
assert.equal(travel.run('enemy.x'), frozenX, 'travel menu pauses the game');
assert.ok(travel.labels.includes('休息站傳送'), 'travel menu is visible');
travel.key('Digit2');
assert.equal(travel.run('travelOpen && travelNotice.includes("尚未啟動") && room===0'), true, 'locked destinations cannot be used');
travel.run('elevatorCheckpoint.activated=true'); travel.key('Digit2');
assert.equal(travel.run('!travelOpen && room===2 && activeCheckpoint==="elevator" && health===2 && steam===1 && toolAmmo===2'), true, 'travel preserves resources and selects the destination checkpoint');
assert.equal(createGame(travel.storageData).run('room'), 2, 'destination checkpoint is saved');
travel.run('for(let i=0;i<RESPAWN_DURATION;i++)update(); greenhouseCheckpoint.activated=true');
travel.key('KeyG'); travel.clickCanvas(480, 270);
assert.equal(travel.run('room===4 && activeCheckpoint==="greenhouse" && !travelOpen'), true, 'scaled mouse selection travels to the greenhouse');
travel.run('for(let i=0;i<RESPAWN_DURATION;i++)update()'); travel.key('KeyI');
assert.equal(travel.run('equipmentOpen'), true, 'equipment can be changed at the destination station');
travel.key('Escape'); travel.run('player.x=100;player.y=443'); travel.key('KeyI');
assert.equal(travel.run('!equipmentOpen'), true, 'equipment remains unavailable after leaving the station');
// Follow the platforms with real movement inputs, without teleporting the player.
const route = createGame(); route.run('changeRoom(5)');
function walkRightUntil(x) {
  route.key('KeyD'); for (let i=0; i<100 && route.run('player.x')<x; i++) route.run('update()'); route.keyup('KeyD');
}
function jumpRightUntil(x) {
  route.key('KeyD'); route.key('Space');
  for (let i=0; i<100 && route.run('player.x')<x; i++) route.run('update()');
  route.keyup('KeyD'); for (let i=0; i<100 && !route.run('player.grounded'); i++) route.run('update()'); route.keyup('Space');
}
walkRightUntil(110); jumpRightUntil(240);
assert.equal(route.run('player.grounded && player.y===378'), true, 'first platform is reachable');
walkRightUntil(280); jumpRightUntil(380);
assert.equal(route.run('player.grounded && player.y===313'), true, 'second platform is reachable');
walkRightUntil(425); jumpRightUntil(580);
assert.equal(route.run('player.grounded && player.y===348'), true, 'moving platform is reachable');
jumpRightUntil(720);
assert.equal(route.run('player.grounded && player.y===293'), true, 'fourth platform is reachable');
jumpRightUntil(860);
assert.equal(route.run('courseFinished'), true, 'the complete course is reachable with normal jumps');

// Wall jumps work against solid walls and retain the separate double jump.
const wallJump = createGame();
wallJump.run('player.x=0;player.y=250;player.vx=0;player.vy=2;player.grounded=false;coyoteTime=0;doubleJumpUnlocked=true;doubleJumpUsed=false');
wallJump.key('Space'); wallJump.run('update()');
assert.equal(wallJump.run('player.vx>0 && player.vy<0 && wallJumpLock>0 && !doubleJumpUsed'), true, 'left wall pushes the player right without consuming double jump');
wallJump.keyup('Space'); wallJump.run('update()'); wallJump.key('Space'); wallJump.run('update()');
assert.equal(wallJump.run('doubleJumpUsed'), true, 'double jump remains available after a wall jump');
wallJump.run('changeRoom(2);drone.health=0;player.x=weakWall.x-player.w;player.y=430;player.vx=0;player.vy=1;player.grounded=false;coyoteTime=0');
wallJump.keyup('Space'); wallJump.key('Space'); wallJump.run('update()');
assert.equal(wallJump.run('player.vx<0 && player.vy<0 && wallJumpLock>0'), true, 'shaft wall pushes the player away');
wallJump.run('changeRoom(2);weakWall.broken=true;player.x=weakWall.x-player.w;player.y=430;player.vy=1;player.grounded=false;coyoteTime=0;doubleJumpUnlocked=false');
wallJump.keyup('Space'); wallJump.key('Space'); wallJump.run('update()');
assert.equal(wallJump.run('player.vy>0 && wallJumpLock===0'), true, 'a broken wall cannot be used for wall jumping');

// The exploration map reveals rooms on entry and preserves progress across reloads.
const explorationMap = createGame();
explorationMap.run('mapOpen=true;draw()');
assert.ok(explorationMap.labels.includes('鍋爐室'));
assert.equal(explorationMap.labels.includes('空中跑酷'), false, 'unvisited rooms remain hidden');
explorationMap.run('mapOpen=false;changeRoom(1);mapOpen=true;draw()');
assert.ok(explorationMap.labels.includes('機械控制室'));
assert.equal(createGame(explorationMap.storageData).run('visitedRooms[1]'), true, 'room discovery persists');
const legacyMap = createGame({'steam-city-progress-v1': JSON.stringify({reactor:true,bossDefeated:true,greenhouseCheckpoint:true})});
assert.equal(legacyMap.run('visitedRooms.slice(0,5).every(Boolean)'), true, 'old progress reveals rooms it proves were visited');
assert.equal(legacyMap.run('visitedRooms[5]'), false, 'old saves do not reveal unproven areas');
legacyMap.buttons['#restart-button']._click();
assert.equal(legacyMap.run('visitedRooms.filter(Boolean).length'), 1, 'new game clears map discoveries');

// The boiler's elevated door opens a three-room branch with return routes and saved discoveries.
const branch = createGame();
branch.run('player.x=branchDoor.x+10;player.y=153;player.grounded=true'); branch.key('KeyE'); branch.run('update()');
assert.equal(branch.run('room===6 && player.x===820 && visitedRooms[6]'), true, 'elevated boiler door enters the first branch room');
branch.run('draw();player.x=exitDoor.x;player.y=443'); branch.key('KeyE'); branch.run('update()');
assert.equal(branch.run('room===7 && player.x===820 && visitedRooms[7]'), true, 'first branch room leads deeper');
branch.run('draw();player.x=exitDoor.x;player.y=443'); branch.key('KeyE'); branch.run('update()');
assert.equal(branch.run('room===8 && visitedRooms[8]'), true, 'second branch room leads to the workshop');
branch.run('draw();player.x=exitDoor.x;player.y=443'); branch.key('KeyE'); branch.run('update()');
assert.equal(branch.run('room'), 8, 'the final room has no false exit');
branch.run('player.x=door.x;player.y=443'); branch.key('KeyE'); branch.run('update()');
assert.equal(branch.run('room===7 && player.x===70'), true, 'return door returns to the previous room');
branch.run('player.x=door.x;player.y=443'); branch.key('KeyE'); branch.run('update()');
assert.equal(branch.run('room'), 6);
branch.run('player.x=door.x;player.y=443'); branch.key('KeyE'); branch.run('update()');
assert.equal(branch.run('room===0 && player.y===153'), true, 'branch exit returns to the elevated boiler door');
const branchReload = createGame(branch.storageData);
assert.equal(branchReload.run('visitedRooms.slice(6,9).every(Boolean)'), true, 'branch exploration survives reload');
branchReload.run('changeRoom(6);player.x=branchVent.x;player.y=443;player.grounded=true;vent.cycle=120;invulnerability=0;health=3;update()');
assert.equal(branchReload.run('health'), 2, 'active branch steam damages the player');
branchReload.run('mapOpen=true;draw()');
assert.ok(branchReload.labels.includes('失落工坊'), 'discovered branch appears on the map');

// Cross the workshop shaft using real movement and two alternating wall jumps.
const workshop = createGame();
workshop.run('changeRoom(8);player.x=450;player.y=443;player.grounded=true;keys.clear();invulnerability=999');
workshop.key('KeyD'); workshop.key('Space');
let workshopWallJumps = 0;
for (let tick = 0; tick < 120 && !workshop.run('memoryGears[10].collected'); tick++) {
  workshop.run('update()');
  if (workshop.run('player.x>=480 && player.y+player.h>210 && wallJumpLock===0 && !player.grounded')) {
    workshop.keyup('Space'); workshop.keyup('KeyD'); workshop.key('KeyA'); workshop.key('Space'); workshopWallJumps++;
  } else if (workshop.run('player.x<=408 && player.y+player.h>210 && wallJumpLock===0 && !player.grounded')) {
    workshop.keyup('Space'); workshop.keyup('KeyA'); workshop.key('KeyD'); workshop.key('Space'); workshopWallJumps++;
  }
}
assert.ok(workshopWallJumps >= 2, 'workshop route requires alternating wall jumps');
assert.equal(workshop.run('memoryGears[10].collected'), true, 'workshop reward is reachable using wall jumps');
assert.equal(createGame(workshop.storageData).run('memoryGears[10].collected'), true, 'workshop reward persists');
const mine = createGame();
mine.run('changeRoom(7);player.x=540;player.y=338;player.grounded=true;player.vx=0;invulnerability=999');
const previousMineX = mine.run('player.x'); mine.run('update()');
assert.ok(mine.run('player.x') > previousMineX, 'the mine platform carries the player');
mine.run('ambientTime=0;player.x=480;player.y=443;player.grounded=true;health=3;invulnerability=0;update()');
assert.equal(mine.run('health'), 2, 'the mine gear damages on contact');
mine.run('ambientTime=60;update()');
assert.ok(mine.run('mineSaw.x > 600'), 'the mine gear travels across the floor');

// Branch foes telegraph distinctive attacks, accept both weapons, and reset on room entry.
const branchCombat = createGame();
branchCombat.run('changeRoom(6);player.x=500;player.y=443;player.grounded=true;branchEnemy.cooldown=0;invulnerability=999;update()');
assert.equal(branchCombat.run('branchEnemy.state'), 'warning', 'pipe gunner telegraphs a shot');
branchCombat.run('for(let i=0;i<45;i++) update()');
assert.equal(branchCombat.run('branchShot.active'), true, 'pipe gunner fires after warning');
branchCombat.run('branchShot.active=false;branchEnemy.x=620;branchEnemy.y=451;branchEnemy.health=1;branchEnemy.stun=20;player.x=570;player.y=443;player.facing=1;attackCooldown=0;steam=0');
branchCombat.attack(); branchCombat.run('update()');
assert.equal(branchCombat.run('branchEnemy.health===0 && steam===1 && coins.some(c=>c.value===5)'), true, 'sword defeats the pipe gunner and rewards steam and coins');
branchCombat.run('changeRoom(7);player.x=340;player.y=443;player.grounded=true;branchEnemy.x=250;branchEnemy.cooldown=0;invulnerability=999;update()');
assert.equal(branchCombat.run('branchEnemy.state'), 'warning', 'miner warns before charging');
branchCombat.run('for(let i=0;i<45;i++) update()');
assert.equal(branchCombat.run('branchEnemy.state'), 'charge', 'miner charges after warning');
branchCombat.run('changeRoom(8);branchEnemy.x=680;branchEnemy.y=315;branchEnemy.health=2;branchEnemy.cooldown=999;player.x=600;player.y=310;player.facing=1;toolAmmo=4;toolProjectile.active=false');
branchCombat.key('KeyF'); branchCombat.run('for(let i=0;i<15;i++) update()');
assert.ok(branchCombat.run('branchEnemy.health') < 2, 'tools can damage workshop drone');
branchCombat.run('changeRoom(6)');
assert.equal(branchCombat.run('branchEnemy.health===3 && !branchShot.active'), true, 'returning respawns the gunner and clears old shots');

// The workshop return door works from the raised approach as well as at floor level.
const workshopExit = createGame();
workshopExit.run('changeRoom(8);branchEnemy.health=0;player.x=840;player.y=363;player.vx=0;player.vy=0;player.grounded=true');
assert.equal(workshopExit.run('overlaps(player, door)'), false, 'the raised approach does not overlap the old door rectangle');
assert.equal(workshopExit.run('nearBranchReturnDoor()'), true, 'the raised approach is within the return door interaction area');
workshopExit.key('KeyE'); workshopExit.run('update()');
assert.equal(workshopExit.run('room===7 && player.x===70'), true, 'pressing E near the workshop door returns to the mine');
workshopExit.run('changeRoom(8);branchEnemy.health=0;player.x=760;player.y=363;player.vx=0;player.vy=0;player.grounded=true');
workshopExit.key('KeyE'); workshopExit.run('update()');
assert.equal(workshopExit.run('room'), 8, 'pressing E away from the door does not change rooms');

// Each branch has three independently damageable foes with independent shots.
const branchSquads = createGame();
for (const roomNumber of [6, 7, 8]) {
  branchSquads.run(`changeRoom(${roomNumber});draw()`);
  assert.equal(branchSquads.run('branchEnemies.filter(foe=>foe.health>0).length'), 3, `room ${roomNumber} spawns three enemies`);
  assert.equal(branchSquads.run('branchEnemies.some(foe=>overlaps(player,foe))'), false, 'room entry does not place the player inside an enemy');
}
branchSquads.run('changeRoom(6);branchEnemies.forEach(foe=>{foe.stun=60;foe.cooldown=999});branchEnemies[1].health=1;player.x=290;player.y=443;player.vx=0;player.facing=1;attackCooldown=0;invulnerability=999');
branchSquads.attack(); branchSquads.run('update()');
assert.equal(branchSquads.run('branchEnemies.map(foe=>foe.health).join(",")'), '3,0,3', 'a sword hit affects only the struck enemy');
assert.equal(branchSquads.run('coins.filter(coin=>coin.value===5).length'), 1, 'each defeated foe drops its reward once');
branchSquads.run('changeRoom(6);branchEnemies.forEach(foe=>{foe.x=500;foe.y=451;foe.cooldown=0;foe.stun=0});player.x=400;player.y=443;invulnerability=999');
branchSquads.run('for(let i=0;i<46;i++) update()');
assert.equal(branchSquads.run('branchEnemies.filter(foe=>foe.shot.active).length'), 3, 'each gunner can have an independent projectile');
branchSquads.run('branchEnemies[1].shot.x=player.x+player.w+10;branchEnemies[1].shot.y=player.y+8;branchEnemies[1].shot.vx=0;branchEnemies[1].shot.vy=0;branchEnemies.forEach(foe=>foe.stun=20);attackCooldown=0;player.facing=1');
branchSquads.attack(); branchSquads.run('update()');
assert.equal(branchSquads.run('branchEnemies[1].shot.active'), false, 'the sword can clear another enemy’s projectile');
branchSquads.run('changeRoom(7);changeRoom(6)');
assert.equal(branchSquads.run('branchEnemies.every(foe=>foe.health===3 && !foe.shot.active)'), true, 're-entry resets all enemies and projectiles');

// Walk from the mine into the workshop and back out using actual movement.
const realWorkshopExit = createGame();
realWorkshopExit.run('changeRoom(7);player.x=10;player.y=443;player.grounded=true;invulnerability=999');
realWorkshopExit.key('KeyE'); realWorkshopExit.run('update()'); realWorkshopExit.keyup('KeyE');
assert.equal(realWorkshopExit.run('room'), 8, 'the mine door enters the workshop');
realWorkshopExit.key('KeyD');
for (let i=0; i<120 && realWorkshopExit.run('room===8'); i++) realWorkshopExit.run('update()');
realWorkshopExit.keyup('KeyD');
assert.equal(realWorkshopExit.run('room===7 && player.x===70'), true, 'walking right through the workshop exit returns to the mine');
realWorkshopExit.run('changeRoom(8);player.x=canvas.width-player.w;player.y=443;player.vx=0;keys.clear();update()');
assert.equal(realWorkshopExit.run('room'), 8, 'standing still at the right edge does not switch rooms');
realWorkshopExit.key('KeyE'); realWorkshopExit.run('update()');
assert.equal(realWorkshopExit.run('room'), 7, 'E still opens the door at the right edge');

// Existing content is presented as a tutorial, with room-specific hints and a clear ending.
const tutorialChapter = createGame();
tutorialChapter.run('draw()');
assert.ok(tutorialChapter.labels.some(label => label.includes('教學：A / D')), 'the starting room explains movement');
tutorialChapter.run('changeRoom(8);draw()');
assert.ok(tutorialChapter.labels.some(label => label.includes('雙牆間交替攀爬')), 'the workshop explains wall jumping');
tutorialChapter.run('won=true;endingTime=660;draw()');
assert.ok(tutorialChapter.labels.includes('新手教學完成'));
assert.ok(tutorialChapter.labels.some(label => label.includes('按 E 醒來')));

// The backstory appears at the beginning without blocking play and remains in the journal.
const story = createGame();
story.run('draw()');
assert.ok(story.labels.some(label => label.includes('十年前') && label.includes('大樓倒塌')));
story.key('KeyD'); story.run('update()');
assert.ok(story.run('player.x') > 90, 'the opening text does not block movement');
story.key('KeyJ'); story.run('draw()');
assert.ok(story.labels.some(label => label.includes('十年後') && label.includes('再次回到')));
story.run('journalOpen=false;saveProgress()');
assert.equal(createGame(story.storageData).run('storyIntroTimer'), 0, 'existing saves resume without replaying the intro');

// The tutorial ends with an elevator failure and a child waking the robot.
const cutscene = createGame();
cutscene.run('won=true;endingTime=150;draw()');
assert.ok(cutscene.labels.some(label => label.includes('鋼纜斷裂')));
cutscene.run('endingTime=250;draw()');
assert.ok(cutscene.labels.some(label => label.includes('電梯墜向黑暗')));
cutscene.run('endingTime=500;draw()');
assert.ok(cutscene.labels.some(label => label.includes('快醒醒')));
cutscene.run('endingTime=600;draw()');
assert.ok(cutscene.labels.some(label => label.includes('終於醒了')));
cutscene.run('endingTime=660;draw()');
assert.ok(cutscene.labels.includes('新手教學完成'));

// The fall leads to Clocktower Town with abilities damaged and prior progress preserved.
const town = createGame();
town.run('money=42;memoryGears[0].collected=true;doubleJumpUnlocked=true;won=true;endingTime=660');
town.key('KeyE'); town.run('draw()');
assert.equal(town.run('postFall && room===9 && !won && !doubleJumpUnlocked && toolAmmo===0'), true, 'waking starts the post-fall scene with damaged abilities');
assert.equal(town.run('money===42 && memoryGears[0].collected'), true, 'the fall preserves money and collectibles');
town.key('ShiftLeft'); town.key('KeyF'); town.run('update()');
assert.equal(town.run('dashTimer===0 && !toolProjectile.active'), true, 'damaged dash and tools cannot be used');
town.run('player.x=0;player.y=250;player.vy=1;player.grounded=false;coyoteTime=0;wallJumpLock=0'); town.key('Space'); town.run('update()');
assert.equal(town.run('player.vy>0 && wallJumpLock===0'), true, 'wall jump is damaged after the fall');
town.run('player.x=490;player.y=443;player.vx=0;player.grounded=true'); town.key('KeyE'); town.run('update()');
assert.ok(town.run('logMessage').includes('零件'), 'the child explains the damage');
town.run('player.x=door.x;player.y=443;player.vx=0;player.grounded=true'); town.key('KeyE'); town.run('update();draw()');
assert.equal(town.run('room===10 && player.x===70 && visitedRooms[10]'), true, 'the crash site leads to Clocktower Town');
town.run('mapOpen=true;draw();mapOpen=false');
assert.ok(town.labels.includes('鐘樓鎮'), 'the town appears on the map');
town.run('player.x=exitDoor.x;player.y=443;player.vx=0'); town.key('KeyE'); town.run('update()');
assert.equal(town.run('room===9 && player.x===820'), true, 'the town exit returns to the crash site');
const townReload = createGame(town.storageData);
assert.equal(townReload.run('postFall && room===9 && !doubleJumpUnlocked && toolAmmo===0 && money===42 && visitedRooms[10]'), true, 'post-fall state and town discovery persist');
townReload.run('gameOver=true;resetGame()');
assert.equal(townReload.run('room===9 && postFall && toolAmmo===0'), true, 'respawn cannot restore damaged abilities');

// The robot's reserved personality comes through while talking with the child.
const personality = createGame();
personality.run('won=true;endingTime=660'); personality.key('KeyE');
personality.run('player.x=490;player.y=443;player.vx=0;player.grounded=true');
const characterLines = [];
for (let i=0;i<5;i++) { personality.key('KeyE'); personality.run('update()'); characterLines.push(personality.run('logMessage')); }
assert.ok(characterLines[1].includes('我還能走'), 'the robot downplays its own damage');
assert.ok(characterLines[3].includes('你有受傷嗎'), 'the robot asks about the child’s safety');
const personalityReload = createGame(personality.storageData);
assert.equal(personalityReload.run('childConversation'), 4, 'conversation progress survives reload');
personalityReload.run('player.x=490;player.y=443;player.vx=0;player.grounded=true'); personalityReload.key('KeyE'); personalityReload.run('update()');
assert.ok(personalityReload.run('logMessage').includes('鐘樓鎮'), 'the final line remains available');

// The child introduces the three town shops, which work with keyboard and mouse.
const townTour = createGame();
townTour.run('won=true;endingTime=660;money=50'); townTour.key('KeyE');
townTour.run('player.x=door.x;player.y=443;player.vx=0;player.grounded=true'); townTour.key('KeyE'); townTour.run('update()');
assert.equal(townTour.run('room===10 && logMessage.includes("歡迎")'), true, 'the child welcomes the player to town');
townTour.run('player.x=215;player.y=443;player.vx=0;player.grounded=true;health=2;update()');
assert.equal(townTour.run('(townGuideMask & 1)!==0 && logMessage.includes("雜貨")'), true, 'the child introduces the general store');
townTour.key('KeyE'); townTour.run('update();draw()');
assert.equal(townTour.run('townMenu'), 'general');
const shopPosition = townTour.run('player.x'); townTour.key('KeyD'); townTour.run('update()');
assert.equal(townTour.run('player.x'), shopPosition, 'the game pauses while a shop is open');
townTour.key('Digit1');
assert.equal(townTour.run('money===42 && health===3'), true, 'general store repairs health for coins');
townTour.key('Digit1'); assert.equal(townTour.run('money'), 42, 'full health cannot be charged twice');
townTour.key('Escape'); townTour.run('player.x=465;player.y=443;player.vx=0;player.grounded=true;update()');
assert.equal(townTour.run('(townGuideMask & 2)!==0'), true, 'the child introduces the clothes shop');
townTour.key('KeyE'); townTour.run('update()'); townTour.clickCanvas(480,270);
assert.equal(townTour.run('townCloak && money===27'), true, 'clothing purchase works by clicking');
townTour.key('Digit1'); assert.equal(townTour.run('money'), 27, 'the cloak cannot be purchased twice');
townTour.key('Escape'); townTour.run('player.x=715;player.y=443;player.vx=0;player.grounded=true;update()');
assert.equal(townTour.run('(townGuideMask & 4)!==0'), true, 'the child introduces the claw machine');
townTour.key('KeyE'); townTour.run('update();ambientTime=10;draw()'); townTour.key('Digit1');
assert.equal(townTour.run('money===22 && townPrizeCount===0'), true, 'a mistimed claw attempt costs coins and does not award a prize');
townTour.run('ambientTime=60'); townTour.key('Digit1');
assert.equal(townTour.run('money===17 && townPrizeCount===1'), true, 'a well-timed claw attempt wins a prize');
townTour.run('money=0'); townTour.key('Digit1');
assert.equal(townTour.run('money===0 && townPrizeCount===1'), true, 'insufficient funds block an attempt');
const townTourReload = createGame(townTour.storageData);
assert.equal(townTourReload.run('townGuideMask===7 && townCloak && townPrizeCount===1'), true, 'tour, cloak, and prizes survive reload');
townTourReload.buttons['#restart-button']._click();
assert.equal(townTourReload.run('townGuideMask===0 && !townCloak && townPrizeCount===0'), true, 'a new game clears town progress');

// After the town tour, the child brings the robot home to meet both parents.
const familyStory = createGame();
familyStory.run('won=true;endingTime=660;money=42'); familyStory.key('KeyE');
familyStory.run('player.x=door.x;player.y=443;player.vx=0;player.grounded=true'); familyStory.key('KeyE'); familyStory.run('update()');
familyStory.run('player.x=855;player.y=443;player.vx=0;player.grounded=true'); familyStory.key('KeyE'); familyStory.run('update();draw()');
assert.equal(familyStory.run('room===11 && familyStage===1'), true, 'the house entrance begins the family visit');
assert.ok(familyStory.run('logMessage').includes('爸爸、媽媽'), 'the child introduces the visit');
familyStory.run('player.x=330;player.y=443;player.vx=0;player.grounded=true');
const familyLines=[];
for (let i=0; i<5; i++) { familyStory.key('KeyE'); familyStory.run('update()'); familyLines.push(familyStory.run('logMessage')); }
assert.ok(familyLines[0].includes('媽媽') && familyLines[0].includes('休息'), 'mother invites the robot to rest');
assert.ok(familyLines[1].includes('爸爸') && familyLines[1].includes('一晚'), 'father offers an overnight stay');
assert.ok(familyLines[2].includes('不必') && familyLines[2].includes('不能留下'), 'the robot refuses');
assert.equal(familyStory.run('familyStage'), 6, 'the robot collapses after the conversation');
familyStory.run('draw()');
assert.ok(familyStory.labels.some(label => label.includes('突然失去意識')), 'the collapse is shown on screen');
const familyReload = createGame(familyStory.storageData);
assert.equal(familyReload.run('room===11 && familyStage===6 && money===42'), true, 'collapse and existing progress survive reload');
familyReload.run('draw();mapOpen=true;draw()');
assert.ok(familyReload.labels.includes('小孩的家'), 'the family home appears on the map');

// Clocktower Town has a persistent rest station and two-way fast travel.
const townTravel = createGame();
townTravel.run('checkpoint.activated=true;activeCheckpoint="boiler";won=true;endingTime=660;money=21'); townTravel.key('KeyE');
townTravel.run('player.x=door.x;player.y=443;player.vx=0;player.grounded=true'); townTravel.key('KeyE'); townTravel.run('update()');
townTravel.run('player.x=townCheckpoint.x;player.y=443;player.vx=0;player.grounded=true;health=2;update()');
assert.equal(townTravel.run('townCheckpoint.activated && activeCheckpoint==="town" && health===3 && postFall'), true, 'entering the town station activates it and restores health');
townTravel.run('health=2'); townTravel.key('KeyE'); townTravel.run('update()');
assert.equal(townTravel.run('health===3 && activeCheckpoint==="town" && toolAmmo===0'), true, 'resting restores health without repairing damaged tools');
townTravel.key('KeyG'); townTravel.run('draw()');
assert.equal(townTravel.run('travelOpen'), true);
townTravel.key('Digit1');
assert.equal(townTravel.run('room===0 && activeCheckpoint==="boiler" && postFall'), true, 'the town station travels to an activated tutorial station');
townTravel.run('for(let i=0;i<RESPAWN_DURATION;i++)update()'); townTravel.key('KeyG'); townTravel.key('Digit4');
assert.equal(townTravel.run('room===10 && activeCheckpoint==="town" && toolAmmo===0'), true, 'option 4 travels back to town without restoring tools');
const townTravelReload = createGame(townTravel.storageData);
assert.equal(townTravelReload.run('room===10 && townCheckpoint.activated && activeCheckpoint==="town" && postFall'), true, 'town teleport and selected respawn persist');
townTravelReload.run('gameOver=true;resetGame()');
assert.equal(townTravelReload.run('room===10 && postFall && toolAmmo===0'), true, 'death respawns at the selected town station');
townTravelReload.run('changeRoom(1);player.x=jumpUpgrade.x;player.y=jumpUpgrade.y;invulnerability=999;update()');
assert.equal(townTravelReload.run('doubleJumpUnlocked'), false, 'visiting the old upgrade cannot bypass post-fall ability damage');
const noTownStation = createGame({'steam-city-progress-v1': JSON.stringify({checkpoint:true})});
assert.equal(noTownStation.run('townCheckpoint.activated'), false, 'old saves do not unlock the town station');

// After collapsing, the family puts the robot to bed and it wakes the next day.
const overnight = createGame(familyStory.storageData);
overnight.run('health=1;mapOpen=false'); overnight.key('KeyE'); overnight.run('draw()');
assert.equal(overnight.run('familyStage'), 7, 'the parents take the unconscious robot to bed');
assert.ok(overnight.labels.some(label => label.includes('安置到床上')));
assert.ok(overnight.labels.some(label => label.includes('一夜過去')));
const overnightReload = createGame(overnight.storageData);
assert.equal(overnightReload.run('room===11 && familyStage===7'), true, 'the overnight scene survives reload');
overnightReload.key('KeyE'); overnightReload.run('draw()');
assert.equal(overnightReload.run('familyStage===8 && health===3 && postFall && toolAmmo===0'), true, 'the next morning restores health without repairing damaged tools');
assert.ok(overnightReload.run('logMessage').includes('早安'));
const beforeWalk = overnightReload.run('player.x'); overnightReload.key('KeyD'); overnightReload.run('update()');
assert.ok(overnightReload.run('player.x') > beforeWalk, 'the player regains control after waking');
overnightReload.keyup('KeyD'); overnightReload.run('player.x=330;player.y=443;player.vx=0;player.grounded=true'); overnightReload.key('KeyE'); overnightReload.run('update()');
assert.ok(overnightReload.run('logMessage').includes('謝了'), 'the robot thanks the family');
assert.equal(createGame(overnightReload.storageData).run('familyStage'), 8, 'the completed overnight visit persists');

// Each town shop offers five working choices, and clothing is visibly selectable.
const expandedShops = createGame();
expandedShops.run('won=true;endingTime=660;money=200'); expandedShops.key('KeyE');
expandedShops.run('player.x=door.x;player.y=443;player.vx=0;player.grounded=true'); expandedShops.key('KeyE'); expandedShops.run('update()');
expandedShops.run('player.x=465;player.y=443;player.vx=0;player.grounded=true'); expandedShops.key('KeyE'); expandedShops.run('update();draw()');
assert.equal(expandedShops.run('townMenu'), 'clothes');
for (let i=1; i<=5; i++) assert.ok(expandedShops.labels.some(label => label.includes(expandedShops.run(`townClothes[${i-1}].name`))), 'each cloak is listed');
expandedShops.key('Digit2');
assert.equal(expandedShops.run('townCloakStyle===2 && townCloakOwned[1] && money===182'), true, 'buying the blue cloak immediately equips it');
expandedShops.key('Digit6'); assert.equal(expandedShops.run('townCloakStyle'), 0, 'the original cloak can be restored');
expandedShops.run('money=0'); expandedShops.key('Digit2');
assert.equal(expandedShops.run('townCloakStyle===2 && money===0'), true, 'owned clothes can be worn again for free');
const ownedCloakReload = createGame(expandedShops.storageData);
assert.equal(ownedCloakReload.run('townCloakStyle===2 && townCloakOwned[1]'), true, 'selected cloak persists');
const oldCloakSave = createGame({'steam-city-progress-v1': JSON.stringify({townCloak:true,townPrizeCount:3})});
assert.equal(oldCloakSave.run('townCloakOwned[0] && townCloakStyle===1 && townPrizes[0]===3'), true, 'old outfit and prize saves migrate');
expandedShops.key('Escape'); expandedShops.run('player.x=215;player.y=443;player.vx=0;player.grounded=true;money=100;health=1;steam=0'); expandedShops.key('KeyE'); expandedShops.run('update();draw()');
assert.equal(expandedShops.run('townMenu'), 'general');
expandedShops.key('Digit2'); assert.equal(expandedShops.run('health===3 && money===86'), true, 'large repair pack restores two health');
expandedShops.key('Digit4'); assert.equal(expandedShops.run('steam===1 && money===81'), true, 'steam canister restores one steam');
expandedShops.key('Digit5'); assert.equal(expandedShops.run('steam===3 && money===69'), true, 'large steam canister fills steam');
expandedShops.key('Digit5'); assert.equal(expandedShops.run('money'), 69, 'full steam cannot be charged again');
expandedShops.key('Escape'); expandedShops.run('player.x=715;player.y=443;player.vx=0;player.grounded=true'); expandedShops.key('KeyE'); expandedShops.run('update();ambientTime=60;draw()');
assert.equal(expandedShops.run('townMenu'), 'claw');
expandedShops.key('Digit5'); assert.equal(expandedShops.run('townPrizes[4]===1 && townPrizeCount===1 && money===64'), true, 'fifth doll can be won independently');
expandedShops.clickCanvas(480,340);
assert.equal(expandedShops.run('townPrizes[2]===1 && townPrizeCount===2 && money===59'), true, 'scaled mouse click selects another doll');
const expandedReload = createGame(expandedShops.storageData);
assert.equal(expandedReload.run('townPrizes[2]===1 && townPrizes[4]===1 && townCloakStyle===2'), true, 'different prizes and chosen clothes persist');

// The forest contains ten connected areas, five fruit types, a key card, and a dedicated boss.
const forestRun = createGame();
forestRun.run('won=true;endingTime=660'); forestRun.key('KeyE');
forestRun.run('familyStage=8;changeRoom(10);player.x=forestGate.x+5;player.y=353;player.grounded=true;invulnerability=99999');
forestRun.key('KeyE'); forestRun.run('update();draw()');
assert.equal(forestRun.run('room===12 && branchEnemies.filter(e=>e.health>0).length===3'), true, 'the town gate leads to the first forest area with enemies');
assert.equal(forestRun.run('forestNames.length===10 && new Set(forestNames).size===10 && forestFruit.length===5'), true, 'forest contains 10 named areas and 5 types of fruit');
const observedFruit = new Set();
for (let expected=12; expected<=21; expected++) {
  assert.equal(forestRun.run('room'), expected, `forest area ${expected-11} is reachable`);
  for (const type of forestRun.run('branchEnemies.map(e=>e.fruitType)')) observedFruit.add(type);
  forestRun.run('draw();mapOpen=true;draw();mapOpen=false');
  forestRun.key('KeyD');
  let jumping = false;
  for (let frame=0; frame<650 && forestRun.run('player.x')<870; frame++) {
    if (jumping && forestRun.run('player.grounded')) { forestRun.keyup('Space'); jumping = false; }
    const nearGap = forestRun.run(`(() => {
      if (!player.grounded || player.y + player.h !== 485) return false;
      const floors = roomPlatforms[room].filter(p => p.y === 485);
      const floor = floors.find(p => player.x + player.w / 2 >= p.x && player.x + player.w / 2 < p.x + p.w);
      return !!floor && floor.x + floor.w < 960 && player.x + player.w >= floor.x + floor.w - 12;
    })()`);
    if (!jumping && nearGap) { forestRun.key('Space'); jumping = true; }
    forestRun.run('update()');
  }
  if (jumping) forestRun.keyup('Space');
  forestRun.keyup('KeyD');
  assert.ok(forestRun.run('player.x')>=870, `area ${expected-11} can be crossed with normal movement`);
  if (expected < 21) { forestRun.key('KeyE'); forestRun.run('update()'); }
}
assert.equal(observedFruit.size, 5, 'all five fruit enemy types appear on the route');
forestRun.key('KeyE'); forestRun.run('update()');
assert.equal(forestRun.run('room===21 && !forestBossKey && logMessage.includes("房卡")'), true, 'boss door stays locked without the key card');
forestRun.run('changeRoom(18);player.x=160;player.y=443;player.vx=0;player.vy=0;player.grounded=true;invulnerability=99999');
forestRun.key('KeyD'); forestRun.key('Space');
for(let i=0;i<50 && !forestRun.run('forestBossKey');i++) forestRun.run('update()');
forestRun.keyup('KeyD'); forestRun.keyup('Space');
assert.equal(forestRun.run('forestBossKey'), true, 'the key card is reachable by jumping onto the platform');
assert.equal(createGame(forestRun.storageData).run('forestBossKey'), true, 'the key card persists');
forestRun.run('changeRoom(21);player.x=900;player.y=443;player.grounded=true;invulnerability=99999'); forestRun.key('KeyE'); forestRun.run('update();draw()');
assert.equal(forestRun.run('room===27 && bossActive && boss.health===boss.maxHealth'), true, 'the card opens the dedicated boss room');
forestRun.run('mapOpen=true;draw();mapOpen=false;player.x=0;player.y=443'); forestRun.key('KeyE'); forestRun.run('update()');
assert.equal(forestRun.run('room===27 && logMessage.includes("擊敗")'), true, 'the boss arena is locked during combat');
forestRun.run('boss.health=1;boss.state="recover";boss.timer=80;boss.x=650;player.x=600;player.y=443;player.facing=1;attackCooldown=0;invulnerability=99999'); forestRun.attack(); forestRun.run('update()');
assert.equal(forestRun.run('forestBossDefeated && !bossActive'), true, 'the forest boss can be defeated');
assert.equal(createGame(forestRun.storageData).run('forestBossDefeated && forestBossKey'), true, 'forest boss victory and key survive reload');
forestRun.run('player.x=0;player.y=443;player.vx=0'); forestRun.key('KeyE'); forestRun.run('update()');
assert.equal(forestRun.run('room'), 21, 'the exit opens after boss victory');
const forestStation = createGame();
forestStation.run('postFall=true;familyStage=8;townCheckpoint.activated=true;changeRoom(19);player.x=forestCheckpoint.x;player.y=443;player.vx=0;health=2;invulnerability=99999;update()');
assert.equal(forestStation.run('forestCheckpoint.activated && activeCheckpoint==="forest" && health===3'), true, 'forest rest station activates and heals');
forestStation.key('KeyG'); forestStation.key('Digit4'); forestStation.run('for(let i=0;i<RESPAWN_DURATION;i++)update()');
assert.equal(forestStation.run('room'), 10, 'forest station travels to town');
forestStation.key('KeyG'); forestStation.key('Digit5');
assert.equal(forestStation.run('room===19 && activeCheckpoint==="forest"'), true, 'option 5 returns to the forest station');
assert.equal(createGame(forestStation.storageData).run('room===19 && forestCheckpoint.activated'), true, 'forest station is a persistent respawn point');

// Each forest area has its own terrain, with working gaps, a moving bridge and steam vents.
assert.equal(forestRun.run('new Set(forestLayouts.map(layout=>JSON.stringify(layout))).size'), 10, 'all ten forest areas have distinct collision layouts');
const bridgeCheck = createGame();
bridgeCheck.run('postFall=true;familyStage=8;changeRoom(17);player.x=410;player.y=378;player.grounded=true;player.vx=0;invulnerability=99999');
const bridgeBefore = bridgeCheck.run('roomPlatforms[17].find(p=>p.forestMoving).x');
bridgeCheck.run('update()');
assert.ok(bridgeCheck.run('roomPlatforms[17].find(p=>p.forestMoving).x') > bridgeBefore, 'the vine bridge moves');
assert.ok(bridgeCheck.run('player.x') > 410, 'the moving bridge carries a standing player');
bridgeCheck.run('changeRoom(14);player.x=forestHazards[14].x;player.y=443;player.vx=0;player.grounded=true;health=3;invulnerability=0;vent.cycle=125;update()');
assert.equal(bridgeCheck.run('health'), 2, 'an active forest vent damages the player');
// Return through every forest gap with only the basic jump available.
forestRun.run('invulnerability=99999');
for (let expected=21; expected>=12; expected--) {
  assert.equal(forestRun.run('room'), expected, 'return route stays in the expected area');
  forestRun.key('KeyA'); let jumping = false;
  for (let frame=0; frame<650 && forestRun.run('player.x')>50; frame++) {
    if (jumping && forestRun.run('player.grounded')) { forestRun.keyup('Space'); jumping=false; }
    const nearGap = forestRun.run(`(() => {
      if (!player.grounded || player.y + player.h !== 485) return false;
      const floors = roomPlatforms[room].filter(p => p.y === 485);
      const floor = floors.find(p => player.x + player.w / 2 >= p.x && player.x + player.w / 2 < p.x + p.w);
      return !!floor && floor.x > 0 && player.x <= floor.x + 12;
    })()`);
    if (!jumping && nearGap) { forestRun.key('Space'); jumping=true; }
    forestRun.run('update()');
  }
  if (jumping) forestRun.keyup('Space'); forestRun.keyup('KeyA');
  assert.ok(forestRun.run('player.x')<=50, `area ${expected-11} can be crossed backwards with basic jumps`);
  forestRun.key('KeyE'); forestRun.run('update()');
}
assert.equal(forestRun.run('room'), 10, 'returning through the forest leads back to Clocktower Town');

// The forest boss has three telegraphed attacks and a distinct music loop.
const fruitBoss = createGame();
fruitBoss.run('postFall=true;familyStage=8;changeRoom(27);bossIntroTimer=0;player.x=300;player.y=443;player.grounded=true;invulnerability=99999');
assert.equal(fruitBoss.run('boss.nextAttack'), 'seedRain');
fruitBoss.run('boss.state="idle";boss.timer=1;update();draw()');
assert.equal(fruitBoss.run('boss.state==="warning" && boss.nextAttack==="seedRain"'), true);
assert.ok(fruitBoss.labels.includes('果核雨！'), 'seed rain has a visible warning');
fruitBoss.run('boss.timer=1;update()');
assert.equal(fruitBoss.run('forestBossSeeds.length===3 && boss.nextAttack==="vineWave"'), true, 'seed rain spawns three seeds');
fruitBoss.run('forestBossSeeds.length=0;boss.state="idle";boss.timer=1;update();draw()');
assert.ok(fruitBoss.labels.includes('藤蔓橫掃！'), 'vine wave has a visible warning');
fruitBoss.run('boss.timer=1;update()');
assert.equal(fruitBoss.run('forestBossWave.active && boss.nextAttack==="fruitBurst"'), true, 'vine wave launches across the floor');
fruitBoss.run('player.x=300;player.y=400;health=3;invulnerability=0;forestBossWave.x=300;forestBossWave.vx=0;update()');
assert.equal(fruitBoss.run('health'), 3, 'jumping above the low vine avoids damage');
fruitBoss.run('player.x=300;player.y=443;player.vy=0;player.grounded=true;forestBossWave.x=300;update()');
assert.equal(fruitBoss.run('health'), 2, 'the vine damages a grounded player');
fruitBoss.run('forestBossWave.active=false;boss.state="idle";boss.timer=1;invulnerability=99999;player.x=800;player.y=443;update();draw()');
assert.ok(fruitBoss.labels.includes('果實散彈！'), 'fruit burst has a visible warning');
fruitBoss.run('boss.timer=1;update()');
assert.equal(fruitBoss.run('forestBossSeeds.length===3 && forestBossSeeds.every(seed=>seed.vx>=0) && boss.nextAttack==="seedRain"'), true, 'burst fires toward a player on the right');
fruitBoss.run('boss.health=1;boss.state="recover";boss.timer=80;boss.x=650;player.x=600;player.y=443;player.facing=1;attackCooldown=0;invulnerability=99999'); fruitBoss.attack(); fruitBoss.run('update()');
assert.equal(fruitBoss.run('!bossActive && forestBossSeeds.length===0 && !forestBossWave.active'), true, 'victory clears active hazards');
fruitBoss.run('changeRoom(27)');
assert.equal(fruitBoss.run('forestBossSeeds.length===0 && !forestBossWave.active && boss.nextAttack==="seedRain"'), true, 're-entry resets the boss attacks');

// Verify synthesized notes, phase-two tempo, pause behavior and the existing mute setting.
const bossAudio = createGame();
bossAudio.run(`globalThis.audioNotes=[]; window.AudioContext=function(){ this.state='running'; this.currentTime=0; this.destination={}; this.createOscillator=()=>({frequency:{setValueAtTime:(v)=>audioNotes.push(v),exponentialRampToValueAtTime:()=>{}},connect:()=>{},start:()=>{},stop:()=>{}}); this.createGain=()=>({gain:{setValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}},connect:()=>{}}); }; changeRoom(27); bossIntroTimer=0; boss.state='idle'; boss.timer=999; boss.musicTick=0; audioNotes.length=0; update()`);
assert.ok(bossAudio.run('audioNotes.includes(forestBossMusic.melody[0]) && audioNotes.includes(forestBossMusic.bass[0])'), 'the boss plays its own melody and bass');
bossAudio.run('audioNotes.length=0;boss.phase=2;boss.musicTick=9;update()');
assert.ok(bossAudio.run('audioNotes.includes(forestBossMusic.melody[1])'), 'phase two advances the melody faster');
bossAudio.run('audioNotes.length=0;muted=true;boss.musicTick=0;update()');
assert.equal(bossAudio.run('audioNotes.length'), 0, 'mute silences the boss music');
bossAudio.run('muted=false;mapOpen=true;boss.musicTick=0;update()');
assert.equal(bossAudio.run('boss.musicTick'), 0, 'opening the map pauses the music sequence');

// The boss seed must be planted at the first forest area before the next area opens.
const seedQuest = createGame();
seedQuest.run('postFall=true;familyStage=8;changeRoom(12);branchEnemies.forEach(e=>e.health=0);player.x=500;player.y=443;player.vx=0;player.grounded=true');
seedQuest.key('KeyE'); seedQuest.run('update()');
assert.equal(seedQuest.run('!forestSeedPlanted && logMessage.includes("先擊敗")'), true, 'planting requires the boss seed');
seedQuest.run('player.x=seedGate.x+5;player.y=298;player.vx=0;player.grounded=true'); seedQuest.key('KeyE'); seedQuest.run('update()');
assert.equal(seedQuest.run('room===12 && !forestSeedPlanted'), true, 'the next area is locked until planting');
seedQuest.run('changeRoom(27);bossIntroTimer=0;boss.health=1;boss.state="recover";boss.timer=80;boss.x=650;player.x=600;player.y=443;player.facing=1;attackCooldown=0;invulnerability=99999'); seedQuest.attack(); seedQuest.run('update()');
assert.equal(seedQuest.run('forestSeedOwned && forestBossDefeated'), true, 'defeating the boss awards the seed');
const seedReload = createGame(seedQuest.storageData);
assert.equal(seedReload.run('forestSeedOwned && !forestSeedPlanted'), true, 'unplanted seed survives reload');
seedQuest.run('changeRoom(12);branchEnemies.forEach(e=>e.health=0);player.x=500;player.y=443;player.vx=0;player.grounded=true;invulnerability=99999');
seedQuest.key('KeyE'); seedQuest.run('update();draw()');
assert.equal(seedQuest.run('forestSeedPlanted && !forestSeedOwned'), true, 'planting consumes the seed and opens the tree gate');
assert.ok(seedQuest.labels.includes('E 前往新區域'));
assert.equal(seedQuest.run('farewellStage===1 && farewellActive()'), true, 'planting starts the farewell');
assert.ok(seedQuest.labels.some(label => label.includes('你真的要走了嗎')));
seedQuest.key('KeyE'); seedQuest.run('draw()');
assert.ok(seedQuest.labels.some(label => label.includes('你回鎮上吧')), 'the protagonist asks the child to return to town');
const farewellReload = createGame(seedQuest.storageData);
assert.equal(farewellReload.run('room===12 && farewellStage===2 && farewellActive()'), true, 'an unfinished farewell resumes at the seed tree');
seedQuest.key('KeyE'); seedQuest.key('KeyE'); seedQuest.run('draw()');
assert.ok(seedQuest.labels.some(label => label.includes('照顧好自己')), 'the protagonist shows concern while saying goodbye');
seedQuest.key('KeyE');
assert.equal(seedQuest.run('farewellStage===5 && !farewellActive()'), true, 'the farewell ends before the new area opens');
seedQuest.key('KeyA'); for(let i=0;i<140 && seedQuest.run('player.x')>225;i++) seedQuest.run('update()'); seedQuest.keyup('KeyA');
seedQuest.run('player.vx=0;player.grounded=true'); seedQuest.key('Space'); for(let i=0;i<65;i++) seedQuest.run('update()'); seedQuest.keyup('Space');
assert.equal(seedQuest.run('player.grounded && player.y===363'), true, 'the first ledge is reachable with a basic jump');
seedQuest.key('KeyD'); for(let i=0;i<60 && seedQuest.run('player.x')<275;i++) seedQuest.run('update()'); seedQuest.key('Space');
for(let i=0;i<70 && !(seedQuest.run('player.grounded && player.y===298'));i++) seedQuest.run('update()');
seedQuest.keyup('KeyD'); seedQuest.keyup('Space');
assert.equal(seedQuest.run('player.grounded && player.y===298'), true, 'the tree gate platform is reachable without restored abilities');
seedQuest.key('KeyD'); for(let i=0;i<40 && seedQuest.run('player.x')<450;i++) seedQuest.run('update()'); seedQuest.keyup('KeyD');
seedQuest.run('player.vx=0'); seedQuest.key('KeyE'); seedQuest.run('update();draw();mapOpen=true;draw();mapOpen=false');
assert.equal(seedQuest.run('room===28 && visitedRooms[28]'), true, 'the grown gate leads to the next area');
assert.ok(seedQuest.labels.includes('樹根之路 · 新旅程的入口'));
seedQuest.run('player.x=0;player.y=443;player.vx=0;player.grounded=true'); seedQuest.key('KeyE'); seedQuest.run('update()');
assert.equal(seedQuest.run('room===12 && forestSeedPlanted'), true, 'the new area connects back to the forest');
const plantedReload = createGame(seedQuest.storageData);
assert.equal(plantedReload.run('forestSeedPlanted && !forestSeedOwned && visitedRooms[28]'), true, 'planted gate and new area discovery persist');
const legacySeed = createGame({'steam-city-progress-v1': JSON.stringify({forestBossDefeated:true})});
assert.equal(legacySeed.run('forestSeedOwned && !forestSeedPlanted'), true, 'previous boss victories receive the seed');

const oldPlantedSave = createGame({'steam-city-progress-v1': JSON.stringify({postFall:true, familyStage:8, forestSeedPlanted:true, forestCheckpoint:true, activeCheckpoint:'forest'})});
assert.equal(oldPlantedSave.run('room===12 && farewellStage===1 && farewellActive()'), true, 'older planted saves receive the new farewell');

// Important Gear 1 and the seed are awarded together and restore only the dash.
const gearQuest = createGame();
gearQuest.run('postFall=true;familyStage=8;changeRoom(27);toolAmmo=0;bossIntroTimer=0;player.x=600;player.y=443;player.grounded=true;player.facing=1;boss.x=650;boss.health=1;boss.state="recover";boss.timer=80;attackCooldown=0;invulnerability=99999');
gearQuest.key('ShiftLeft'); gearQuest.run('update()');
assert.equal(gearQuest.run('dashTimer===0 && !importantGear1'), true, 'dash remains damaged before obtaining the gear');
gearQuest.attack(); gearQuest.run('update()');
assert.equal(gearQuest.run('forestBossDefeated && importantGear1 && forestSeedOwned'), true, 'boss victory awards both key gear and seed');
assert.ok(gearQuest.run('logMessage').includes('重要齒輪 1'), 'the victory message names the reward');
gearQuest.key('ShiftLeft'); gearQuest.run('update()');
assert.ok(gearQuest.run('dashTimer>0 && player.vx>0'), 'the key gear restores the normal dash');
gearQuest.run('dashTimer=0;player.x=0;player.y=250;player.vy=1;player.grounded=false;coyoteTime=0;wallJumpLock=0'); gearQuest.key('Space'); gearQuest.run('update()');
assert.equal(gearQuest.run('player.vy>0 && wallJumpLock===0 && !doubleJumpUnlocked'), true, 'other damaged movement abilities remain unavailable');
gearQuest.key('KeyF'); gearQuest.run('update()');
assert.equal(gearQuest.run('!toolProjectile.active && toolAmmo===0'), true, 'the key gear does not restore damaged tools');
const gearReload = createGame(gearQuest.storageData);
assert.equal(gearReload.run('importantGear1 && forestSeedOwned'), true, 'gear and seed survive reload');
gearReload.key('ShiftLeft'); gearReload.run('update()');
assert.ok(gearReload.run('dashTimer>0'), 'dash remains available after reload');
gearReload.run('gameOver=true;resetGame();respawnTimer=0'); gearReload.key('ShiftLeft'); gearReload.run('update()');
assert.ok(gearReload.run('importantGear1 && dashTimer>0'), 'death does not remove the key gear');
gearReload.buttons['#restart-button']._click();
assert.equal(gearReload.run('!importantGear1 && !forestBossDefeated'), true, 'a new game clears the key gear');
const legacyGear = createGame({'steam-city-progress-v1': JSON.stringify({postFall:true,forestBossDefeated:true})});
assert.equal(legacyGear.run('importantGear1 && forestSeedOwned'), true, 'old forest boss victories receive both rewards');

// After visiting the next area, returning to town triggers an excited reunion.
const reunion = createGame();
reunion.run('postFall=true;familyStage=8;forestSeedPlanted=true;farewellStage=5;visitedRooms[28]=true;changeRoom(12);player.x=exitDoor.x;player.y=443;player.vx=0;player.grounded=true;invulnerability=99999');
reunion.key('KeyE'); reunion.run('update();draw()');
assert.equal(reunion.run('room===10 && reunionStage===1 && reunionActive()'), true, 'returning to town begins the reunion');
assert.ok(reunion.labels.some(label => label.includes('你回來了')));
const reunionX = reunion.run('player.x'); reunion.key('KeyD'); reunion.run('update()');
assert.equal(reunion.run('player.x'), reunionX, 'the reunion dialogue pauses movement');
reunion.key('KeyE'); reunion.run('draw()');
assert.ok(reunion.labels.some(label => label.includes('小心跌倒')), 'the protagonist shows quiet concern');
const reunionReload = createGame(reunion.storageData);
assert.equal(reunionReload.run('room===10 && reunionStage===2 && reunionActive()'), true, 'unfinished reunion resumes in town after reload');
for (let i=0; i<3; i++) reunion.key('KeyE');
assert.equal(reunion.run('reunionStage===5 && !reunionActive()'), true, 'the reunion finishes and restores control');
reunion.key('KeyA'); reunion.run('update()');
assert.notEqual(reunion.run('player.x'), reunionX, 'movement works after the reunion');
reunion.run('changeRoom(9);changeRoom(10)');
assert.equal(reunion.run('reunionStage===5 && !reunionActive()'), true, 'the reunion does not replay on later town visits');
const noEarlyReunion = createGame();
noEarlyReunion.run('postFall=true;familyStage=8;changeRoom(10)');
assert.equal(noEarlyReunion.run('reunionStage'), 0, 'the reunion does not trigger before reaching the next area');

// Region 3 is a connected set of plains and hunter paths, with a dash-gated canyon.
const wildRoute = createGame();
wildRoute.run('postFall=true;familyStage=8;importantGear1=true;forestSeedPlanted=true;farewellStage=5;changeRoom(28);invulnerability=99999');
assert.equal(wildRoute.run('wildZones.length'),6);
for (let expected=28;expected<=32;expected++) {
  assert.equal(wildRoute.run('room'),expected);
  assert.equal(wildRoute.run('wildEnemies.every(foe=>foe.irradiated)'),true,'all region 3 enemies are irradiated');
  wildRoute.run('draw();mapOpen=true;draw();mapOpen=false;wildEnemies.forEach(foe=>foe.health=0)');
  wildRoute.key('KeyD'); let flight=0;
  for(let tick=0;tick<650 && wildRoute.run('player.x')<880;tick++) {
    if(flight && wildRoute.run('player.grounded')){wildRoute.keyup('Space');flight=0;}
    const nearGap=wildRoute.run(`(() => {
      if(!player.grounded || player.y+player.h!==485)return false;
      const floor=roomPlatforms[room].find(p=>p.y===485 && player.x+player.w>p.x && player.x<p.x+p.w);
      return !!floor && floor.x+floor.w<960 && player.x>=floor.x+floor.w-22;
    })()`);
    if(!flight && nearGap){wildRoute.key('Space');flight=1;}
    if(flight){if(expected===30 && flight===7)wildRoute.key('ShiftLeft');flight++;}
    wildRoute.run('update()');
  }
  wildRoute.keyup('KeyD');wildRoute.keyup('Space');wildRoute.keyup('ShiftLeft');
  assert.ok(wildRoute.run('player.x')>=880,`region 3 room ${expected} is traversable`);
  wildRoute.key('KeyE');wildRoute.run('update()');
}
assert.equal(wildRoute.run('room===33 && gauntletWave===1'),true,'the hunter path leads to the gauntlet');

// The optional down-slash course can be completed with three timed sword bounces.
const pogoCourse=createGame();pogoCourse.run('postFall=true;importantGear1=true;familyStage=8;changeRoom(34);invulnerability=99999');
pogoCourse.key('KeyD');for(let i=0;i<40 && pogoCourse.run('player.x')<125;i++)pogoCourse.run('update()');
pogoCourse.key('Space');pogoCourse.key('KeyS');let pogoBounces=0;
for(let tick=0;tick<250 && !pogoCourse.run('wildPogoFinished');tick++) {
  if(pogoCourse.run('attackCooldown===0 && wildPogoTargets.some(t=>player.y+player.h<=t.y+t.h && overlaps({x:player.x+2,y:player.y+player.h,w:26,h:48},t))')){pogoCourse.attack();pogoBounces++;}
  pogoCourse.run('update()');
}
assert.equal(pogoCourse.run('wildPogoFinished && wildPogoRewardClaimed && money===15'),true,'the down-slash course awards its first completion');
assert.equal(pogoBounces,3,'the course uses all three down-slash targets');
pogoCourse.run('update();update()');assert.equal(pogoCourse.run('money'),15,'standing at the goal does not duplicate the reward');
assert.equal(createGame(pogoCourse.storageData).run('wildPogoRewardClaimed'),true,'the course reward persists');
pogoCourse.key('KeyT');assert.equal(pogoCourse.run('player.x===70 && !wildPogoFinished'),true,'T retries the course');
pogoCourse.run('player.x=400;player.y=650;update()');assert.equal(pogoCourse.run('player.x===70 && health===3'),true,'a missed jump restarts without life loss');

// The gauntlet locks its exit and sends one, two, then three infected hunters.
const gauntlet=createGame();gauntlet.run('postFall=true;importantGear1=true;familyStage=8;changeRoom(33);invulnerability=99999');
gauntlet.run('player.x=0;player.y=443;player.vx=0');gauntlet.key('KeyE');gauntlet.run('update()');
assert.equal(gauntlet.run('room'),33,'the active gauntlet exit is locked');
for(let wave=1;wave<=3;wave++) {
  gauntlet.run('for(let i=0;i<95 && gauntletWait>0;i++)update()');
  assert.equal(gauntlet.run('wildEnemies.filter(foe=>foe.health>0).length'),wave,`wave ${wave} has the expected enemy count`);
  for(let foeIndex=0;foeIndex<wave;foeIndex++) {
    gauntlet.run(`{wildEnemies.forEach(e=>{e.state='recover';e.timer=999;e.shot.active=false});const testFoe=wildEnemies[${foeIndex}];testFoe.health=1;player.x=testFoe.x-45;player.y=testFoe.y;player.vx=0;player.vy=0;player.facing=1;attackCooldown=0;keys.clear()}`);
    gauntlet.attack();gauntlet.run('update()');
    assert.equal(gauntlet.run(`wildEnemies[${foeIndex}].health`),0,'the sword can defeat each hunter');
  }
  gauntlet.run('update()');
}
assert.equal(gauntlet.run('wildGauntletCleared'),true,'all three waves clear the gauntlet');
const gauntletBalance=gauntlet.run('money');gauntlet.run('changeRoom(32);changeRoom(33);update()');
assert.equal(gauntlet.run('money'),gauntletBalance,'re-entry does not duplicate the clear reward');
assert.equal(createGame(gauntlet.storageData).run('wildGauntletCleared'),true,'gauntlet completion persists');
gauntlet.run('player.x=0;player.y=443;player.vx=0');gauntlet.key('KeyE');gauntlet.run('update()');
assert.equal(gauntlet.run('room'),32,'the exit opens after all waves');

// Hunters telegraph their ranged attack, and the camp joins the existing travel network.
const wildCombat=createGame();wildCombat.run('postFall=true;familyStage=8;importantGear1=true;changeRoom(28);wildEnemies[0].health=0;wildEnemies[1].cooldown=0;wildEnemies[1].x=680;player.x=550;player.y=443;player.vx=0;player.grounded=true;invulnerability=99999;update()');
assert.equal(wildCombat.run('wildEnemies[1].state'),'warning','the infected archer telegraphs its shot');
wildCombat.run('for(let i=0;i<55;i++)update()');assert.equal(wildCombat.run('wildEnemies[1].shot.active'),true,'the archer fires after warning');
wildCombat.run('changeRoom(32);player.x=wildCheckpoint.x;player.y=443;player.vx=0;player.grounded=true;health=1;update()');
assert.equal(wildCombat.run('health===3 && wildCheckpoint.activated && activeCheckpoint==="wild" && wildEnemies.length===0'),true,'camp is a safe rest station');
assert.equal(createGame(wildCombat.storageData).run('room===32 && wildCheckpoint.activated && importantGear1'),true,'camp is a saved respawn point');
wildCombat.run('townCheckpoint.activated=true');wildCombat.key('KeyG');wildCombat.key('Digit4');wildCombat.run('for(let i=0;i<RESPAWN_DURATION;i++)update()');
wildCombat.key('KeyG');wildCombat.key('Digit6');
assert.equal(wildCombat.run('room===32 && activeCheckpoint==="wild"'),true,'option six returns to the hunter camp');

// The canyon can also be crossed on the return journey with the repaired dash.
const returnCanyon=createGame();returnCanyon.run('postFall=true;importantGear1=true;familyStage=8;changeRoom(30);wildEnemies.forEach(foe=>foe.health=0);player.x=820;player.y=443;player.grounded=true;invulnerability=99999');
returnCanyon.key('KeyA');let returnFlight=0;
for(let tick=0;tick<500 && returnCanyon.run('player.x')>50;tick++){
  if(returnFlight && returnCanyon.run('player.grounded')){returnCanyon.keyup('Space');returnFlight=0;}
  if(!returnFlight && returnCanyon.run('player.grounded && player.x<=563 && player.x>350')){returnCanyon.key('Space');returnFlight=1;}
  if(returnFlight){if(returnFlight===7)returnCanyon.key('ShiftLeft');returnFlight++;}
  returnCanyon.run('update()');
}
returnCanyon.keyup('KeyA');returnCanyon.keyup('Space');
assert.ok(returnCanyon.run('player.x')<=50,'the dash canyon has a traversable return route');

// The shared tool projectile can damage irradiated enemies independently of sword combat.
const wildTool=createGame();wildTool.run('changeRoom(28);wildEnemies[0].state="recover";wildEnemies[0].timer=999;wildEnemies[0].x=350;wildEnemies[1].health=0;player.x=275;player.y=443;player.facing=1;player.vx=0;toolAmmo=4;invulnerability=99999');
wildTool.key('KeyF');wildTool.run('for(let i=0;i<12;i++)update()');
assert.equal(wildTool.run('wildEnemies[0].health'),1,'a tool hit damages a region 3 enemy');

// Altar 1 is reachable by a normal jump and grants its permanent reward once.
const altar=createGame();
altar.run('postFall=true;familyStage=8;changeRoom(29);wildEnemies.forEach(e=>e.health=0);player.x=210;player.y=443;player.grounded=true;invulnerability=99999');
altar.key('Space');altar.run('for(let i=0;i<65;i++)update()');altar.keyup('Space');
assert.equal(altar.run('player.grounded && player.y===363'),true,'a basic jump reaches altar 1');
altar.key('KeyE');altar.run('update();draw()');
assert.equal(altar.run('altar1Claimed && health===4 && playerMaxHealth()===4'),true,'the altar grants one maximum life and heals');
altar.key('KeyE');altar.run('update()');
assert.equal(altar.run('playerMaxHealth()'),4,'repeated interaction cannot stack the reward');
altar.run('changeRoom(32);player.x=wildCheckpoint.x;player.y=443;player.grounded=true;health=1;update()');
assert.equal(altar.run('health'),4,'rest stations restore the new health maximum');
const altarReload=createGame(altar.storageData);
assert.equal(altarReload.run('altar1Claimed && health===4'),true,'the altar reward survives reload');
altar.run('health=3;steam=3');altar.key('KeyQ');altar.run('for(let i=0;i<HEAL_DURATION;i++)update()');
assert.equal(altar.run('health===4 && steam===0'),true,'steam repair heals the fourth life');
altarReload.buttons['#restart-button']._click();
assert.equal(altarReload.run('!altar1Claimed && health===3'),true,'a new game clears the altar reward');

// The iron-chain spear follows facing, pierces, and damages each target only once.
const spear=createGame();
spear.run('postFall=true;familyStage=8;changeRoom(28);wildEnemies.forEach(e=>e.health=0);steam=3');
spear.key('KeyV');spear.run('update()');
assert.equal(spear.run('!ironSpear.active && steam===3'),true,'the spear is locked before the altar');
spear.run('altar1Claimed=true;player.x=260;player.y=443;player.grounded=true;player.facing=1;invulnerability=99999;wildEnemies.forEach((e,i)=>{e.x=350+i*100;e.y=445;e.health=5;e.state="recover";e.timer=999;e.shot.active=false})');
spear.key('KeyV');spear.run('update()');
assert.equal(spear.run('ironSpear.active && ironSpear.vx===14 && steam===1'),true,'right-facing cast costs two steam');
spear.run('for(let i=0;i<35;i++)update();draw()');
assert.equal(spear.run('wildEnemies.every(e=>e.health===2)'),true,'a single cast pierces enemies for three damage without repeat hits');
spear.run('resetIronSpear();player.facing=-1;steam=3');spear.key('KeyV');spear.run('update()');
assert.equal(spear.run('ironSpear.active && ironSpear.vx===-14 && ironSpear.x<player.x'),true,'left-facing cast travels left');
const spearX=spear.run('ironSpear.x');spear.key('Tab');spear.run('update()');
assert.equal(spear.run('ironSpear.x'),spearX,'the map pauses the projectile');spear.key('Tab');
spear.run('changeRoom(29)');assert.equal(spear.run('ironSpear.active'),false,'changing rooms clears the chain spear');
spear.run('steam=1');spear.key('KeyV');spear.run('update()');
assert.equal(spear.run('!ironSpear.active && steam===1'),true,'insufficient steam cannot cast');
spear.run('changeRoom(34);steam=3');spear.key('KeyV');spear.run('update()');spear.key('KeyT');
assert.equal(spear.run('ironSpear.active'),false,'retrying the pogo course clears the projectile');

// The former coworker has a dedicated arena, dialogue, telegraphs and a persistent victory.
const coworker=createGame();
coworker.run('postFall=true;familyStage=8;importantGear1=true;wildGauntletCleared=true;changeRoom(33);player.x=door.x;player.y=443;player.grounded=true');
coworker.key('KeyE');coworker.run('update();draw()');
assert.equal(coworker.run('room===35 && duelIntroActive() && duelist.irradiated'),true,'the cleared gauntlet leads to the infected coworker arena');
const introX=coworker.run('player.x');coworker.key('KeyD');coworker.run('update()');
assert.equal(coworker.run('player.x'),introX,'the reunion dialogue pauses movement');
for(let i=0;i<4;i++)coworker.key('KeyE');
assert.equal(coworker.run('duelistActive()'),true,'the fight starts after the reunion dialogue');
coworker.run('invulnerability=99999;player.x=0;player.y=443;player.vx=0');coworker.key('KeyE');coworker.run('update()');
assert.equal(coworker.run('room'),35,'the arena exit stays locked during the fight');
coworker.run('duelist.timer=1;update()');assert.equal(coworker.run('duelist.state'),'warning','the thrust has a visible warning');
coworker.run('for(let i=0;i<48;i++)update()');assert.equal(coworker.run('duelist.state'),'thrust');
const thrustX=coworker.run('duelist.x');coworker.run('update()');assert.ok(coworker.run('duelist.x')<thrustX,'the thrust moves toward the player');
coworker.run('duelist.state="warning";duelist.move="leap";duelist.timer=1;update();update()');
assert.ok(coworker.run('duelist.y')<431,'the aerial attack leaves the ground');
coworker.run('for(let i=0;i<50;i++)update()');assert.equal(coworker.run('duelist.y'),431,'the aerial attack lands');
coworker.run('duelist.x=650;duelist.state="guard";duelist.timer=999;player.x=600;player.y=443;player.facing=1;player.vx=0;player.grounded=true;attackCooldown=0');
coworker.attack();coworker.run('update()');
assert.equal(coworker.run('duelist.health===12 && duelist.state==="counterTell"'),true,'a guarded melee hit triggers a counter instead of damage');
coworker.run('duelist.state="guard";duelist.timer=999;altar1Claimed=true;steam=3');coworker.key('KeyV');coworker.run('for(let i=0;i<4;i++)update()');
assert.equal(coworker.run('duelist.health===9 && duelist.state==="recover" && steam===1'),true,'the iron spear breaks guard and deals three damage');
coworker.run('resetIronSpear();duelist.health=1;duelist.x=650;duelist.y=431;duelist.state="recover";duelist.timer=999;player.x=600;player.y=443;player.facing=1;player.vx=0;attackCooldown=0');
coworker.attack();coworker.run('update();draw()');
assert.equal(coworker.run('duelistDefeated && !duelistActive() && duelist.health===0 && dockFallPending'),true,'winning stops the coworker and schedules the collapse');
assert.equal(createGame(coworker.storageData).run('duelistDefeated'),true,'the boss victory persists');
coworker.run('player.x=0;player.y=443;player.vx=0');coworker.key('KeyE');coworker.run('update()');
assert.equal(coworker.run('room===35 && dockFallTick===1'),true,'victory starts the collapse instead of allowing an early exit');
const collapseMoney=coworker.run('money');
coworker.key('Escape');coworker.run('update()');assert.equal(coworker.run('dockFallTick'),1,'the collapse can be paused');coworker.key('Escape');
coworker.key('KeyV');coworker.attack();coworker.key('KeyD');coworker.run('for(let i=0;i<90;i++)update();draw()');
assert.equal(coworker.run('!ironSpear.active && !attackQueued && player.x===0'),true,'combat and movement are locked during the fall');
const interruptedFall=createGame(coworker.storageData);interruptedFall.run('update()');
assert.equal(interruptedFall.run('room===35 && dockFallTick===1'),true,'reloading an unfinished fall resumes the transition');
coworker.run('for(let i=0;i<100;i++)update();draw()');
assert.equal(coworker.run('room===36 && dockEntered && !dockFallPending && dockArrivalActive() && dockCheckpoint.activated && activeCheckpoint==="dock"'),true,'both characters land at the region 4 safe station');
assert.equal(coworker.run('money'),collapseMoney,'the transition keeps the boss reward');
assert.ok(coworker.labels.some(text=>text.includes('下面竟然還有一座工廠')),'arrival includes the coworker dialogue');
const arrivalReload=createGame(coworker.storageData);
assert.equal(arrivalReload.run('room===36 && dockArrivalActive()'),true,'unfinished arrival dialogue survives reload');
for(let i=0;i<3;i++)coworker.key('KeyE');
coworker.run('player.x=505;player.y=443;player.vx=0');coworker.key('KeyE');coworker.run('update()');
assert.ok(coworker.run('logMessage').includes('等你'),'the coworker remains in the safe landing room');
coworker.run('gameOver=true;resetGame();respawnTimer=0');
assert.equal(coworker.run('room===36 && !dockArrivalActive() && dockFallTick===-1'),true,'death respawns in region 4 without replaying the fall');
coworker.run('player.x=0;player.y=443;player.vx=0');coworker.key('KeyE');coworker.run('update()');
assert.equal(coworker.run('room'),36,'the collapsed entrance cannot lead back to the boss');

// The furnace region has infected enemies, readable hazards and a reversible route.
const docks=createGame(coworker.storageData);
docks.run('changeRoom(37);invulnerability=99999');
assert.equal(docks.run('wildEnemies.length===3 && wildEnemies.every(e=>e.irradiated)'),true,'region 4 retains radiation on all enemies');
docks.run('wildEnemies.forEach(e=>{e.state="recover";e.timer=9999});wildEnemies[0].x=520;player.x=475;player.y=443;player.facing=1;player.grounded=true;attackCooldown=0');
docks.attack();docks.run('update()');assert.equal(docks.run('wildEnemies[0].health'),3,'the sword damages the infected foundry worker');
docks.run('wildEnemies.forEach(e=>e.health=0);wildTicks=110;draw()');
assert.ok(docks.labels.includes('爐口即將噴發'),'the furnace vent has a visible warning');
docks.run('health=4;invulnerability=0;wildTicks=134;player.x=565;player.y=443;player.vx=0;update()');
assert.equal(docks.run('health'),3,'the active furnace jet deals damage');
docks.run('invulnerability=0;dashTimer=0;player.x=350;player.y=470;player.vy=3;update()');
assert.equal(docks.run('health===2 && player.x===70 && player.y===443'),true,'lava deals one hit and rescues to a safe bank');

// Traverse the molten bridge using normal movement and jumps.
docks.run('changeRoom(37);wildEnemies.forEach(e=>e.health=0);invulnerability=99999');
docks.key('KeyD');let dockFlight=0;
for(let tick=0;tick<500 && docks.run('player.x')<885;tick++){
  if(dockFlight&&docks.run('player.grounded')){docks.keyup('Space');dockFlight=0;}
  if(!dockFlight&&docks.run('player.grounded && ((player.x>=270&&player.x<430)||(player.x>=600&&player.x<750))')){docks.key('Space');dockFlight=1;}
  if(dockFlight)dockFlight++;
  docks.run('update()');
}
docks.keyup('KeyD');docks.keyup('Space');assert.ok(docks.run('player.x')>=885,'the furnace bridge is traversable');
docks.key('KeyE');docks.run('update()');assert.equal(docks.run('room'),38);
docks.run('let testDockRescues=0;const originalDockRescue=dockLavaRescue;dockLavaRescue=()=>{const rescued=originalDockRescue();if(rescued)testDockRescues++;return rescued;}');

function dockWalkTo(target){
  const right=docks.run('player.x')<target,code=right?'KeyD':'KeyA';docks.key(code);
  for(let i=0;i<200&&(right?docks.run('player.x')<target:docks.run('player.x')>target);i++)docks.run('update()');
  docks.keyup(code);docks.run('player.vx=0');
}
function dockJumpTo(target,dash=false){
  if(dash)docks.run('for(let i=0;i<65&&dashCooldown>0;i++)update()');
  const right=docks.run('player.x')<target,code=right?'KeyD':'KeyA';
  docks.key('Space');if(Math.abs(docks.run('player.x')-target)>5)docks.key(code);
  for(let i=0;i<100;i++){
    if(dash&&i===7)docks.key('ShiftLeft');
    if(right?docks.run('player.x')>=target:docks.run('player.x')<=target){docks.keyup(code);docks.run('player.vx=0');}
    docks.run('update()');if(i>3&&docks.run('player.grounded'))break;
  }
  docks.keyup('Space');docks.keyup(code);docks.keyup('ShiftLeft');docks.run('player.vx=0');
}
docks.run('wildEnemies.forEach(e=>e.health=0)');
dockWalkTo(240);dockJumpTo(docks.run('player.x'));
assert.equal(docks.run('player.y'),363,'the first shaft ledge is reachable with a basic jump');
dockWalkTo(305);dockJumpTo(435);
assert.equal(docks.run('player.y'),288,'the second shaft ledge is reachable without wall jump');
dockJumpTo(620,true);
assert.equal(docks.run('player.grounded && player.x>580 && player.x<695'),true,'a jump and dash reach the chain platform');
dockJumpTo(755);
assert.equal(docks.run('player.y'),303,'the lift route reaches the exit ledge');
dockWalkTo(885);docks.key('KeyE');docks.run('update()');assert.equal(docks.run('room'),39,'the shaft is traversable with the restored dash');
docks.run('changeRoom(38);wildEnemies.forEach(e=>e.health=0)');
dockJumpTo(docks.run('player.x'));assert.equal(docks.run('player.y'),363,'the right bank has a reachable return step');
dockJumpTo(755);assert.equal(docks.run('player.y'),303,'the return step reaches the high ledge');
dockJumpTo(620,true);assert.equal(docks.run('player.grounded && player.x>580 && player.x<695'),true,'the return jump reaches the lift');
dockJumpTo(435,true);assert.equal(docks.run('player.y'),288,'the return jump reaches the center ledge');
dockJumpTo(305);dockWalkTo(200);dockWalkTo(25);
docks.key('KeyE');docks.run('update()');assert.equal(docks.run('room'),37,'the shaft can be traversed on the return journey');
assert.equal(docks.run('testDockRescues'),0,'both shaft routes finish without a lava reset');
docks.run('changeRoom(38);wildEnemies.forEach(e=>e.health=0)');

// Boarding the chain lift carries the player vertically without clipping.
docks.run('wildEnemies.forEach(e=>e.health=0);{const p=roomPlatforms[38].find(p=>p.dockLift);player.x=p.x+30;player.y=p.y-player.h;player.vx=0;player.vy=0;player.grounded=true;}');
const liftStart=docks.run('player.y');docks.run('for(let i=0;i<35;i++)update()');
assert.ok(docks.run('player.y')<liftStart-35,'the chain platform carries a standing player upward');
assert.equal(docks.run('player.grounded'),true,'the player stays grounded on the lift');

// Region 4 enemies have their own hammer wave, lobbed slag and vertical beam.
const foundryFoes=createGame(coworker.storageData);
for(let type=0;type<3;type++){
  foundryFoes.run(`changeRoom(37);invulnerability=99999;wildEnemies.forEach(e=>e.health=0);{const foe=wildEnemies[${type===0?0:type===1?1:2}];foe.health=foe.maxHealth;foe.state='patrol';foe.cooldown=0;player.x=foe.x-60;player.y=443;player.vx=0;player.grounded=true;}update();draw()`);
  assert.equal(foundryFoes.run(`wildEnemies[${type}].state`),'warning',`foundry enemy ${type} telegraphs its attack`);
  foundryFoes.run(`for(let i=0;i<${type===0?48:type===1?65:70};i++)update()`);
  assert.equal(foundryFoes.run(`wildEnemies[${type}].shot.kind`),['shock','slag','beam'][type],'each enemy uses a distinct attack');
  if(type===0){const waveX=foundryFoes.run('wildEnemies[0].shot.x');foundryFoes.run('update()');assert.ok(foundryFoes.run('wildEnemies[0].shot.x')<waveX,'hammer shock travels along the floor');}
  if(type===1){assert.ok(foundryFoes.run('wildEnemies[1].shot.vy')<0,'slag starts on an upward arc');foundryFoes.run('for(let i=0;i<65;i++)update()');assert.equal(foundryFoes.run('wildEnemies[1].shot.kind'),'burn','slag leaves a temporary burning patch');}
  if(type===2){assert.equal(foundryFoes.run('wildEnemies[2].shot.w===24 && wildEnemies[2].shot.h>100'),true,'the drone fires a narrow vertical heat beam');foundryFoes.run('for(let i=0;i<30;i++)update()');assert.equal(foundryFoes.run('wildEnemies[2].shot.active'),false,'the beam ends after its attack window');}
}

// The power lever enables a two-way shortcut, saved independently of the fall.
docks.run('changeRoom(39);wildEnemies.forEach(e=>e.health=0);player.x=door.x;player.y=443;player.vx=0');docks.key('KeyE');docks.run('update()');
assert.equal(docks.run('room===39 && !dockShortcut'),true,'the return lift needs power');
docks.run('player.x=dockLever.x;player.y=443;player.vx=0');docks.key('KeyE');docks.run('update()');
assert.equal(docks.run('dockShortcut'),true,'the pump room lever powers the shortcut');
docks.run('player.x=door.x;player.y=443;player.vx=0');docks.key('KeyE');docks.run('update()');
assert.equal(docks.run('room===35 && !duelistActive() && !duelIntroActive() && dockFallTick===-1'),true,'the return lift reaches the cleared arena without another collapse');
docks.run('player.x=door.x;player.y=443;player.vx=0');docks.key('KeyE');docks.run('update()');assert.equal(docks.run('room'),39,'the powered lift works in both directions');
assert.equal(createGame(docks.storageData).run('dockShortcut && dockEntered'),true,'the shortcut persists after reload');
docks.run('changeRoom(36);player.x=dockCheckpoint.x;player.y=443;wildCheckpoint.activated=true;player.vx=0');docks.key('KeyG');docks.key('Digit6');docks.run('respawnTimer=0');
docks.key('KeyG');docks.key('Digit7');assert.equal(docks.run('room===36 && activeCheckpoint==="dock"'),true,'the seventh travel option returns to region 4');
docks.run('respawnTimer=0;mapOpen=true;draw();mapOpen=false;travelOpen=true;draw();travelOpen=false');
assert.ok(docks.labels.includes('區域 4 · 地下熔塢'),'region 4 has its own map');
assert.equal(createGame({'steam-city-progress-v1':JSON.stringify({postFall:true,familyStage:8,duelistDefeated:true})}).run('room===35 && dockFallPending'),true,'older boss victories receive the new story transition');
docks.buttons['#restart-button']._click();assert.equal(docks.run('!dockEntered && !dockShortcut && !dockCheckpoint.activated && dockFallTick===-1'),true,'new game clears region 4 progression');

console.log('All exploration, story, combat, parkour, gauntlet, altar, spear, economy, equipment and save checks passed.');
