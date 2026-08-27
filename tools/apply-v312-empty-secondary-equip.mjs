import fs from 'node:fs';

const path='src/sim.js';
let s=fs.readFileSync(path,'utf8');
const old="function applyBagEquip(p,index){const it=p.inventory[index];if(!it)return false;if(it.kind==='weapon'){const slot=p.weaponSlot||'primary',old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);p.reload=0;return true}if(it.kind==='armor'||it.kind==='helmet'||it.kind==='backpack'){const slot=it.kind,old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);return true}return false}";
const next="function applyBagEquip(p,index){const it=p.inventory[index];if(!it)return false;if(it.kind==='weapon'){const slot=!p.gear.primary?'primary':!p.gear.secondary?'secondary':(p.weaponSlot||'primary'),old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);p.reload=0;return true}if(it.kind==='armor'||it.kind==='helmet'||it.kind==='backpack'){const slot=it.kind,old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);return true}return false}";
if(!s.includes(old))throw new Error('applyBagEquip anchor not found');
s=s.replace(old,next);
fs.writeFileSync(path,s);
console.log('v3.1.2 empty secondary equip fix applied');
// trigger workflow after workflow registration
