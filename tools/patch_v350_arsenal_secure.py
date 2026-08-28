from pathlib import Path
import re


def rep(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    return text.replace(old, new, 1)

# ---------------- simulation ----------------
p = Path('src/sim.js')
s = p.read_text(encoding='utf-8')

weapons = r"""export const WEAPONS={
 pistol:{name:'M9 권총',class:'pistol',price:220,damage:28,mag:15,caliber:'9mm',rate:.21,reload:1.35,speed:1180,spread:.018,range:900,auto:false,recoil:1.6,sound:620},
 smg:{name:'VX-9 SMG',class:'smg',price:540,damage:17,mag:30,caliber:'9mm',rate:.075,reload:1.7,speed:1040,spread:.06,range:760,auto:true,recoil:1.15,sound:760},
 mp5:{name:'MP5A3',class:'smg',price:690,damage:19,mag:30,caliber:'9mm',rate:.082,reload:1.62,speed:1080,spread:.042,range:830,auto:true,recoil:1.35,sound:770},
 vector:{name:'Vector 9',class:'smg',price:930,damage:15,mag:25,caliber:'9mm',rate:.055,reload:1.82,speed:1060,spread:.052,range:720,auto:true,recoil:1.05,sound:790},
 ar:{name:'AK-12 돌격소총',class:'ar',price:820,damage:24,mag:30,caliber:'5.56',rate:.105,reload:1.95,speed:1260,spread:.035,range:1080,auto:true,recoil:2.0,sound:980},
 m4:{name:'M4A1 카빈',class:'ar',price:980,damage:22,mag:30,caliber:'5.56',rate:.085,reload:1.78,speed:1290,spread:.028,range:1100,auto:true,recoil:1.72,sound:960},
 scar:{name:'SCAR-H',class:'battle',price:1380,damage:34,mag:20,caliber:'7.62',rate:.13,reload:2.05,speed:1390,spread:.033,range:1240,auto:true,recoil:3.05,sound:1180},
 shotgun:{name:'M870 산탄총',class:'shotgun',price:730,damage:12,pellets:8,mag:6,caliber:'12g',rate:.68,reload:2.1,speed:980,spread:.17,range:520,auto:false,recoil:4.2,sound:1120},
 saiga:{name:'Saiga-12',class:'shotgun',price:1180,damage:10,pellets:8,mag:8,caliber:'12g',rate:.28,reload:2.35,speed:990,spread:.155,range:550,auto:false,recoil:3.8,sound:1150},
 dmr:{name:'M14 DMR',class:'dmr',price:1050,damage:46,mag:10,caliber:'7.62',rate:.34,reload:2.2,speed:1460,spread:.012,range:1350,auto:false,recoil:3.4,sound:1180},
 m700:{name:'M700 저격소총',class:'sniper',price:1560,damage:72,mag:5,caliber:'7.62',rate:.92,reload:2.65,speed:1580,spread:.006,range:1650,auto:false,recoil:5.0,sound:1280}
};"""
s, n = re.subn(r"export const WEAPONS=\{.*?\n\};\n\nexport const AMMO_TIERS", weapons + "\n\nexport const AMMO_TIERS", s, count=1, flags=re.S)
if n != 1: raise SystemExit('failed weapons block')

parts = r"""export const WEAPON_PARTS={
 red_dot:{kind:'part',key:'red_dot',slot:'optic',name:'마이크로 레드닷',price:260,compatibleClasses:['pistol','smg','ar','battle','shotgun','dmr'],spreadMult:.93,viewLead:45},
 holo:{kind:'part',key:'holo',slot:'optic',name:'홀로 사이트',price:340,compatibleClasses:['smg','ar','battle','shotgun','dmr'],spreadMult:.89,viewLead:65},
 optic_2x:{kind:'part',key:'optic_2x',slot:'optic',name:'2× 전술 조준경',price:420,compatibleClasses:['smg','ar','battle','dmr'],visionBonus:2,viewLead:120,spreadMult:.92},
 optic_4x:{kind:'part',key:'optic_4x',slot:'optic',name:'4× 정밀 조준경',price:760,compatibleClasses:['ar','battle','dmr','sniper'],visionBonus:4,viewLead:220,spreadMult:.86,moveMult:.96},
 optic_6x:{kind:'part',key:'optic_6x',slot:'optic',name:'6× 장거리 스코프',price:1080,compatibleClasses:['dmr','sniper'],visionBonus:5,viewLead:300,spreadMult:.78,moveMult:.91},
 suppressor:{kind:'part',key:'suppressor',slot:'muzzle',name:'소음기',price:680,compatibleClasses:['pistol','smg','ar','battle','dmr','sniper'],soundMult:.48,recoilMult:1.06},
 compensator:{kind:'part',key:'compensator',slot:'muzzle',name:'컴펜세이터',price:430,compatibleClasses:['smg','ar','battle','dmr'],recoilMult:.78,soundMult:1.08},
 muzzle_brake:{kind:'part',key:'muzzle_brake',slot:'muzzle',name:'대형 머즐 브레이크',price:520,compatibleClasses:['ar','battle','dmr','sniper'],recoilMult:.66,spreadMult:1.06,soundMult:1.16},
 vertical_grip:{kind:'part',key:'vertical_grip',slot:'grip',name:'수직 손잡이',price:360,compatibleClasses:['smg','ar','battle','dmr'],spreadMult:.80,recoilMult:.72},
 horizontal_grip:{kind:'part',key:'horizontal_grip',slot:'grip',name:'수평 손잡이',price:390,compatibleClasses:['smg','ar','battle','dmr'],spreadMult:.62,recoilMult:.88},
 angled_grip:{kind:'part',key:'angled_grip',slot:'grip',name:'앵글 손잡이',price:440,compatibleClasses:['smg','ar','battle','dmr'],spreadMult:.76,recoilMult:.82,moveMult:1.03},
 tactical_stock:{kind:'part',key:'tactical_stock',slot:'stock',name:'전술 개머리판',price:460,compatibleClasses:['smg','ar','battle','dmr'],recoilMult:.80,spreadMult:.90},
 heavy_stock:{kind:'part',key:'heavy_stock',slot:'stock',name:'중량 개머리판',price:570,compatibleClasses:['ar','battle','dmr','sniper'],recoilMult:.65,moveMult:.90},
 light_stock:{kind:'part',key:'light_stock',slot:'stock',name:'경량 개머리판',price:350,compatibleClasses:['smg','ar'],moveMult:1.08,recoilMult:1.10},
 ext_mag:{kind:'part',key:'ext_mag',slot:'mag',name:'확장 탄창',price:390,compatibleClasses:['pistol','smg','ar','battle','dmr','sniper'],magMult:1.4,reloadMult:1.12},
 quickdraw_mag:{kind:'part',key:'quickdraw_mag',slot:'mag',name:'퀵드로우 탄창',price:410,compatibleClasses:['pistol','smg','ar','battle','dmr'],reloadMult:.68},
 ext_quickdraw:{kind:'part',key:'ext_quickdraw',slot:'mag',name:'확장 퀵드로우 탄창',price:690,compatibleClasses:['smg','ar','battle','dmr'],magMult:1.25,reloadMult:.82},
 shell_tube:{kind:'part',key:'shell_tube',slot:'mag',name:'샷건 연장 튜브',price:340,compatibleClasses:['shotgun'],magBonus:2,reloadMult:1.08},
 shell_quick:{kind:'part',key:'shell_quick',slot:'mag',name:'샷건 퀵로더',price:470,compatibleClasses:['shotgun'],reloadMult:.72},
 laser:{kind:'part',key:'laser',slot:'tactical',name:'전술 레이저',price:380,compatibleClasses:['pistol','smg','ar','battle','shotgun','dmr'],spreadMult:.72},
 flashlight:{kind:'part',key:'flashlight',slot:'tactical',name:'고광량 전술 라이트',price:310,compatibleClasses:['pistol','smg','ar','battle','shotgun'],visionBonus:1},
 rangefinder:{kind:'part',key:'rangefinder',slot:'tactical',name:'레이저 거리측정기',price:620,compatibleClasses:['battle','dmr','sniper'],visionBonus:1,viewLead:80,spreadMult:.92}
};

export function weaponAcceptsPart(weapon,part){const d=part?.key?WEAPON_PARTS[part.key]:part;if(!weapon||weapon.kind!=='weapon'||!d)return false;const cls=WEAPONS[weapon.type]?.class;return (d.compatible||[]).includes(weapon.type)||(d.compatibleClasses||[]).includes(cls)}
export function weaponPartEffects(weapon){const out={spreadMult:1,recoilMult:1,magMult:1,magBonus:0,visionBonus:0,viewLead:0,reloadMult:1,soundMult:1,moveMult:1};for(const part of Object.values(weapon?.parts||{})){const d=part?.key?WEAPON_PARTS[part.key]:null;if(!d)continue;if(d.spreadMult)out.spreadMult*=d.spreadMult;if(d.recoilMult)out.recoilMult*=d.recoilMult;if(d.magMult)out.magMult*=d.magMult;if(d.magBonus)out.magBonus+=d.magBonus;if(d.visionBonus)out.visionBonus+=d.visionBonus;if(d.viewLead)out.viewLead=Math.max(out.viewLead,d.viewLead);if(d.reloadMult)out.reloadMult*=d.reloadMult;if(d.soundMult)out.soundMult*=d.soundMult;if(d.moveMult)out.moveMult*=d.moveMult}return out}
export function weaponMagCapacity(weapon){if(!weapon?.type||!WEAPONS[weapon.type])return 0;const d=WEAPONS[weapon.type],e=weaponPartEffects(weapon);return Math.max(1,Math.round(d.mag*e.magMult+e.magBonus))}
export function weaponReloadTime(weapon){if(!weapon?.type||!WEAPONS[weapon.type])return 0;return WEAPONS[weapon.type].reload*weaponPartEffects(weapon).reloadMult}"""
s, n = re.subn(r"export const WEAPON_PARTS=\{.*?export function weaponMagCapacity\(weapon\)\{.*?\}\n", parts + "\n", s, count=1, flags=re.S)
if n != 1: raise SystemExit('failed parts block')

s = rep(s, "const primary=normalizeItem(load.primary||weaponItem(kind==='scav'?'pistol':'ar',kind==='pmc'?1.04:1));", "const primary=normalizeItem(load.primary||weaponItem(kind==='scav'?'pistol':'ar',kind==='pmc'?1.04:1));", 'actor anchor')
s = rep(s, "visionLevel:load.visionLevel||3,recoil:0};", "visionLevel:load.visionLevel||3,recoil:0,secureItemId:load.secureItemId||null};", 'actor secure id')

old_roll = "if(Math.random()<.12)out.push(weaponItem(['smg','ar','shotgun','dmr'][i%4],1+.04*Math.random(),1+Math.floor(Math.random()*2)));return out}"
new_roll = "if(Math.random()<.15){const guns=['pistol','smg','mp5','vector','ar','m4','scar','shotgun','saiga','dmr','m700'];out.push(weaponItem(guns[(i+Math.floor(Math.random()*guns.length))%guns.length],1+.04*Math.random(),1+Math.floor(Math.random()*2)))}return out}"
s = rep(s, old_roll, new_roll, 'crate weapon pool')

s = rep(s, "const pmc=(w.aiSpawnSeq%4===0),kind=pmc?'pmc':'scav',guns=pmc?['ar','dmr','smg']:['smg','shotgun','pistol','ar'];", "const pmc=(w.aiSpawnSeq%4===0),kind=pmc?'pmc':'scav',guns=pmc?['ar','m4','scar','dmr','m700','vector']:['smg','mp5','shotgun','saiga','pistol','ar'];", 'AI arsenal')

s = rep(s, "const s=pickHumanSpawn(w),team=`human-${uid('team')}`,a=makeActor('player',s.x,s.y,team,{name:pc.name||'PLAYER',primary:pc.equipment?.primary,secondary:pc.equipment?.secondary,armor:pc.equipment?.armor,helmet:pc.equipment?.helmet,backpack:pc.equipment?.backpack,inventory:pc.inventory||[],visionLevel:pc.visionLevel||3});", "const s=pickHumanSpawn(w),team=`human-${uid('team')}`,a=makeActor('player',s.x,s.y,team,{name:pc.name||'PLAYER',primary:pc.equipment?.primary,secondary:pc.equipment?.secondary,armor:pc.equipment?.armor,helmet:pc.equipment?.helmet,backpack:pc.equipment?.backpack,inventory:pc.inventory||[],visionLevel:pc.visionLevel||3,secureItemId:pc.secureItemId||null});", 'human secure load')

old_restore = "export function restoreHumanPlayer(w,state={}){const gear=state.gear||{},id=addHumanPlayer(w,{name:state.name||'PLAYER',equipment:{primary:gear.primary||null,secondary:gear.secondary||null,armor:gear.armor||null,helmet:gear.helmet||null,backpack:gear.backpack||null},inventory:state.inventory||[],visionLevel:state.baseVisionLevel||state.visionLevel||3}),a=getActor(w,id);if(!a)return id;const q=nearestFreePoint(w,Number(state.x)||a.x,Number(state.y)||a.y,a.r,300);if(q){a.x=q.x;a.y=q.y}a.hp=clamp(Number(state.hp)||a.hp,1,a.maxHp);a.kills=Math.max(0,Number(state.kills)||0);a.weaponSlot=state.weaponSlot==='secondary'&&a.gear.secondary?'secondary':'primary';a.recoil=Math.max(0,Number(state.recoil)||0);return id}"
new_restore = "export function restoreHumanPlayer(w,state={}){const gear=state.gear||{},id=addHumanPlayer(w,{name:state.name||'PLAYER',equipment:{primary:gear.primary||null,secondary:gear.secondary||null,armor:gear.armor||null,helmet:gear.helmet||null,backpack:gear.backpack||null},inventory:state.inventory||[],visionLevel:state.baseVisionLevel||state.visionLevel||3,secureItemId:state.secureItemId||null}),a=getActor(w,id);if(!a)return id;const q=nearestFreePoint(w,Number(state.x)||a.x,Number(state.y)||a.y,a.r,300);if(q){a.x=q.x;a.y=q.y}a.hp=clamp(Number(state.hp)||a.hp,1,a.maxHp);a.kills=Math.max(0,Number(state.kills)||0);a.weaponSlot=state.weaponSlot==='secondary'&&a.gear.secondary?'secondary':'primary';a.recoil=Math.max(0,Number(state.recoil)||0);if(a.secureItemId&&!a.inventory.some(i=>i.id===a.secureItemId))a.secureItemId=null;return id}"
s = rep(s, old_restore, new_restore, 'restore secure')

s = rep(s, "if(a.reload>0||gun.ammo>=cap||!tier)return;a.reload=d.reload;a.reloadTier=tier", "if(a.reload>0||gun.ammo>=cap||!tier)return;a.reload=weaponReloadTime(gun);a.reloadTier=tier", 'reload attachment speed')
s = rep(s, "if(it.qty<=0)a.inventory.splice(i,1)", "if(it.qty<=0){if(a.secureItemId===it.id)a.secureItemId=null;a.inventory.splice(i,1)}", 'ammo secure consume')
s = rep(s, "addSound(w,a.x,a.y,d.sound,'gunshot',a.id);", "addSound(w,a.x,a.y,d.sound*parts.soundMult,'gunshot',a.id);", 'suppressor sound')

old_kill = "function killActor(w,a,source){if(a.dead)return;a.dead=true;const killer=getActor(w,source);if(killer)killer.kills++;const items=[];for(const k of ['primary','secondary','armor','helmet','backpack'])if(a.gear[k])items.push(normalizeItem(a.gear[k]));items.push(...a.inventory.map(normalizeItem));if(a.kind==='player')items.push(valuable((a.name||'PLAYER')+' 인식표',350));w.corpses.push({id:uid('corpse'),kind:'corpse',x:a.x,y:a.y,r:20,ownerName:a.name,items});emit(w,'kill',{killer:killer?.name||'UNKNOWN',victim:a.name,playerKill:killer?.kind==='player'});if(a.kind==='player')w.results[a.id]={status:'dead',reason:'사망',kills:a.kills,lootValue:0}}"
new_kill = "function killActor(w,a,source){if(a.dead)return;a.dead=true;const killer=getActor(w,source);if(killer)killer.kills++;const secure=a.kind==='player'&&a.secureItemId?a.inventory.find(i=>i.id===a.secureItemId):null,items=[];for(const k of ['primary','secondary','armor','helmet','backpack'])if(a.gear[k])items.push(normalizeItem(a.gear[k]));items.push(...a.inventory.filter(i=>!secure||i.id!==secure.id).map(normalizeItem));if(a.kind==='player')items.push(valuable((a.name||'PLAYER')+' 인식표',350));w.corpses.push({id:uid('corpse'),kind:'corpse',x:a.x,y:a.y,r:20,ownerName:a.name,items});emit(w,'kill',{killer:killer?.name||'UNKNOWN',victim:a.name,playerKill:killer?.kind==='player'});if(a.kind==='player')w.results[a.id]={status:'dead',reason:'사망',kills:a.kills,lootValue:0,secureItem:secure?copy(secure):null}}"
s = rep(s, old_kill, new_kill, 'safe death drop')

old_equip = "function applyBagEquip(p,index){const it=p.inventory[index];if(!it)return false;if(it.kind==='weapon'){const slot=!p.gear.primary?'primary':!p.gear.secondary?'secondary':(p.weaponSlot||'primary'),old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);p.reload=0;return true}if(it.kind==='armor'||it.kind==='helmet'||it.kind==='backpack'){const slot=it.kind,old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);return true}return false}"
new_equip = "function applyBagEquip(p,index){const it=p.inventory[index];if(!it)return false;if(p.secureItemId===it.id)p.secureItemId=null;if(it.kind==='weapon'){const slot=!p.gear.primary?'primary':!p.gear.secondary?'secondary':(p.weaponSlot||'primary'),old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);p.reload=0;return true}if(it.kind==='armor'||it.kind==='helmet'||it.kind==='backpack'){const slot=it.kind,old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);return true}return false}"
s = rep(s, old_equip, new_equip, 'secure equip clear')
s = rep(s, "const g=p.inventory.splice(i,1)[0],v=norm", "const g=p.inventory.splice(i,1)[0];if(p.secureItemId===g.id)p.secureItemId=null;const v=norm", 'grenade secure consume')
s = rep(s, "const m=p.inventory.splice(i,1)[0],before=p.hp;", "const m=p.inventory.splice(i,1)[0],before=p.hp;if(p.secureItemId===m.id)p.secureItemId=null;", 'med secure consume')

old_action_tail = "}else if(action.type===ACTIONS.DISCARD_ITEM){const i=p.inventory.findIndex(x=>x.id===action.itemId);if(i>=0){const [it]=p.inventory.splice(i,1);emit(w,'discard',{recipient:id,item:it.name||'아이템'})}}else if(action.type===ACTIONS.GRENADE)throwGrenade(w,p);else if(action.type===ACTIONS.USE_MED)useMed(w,p)}"
new_action_tail = "}else if(action.type===ACTIONS.SECURE_ITEM){const it=p.inventory.find(x=>x.id===action.itemId);if(!it)return;p.secureItemId=p.secureItemId===it.id?null:it.id;emit(w,'secure',{recipient:id,item:it.name||'아이템',active:!!p.secureItemId})}else if(action.type===ACTIONS.DISCARD_ITEM){const i=p.inventory.findIndex(x=>x.id===action.itemId);if(i>=0){const [it]=p.inventory.splice(i,1);if(p.secureItemId===it.id)p.secureItemId=null;emit(w,'discard',{recipient:id,item:it.name||'아이템'})}}else if(action.type===ACTIONS.GRENADE)throwGrenade(w,p);else if(action.type===ACTIONS.USE_MED)useMed(w,p)}"
s = rep(s, old_action_tail, new_action_tail, 'secure action')

s = rep(s, "const sp=p.moveSpeed*(inp.sprint&&!healing?1.48:1)*(healing?0.55:1);", "const sp=p.moveSpeed*weaponPartEffects(currentWeapon(p)).moveMult*(inp.sprint&&!healing?1.48:1)*(healing?0.55:1);", 'stock mobility')
s = rep(s, "desired=gun.type==='shotgun'?145:gun.type==='dmr'?520:a.kind==='pmc'?330:250;", "desired=def.class==='shotgun'?150:def.class==='sniper'?650:def.class==='dmr'?520:def.class==='battle'?410:a.kind==='pmc'?330:250;", 'AI weapon class range')

s = rep(s, "w.results[id]={status:'dead',reason:'시간 초과',kills:p?.kills||0,lootValue:0}", "w.results[id]={status:'dead',reason:'시간 초과',kills:p?.kills||0,lootValue:0,secureItem:p?.secureItemId?copy(p.inventory.find(i=>i.id===p.secureItemId)||null):null}", 'timeout safe item')
s = rep(s, "weaponSlot:p.weaponSlot,weapon:publicItem(gun)", "weaponSlot:p.weaponSlot,secureItemId:p.secureItemId||null,weapon:publicItem(gun)", 'snapshot secure id')
p.write_text(s, encoding='utf-8')

# ---------------- protocol ----------------
p = Path('src/protocol.js')
s = p.read_text(encoding='utf-8')
s = rep(s, "SWAP_WEAPON:'swap_weapon',GRENADE:'grenade',USE_MED:'use_med',DISCARD_ITEM:'discard_item'", "SWAP_WEAPON:'swap_weapon',GRENADE:'grenade',USE_MED:'use_med',SECURE_ITEM:'secure_item',DISCARD_ITEM:'discard_item'", 'protocol secure')
p.write_text(s, encoding='utf-8')

# ---------------- reconnect snapshot recovery ----------------
p = Path('src/net.js')
s = p.read_text(encoding='utf-8')
s = rep(s, "weaponSlot:p.weaponSlot,recoil:p.recoil||0,gear:p.gear,inventory:p.inventory", "weaponSlot:p.weaponSlot,recoil:p.recoil||0,secureItemId:p.secureItemId||null,gear:p.gear,inventory:p.inventory", 'net secure recovery')
p.write_text(s, encoding='utf-8')

# ---------------- client UI ----------------
p = Path('src/main.js')
m = p.read_text(encoding='utf-8')
m = rep(m, "weaponAcceptsPart,weaponPartEffects,weaponMagCapacity,AMMO_TIERS", "weaponAcceptsPart,weaponPartEffects,weaponMagCapacity,weaponReloadTime,AMMO_TIERS", 'import reload time')

old_desc = "const weaponDesc={pistol:'저렴한 반자동 보조무기',smg:'근거리 압박용 고연사 기관단총',ar:'근·중거리 범용 돌격소총',shotgun:'실내와 코너전에 강한 근접 화력',dmr:'중·장거리 정밀 사격용 고화력 소총'};"
new_desc = "const weaponClassDesc={pistol:'휴대성이 좋은 반자동 보조무기',smg:'근거리 고연사 기관단총',ar:'근·중거리 범용 돌격소총',battle:'고화력 전투소총',shotgun:'실내와 코너전에 강한 산탄총',dmr:'중·장거리 정밀 사격용 지정사수소총',sniper:'장거리 단발 고화력 저격소총'};const weaponDescription=type=>weaponClassDesc[WEAPONS[type]?.class]||'커스텀 화기';"
m = rep(m, old_desc, new_desc, 'weapon descriptions')
m = rep(m, "return`${weaponDesc[it.type]} ·", "return`${weaponDescription(it.type)} ·", 'weapon item desc')
m = rep(m, "· 반동 ×${fx.recoilMult.toFixed(2)} · 집탄 ×${fx.spreadMult.toFixed(2)} · 현재 T", "· 반동 ×${fx.recoilMult.toFixed(2)} · 집탄 ×${fx.spreadMult.toFixed(2)} · 재장전 ${weaponReloadTime(it).toFixed(2)}s · 소음 ×${fx.soundMult.toFixed(2)} · 이동 ×${fx.moveMult.toFixed(2)} · 현재 T", 'weapon attachment stat text')

old_part_meta = "if(d.recoilMult)stats.push(`반동 ×${d.recoilMult}`);return`${d.slot==='optic'?'조준경':d.slot==='mag'?'탄창':'손잡이'} · ${stats.join(' · ')} · 호환 ${(d.compatible||[]).map(k=>WEAPONS[k]?.name||k).join(', ')}`"
new_part_meta = "if(d.recoilMult)stats.push(`반동 ×${d.recoilMult}`);if(d.reloadMult)stats.push(`재장전 ×${d.reloadMult}`);if(d.soundMult)stats.push(`소음 ×${d.soundMult}`);if(d.moveMult)stats.push(`이동 ×${d.moveMult}`);const slotLabel={optic:'조준경',muzzle:'총구',grip:'손잡이',stock:'개머리판',mag:'탄창',tactical:'전술장비'}[d.slot]||d.slot,compat=[...new Set([...(d.compatible||[]),...Object.entries(WEAPONS).filter(([,w])=>(d.compatibleClasses||[]).includes(w.class)).map(([k])=>k)])];return`${slotLabel} · ${stats.join(' · ')} · 호환 ${compat.map(k=>WEAPONS[k]?.name||k).join(', ')}`"
m = rep(m, old_part_meta, new_part_meta, 'part meta expanded')

m = rep(m, "function sellFromStash(i){const it=meta.stash[i],price=sellPrice(it);if(!it||price<=0)return;meta.money+=price;meta.stash.splice(i,1);save();renderLobby()}", "function sellFromStash(i){const it=meta.stash[i],price=sellPrice(it);if(!it||price<=0)return;meta.money+=price;meta.stash.splice(i,1);save();renderLobby()}\nfunction secureItemFromSnapshot(){const p=snap?.player,id=p?.secureItemId;return id?p.inventory?.find(i=>i.id===id)||null:null}\nfunction restoreSecureItem(it){if(!it)return false;const all=[...(meta.inventory||[]),...(meta.stash||[])];if(all.some(x=>x?.id===it.id))return false;addMetaItemStacked(meta.stash,cp(it));save();return true}", 'secure client helpers')

old_result = "function handleResult(r){lastResultHandled=true;if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();if(session===realtime)realtime.leave();else session?.close();session=null;if(r.status==='extracted'){meta.equipment=r.equipment||{primary:null,secondary:null,armor:null,helmet:null,backpack:null};const cap=12,items=compactMetaAmmo(r.items||[]);meta.inventory=items.slice(0,cap);for(const it of items.slice(cap))addMetaItemStacked(meta.stash,it);save()}showResult(r.status==='extracted',r)}"
new_result = "function handleResult(r){lastResultHandled=true;if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();if(session===realtime)realtime.leave();else session?.close();session=null;if(r.status==='extracted'){meta.equipment=r.equipment||{primary:null,secondary:null,armor:null,helmet:null,backpack:null};const cap=12,items=compactMetaAmmo(r.items||[]);meta.inventory=items.slice(0,cap);for(const it of items.slice(cap))addMetaItemStacked(meta.stash,it);save()}else restoreSecureItem(r.secureItem||secureItemFromSnapshot());showResult(r.status==='extracted',r)}"
m = rep(m, old_result, new_result, 'result secure restore')
m = rep(m, "`${r.reason} · 출격 장비와 전리품 상실`", "`${r.reason} · 출격 장비와 전리품 상실${r.secureItem?' · 안전칸 1개 회수':''}`", 'result message safe')

old_abandon = "if(confirm('출격 장비와 전리품을 모두 포기할까요?')){if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();if(session===realtime)realtime.leave();"
new_abandon = "if(confirm('출격 장비와 전리품을 모두 포기할까요? 안전칸 지정 아이템 1개는 보존됩니다.')){restoreSecureItem(secureItemFromSnapshot());if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();if(session===realtime)realtime.leave();"
m = rep(m, old_abandon, new_abandon, 'abandon secure restore')

m = rep(m, "if(e.type==='loot')toast(`획득: ${e.item}`);", "if(e.type==='secure')toast(e.active?`안전칸 지정: ${e.item}`:`안전칸 해제: ${e.item}`);if(e.type==='loot')toast(`획득: ${e.item}`);", 'secure toast')

old_bag_head = "function renderBag(){const inv=snap.player.inventory,key=snap.player.bagCapacity+'|'+inv.map(it=>`${it.id}:${it.ammo??''}:${it.qty??''}:${it.tier??''}:${it.ammoTier??''}`).join(',');"
new_bag_head = "function renderBag(){const inv=snap.player.inventory,key=snap.player.bagCapacity+'|secure:'+String(snap.player.secureItemId||'')+'|'+inv.map(it=>`${it.id}:${it.ammo??''}:${it.qty??''}:${it.tier??''}:${it.ammoTier??''}`).join(',');"
m = rep(m, old_bag_head, new_bag_head, 'bag key secure')

old_bag_item = "if(it){d.innerHTML=`<b>${itemName(it)}</b><small>${itemSub(it)}</small>`;const actions=document.createElement('div');"
new_bag_item = "if(it){const isSecure=it.id===snap.player.secureItemId;if(isSecure){d.style.borderColor='rgba(87,220,164,.95)';d.style.boxShadow='0 0 0 1px rgba(87,220,164,.35) inset'}d.innerHTML=`<b>${isSecure?'🔒 ':''}${itemName(it)}</b><small>${itemSub(it)}${isSecure?' · 사망 시 보존':''}</small>`;const actions=document.createElement('div');"
m = rep(m, old_bag_item, new_bag_item, 'bag secure visual')

old_drop = "const drop=document.createElement('button');drop.textContent='버리기';"
new_drop = "const secure=document.createElement('button');secure.textContent=it.id===snap.player.secureItemId?'안전칸 해제':'안전칸 지정';secure.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.SECURE_ITEM,itemId:it.id})};actions.appendChild(secure);const drop=document.createElement('button');drop.textContent='버리기';"
m = rep(m, old_drop, new_drop, 'secure bag button')

old_disconnect = "realtime.on('disconnect',x=>{if(session===realtime&&!lastResultHandled){lastResultHandled=true;session=null;if(document.pointerLockElement)document.exitPointerLock?.();showResult(false,{reason:x?.reason||'멀티 서버 연결 끊김',kills:snap?.player?.kills||0,lootValue:0})}})"
new_disconnect = "realtime.on('disconnect',x=>{if(session===realtime&&!lastResultHandled){restoreSecureItem(secureItemFromSnapshot());lastResultHandled=true;session=null;if(document.pointerLockElement)document.exitPointerLock?.();showResult(false,{reason:x?.reason||'멀티 서버 연결 끊김',kills:snap?.player?.kills||0,lootValue:0,secureItem:secureItemFromSnapshot()})}})"
m = rep(m, old_disconnect, new_disconnect, 'disconnect secure restore')

# audio profile by weapon class
old_shot = "function shotSound(type,volume=1){if(!audioCtx)return;const d={pistol:[.035,360],smg:[.026,430],ar:[.045,300],shotgun:[.075,170],dmr:[.06,220]}[type]||[.04,300];"
new_shot = "function shotSound(type,volume=1){if(!audioCtx)return;const cls=WEAPONS[type]?.class||type,d={pistol:[.035,360],smg:[.026,430],ar:[.045,300],battle:[.06,235],shotgun:[.075,170],dmr:[.06,220],sniper:[.08,155]}[cls]||[.04,300];"
m = rep(m, old_shot, new_shot, 'shot audio class')
m = rep(m, "const key=type==='shotgun'?'reloadShotgun':type==='ar'||type==='dmr'?'reloadRifle':'reloadPistol';", "const cls=WEAPONS[type]?.class||type,key=cls==='shotgun'?'reloadShotgun':['ar','battle','dmr','sniper'].includes(cls)?'reloadRifle':'reloadPistol';", 'reload audio class')
m = rep(m, "playSample(type==='ar'||type==='dmr'?'reloadGeneric2':'reloadGeneric',.5,1)", "playSample(['ar','battle','dmr','sniper'].includes(cls)?'reloadGeneric2':'reloadGeneric',.5,1)", 'reload fallback class')

m = rep(m, "const reload=Math.max(0,reloadBase-age),dur=WEAPONS[weaponType].reload||1;", "const reload=Math.max(0,reloadBase-age),dur=weaponReloadTime(snap.player.weapon)||WEAPONS[weaponType].reload||1;", 'reload progress parts')
p.write_text(m, encoding='utf-8')

print('v3.5 arsenal + secure slot patch applied')