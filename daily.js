const DAILY_ACTIVE_SAVE_KEY = 'system_hunter_protocol_v16';
const DAILY_PLAYER_SAVE_KEY = 'system_hunter_player_save';
let preCompleteDailySnapshot = null;

function getLocalDateKey(date = new Date()){
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextLocalMidnightIso(){
  const reset = new Date();
  reset.setHours(24, 0, 0, 0);
  return reset.toISOString();
}

function formatResetCountdown(resetAt){
  const target = resetAt ? new Date(resetAt) : new Date(getNextLocalMidnightIso());
  const diff = Math.max(0, target - new Date());
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
    save.daily = { activeDate:null, completedDate:null, completedAt:null, generatedAt:null, resetAt:null, activeGate:null, gateCompletedDate:null, gateRollDate:null, totalGatesCleared:0 };
  }
  if(typeof save.daily.totalGatesCleared === 'undefined') save.daily.totalGatesCleared = 0;
  return save.daily;
}

function getSavedResetText(save = readDailySave()){
  if(!save) return formatResetCountdown(null);
  const daily = ensureDailyState(save);
  if(!daily.resetAt || new Date(daily.resetAt) <= new Date()){
    daily.resetAt = getNextLocalMidnightIso();
    writeDailySave(save);
  }
  return formatResetCountdown(daily.resetAt);
}

