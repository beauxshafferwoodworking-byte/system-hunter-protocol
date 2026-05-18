const STATS_ACTIVE_SAVE_KEY = 'system_hunter_protocol_v16';
const STATS_PLAYER_SAVE_KEY = 'system_hunter_player_save';
let preCompletionSnapshot = null;

function readStatsSave(){
  try{
    return JSON.parse(localStorage.getItem(STATS_ACTIVE_SAVE_KEY) || localStorage.getItem(STATS_PLAYER_SAVE_KEY) || 'null');
  }catch(error){
    console.warn('Unable to read status save.', error);
    return null;
  }
}

function writeStatsSave(save){
  localStorage.setItem(STATS_ACTIVE_SAVE_KEY, JSON.stringify(save));
  localStorage.setItem(STATS_PLAYER_SAVE_KEY, JSON.stringify(save));
}

function ensureLifetimeStats(save){
  if(!save.lifetimeStats){
    save.lifetimeStats = {
      pushups: 0,
      squats: 0,
      lunges: 0,
      coreSets: 0,
      mobilitySessions: 0,
      cardioMinutes: 0,
      recoverySessions: 0,
      pullups: 0,
      longestStreak: save.streak || 0,
      lastUpdated: null
    };
  }
  const defaults = { pushups:0, squats:0, lunges:0, coreSets:0, mobilitySessions:0, cardioMinutes:0, recoverySessions:0, pullups:0 };
  Object.keys(defaults).forEach(key => {
    if(typeof save.lifetimeStats[key] === 'undefined') save.lifetimeStats[key] = defaults[key];
  });
  if(typeof save.lifetimeStats.longestStreak === 'undefined') save.lifetimeStats.longestStreak = save.streak || 0;
  return save.lifetimeStats;
}

function estimateQuestVolume(quest){
  const name = quest.name || '';
  const detail = quest.detail || '';
  const text = `${name} ${detail}`.toLowerCase();
  const volume = { pushups:0, squats:0, lunges:0, coreSets:0, mobilitySessions:0, cardioMinutes:0, recoverySessions:0, pullups:0 };

  if(text.includes('mobility') || text.includes('stretch') || text.includes('decompression') || text.includes('posture')) volume.mobilitySessions += 1;
  if(text.includes('recovery') || text.includes('breathing') || text.includes('neck')) volume.recoverySessions += 1;
  if(text.includes('walk') || text.includes('jog') || text.includes('run')) volume.cardioMinutes += text.includes('8 rounds') ? 25 : 20;
  if(text.includes('pushup') || text.includes('pushups')) volume.pushups += text.includes('4 rounds') ? 40 : text.includes('3 rounds') ? 24 : 60;
  if(text.includes('squat') || text.includes('squats')) volume.squats += text.includes('4 rounds') ? 60 : text.includes('3 rounds') ? 36 : 60;
  if(text.includes('lunge') || text.includes('lunges')) volume.lunges += text.includes('4 rounds') ? 64 : 48;
  if(text.includes('plank') || text.includes('dead bug') || text.includes('bird dog') || text.includes('hollow') || text.includes('core')) volume.coreSets += 3;
  if(text.includes('pull-up') || text.includes('pullup') || text.includes('pullups')) volume.pullups += 25;

  return volume;
}

function addVolume(target, volume){
  Object.keys(volume).forEach(key => {
    target[key] = (target[key] || 0) + volume[key];
  });
}

function getHunterClassification(stats){
  const strengthScore = (stats.pushups || 0) + (stats.squats || 0) + (stats.lunges || 0) + ((stats.pullups || 0) * 3);
  const enduranceScore = (stats.cardioMinutes || 0) * 5;
  const recoveryScore = ((stats.mobilitySessions || 0) + (stats.recoverySessions || 0)) * 60 + ((stats.coreSets || 0) * 8);

  const top = Math.max(strengthScore, enduranceScore, recoveryScore);
  if(top < 150) return 'Classification: Unawakened';
  if(strengthScore === top && enduranceScore > top * 0.65) return 'Classification: Hybrid Hunter';
  if(strengthScore === top) return 'Classification: Vanguard';
  if(enduranceScore === top) return 'Classification: Endurance Hunter';
  return 'Classification: Recovery Adept';
}

