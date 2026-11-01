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
  const canvas = {width: 960, height: 540, getContext: () => ctx, addEventListener: (name, fn) => { handlers['canvas:' + name] = fn; }};
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
    window: {addEventListener: (name, fn) => { handlers[name] = fn; }, confirm: () => true},
    localStorage: {getItem: key => storageData[key] ?? null, setItem: (key, value) => { storageData[key] = value; }},
    requestAnimationFrame() {}
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  const key = code => handlers.keydown({code, repeat: false, preventDefault() {}});
  const attack = () => handlers['canvas:mousedown']({button: 0});
  return {run, key, attack, labels, buttons, storageData};
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
assert.ok(replay.labels.includes('廢棄溫室'), 'map includes the greenhouse');

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
assert.equal(lethal.run('gameOver && !won'), true, 'a lethal hit takes priority over completing the game');
console.log('All exploration, Boss, checkpoint, save and preference smoke checks passed.');
