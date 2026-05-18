const PLAYER_SAVE_KEY = 'system_hunter_player_save';
const ACTIVE_SAVE_KEY = 'system_hunter_protocol_v16';
const LEGACY_SAVE_KEYS = [
  'system_hunter_protocol_v1',
  'system_hunter_protocol_v13',
  'system_hunter_protocol_v14',
  'system_hunter_protocol_v15',
  'system_hunter_protocol_v16'
];

function readJson(key){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }catch(error){
    console.warn('SYSTEM save read failed:', key, error);
    return null;
  }
}

function writeJson(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function migratePlayerSave(){
  const stable = readJson(PLAYER_SAVE_KEY);
  if(stable){
    if(!readJson(ACTIVE_SAVE_KEY)) writeJson(ACTIVE_SAVE_KEY, stable);
    return stable;
  }

  for(let i = LEGACY_SAVE_KEYS.length - 1; i >= 0; i--){
    const legacy = readJson(LEGACY_SAVE_KEYS[i]);
    if(legacy){
      legacy.saveVersion = 'stable-v1';
      legacy.migratedFrom = LEGACY_SAVE_KEYS[i];
      legacy.migratedAt = new Date().toISOString();
      writeJson(PLAYER_SAVE_KEY, legacy);
      writeJson(ACTIVE_SAVE_KEY, legacy);
      return legacy;
    }
  }
  return null;
}

function installSaveMirror(){
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value){
    originalSetItem(key, value);
    if(key === ACTIVE_SAVE_KEY){
      originalSetItem(PLAYER_SAVE_KEY, value);
    }
  };
}

function exportPlayerSave(){
  const save = readJson(PLAYER_SAVE_KEY) || readJson(ACTIVE_SAVE_KEY);
  if(!save){
    alert('No player save found yet. Complete or generate a quest first.');
    return;
  }
  const backup = {
    app: 'SYSTEM // Hunter Protocol',
    exportedAt: new Date().toISOString(),
    saveVersion: 'stable-v1',
    player: save
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,10);
  link.href = url;
  link.download = `system-hunter-save-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importPlayerSave(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    try{
      const parsed = JSON.parse(event.target.result);
      const player = parsed.player || parsed;
      if(!player || typeof player !== 'object' || typeof player.level === 'undefined'){
        throw new Error('Invalid player save file.');
      }
      player.importedAt = new Date().toISOString();
      writeJson(PLAYER_SAVE_KEY, player);
      writeJson(ACTIVE_SAVE_KEY, player);
      alert('Player save imported. The app will reload now.');
      window.location.reload();
    }catch(error){
      alert('Import failed. This does not look like a valid SYSTEM save file.');
      console.error(error);
    }
  };
  reader.readAsText(file);
}

function wipePlayerSave(){
  const phrase = prompt('Type WIPE to permanently erase local SYSTEM player data.');
  if(phrase !== 'WIPE') return;
  [PLAYER_SAVE_KEY, ...LEGACY_SAVE_KEYS].forEach(key => localStorage.removeItem(key));
  alert('Player data wiped. The app will reload with a clean profile.');
  window.location.reload();
}

migratePlayerSave();
installSaveMirror();

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportSave');
  const importInput = document.getElementById('importSave');
  const wipeBtn = document.getElementById('wipeSave');

  if(exportBtn) exportBtn.addEventListener('click', exportPlayerSave);
  if(importInput) importInput.addEventListener('change', event => importPlayerSave(event.target.files?.[0]));
  if(wipeBtn) wipeBtn.addEventListener('click', wipePlayerSave);
});
