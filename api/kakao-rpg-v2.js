import { getCache } from '@vercel/functions';

const PLAYER_PREFIX = 'kakao-rpg-v2:player:';
const TTL = 60 * 60 * 24 * 365;
const INV_MAX = 30;
const MAX_ENH = 15;

const TREE = {
  sword:{n:'검술',max:10}, bow:{n:'궁술',max:10}, heavy:{n:'중무기',max:10},
  spear:{n:'창술',max:10}, dual:{n:'쌍검술',max:10}, magic:{n:'마력',max:10},
  defense:{n:'방어',max:10}, agility:{n:'기동',max:10}, energy:{n:'에너지',max:10}, survival:{n:'생존',max:10}
};
const TREE_BY_NAME = Object.fromEntries(Object.entries(TREE).map(([k,v])=>[v.n,k]));

const ITEM = {
  starter_sword:{n:'낡은 장검',slot:'weapon',wt:'sword',buy:0,sell:60,st:{atk:8}},
  starter_armor:{n:'천 갑옷',slot:'armor',buy:0,sell:40,st:{hp:25,def:3}},
  starter_boots:{n:'낡은 장화',slot:'shoes',buy:0,sell:30,st:{spd:5}},
  starter_ring:{n:'구리 반지',slot:'accessory',buy:0,sell:25,st:{hp:10}},

  iron_sword:{n:'철제 장검',slot:'weapon',wt:'sword',buy:450,sell:180,st:{atk:14}},
  hunter_bow:{n:'사냥꾼의 활',slot:'weapon',wt:'bow',buy:520,sell:210,st:{atk:12,spd:4,crit:.04}},
  iron_greatsword:{n:'철제 대검',slot:'weapon',wt:'greatsword',buy:620,sell:250,st:{atk:21,spd:-7}},
  iron_spear:{n:'철제 창',slot:'weapon',wt:'spear',buy:560,sell:225,st:{atk:15,def:2}},
  twin_blades:{n:'쌍철검',slot:'weapon',wt:'dual',buy:590,sell:235,st:{atk:11,spd:9,crit:.03}},
  novice_staff:{n:'견습 마도 스태프',slot:'weapon',wt:'staff',buy:680,sell:270,st:{atk:16,maxEnergy:1}},
  leather_armor:{n:'가죽 갑옷',slot:'armor',buy:420,sell:170,st:{hp:45,def:7}},
  iron_armor:{n:'철제 갑옷',slot:'armor',buy:720,sell:290,st:{hp:70,def:12,spd:-4}},
  runner_boots:{n:'질주의 장화',slot:'shoes',buy:440,sell:175,st:{spd:14}},
  energy_ring:{n:'푸른 에너지 반지',slot:'accessory',buy:760,sell:300,st:{maxEnergy:1,hp:15}},

  slime_charm:{n:'응축 점액 부적',slot:'accessory',buy:null,sell:190,st:{hp:25,maxEnergy:1}},
  goblin_dagger:{n:'고블린 단검',slot:'weapon',wt:'dagger',buy:null,sell:240,st:{atk:12,spd:12,crit:.06}},
  wolf_boots:{n:'늑대가죽 장화',slot:'shoes',buy:null,sell:260,st:{spd:18,hp:15}},
  orc_axe:{n:'오크 전투도끼',slot:'weapon',wt:'axe',buy:null,sell:330,st:{atk:24,def:3,spd:-3}},
  shaman_staff:{n:'주술사의 스태프',slot:'weapon',wt:'staff',buy:null,sell:360,st:{atk:20,maxEnergy:1,crit:.03}}
};
const SHOP = ['iron_sword','hunter_bow','iron_greatsword','iron_spear','twin_blades','novice_staff','leather_armor','iron_armor','runner_boots','energy_ring'];
const DROP_BY_MON = {
  '푸른 슬라임':'slime_charm','고블린':'goblin_dagger','굶주린 늑대':'wolf_boots','오크 전사':'orc_axe','숲 주술사':'shaman_staff'
};

