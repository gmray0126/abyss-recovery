import fs from 'node:fs';

const path='src/main.js';
let s=fs.readFileSync(path,'utf8');
const replace=(from,to,label)=>{if(!s.includes(from))throw new Error('missing '+label);s=s.replace(from,to)};

replace(
"const audioSampleUrls={shotPistol:'./assets/audio/shot-pistol.wav',shotSmg:'./assets/audio/shot-smg.wav',shotAr:'./assets/audio/shot-ar.wav',shotShotgun:'./assets/audio/shot-shotgun.wav',shotDmr:'./assets/audio/shot-dmr.wav',reloadGeneric:'./assets/audio/reload-generic.wav',reloadGeneric2:'./assets/audio/reload-generic2.wav',reloadPistol:'./assets/audio/reload-pistol.wav',reloadRifle:'./assets/audio/reload-rifle.wav',reloadShotgun:'./assets/audio/reload-shotgun.wav'};",
"const audioSampleUrls={reloadGeneric:'./assets/audio/reload-generic.wav',reloadGeneric2:'./assets/audio/reload-generic2.wav',reloadPistol:'./assets/audio/reload-pistol.wav',reloadRifle:'./assets/audio/reload-rifle.wav',reloadShotgun:'./assets/audio/reload-shotgun.wav'};",
'audio sample urls');

replace(
"function shotSound(type,volume=1){if(!audioCtx)return;const sample={pistol:['shotPistol',.62],smg:['shotSmg',.50],ar:['shotAr',.60],shotgun:['shotShotgun',.72],dmr:['shotDmr',.68]}[type];if(sample&&playSample(sample[0],volume*sample[1],1))return;const d={pistol:[.035,360],smg:[.026,430],ar:[.045,300],shotgun:[.075,170],dmr:[.06,220]}[type]||[.04,300];noiseBurst(type==='shotgun'?.10:.065,d[0]*volume,70,d[1]*3);const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;o.type='square';o.frequency.setValueAtTime(d[1],now);o.frequency.exponentialRampToValueAtTime(55,now+.055);g.gain.setValueAtTime(d[0]*.5*volume,now);g.gain.exponentialRampToValueAtTime(.001,now+.07);o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.08)}",
"function shotSound(type,volume=1){if(!audioCtx)return;const d={pistol:[.035,360],smg:[.026,430],ar:[.045,300],shotgun:[.075,170],dmr:[.06,220]}[type]||[.04,300];noiseBurst(type==='shotgun'?.10:.065,d[0]*volume,70,d[1]*3);const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;o.type='square';o.frequency.setValueAtTime(d[1],now);o.frequency.exponentialRampToValueAtTime(55,now+.055);g.gain.setValueAtTime(d[0]*.5*volume,now);g.gain.exponentialRampToValueAtTime(.001,now+.07);o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.08)}",
'shot synth');

fs.writeFileSync(path,s);