function showDailyNotice(title, body, eyebrow = 'DAILY SYSTEM'){
  const overlay = document.getElementById('systemOverlay');
  const titleEl = document.getElementById('overlayTitle');
  const bodyEl = document.getElementById('overlayBody');
  const eyebrowEl = document.getElementById('overlayEyebrow');
  if(!overlay || !titleEl || !bodyEl || !eyebrowEl){ alert(`${title}\n${body}`); return; }
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

function isDailyCompletionLocked(save){
  if(!save) return false;
  const daily = ensureDailyState(save);
  return daily.completedDate === getLocalDateKey();
}

function markDailyGenerated(save){
  const today = getLocalDateKey();
  const daily = ensureDailyState(save);
  daily.activeDate = today;
  daily.generatedAt = daily.generatedAt || new Date().toISOString();
  daily.resetAt = daily.resetAt && new Date(daily.resetAt) > new Date() ? daily.resetAt : getNextLocalMidnightIso();
  return save;
}

function markDailyCompleted(save){
  const daily = ensureDailyState(save);
  daily.completedDate = getLocalDateKey();
  daily.completedAt = new Date().toISOString();
  daily.resetAt = daily.resetAt && new Date(daily.resetAt) > new Date() ? daily.resetAt : getNextLocalMidnightIso();
  save.quests = (save.quests || []).map(q => ({ ...q, locked:true }));
  save.log = save.log || [];
  save.log.unshift(`${new Date().toLocaleString()}: Daily Quest completion locked until reset.`);
  return save;
}

function reconcileExistingQuest(){
  const save = readDailySave();
  if(!save || !Array.isArray(save.quests) || save.quests.length === 0) return;
  const daily = ensureDailyState(save);
  const today = getLocalDateKey();
  if(daily.activeDate !== today){
    markDailyGenerated(save);
    save.log = save.log || [];
    save.log.unshift(`${new Date().toLocaleString()}: Daily Quest locked to ${today}.`);
    writeDailySave(save);
    return;
  }
  if(!daily.resetAt || new Date(daily.resetAt) <= new Date()){
    daily.resetAt = getNextLocalMidnightIso();
    writeDailySave(save);
  }
}

function applyGateIfRolled(save){
  if(!save || !window.SYSTEM_GATES || !window.SYSTEM_GATES.rollForGate) return save;
  const daily = ensureDailyState(save);
  const today = getLocalDateKey();
  if(daily.gateRollDate === today) return save;
  daily.gateRollDate = today;
  const gate = window.SYSTEM_GATES.rollForGate();
  if(!gate){ daily.activeGate = null; return save; }
  save.quests = gate.modifier(save.quests || []);
  save.dayType = gate.name;
  daily.activeGate = { id: gate.id, name: gate.name, type: gate.type, bonusXp: gate.bonusXp, generatedAt: new Date().toISOString(), cleared:false };
  save.log = save.log || [];
  save.log.unshift(`${new Date().toLocaleString()}: ${gate.name} detected. Bonus XP available: +${gate.bonusXp}.`);
  showDailyNotice(gate.overlay, gate.description, 'GATE EVENT');
  return save;
}

function processDailyGeneration(){
  const save = readDailySave();
  if(!save || !Array.isArray(save.quests) || save.quests.length === 0) return;
  markDailyGenerated(save);
  applyGateIfRolled(save);
  writeDailySave(save);
  window.location.reload();
}

function processDailyCompletion(before, after){
  if(!before || !after) return;
  const beforeFull = before.fullCompletions || 0;
  const beforePartial = before.partialCompletions || 0;
  const afterFull = after.fullCompletions || 0;
  const afterPartial = after.partialCompletions || 0;
  if(afterFull <= beforeFull && afterPartial <= beforePartial) return;
  markDailyCompleted(after);
  writeDailySave(after);
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
  daily.resetAt = daily.resetAt && new Date(daily.resetAt) > new Date() ? daily.resetAt : getNextLocalMidnightIso();
  after.log = after.log || [];
  after.log.unshift(`${new Date().toLocaleString()}: Gate cleared: ${gate.name}. Bonus awarded: +${gate.bonusXp} XP.`);
  writeDailySave(after);
  showDailyNotice('GATE CLEARED', `${gate.name} conquered. Bonus awarded: +${gate.bonusXp} XP.`, 'GATE COMPLETE');
  setTimeout(() => window.location.reload(), 650);
}

function updateDailyUi(){
  const save = readDailySave();
  const generateButton = document.getElementById('generateQuest');
  const completeButton = document.getElementById('completeDay');
  const daily = save ? ensureDailyState(save) : null;
  const today = getLocalDateKey();
  const resetText = getSavedResetText(save);
  const locked = save && daily.activeDate === today && Array.isArray(save.quests) && save.quests.length > 0;
  const completeLocked = save && daily.completedDate === today;

  if(generateButton) generateButton.textContent = locked ? `Daily Quest Locked // Reset in ${resetText}` : 'Generate Today’s Quest';
  if(completeButton){
    completeButton.textContent = completeLocked ? `Daily Quest Complete // Reset in ${resetText}` : 'Complete Daily Quest';
    completeButton.disabled = !!completeLocked;
  }

  const badge = document.getElementById('dailyLockBadge');
  const reset = document.getElementById('dailyResetTimer');
  const gateStatus = document.getElementById('dailyGateStatus');
  const gateClears = document.getElementById('dailyGateClears');
  const hint = document.getElementById('dailySystemHint');
  if(badge) badge.textContent = completeLocked ? 'Complete' : locked ? 'Active' : 'Available';
  if(reset) reset.textContent = resetText;
  if(gateStatus) gateStatus.textContent = daily?.activeGate ? (daily.activeGate.cleared ? `${daily.activeGate.name} Cleared` : daily.activeGate.name) : 'No Gate';
  if(gateClears) gateClears.textContent = daily?.totalGatesCleared || 0;
  if(hint) hint.textContent = completeLocked ? 'Daily rewards claimed. New quest available after reset.' : 'Daily quests and Gates are locked to your local calendar day.';
}

document.addEventListener('DOMContentLoaded', () => {
  reconcileExistingQuest();
  updateDailyUi();
  setInterval(updateDailyUi, 60000);

  const generateButton = document.getElementById('generateQuest');
  if(generateButton){
    generateButton.addEventListener('click', event => {
      const save = readDailySave();
      if(isDailyQuestLocked(save)){
        event.preventDefault();
        event.stopImmediatePropagation();
        showDailyNotice('DAILY QUEST ALREADY GENERATED', `Next reset in ${getSavedResetText(save)}.`, 'SYSTEM LOCK');
      }
    }, true);
    generateButton.addEventListener('click', () => setTimeout(processDailyGeneration, 140));
  }

  const completeButton = document.getElementById('completeDay');
  if(completeButton){
    completeButton.addEventListener('click', event => {
      const save = readDailySave();
      if(isDailyCompletionLocked(save)){
        event.preventDefault();
        event.stopImmediatePropagation();
        showDailyNotice('DAILY REWARD ALREADY CLAIMED', `Next completion available in ${getSavedResetText(save)}.`, 'SYSTEM LOCK');
        return;
      }
      preCompleteDailySnapshot = save;
    }, true);
    completeButton.addEventListener('click', () => {
      setTimeout(() => {
        const latest = readDailySave();
        processDailyCompletion(preCompleteDailySnapshot, latest);
        processGateCompletion(preCompleteDailySnapshot, readDailySave());
        updateDailyUi();
      }, 180);
    });
  }
});