const SKILL = {
  heavy_strike:{n:'강타',c:2,m:1.75,h:1,p:0,weapons:null},
  rapid_strike:{n:'연속타',c:3,m:.68,h:3,p:0,weapons:null},
  break_strike:{n:'분쇄',c:3,m:1.45,h:1,p:.35,weapons:null},
  sword_flow:{n:'검의 흐름',c:2,m:1.45,h:2,p:.10,weapons:['sword'],tree:'sword',rank:2},
  piercing_arrow:{n:'관통사격',c:2,m:1.85,h:1,p:.45,weapons:['bow'],tree:'bow',rank:2},
  giant_crush:{n:'거신분쇄',c:4,m:2.65,h:1,p:.20,weapons:['greatsword','axe','hammer'],tree:'heavy',rank:2},
  spear_thrust:{n:'연환찌르기',c:3,m:.82,h:3,p:.22,weapons:['spear'],tree:'spear',rank:2},
  twin_flurry:{n:'쌍검난무',c:4,m:.46,h:6,p:0,weapons:['dual','dagger'],tree:'dual',rank:2},
  fire_ball:{n:'화염구',c:2,m:1.90,h:1,p:.15,weapons:['staff','wand'],tree:'magic',rank:2},
  lightning:{n:'낙뢰',c:3,m:2.35,h:1,p:.25,weapons:['staff','wand'],tree:'magic',rank:4}
};
const SKILL_BY_NAME = Object.fromEntries(Object.entries(SKILL).map(([k,v])=>[v.n,k]));

const MON = [
  {n:'푸른 슬라임',hp:72,a:18,d:5,s:78,g:[16,28],m:'점액',xp:20},
  {n:'고블린',hp:96,a:24,d:9,s:104,g:[24,38],m:'고블린 가죽',xp:28},
  {n:'굶주린 늑대',hp:82,a:22,d:6,s:132,g:[20,34],m:'늑대 이빨',xp:30},
  {n:'오크 전사',hp:148,a:34,d:17,s:76,g:[38,58],m:'오크 철편',xp:42},
  {n:'숲 주술사',hp:92,a:29,d:8,s:96,g:[34,52],m:'주술 가루',xp:45}
];

