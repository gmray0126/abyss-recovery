
import { getCache } from '@vercel/functions';

const PREFIX='kakao-rpg-v1:';
const TTL=60*60*24*30;
const MON=[
 {n:'푸른 슬라임',hp:72,a:18,d:5,s:78,g:[16,28],m:'점액'},
 {n:'고블린',hp:96,a:24,d:9,s:104,g:[24,38],m:'고블린 가죽'},
 {n:'굶주린 늑대',hp:82,a:22,d:6,s:132,g:[20,34],m:'늑대 이빨'},
 {n:'오크 전사',hp:148,a:34,d:17,s:76,g:[38,58],m:'오크 철편'},
 {n:'숲 주술사',hp:92,a:29,d:8,s:96,g:[34,52],m:'주술 가루'}
];
const SK=[
 {n:'강베기',c:2,m:1.9,h:1,p:0},
 {n:'연속베기',c:3,m:.72,h:3,p:0},
 {n:'분쇄',c:3,m:1.55,h:1,p:.35}
];

function fresh(){
 return {mode:'home',depth:0,hp:360,mhp:360,e:2,me:6,atk:52,def:22,spd:120,pg:0,guard:false,evade:false,mul:1,en:[],target:0,pending:null,scouted:false,loot:{g:0,m:{}},bank:{g:0,m:{}},seed:(Date.now()>>>0)||1,last:'원하는 콘텐츠를 선택해주세요.'};
}
function rnd(s){s.seed=(s.seed*1664525+1013904223)>>>0;return s.seed/4294967296;}
function ri(s,a,b){return Math.floor(a+rnd(s)*(b-a+1));}
function add(o,k,v){o[k]=(o[k]||0)+v;}
function alive(s){return s.en.filter(x=>x.hp>0);}
function target(s){let x=s.en[s.target];if(x&&x.hp>0)return x;let i=s.en.findIndex(x=>x.hp>0);s.target=i<0?0:i;return i<0?null:s.en[i];}
function userId(b){return b&&b.userRequest&&b.userRequest.user&&(b.userRequest.user.id||(b.userRequest.user.properties||{}).botUserKey)||'';}
function utter(b){return String(b&&b.userRequest&&b.userRequest.utterance||'').trim().replace(/^\//,'');}
async function load(c,id){let x=await c.get(PREFIX+id);if(!x)return fresh();if(typeof x==='string'){try{x=JSON.parse(x);}catch{return fresh();}}return Object.assign(fresh(),x);}
async function save(c,id,s){await c.set(PREFIX+id,s,{ttl:TTL,name:'Kakao RPG Session'});}

function makeEncounter(s,depth){
 let max=depth<3?2:depth<6?3:4,min=depth<4?1:2,count=ri(s,min,max),out=[];
 for(let i=0;i<count;i++){
  let base=MON[ri(s,0,Math.min(MON.length-1,1+Math.floor(depth/2)))],k=1+(depth-1)*.07;
  out.push({n:base.n,hp:Math.round(base.hp*k),mh:Math.round(base.hp*k),a:Math.round(base.a*k),d:Math.round(base.d*k),s:Math.round(base.s*(1+Math.min(.25,(depth-1)*.015))),g:base.g,m:base.m,ag:0});
 }
 return out;
}
function reward(s,x){let g=ri(s,x.g[0],x.g[1]);s.loot.g+=g;add(s.loot.m,x.m,1);return g+'G + '+x.m+' x1';}
function ready(s){s.pg=100;s.e=Math.min(s.me,s.e+1);s.last='⚡ 행동게이지 100 → 에너지 +1 ('+s.e+'/'+s.me+')';}
function die(s){let lost=s.loot.g;s.hp=0;s.loot={g:0,m:{}};s.mode='dead';s.last='☠ 전투 불능! 이번 원정 전리품 전부 소실 ('+lost+'G 포함)';}
function enemyAct(s,x){
 let raw=x.a;
 if(s.evade){
  let ok=rnd(s)<.56;s.evade=false;
  if(ok){s.mul=2;s.last='🌪 '+x.n+' 공격 회피! 다음 공격 ×2';}
  else{s.e=Math.max(0,s.e-1);s.hp-=raw;s.last='💥 회피 실패! '+raw+' 피해 / 에너지 -1';}
 }else if(s.guard){
  let d=Math.max(0,raw-s.def);s.guard=false;s.hp-=d;s.last='🛡 방어! '+s.def+' 차단 → '+d+' 피해';
 }else{s.hp-=raw;s.last='👹 '+x.n+' 공격 → '+raw+' 피해';}
 if(s.hp<=0)die(s);
}
function victory(s){
 s.mode='camp';s.pending=makeEncounter(s,s.depth+1);s.scouted=false;
 s.last='✅ 조우 승리! HP '+s.hp+'/'+s.mhp+', 에너지 '+s.e+'/'+s.me+' 유지';
}
function advance(s){
 let z=0;
 while(s.mode==='battle'&&z++<100){
  if(!alive(s).length){victory(s);return;}
  if(s.pg>=100-1e-9){ready(s);return;}
  let times=[(100-s.pg)/s.spd];
  alive(s).forEach(x=>times.push((100-x.ag)/x.s));
  let dt=Math.min.apply(null,times);s.pg+=s.spd*dt;alive(s).forEach(x=>x.ag+=x.s*dt);
  if(s.pg>=100-1e-9){ready(s);return;}
  let acts=alive(s).filter(x=>x.ag>=100-1e-9).sort((a,b)=>b.s-a.s);
  for(let x of acts){x.ag-=100;enemyAct(s,x);if(s.mode!=='battle')return;}
 }
}
function hit(s,m,h,p){
 let x=target(s);if(!x)return {d:0,k:false,r:'',n:''};
 let total=0;
 for(let i=0;i<h;i++){
  let d=s.atk*m*(100/(100+x.d*(1-p)*4))*(.93+rnd(s)*.14);if(rnd(s)<.08)d*=1.55;total+=Math.max(1,Math.round(d));
 }
 total=Math.round(total*s.mul);s.mul=1;x.hp=Math.max(0,x.hp-total);
 let r=x.hp<=0?reward(s,x):'';target(s);
 return {d:total,k:x.hp<=0,r:r,n:x.n};
}
function startDungeon(s){
 Object.assign(s,{mode:'battle',depth:1,hp:s.mhp,e:2,pg:0,guard:false,evade:false,mul:1,loot:{g:0,m:{}},pending:null,scouted:false});
 s.en=makeEncounter(s,1);s.target=0;s.last='🌲 잊힌 숲 입장! 몬스터 '+s.en.length+'마리 조우.';advance(s);
}
function act(s,cmd){
 if(s.mode!=='battle'||s.pg<100-1e-9)return;
 if((cmd==='방어'||cmd==='회피')&&s.e<1){s.last='⚠ 에너지가 부족합니다.';return;}
 let si=cmd==='스킬1'?0:cmd==='스킬2'?1:cmd==='스킬3'?2:-1;
 if(si>=0&&s.e<SK[si].c){s.last='⚠ 에너지가 부족합니다.';return;}
 s.pg=0;
 if(cmd==='기본공격'){
  let r=hit(s,1,1,0);s.e=Math.min(s.me,s.e+1);s.last='⚔ '+r.n+' '+r.d+' 피해'+(r.k?' / 처치! '+r.r:'')+' / 에너지 +1';
 }else if(si>=0){
  let k=SK[si],r;s.e-=k.c;r=hit(s,k.m,k.h,k.p);s.last='✨ '+k.n+'! '+r.n+' '+r.d+' 피해'+(r.k?' / 처치! '+r.r:'');
 }else if(cmd==='방어'){s.e--;s.guard=true;s.last='🛡 방어 자세 / 에너지 -1';}
 else if(cmd==='회피'){s.evade=true;s.last='🌪 회피 준비 / 실패 시 에너지 -1';}
 advance(s);
}
function scout(s){
 if(s.mode!=='camp')return;
 if(s.scouted){s.last='🔎 이미 탐사했습니다.';return;}
 if(s.e<2){s.last='⚠ 탐사에는 에너지 2가 필요합니다.';return;}
 s.e-=2;s.scouted=true;s.last='🔎 다음 조우 '+s.pending.length+'마리: '+s.pending.map(x=>x.n).join(', ');
}
function next(s){
 if(s.mode!=='camp'||!s.pending)return;
 s.depth++;s.en=s.pending;s.pending=null;s.scouted=false;s.pg=0;s.guard=false;s.evade=false;s.target=0;s.mode='battle';
 s.last='➡ 깊이 '+s.depth+' 전진! 몬스터 '+s.en.length+'마리 조우.';advance(s);
}
function retreat(s){
 if(s.mode!=='camp')return;
 s.bank.g+=s.loot.g;Object.entries(s.loot.m).forEach(([k,v])=>add(s.bank.m,k,v));
 let g=s.loot.g;s.loot={g:0,m:{}};s.mode='home';s.pending=null;s.last='🏕 후퇴 성공! 전리품 확보 (+'+g+'G)';
}
function mats(o){let a=Object.entries(o||{}).filter(x=>x[1]>0).map(x=>x[0]+'x'+x[1]);return a.length?a.join(', '):'없음';}
function qr(x){return {label:x,action:'message',messageText:x};}
function resp(t,q){let z={version:'2.0',template:{outputs:[{simpleText:{text:t}}]}};if(q&&q.length)z.template.quickReplies=q.map(qr);return z;}
function battleText(s){
 let es=s.en.map((x,i)=>(i+1)+'. '+x.n+' HP '+x.hp+'/'+x.mh+' SPD '+x.s).join('\n');
 return ('🌲 잊힌 숲 · 깊이 '+s.depth+'\n❤️ '+s.hp+'/'+s.mhp+'  ⚡ '+s.e+'/'+s.me+'  ⏱ '+s.spd+'  🛡 '+s.def+'\n\n'+es+'\n\n🎒 '+s.loot.g+'G / '+mats(s.loot.m)+'\n\n'+s.last).slice(0,980);
}
function render(s){
 if(s.mode==='battle'){
  let q=[];s.en.forEach((x,i)=>{if(x.hp>0&&i<4)q.push('대상 '+(i+1));});
  q=q.concat(['기본공격','스킬1','스킬2','스킬3','회피','방어']).slice(0,10);
  return resp(battleText(s),q);
 }
 if(s.mode==='camp'){
  let nx=s.scouted?s.pending.length+'마리 · '+s.pending.map(x=>x.n).join(', '):'미확인';
  return resp('✅ 깊이 '+s.depth+' 전투 종료\n❤️ '+s.hp+'/'+s.mhp+'  ⚡ '+s.e+'/'+s.me+'\n🎒 '+s.loot.g+'G / '+mats(s.loot.m)+'\n🔎 다음 조우: '+nx+'\n\n'+s.last,['계속 전진','탐사','후퇴']);
 }
 if(s.mode==='dead')return resp(s.last,['던전 입장','메뉴']);
 return resp('⚔ 오픈톡 RPG 테스트 봇\n🏦 '+s.bank.g+'G / '+mats(s.bank.m)+'\n\n'+s.last,['던전 입장','상태','초기화']);
}
function command(s,cmd){
 if(!cmd||cmd==='시작'||cmd==='메뉴'){if(s.mode==='dead')s.mode='home';s.last='원하는 콘텐츠를 선택해주세요.';return;}
 if(cmd==='초기화'){let n=fresh();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,n);s.last='데이터를 초기화했습니다.';return;}
 if(cmd==='상태'){s.last='HP '+s.hp+'/'+s.mhp+' / 에너지 '+s.e+'/'+s.me+' / 보관 '+s.bank.g+'G';return;}
 if(cmd==='던전 입장'){startDungeon(s);return;}
 if(s.mode==='battle'){
  let m=cmd.match(/^대상\s*([1-4])$/);
  if(m){let i=+m[1]-1;if(s.en[i]&&s.en[i].hp>0){s.target=i;s.last='🎯 대상: '+s.en[i].n;}else s.last='⚠ 선택 불가';return;}
  if(['기본공격','스킬1','스킬2','스킬3','회피','방어'].includes(cmd)){act(s,cmd);return;}
 }
 if(s.mode==='camp'){
  if(cmd==='탐사'){scout(s);return;}
  if(cmd==='계속 전진'){next(s);return;}
  if(cmd==='후퇴'){retreat(s);return;}
 }
 s.last='알 수 없는 명령: '+cmd;
}
export async function GET(){return Response.json({ok:true,service:'kakao-rpg-v1',skillVersion:'2.0'},{headers:{'cache-control':'no-store'}});}
export async function POST(request){
 let body;try{body=await request.json();}catch{return Response.json(resp('잘못된 요청입니다.'),{status:400});}
 let id=userId(body);if(!id)return Response.json(resp('사용자 식별키가 없습니다.'),{status:400});
 let cache=getCache(),s=await load(cache,id);command(s,utter(body));await save(cache,id,s);
 return Response.json(render(s),{headers:{'cache-control':'no-store'}});
}
export default {async fetch(request){if(request.method==='GET')return GET();if(request.method==='POST')return POST(request);return Response.json({ok:false},{status:405});}};
