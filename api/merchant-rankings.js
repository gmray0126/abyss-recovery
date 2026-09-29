import { getCache } from '@vercel/functions';

const KEY = 'fantasy-merchant-global-rank-v1';
const TAG = 'fantasy-merchant-rankings';
const MAX_ENTRIES = 100;

function cleanName(value){
  return String(value ?? '')
    .replace(/[<>\n\r\t]/g,'')
    .trim()
    .slice(0,16);
}
function num(value,min,max){
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min,Math.min(max,Math.round(n))) : NaN;
}
function sortRanks(list){
  return list.sort((a,b) =>
    b.wealth - a.wealth ||
    a.day - b.day ||
    b.contracts - a.contracts ||
    a.createdAt - b.createdAt
  );
}
async function readRanks(cache){
  const raw = await cache.get(KEY);
  if(Array.isArray(raw)) return raw;
  if(typeof raw === 'string'){
    try{
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }catch{}
  }
  return [];
}
async function writeRanks(cache,list){
  await cache.set(KEY,list,{
    ttl:60*60*24*365,
    tags:[TAG],
    name:'Fantasy Merchant Global Clear Rankings'
  });
}
function payload(list){
  return {
    ok:true,
    rankings:list.slice(0,30).map(({name,wealth,day,contracts,createdAt}) => ({
      name,wealth,day,contracts,createdAt
    }))
  };
}

export async function GET(){
  const cache = getCache();
  const list = sortRanks(await readRanks(cache));
  return Response.json(payload(list),{
    headers:{'cache-control':'no-store'}
  });
}

export async function POST(request){
  let body;
  try{ body = await request.json(); }
  catch{ return Response.json({ok:false,message:'잘못된 요청입니다.'},{status:400}); }

  const name = cleanName(body.name);
  const wealth = num(body.wealth,1,1_000_000_000_000);
  const peak = num(body.peak,1,1_000_000_000_000);
  const day = num(body.day,1,10000);
  const contracts = num(body.contracts,0,10000);

  if(!name) return Response.json({ok:false,message:'상단 이름을 입력해주세요.'},{status:400});
  if(!Number.isFinite(wealth) || !Number.isFinite(peak) || !Number.isFinite(day) || !Number.isFinite(contracts)){
    return Response.json({ok:false,message:'기록 값이 올바르지 않습니다.'},{status:400});
  }
  if(day < 107 || peak < 100000 || contracts < 10){
    return Response.json({ok:false,message:'클리어 조건을 만족한 기록만 등록할 수 있습니다.'},{status:400});
  }

  const cache = getCache();
  const list = await readRanks(cache);
  const now = Date.now();
  const entry = {name,wealth,peak,day,contracts,createdAt:now};

  const same = list.findIndex(x => String(x.name).toLowerCase() === name.toLowerCase());
  if(same >= 0){
    const old = list[same];
    const better = wealth > Number(old.wealth || 0) ||
      (wealth === Number(old.wealth || 0) && day < Number(old.day || 999999));
    if(better) list[same] = entry;
  }else{
    list.push(entry);
  }

  sortRanks(list);
  const trimmed = list.slice(0,MAX_ENTRIES);
  await writeRanks(cache,trimmed);
  return Response.json(payload(trimmed),{
    headers:{'cache-control':'no-store'}
  });
}

export default {
  async fetch(request){
    if(request.method === 'GET') return GET();
    if(request.method === 'POST') return POST(request);
    return Response.json({ok:false,message:'Method not allowed'},{status:405});
  }
};