function getGateStats(save){
  const daily = save.daily || {};
  const history = Array.isArray(save.history) ? save.history : [];
  const clearedGateHistory = history.filter(entry => entry.gate && entry.gate.cleared);
  const totalCleared = daily.totalGatesCleared || clearedGateHistory.length || 0;
  const lastGate = daily.lastGateCleared || clearedGateHistory[0]?.gate?.name || 'None';
  const gateXp = daily.totalGateXp || clearedGateHistory.reduce((sum, entry) => sum + (entry.gate?.bonusXp || 0), 0);
  return { totalCleared, lastGate, gateXp };
}

function processCompletedQuestStats(before, after){
  if(!before || !after) return;
  const beforeFull = before.fullCompletions || 0;
  const beforePartial = before.partialCompletions || 0;
  const afterFull = after.fullCompletions || 0;
  const afterPartial = after.partialCompletions || 0;
  const changed = afterFull > beforeFull || afterPartial > beforePartial;
  if(!changed) return;

  const stats = ensureLifetimeStats(after);
  const completedQuests = (before.quests || []).filter(q => q.done);
  completedQuests.forEach(quest => addVolume(stats, estimateQuestVolume(quest)));
  stats.longestStreak = Math.max(stats.longestStreak || 0, after.streak || 0);
  stats.estimatedMiles = Number(((stats.cardioMinutes || 0) / 18).toFixed(1));
  stats.classification = getHunterClassification(stats);
  stats.lastUpdated = new Date().toISOString();
  writeStatsSave(after);
  renderStatusCard(after);
}

function renderStatusCard(save = readStatsSave()){
  if(!save) return;
  const stats = ensureLifetimeStats(save);
  const gates = getGateStats(save);
  stats.estimatedMiles = Number(((stats.cardioMinutes || 0) / 18).toFixed(1));
  stats.classification = getHunterClassification(stats);

  const setText = (id, value) => { const el = document.getElementById(id); if(el) el.textContent = value; };
  const rank = save.level >= 14 ? 'C-RANK' : save.level >= 7 ? 'D-RANK' : 'E-RANK';

  setText('statusTitle', `${rank} // ${save.title || 'Exhausted Survivor'}`);
  setText('statusClass', stats.classification);
  setText('statusLevel', save.level || 1);
  setText('statusFullQuests', save.fullCompletions || 0);
  setText('statusPartialQuests', save.partialCompletions || 0);
  setText('statusLongestStreak', stats.longestStreak || save.streak || 0);
  setText('statusAchievements', (save.unlockedAchievements || []).length);
  setText('totalPushups', stats.pushups || 0);
  setText('totalSquats', stats.squats || 0);
  setText('totalLunges', stats.lunges || 0);
  setText('totalPullups', stats.pullups || 0);
  setText('totalCore', stats.coreSets || 0);
  setText('totalMobility', stats.mobilitySessions || 0);
  setText('totalRecovery', stats.recoverySessions || 0);
  setText('totalCardioMinutes', stats.cardioMinutes || 0);
  setText('totalMiles', stats.estimatedMiles.toFixed(1));
  setText('statusGatesCleared', gates.totalCleared);
  setText('statusLastGate', gates.lastGate);
  setText('statusGateXp', gates.gateXp);
}

document.addEventListener('DOMContentLoaded', () => {
  renderStatusCard();

  const completeButton = document.getElementById('completeDay');
  if(completeButton){
    completeButton.addEventListener('click', () => {
      preCompletionSnapshot = readStatsSave();
    }, true);

    completeButton.addEventListener('click', () => {
      setTimeout(() => processCompletedQuestStats(preCompletionSnapshot, readStatsSave()), 80);
    });
  }

  document.querySelectorAll('.bottom-nav button[data-tab]').forEach(button => {
    button.addEventListener('click', () => setTimeout(() => renderStatusCard(), 60));
  });
});
