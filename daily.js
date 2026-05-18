const DAILY_ACTIVE_SAVE_KEY = 'system_hunter_protocol_v16';
const DAILY_PLAYER_SAVE_KEY = 'system_hunter_player_save';
let preCompleteDailySnapshot = null;

function getLocalDateKey(date = new Date()){
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextResetText(){
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(24, 0, 0, 0);
  const diff = Math.max(0, reset - now);
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  return `${hours}h ${minutes}m`;
}

function readDailySave(){
  try{
    return JSON.parse(localStorage.getItem(DAILY_ACTIVE_SAVE_KEY) || localStorage.getItem(DAILY_PLAYER_SAVE_KEY) || 'null');
  }catch(error){
    console.warn('Unable to read daily save.', error);
    return null;
  }
}

function writeDailySave(save){
  localStorage.setItem(DAILY_ACTIVE_SAVE_KEY, JSON.stringify(save));
  localStorage.setItem(DAILY_PLAYER_SAVE_KEY, JSON.stringify(save));
}

function ensureDailyState(save){
  if(!save.daily){
    save.daily = {
      activeDate: null,
      completedDate: null,
      generatedAt: null,
      resetAt: null,
      activeGate: null,
      gateCompletedDate: null,
      totalGatesCleared: 0
    };
  }
  if(typeof save.daily.totalGatesCleared === 'undefined') save.daily.totalGatesCleared = 0;
  return save.daily;
}

function showDailyNotice(title, body, eyebrow = 'DAILY SYSTEM'){
  const overlay = document.getElementById('systemOverlay');
  const titleEl = document.getElementById('overlayTitle');
  const bodyEl = document.getElementById('overlayBody');
  const eyebrowEl = document.getElementById('overlayEyebrow');
  if(!overlay || !titleEl || !bodyEl || !eyebrowEl){
    alert(`${title}\n${body}`);
    return;
  }
  eyebrowEl.textContent = eyebrow;
  titleEl.textContent = title;
  bodyEl.textContent = body;
  overlay.classList.remove('hidden');
}

function isDailyQuestLocked(save){
  if(!save) return false;
  const daily = ensureDailyState(save);
  const today = getLocalDateKey();
  return daily.activeDate === today && Array.isArray(save.quests) && save.quests.length > 0;
}

function markDailyGenerated(save){
  const today = getLocalDateKey();
  const daily = ensureDailyState(save);
  daily.activeDate = today;
  daily.generatedAt = new Date().toISOString();
  daily.resetAt = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
  return save;
}

function applyGateIfRolled(save){
  if(!save || !window.SYSTEM_GATES || !window.SYSTEM_GATES.rollForGate) return save;
  const daily = ensureDailyState(save);
  const today = getLocalDateKey();
  if(daily.gateRollDate === today) return save;

  daily.gateRollDate = today;
  const gate = window.SYSTEM_GATES.rollForGate();
  if(!gate) {
    daily.activeGate = null;
    return save;
  }

  save.quests = gate.modifier(save.quests || []);
  save.dayType = gate.name;
  daily.activeGate = {
    id: gate.id,
    name: gate.name,
    type: gate.type,
    bonusXp: gate.bonusXp,
    generatedAt: new Date().toISOString(),
    cleared: false
  };
  save.log = save.log || [];
  save.log.unshift(`${new Date().toLocaleString()}: ${gate.name} detected. Bonus XP available: +${gate.bonusXp}.`);
  showDailyNotice(gate.overlay, gate.description, 'GATE EVENT');
  return save;
}

function processDailyGeneration(){
  const save = readDailySave();
  if(!save) return;
  markDailyGenerated(save);
  applyGateIfRolled(save);
  writeDailySave(save);
  window.location.reload();
}

function processGateCompletion(before, after){
  if(!before || !after) return;
  const beforeFull = before.fullCompletions || 0;
  const afterFull = after.fullCompletions || 0;
  if(afterFull <= beforeFull) return;

  const daily = ensureDailyState(after);
  const gate = daily.activeGate;
  if(!gate || gate.cleared) return;

  const gateQuestCleared = (before.quests || []).some(q => q.gate && q.done);
  if(!gateQuestCleared) return;

  after.xp = (after.xp || 0) + (gate.bonusXp || 0);
  gate.cleared = true;
  gate.clearedAt = new Date().toISOString();
  daily.gateCompletedDate = getLocalDateKey();
  daily.totalGatesCleared = (daily.totalGatesCleared || 0) + 1;
  after.log = after.log || [];
  after.log.unshift(`${new Date().toLocaleString()}: Gate cleared: ${gate.name}. Bonus awarded: +${gate.bonusXp} XP.`);
  writeDailySave(after);
  showDailyNotice('GATE CLEARED', `${gate.name} conquered. Bonus awarded: +${gate.bonusXp} XP.`, 'GATE COMPLETE');
  setTimeout(() => window.location.reload(), 650);
}

function updateDailyUi(){
  const save = readDailySave();
  const button = document.getElementById('generateQuest');
  if(!button) return;

  const daily = save ? ensureDailyState(save) : null;
  const today = getLocalDateKey();
  const locked = save && daily.activeDate === today && Array.isArray(save.quests) && save.quests.length > 0;

  if(locked){
    button.textContent = `Daily Quest Locked // Reset in ${getNextResetText()}`;
  }else{
    button.textContent = 'Generate Today’s Quest';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateDailyUi();
  setInterval(updateDailyUi, 60000);

  const generateButton = document.getElementById('generateQuest');
  if(generateButton){
    generateButton.addEventListener('click', event => {
      const save = readDailySave();
      if(isDailyQuestLocked(save)){
        event.preventDefault();
        event.stopImmediatePropagation();
        showDailyNotice('DAILY QUEST ALREADY GENERATED', `Next reset in ${getNextResetText()}.`, 'SYSTEM LOCK');
      }
    }, true);

    generateButton.addEventListener('click', () => {
      setTimeout(processDailyGeneration, 120);
    });
  }

  const completeButton = document.getElementById('completeDay');
  if(completeButton){
    completeButton.addEventListener('click', () => {
      preCompleteDailySnapshot = readDailySave();
    }, true);

    completeButton.addEventListener('click', () => {
      setTimeout(() => processGateCompletion(preCompleteDailySnapshot, readDailySave()), 140);
    });
  }
});