function itemId(){ return 'ITM_'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,7).toUpperCase(); }
function makeItem(tpl,enh=0){ return {id:itemId(),tpl,enh}; }
function baseTree(){ return Object.fromEntries(Object.keys(TREE).map(k=>[k,0])); }
function fresh(identity){
  return {
    schema:2, seed:(Date.now()>>>0)||1,
    account:{createdAt:Date.now(),keyType:identity.type},
    level:1, exp:0, gold:1200, skillPoints:5,
    tree:baseTree(), loadout:['heavy_strike','rapid_strike','break_strike'], materials:{},
    equipment:{
      weapon:makeItem('starter_sword'), armor:makeItem('starter_armor'),
      shoes:makeItem('starter_boots'), accessory:makeItem('starter_ring')
    },
    inventory:[], run:null, last:'캐릭터가 생성되었습니다. /상태 로 확인해보세요.'
  };
}
function rnd(p){ p.seed=(p.seed*1664525+1013904223)>>>0; return p.seed/4294967296; }
function ri(p,a,b){ return Math.floor(a+rnd(p)*(b-a+1)); }
function add(o,k,v){ o[k]=(o[k]||0)+v; }
function safeKey(v){ return String(v||'').replace(/[^a-zA-Z0-9:_-]/g,'').slice(0,180); }
function identity(body){
  const u=body&&body.userRequest&&body.userRequest.user||{};
  const pr=u.properties||{};
  if(pr.appUserId) return {key:safeKey(pr.appUserId),type:'APP'};
  if(pr.botUserKey) return {key:safeKey(pr.botUserKey),type:'BOT'};
  if(pr.bot_user_key) return {key:safeKey(pr.bot_user_key),type:'BOT'};
  if(u.id) return {key:safeKey(u.id),type:'USER'};
  return {key:'',type:'NONE'};
}
function utter(body){ return String(body&&body.userRequest&&body.userRequest.utterance||'').trim().replace(/^//,''); }
async function load(cache,id){
  let x=await cache.get(PLAYER_PREFIX+id.key);
  if(!x) return fresh(id);
  if(typeof x==='string'){ try{x=JSON.parse(x);}catch{return fresh(id);} }
  x.account=x.account||{};x.account.keyType=id.type;
  x.tree=Object.assign(baseTree(),x.tree||{});x.inventory=Array.isArray(x.inventory)?x.inventory:[];
  x.loadout=Array.isArray(x.loadout)&&x.loadout.length===3?x.loadout:['heavy_strike','rapid_strike','break_strike'];
  x.materials=x.materials||{};x.equipment=x.equipment||{};
  return x;
}
async function save(cache,id,p){ await cache.set(PLAYER_PREFIX+id.key,p,{ttl:TTL,name:'Kakao RPG v2 Player'}); }

function itemTemplate(it){ return it&&ITEM[it.tpl]; }
function enhancedStats(it){
  const t=itemTemplate(it); if(!t)return {};
  const out={...t.st},e=it.enh||0;
  for(const k of ['atk','def','hp']) if(out[k]) out[k]=Math.round(out[k]*(1+e*.10));
  if(out.spd) out.spd=Math.round(out.spd*(1+e*.05));
  return out;
}
function weaponFamily(wt){
  if(wt==='sword')return 'sword'; if(wt==='bow')return 'bow';
  if(['greatsword','axe','hammer'].includes(wt))return 'heavy'; if(wt==='spear')return 'spear';
  if(['dual','dagger'].includes(wt))return 'dual'; if(['staff','wand'].includes(wt))return 'magic';
  return null;
}
function stats(p){
  let s={hp:300+(p.level-1)*20,atk:38+(p.level-1)*3,def:8+(p.level-1),spd:100+Math.floor((p.level-1)/2),maxEnergy:5+Math.floor((p.level-1)/10),crit:.05};
  for(const it of Object.values(p.equipment||{})){
    const st=enhancedStats(it);for(const k of ['hp','atk','def','spd','maxEnergy','crit'])if(st[k])s[k]+=st[k];
  }
  s.hp+=p.tree.survival*12;s.def+=p.tree.defense*2;s.spd+=p.tree.agility*3;s.maxEnergy+=Math.floor(p.tree.energy/3);
  const wt=itemTemplate(p.equipment.weapon)?.wt; const fam=weaponFamily(wt); if(fam)s.atk=Math.round(s.atk*(1+p.tree[fam]*.03));
  s.atk=Math.round(s.atk);s.hp=Math.round(s.hp);s.def=Math.round(s.def);s.spd=Math.round(s.spd);s.maxEnergy=Math.max(1,Math.round(s.maxEnergy));
  return s;
}
function itemName(it){ const t=itemTemplate(it);return t?(it.enh?('+'+it.enh+' '):'')+t.n:'알 수 없는 장비'; }
function slotName(x){ return {weapon:'무기',armor:'갑옷',shoes:'신발',accessory:'장신구'}[x]||x; }
function statText(it){
  const s=enhancedStats(it),a=[];
  if(s.atk)a.push('공격+'+s.atk);if(s.def)a.push('방어+'+s.def);if(s.hp)a.push('HP+'+s.hp);if(s.spd)a.push('속도'+(s.spd>0?'+':'')+s.spd);if(s.maxEnergy)a.push('에너지+'+s.maxEnergy);if(s.crit)a.push('치명+'+Math.round(s.crit*100)+'%');
  return a.join(' ');
}
function sellPrice(it){ const t=itemTemplate(it);return Math.round((t?.sell||0)*(1+(it.enh||0)*.08)); }
function enhCost(it){ const t=itemTemplate(it);const n=(it.enh||0)+1;return Math.max(80,Math.round((t?.sell||100)*(.7+n*.35))); }
function enhStone(it){ const n=(it.enh||0)+1;return n<5?0:Math.floor((n-2)/3); }
function enhChance(it){ const n=(it.enh||0)+1;if(n<=3)return 1;if(n<=6)return .85;if(n<=9)return .7;if(n<=12)return .55;return .4; }
function itemAt(p,n){ return p.inventory[n-1]||null; }
function findEquipped(p,word){
  const map={무기:'weapon',갑옷:'armor',신발:'shoes',장신구:'accessory'}; const slot=map[word];return slot?{slot,it:p.equipment[slot]}:null;
}

function gainExp(p,xp){
  let levels=0;p.exp+=xp;
  while(p.exp>=100*p.level){p.exp-=100*p.level;p.level++;p.skillPoints++;levels++;}
  return levels;
}
function unlockedSkills(p){
  return Object.entries(SKILL).filter(([id,s])=>!s.tree||p.tree[s.tree]>=s.rank).map(([id,s])=>({id,...s}));
}
function skillUsable(p,id){
  const sk=SKILL[id];if(!sk)return false;
  if(sk.tree&&p.tree[sk.tree]<sk.rank)return false;
  const wt=itemTemplate(p.equipment.weapon)?.wt;
  return !sk.weapons||sk.weapons.includes(wt);
}

function makeEncounter(p,depth){
  const max=depth<3?2:depth<6?3:4,min=depth<4?1:2,count=ri(p,min,max),out=[];
  for(let i=0;i<count;i++){
    const base=MON[ri(p,0,Math.min(MON.length-1,1+Math.floor(depth/2)))],k=1+(depth-1)*.07;
    out.push({n:base.n,hp:Math.round(base.hp*k),mh:Math.round(base.hp*k),a:Math.round(base.a*k),d:Math.round(base.d*k),s:Math.round(base.s*(1+Math.min(.25,(depth-1)*.015))),g:base.g,m:base.m,xp:Math.round(base.xp*k),ag:0});
  }
  return out;
}
function alive(r){ return r.en.filter(x=>x.hp>0); }
function target(r){ let x=r.en[r.target];if(x&&x.hp>0)return x;let i=r.en.findIndex(x=>x.hp>0);r.target=i<0?0:i;return i<0?null:r.en[i]; }
function startDungeon(p){
  const st=stats(p);p.run={mode:'battle',depth:1,hp:st.hp,e:2,pg:0,guard:false,evade:false,mul:1,en:[],target:0,pending:null,scouted:false,loot:{g:0,m:{},items:[],xp:0},last:''};
  p.run.en=makeEncounter(p,1);p.run.last='🌲 잊힌 숲 입장! 몬스터 '+p.run.en.length+'마리 조우.';advance(p);
}
function reward(p,x){
  const r=p.run,g=ri(p,x.g[0],x.g[1]);r.loot.g+=g;add(r.loot.m,x.m,1);r.loot.xp+=x.xp;
  if(rnd(p)<.16){const tpl=DROP_BY_MON[x.n];if(tpl)r.loot.items.push(makeItem(tpl));}
  if(rnd(p)<.12)add(r.loot.m,'강화석',1);
  return g+'G + '+x.m+' + '+x.xp+'EXP';
}
function ready(p){ const r=p.run,st=stats(p);r.pg=100;r.e=Math.min(st.maxEnergy,r.e+1);r.last='⚡ 행동게이지 100 → 에너지 +1 ('+r.e+'/'+st.maxEnergy+')'; }
function die(p){ const r=p.run;const lost=r.loot.g;r.hp=0;r.mode='dead';r.loot={g:0,m:{},items:[],xp:0};r.last='☠ 전투 불능! 이번 원정에서 얻은 전리품과 경험치를 전부 잃었습니다. ('+lost+'G 포함)'; }
function enemyAct(p,x){
  const r=p.run,st=stats(p),raw=x.a;
  if(r.evade){
    const ok=rnd(p)<.56;r.evade=false;
    if(ok){r.mul=2;r.last='🌪 '+x.n+' 공격 회피! 다음 공격 ×2';}
    else{r.e=Math.max(0,r.e-1);r.hp-=raw;r.last='💥 회피 실패! '+raw+' 피해 / 에너지 -1';}
  }else if(r.guard){const d=Math.max(0,raw-st.def);r.guard=false;r.hp-=d;r.last='🛡 방어! '+st.def+' 차단 → '+d+' 피해';}
  else{r.hp-=raw;r.last='👹 '+x.n+' 공격 → '+raw+' 피해';}
  if(r.hp<=0)die(p);
}
function victory(p){ const r=p.run;r.mode='camp';r.pending=makeEncounter(p,r.depth+1);r.scouted=false;r.last='✅ 조우 승리! HP '+r.hp+'/'+stats(p).hp+', 에너지 '+r.e+'/'+stats(p).maxEnergy+' 유지'; }
function advance(p){
  const r=p.run,st=stats(p);let z=0;
  while(r&&r.mode==='battle'&&z++<100){
    if(!alive(r).length){victory(p);return;}if(r.pg>=100-1e-9){ready(p);return;}
    const times=[(100-r.pg)/st.spd];alive(r).forEach(x=>times.push((100-x.ag)/x.s));const dt=Math.min(...times);
    r.pg+=st.spd*dt;alive(r).forEach(x=>x.ag+=x.s*dt);if(r.pg>=100-1e-9){ready(p);return;}
    for(const x of alive(r).filter(x=>x.ag>=100-1e-9).sort((a,b)=>b.s-a.s)){x.ag-=100;enemyAct(p,x);if(r.mode!=='battle')return;}
  }
}
function hit(p,sk){
  const r=p.run,st=stats(p),x=target(r);if(!x)return {d:0,k:false,n:'',rew:''};let total=0;
  for(let i=0;i<sk.h;i++){let d=st.atk*sk.m*(100/(100+x.d*(1-sk.p)*4))*(.93+rnd(p)*.14);if(rnd(p)<st.crit)d*=1.55;total+=Math.max(1,Math.round(d));}
  total=Math.round(total*r.mul);r.mul=1;x.hp=Math.max(0,x.hp-total);let rew=x.hp<=0?reward(p,x):'';target(r);return {d:total,k:x.hp<=0,n:x.n,rew};
}
function act(p,cmd){
  const r=p.run;if(!r||r.mode!=='battle'||r.pg<100-1e-9)return;const st=stats(p);
  if((cmd==='방어'||cmd==='회피')&&r.e<1){r.last='⚠ 에너지가 부족합니다.';return;}
  let si=cmd.match(/^스킬([1-3])$/);let skillId=si?p.loadout[+si[1]-1]:null;let sk=skillId&&SKILL[skillId];
  if(sk&&(!skillUsable(p,skillId))){r.last='⚠ 현재 무기나 테크트리로 사용할 수 없는 스킬입니다.';return;}
  if(sk&&r.e<sk.c){r.last='⚠ 에너지가 부족합니다.';return;}
  r.pg=0;
  if(cmd==='기본공격'){
    const res=hit(p,{m:1,h:1,p:0});r.e=Math.min(st.maxEnergy,r.e+1);r.last='⚔ '+res.n+' '+res.d+' 피해'+(res.k?' / 처치! '+res.rew:'')+' / 에너지 +1';
  }else if(sk){r.e-=sk.c;const res=hit(p,sk);r.last='✨ '+sk.n+'! '+res.n+' '+res.d+' 피해'+(res.k?' / 처치! '+res.rew:'');}
  else if(cmd==='방어'){r.e--;r.guard=true;r.last='🛡 방어 자세 / 에너지 -1';}
  else if(cmd==='회피'){r.evade=true;r.last='🌪 회피 준비 / 실패 시 에너지 -1';}
  else return;
  advance(p);
}
function scout(p){const r=p.run;if(!r||r.mode!=='camp')return;if(r.scouted){r.last='🔎 이미 탐사했습니다.';return;}if(r.e<2){r.last='⚠ 탐사에는 에너지 2가 필요합니다.';return;}r.e-=2;r.scouted=true;r.last='🔎 다음 조우 '+r.pending.length+'마리: '+r.pending.map(x=>x.n).join(', ');}
function goNext(p){const r=p.run;if(!r||r.mode!=='camp'||!r.pending)return;r.depth++;r.en=r.pending;r.pending=null;r.scouted=false;r.pg=0;r.guard=false;r.evade=false;r.target=0;r.mode='battle';r.last='➡ 깊이 '+r.depth+' 전진! 몬스터 '+r.en.length+'마리 조우.';advance(p);}
function retreat(p){
  const r=p.run;if(!r||r.mode!=='camp')return;const before=p.level;p.gold+=r.loot.g;Object.entries(r.loot.m).forEach(([k,v])=>add(p.materials,k,v));
  let added=0,lost=0;for(const it of r.loot.items){if(p.inventory.length<INV_MAX){p.inventory.push(it);added++;}else lost++;}
  const levels=gainExp(p,r.loot.xp),g=r.loot.g,xp=r.loot.xp;p.run=null;p.last='🏕 후퇴 성공! +'+g+'G / +'+xp+'EXP / 장비 '+added+'개 확보'+(lost?' / 가방 초과 '+lost+'개 소실':'')+(levels?' / 레벨 '+before+'→'+p.level+'! 스킬포인트 +'+levels:'');
}

function equipFromInventory(p,n){
  if(p.run){p.last='⚠ 던전 진행 중에는 장비를 변경할 수 없습니다.';return;}
  const i=n-1,it=p.inventory[i],t=itemTemplate(it);if(!it||!t){p.last='⚠ 해당 인벤토리 번호가 없습니다.';return;}
  const old=p.equipment[t.slot];p.equipment[t.slot]=it;p.inventory.splice(i,1);if(old)p.inventory.push(old);p.last='✅ '+itemName(it)+' 장착';
}
function unequip(p,word){
  if(p.run){p.last='⚠ 던전 진행 중에는 장비를 변경할 수 없습니다.';return;}
  const found=findEquipped(p,word);if(!found||!found.it){p.last='⚠ 장착된 장비가 없습니다.';return;}if(p.inventory.length>=INV_MAX){p.last='⚠ 인벤토리가 가득 찼습니다.';return;}
  p.inventory.push(found.it);p.equipment[found.slot]=null;p.last='✅ '+word+' 해제';
}
function buy(p,n){
  if(p.run){p.last='⚠ 던전 진행 중에는 상점을 이용할 수 없습니다.';return;}
  const tpl=SHOP[n-1],t=ITEM[tpl];if(!t){p.last='⚠ 상품 번호가 없습니다.';return;}if(p.inventory.length>=INV_MAX){p.last='⚠ 인벤토리가 가득 찼습니다.';return;}if(p.gold<t.buy){p.last='⚠ 골드가 부족합니다.';return;}
  p.gold-=t.buy;p.inventory.push(makeItem(tpl));p.last='🛒 '+t.n+' 구매 (-'+t.buy+'G)';
}
function sell(p,n){
  if(p.run){p.last='⚠ 던전 진행 중에는 판매할 수 없습니다.';return;}
  const i=n-1,it=p.inventory[i];if(!it){p.last='⚠ 해당 인벤토리 번호가 없습니다.';return;}const g=sellPrice(it);p.inventory.splice(i,1);p.gold+=g;p.last='💰 '+itemName(it)+' 판매 (+'+g+'G)';
}
function enhance(p,targetWord){
  if(p.run){p.last='⚠ 던전 진행 중에는 강화할 수 없습니다.';return;}
  let it=null,where='';const n=Number(targetWord);
  if(Number.isInteger(n)&&n>=1){it=itemAt(p,n);where='인벤 '+n;}else{const f=findEquipped(p,targetWord);if(f){it=f.it;where=targetWord;}}
  if(!it){p.last='⚠ 강화할 장비를 찾지 못했습니다.';return;}if((it.enh||0)>=MAX_ENH){p.last='✨ 이미 최대 강화입니다.';return;}
  const cost=enhCost(it),stone=enhStone(it);if(p.gold<cost){p.last='⚠ 강화비 '+cost+'G가 필요합니다.';return;}if((p.materials['강화석']||0)<stone){p.last='⚠ 강화석 '+stone+'개가 필요합니다.';return;}
  p.gold-=cost;if(stone)p.materials['강화석']-=stone;const chance=enhChance(it);if(rnd(p)<chance){it.enh=(it.enh||0)+1;p.last='✨ 강화 성공! '+where+' → '+itemName(it)+' ('+Math.round(chance*100)+'%)';}
  else p.last='💥 강화 실패. 장비는 유지됩니다. ('+Math.round(chance*100)+'%)';
}
function invest(p,name){
  if(p.run){p.last='⚠ 던전 진행 중에는 스킬 포인트를 분배할 수 없습니다.';return;}
  const key=TREE_BY_NAME[name];if(!key){p.last='⚠ 존재하지 않는 테크트리입니다.';return;}if(p.skillPoints<1){p.last='⚠ 스킬 포인트가 없습니다.';return;}if(p.tree[key]>=TREE[key].max){p.last='✨ 이미 최대 랭크입니다.';return;}
  p.skillPoints--;p.tree[key]++;p.last='🌟 '+TREE[key].n+' '+p.tree[key]+'/'+TREE[key].max+' 투자';
}
function setSkill(p,slot,name){
  if(p.run){p.last='⚠ 던전 진행 중에는 스킬 세팅을 변경할 수 없습니다.';return;}
  const id=SKILL_BY_NAME[name];if(!id||!unlockedSkills(p).some(x=>x.id===id)){p.last='⚠ 아직 배우지 않은 스킬입니다.';return;}p.loadout[slot-1]=id;p.last='✅ 스킬 '+slot+'번에 '+SKILL[id].n+' 장착';
}

function matsText(o){const a=Object.entries(o||{}).filter(([,v])=>v>0).map(([k,v])=>k+'x'+v);return a.length?a.join(', '):'없음';}
function qr(label,msg=label){return {label,action:'message',messageText:msg};}
function resp(text,replies=[]){return {version:'2.0',template:{outputs:[{simpleText:{text:String(text).slice(0,990)}}],...(replies.length?{quickReplies:replies.slice(0,10)}:{})}};}
function homeText(p){const s=stats(p);return ['⚔ 오픈톡 RPG v2','Lv.'+p.level+'  EXP '+p.exp+'/'+(100*p.level),'💰 '+p.gold+'G  SP '+p.skillPoints,'❤️ '+s.hp+'  ⚔ '+s.atk+'  🛡 '+s.def+'  ⏱ '+s.spd+'  ⚡ '+s.maxEnergy,'',p.last].join('\n');}
function statusText(p){const s=stats(p),w=p.equipment.weapon?itemName(p.equipment.weapon):'없음';return ['📊 캐릭터 상태','Lv.'+p.level+' EXP '+p.exp+'/'+(100*p.level),'골드 '+p.gold+'G / 스킬포인트 '+p.skillPoints,'HP '+s.hp+' / 공격 '+s.atk+' / 방어 '+s.def,'속도 '+s.spd+' / 최대에너지 '+s.maxEnergy+' / 치명 '+Math.round(s.crit*100)+'%','무기 '+w,'재료 '+matsText(p.materials),'',p.last].join('\n');}
function equipmentText(p){const lines=['🧰 장비'];for(const k of ['weapon','armor','shoes','accessory']){const it=p.equipment[k];lines.push(slotName(k)+': '+(it?itemName(it)+' · '+statText(it):'없음'));}lines.push('','/강화 무기  /강화 갑옷  /강화 신발  /강화 장신구','/해제 무기 처럼 해제 가능');return lines.join('\n');}
function inventoryText(p){const lines=['🎒 인벤토리 '+p.inventory.length+'/'+INV_MAX];if(!p.inventory.length)lines.push('비어있음');p.inventory.slice(0,18).forEach((it,i)=>lines.push((i+1)+'. '+itemName(it)+' ['+slotName(itemTemplate(it)?.slot)+'] '+statText(it)+' · 판매 '+sellPrice(it)+'G'));lines.push('','/장착 1  /판매 1  /강화 1');return lines.join('\n');}
function shopText(p){const lines=['🏪 장비 상점 · 보유 '+p.gold+'G'];SHOP.forEach((id,i)=>{const t=ITEM[id];lines.push((i+1)+'. '+t.n+' ['+slotName(t.slot)+'] '+Object.entries(t.st).map(([k,v])=>k+'+'+v).join(' ')+' · '+t.buy+'G');});lines.push('','/구매 1');return lines.join('\n');}
function skillsText(p){const lines=['🌳 테크트리 · 남은 SP '+p.skillPoints];for(const [k,t] of Object.entries(TREE))lines.push(t.n+' '+p.tree[k]+'/'+t.max);lines.push('','[장착 스킬]');p.loadout.forEach((id,i)=>lines.push((i+1)+'. '+(SKILL[id]?.n||'?')));lines.push('','[배운 액티브] '+unlockedSkills(p).map(x=>x.n).join(', '),'/투자 검술  /스킬장착 1 검의 흐름');return lines.join('\n');}
function accountText(p,id){return ['🔐 계정 연동 상태','식별 방식: '+id.type,'생성일: '+new Date(p.account.createdAt).toISOString().slice(0,10),'','같은 봇에서 같은 식별키가 들어오면 개인채팅/오픈채팅이 달라도 같은 캐릭터를 불러옵니다.'].join('\n');}
function battleText(p){const r=p.run,s=stats(p);const es=r.en.map((x,i)=>(i+1)+'. '+x.n+' HP '+x.hp+'/'+x.mh+' SPD '+x.s+(i===r.target?' ◀':'')).join('\n');return ['🌲 잊힌 숲 · 깊이 '+r.depth,'❤️ '+r.hp+'/'+s.hp+'  ⚡ '+r.e+'/'+s.maxEnergy+'  ⏱ '+s.spd+'  🛡 '+s.def,'',es,'','🎒 '+r.loot.g+'G / '+r.loot.xp+'EXP / '+matsText(r.loot.m),'장비 드랍 '+r.loot.items.length+'개','',r.last].join('\n');}
function campText(p){const r=p.run,s=stats(p),nx=r.scouted?r.pending.length+'마리 · '+r.pending.map(x=>x.n).join(', '):'미확인';return ['✅ 깊이 '+r.depth+' 전투 종료','❤️ '+r.hp+'/'+s.hp+'  ⚡ '+r.e+'/'+s.maxEnergy,'🎒 '+r.loot.g+'G / '+r.loot.xp+'EXP / '+matsText(r.loot.m),'드랍장비 '+r.loot.items.length+'개','🔎 다음 조우: '+nx,'',r.last].join('\n');}

function render(p,id,view){
  if(view==='status')return resp(statusText(p),[qr('장비'),qr('인벤'),qr('스킬'),qr('메뉴')]);
  if(view==='equipment')return resp(equipmentText(p),[qr('인벤'),qr('상점'),qr('상태'),qr('메뉴')]);
  if(view==='inventory')return resp(inventoryText(p),[qr('장비'),qr('상점'),qr('메뉴')]);
  if(view==='shop')return resp(shopText(p),[qr('인벤'),qr('장비'),qr('메뉴')]);
  if(view==='skills')return resp(skillsText(p),[qr('투자 검술'),qr('투자 궁술'),qr('투자 중무기'),qr('투자 방어'),qr('투자 기동'),qr('투자 에너지'),qr('메뉴')]);
  if(view==='account')return resp(accountText(p,id),[qr('상태'),qr('메뉴')]);
  if(p.run?.mode==='battle'){
    const q=[];p.run.en.forEach((x,i)=>{if(x.hp>0&&i<4)q.push(qr('대상 '+(i+1)));});
    p.loadout.forEach((sid,i)=>q.push(qr('스킬'+(i+1)+':'+(SKILL[sid]?.n||'?'),'스킬'+(i+1))));q.push(qr('기본공격'),qr('회피'),qr('방어'));
    return resp(battleText(p),q);
  }
  if(p.run?.mode==='camp')return resp(campText(p),[qr('계속 전진'),qr('탐사'),qr('후퇴')]);
  if(p.run?.mode==='dead')return resp(p.run.last,[qr('던전'),qr('메뉴')]);
  return resp(homeText(p),[qr('던전'),qr('상태'),qr('장비'),qr('인벤'),qr('상점'),qr('스킬'),qr('계정')]);
}

function command(p,id,cmd){
  cmd=String(cmd||'').trim();
  if(!cmd||cmd==='시작'||cmd==='메뉴'||cmd==='가입'){p.last='원하는 메뉴를 선택해주세요.';return;}
  if(cmd==='계정')return 'account';if(cmd==='상태')return 'status';if(cmd==='장비')return 'equipment';if(cmd==='인벤'||cmd==='인벤토리')return 'inventory';if(cmd==='상점')return 'shop';if(cmd==='스킬'||cmd==='테크트리')return 'skills';
  if(cmd==='던전'||cmd==='던전 입장'){if(p.run&&['battle','camp'].includes(p.run.mode)){p.last='⚠ 이미 던전 원정 중입니다.';}else startDungeon(p);return;}
  const mTarget=cmd.match(/^대상\s*([1-4])$/);if(mTarget&&p.run?.mode==='battle'){const i=+mTarget[1]-1;if(p.run.en[i]&&p.run.en[i].hp>0){p.run.target=i;p.run.last='🎯 대상: '+p.run.en[i].n;}return;}
  if(p.run?.mode==='battle'&&['기본공격','스킬1','스킬2','스킬3','회피','방어'].includes(cmd)){act(p,cmd);return;}
  if(p.run?.mode==='camp'){if(cmd==='탐사'){scout(p);return;}if(cmd==='계속 전진'){goNext(p);return;}if(cmd==='후퇴'){retreat(p);return;}}
  let m=cmd.match(/^구매\s+(\d+)$/);if(m){buy(p,+m[1]);return 'shop';}
  m=cmd.match(/^판매\s+(\d+)$/);if(m){sell(p,+m[1]);return 'inventory';}
  m=cmd.match(/^장착\s+(\d+)$/);if(m){equipFromInventory(p,+m[1]);return 'equipment';}
  m=cmd.match(/^해제\s+(무기|갑옷|신발|장신구)$/);if(m){unequip(p,m[1]);return 'equipment';}
  m=cmd.match(/^강화\s+(무기|갑옷|신발|장신구|\d+)$/);if(m){enhance(p,m[1]);return 'equipment';}
  m=cmd.match(/^투자\s+(.+)$/);if(m){invest(p,m[1].trim());return 'skills';}
  m=cmd.match(/^스킬장착\s+([1-3])\s+(.+)$/);if(m){setSkill(p,+m[1],m[2].trim());return 'skills';}
  p.last='알 수 없는 명령입니다. /메뉴 를 입력해보세요.';
}

export async function GET(){return Response.json({ok:true,service:'kakao-rpg-v2',skillVersion:'2.0',features:['persistent-player','inventory','equipment','shop','enhancement','skill-tree','dungeon']},{headers:{'cache-control':'no-store'}});}
export async function POST(request){
  let body;try{body=await request.json();}catch{return Response.json(resp('잘못된 요청입니다.'),{status:400});}
  const id=identity(body);if(!id.key)return Response.json(resp('사용자 식별키가 없습니다.'),{status:400});
  const cache=getCache(),p=await load(cache,id);const view=command(p,id,utter(body));await save(cache,id,p);
  return Response.json(render(p,id,view),{headers:{'cache-control':'no-store'}});
}
export default {async fetch(request){if(request.method==='GET')return GET();if(request.method==='POST')return POST(request);return Response.json({ok:false,message:'Method not allowed'},{status:405});}};
