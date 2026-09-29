const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.round(n).toLocaleString("ko-KR") + "G";
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const ITEMS = {
  bread:{name:"빵",base:18,w:1,cat:"food"},
  wheat:{name:"밀",base:10,w:1,cat:"food"},
  iron:{name:"철괴",base:42,w:2,cat:"metal"},
  sword:{name:"검",base:95,w:3,cat:"weapon"},
  armor:{name:"갑옷",base:150,w:4,cat:"weapon"},
  herb:{name:"약초",base:24,w:1,cat:"alchemy"},
  potion:{name:"회복 포션",base:70,w:1,cat:"alchemy"},
  gem:{name:"보석",base:180,w:1,cat:"luxury"},
  spice:{name:"향신료",base:110,w:1,cat:"luxury"},
  mana:{name:"마법석",base:130,w:2,cat:"magic"},
  beer:{name:"맥주",base:26,w:1,cat:"food"},
  holy:{name:"성수",base:92,w:1,cat:"alchemy"}
};

const CITIES = {
  capital:{name:"왕도",desc:"귀족·군부가 돈을 쓰는 대도시",travel:0,mods:{bread:1.15,wheat:1.2,iron:1.08,sword:1.08,armor:1.12,herb:1.1,potion:1.15,gem:1.32,spice:1.25,mana:1.2,beer:1.15,holy:1.2}},
  farm:{name:"풍요 평원",desc:"곡물과 술이 넘치는 농업지대",travel:14,mods:{bread:.72,wheat:.58,iron:1.28,sword:1.22,armor:1.3,herb:.83,potion:1.03,gem:1.2,spice:1.16,mana:1.14,beer:.65,holy:1.05}},
  mine:{name:"철산 광산도시",desc:"철은 싸고 빵은 귀한 광산도시",travel:18,mods:{bread:1.35,wheat:1.26,iron:.58,sword:.76,armor:.78,herb:1.12,potion:1.12,gem:1.04,spice:1.22,mana:1.12,beer:1.28,holy:1.05}},
  port:{name:"청해 항구",desc:"향신료·보석이 쏟아지는 무역항",travel:22,mods:{bread:1,wheat:.95,iron:1.02,sword:1.05,armor:1.08,herb:1,potion:1,gem:.84,spice:.56,mana:1.04,beer:.92,holy:1.1}},
  arcane:{name:"마도도시 아르카나",desc:"마법석·포션이 생활필수품인 도시",travel:26,mods:{bread:1.2,wheat:1.16,iron:1.12,sword:1.04,armor:1.08,herb:.88,potion:.72,gem:1.15,spice:1.12,mana:.54,beer:1.12,holy:1.18}}
};

const EVENTS = [
  {n:"도적떼 출몰",tag:"위험",txt:"북부 교역로에 도적떼가 나타났습니다. 빵과 호위장비가 귀해집니다.",p:{bread:1.42,wheat:1.3,sword:1.25,armor:1.2},d:{bread:1.6,wheat:1.35,sword:1.45,armor:1.35},days:3},
  {n:"평화의 시대",tag:"정치",txt:"왕이 “이제 전쟁은 질렸다”고 선언했습니다. 무기상들이 동시에 한숨을 쉽니다.",p:{sword:.58,armor:.62,gem:1.28,spice:1.22,beer:1.12},d:{sword:.35,armor:.4,gem:1.5,spice:1.5,beer:1.3},days:4},
  {n:"왕실 대규모 징집",tag:"전쟁",txt:"징집령이 내려졌습니다. 군부가 검과 갑옷을 보이는 족족 사들이고 있습니다.",p:{sword:1.72,armor:1.82,iron:1.32,bread:1.16},d:{sword:2.2,armor:2.25,iron:1.5,bread:1.3},days:3},
  {n:"왕이 빵을 금지했습니다",tag:"막장",txt:"아침 식사 중 이가 아팠다는 이유로 왕이 빵 금지령을 내렸습니다.",p:{bread:.42,wheat:.78,beer:1.15},d:{bread:.2,wheat:.7,beer:1.35},days:2},
  {n:"빵 금지령 철회",tag:"막장",txt:"왕실 치과의사가 문제는 빵이 아니라 충치였다고 밝혔습니다.",p:{bread:1.55,wheat:1.22},d:{bread:1.8,wheat:1.25},days:2},
  {n:"고블린 광부 노조 파업",tag:"노동",txt:"“곡괭이도 쉬어야 한다!” 고블린 광부들이 파업에 돌입했습니다.",p:{iron:1.65,sword:1.18,armor:1.18},d:{iron:1.7,sword:1.2,armor:1.2},days:3},
  {n:"고블린 노조 협상 타결",tag:"노동",txt:"밀린 광석이 한꺼번에 시장으로 쏟아집니다.",p:{iron:.55,sword:.88,armor:.9},d:{iron:.7,sword:.9,armor:.9},days:3},
  {n:"마법대학 시험기간",tag:"학사",txt:"학생들이 밤샘 중입니다. 마법석, 포션, 맥주가 동시에 팔립니다.",p:{mana:1.5,potion:1.45,beer:1.28},d:{mana:1.8,potion:1.7,beer:1.5},days:3},
  {n:"성직자들이 포션을 이단으로 규정",tag:"종교",txt:"회복 포션 불매운동이 시작됐습니다. 성수 판매상들은 매우 신앙심이 깊어졌습니다.",p:{potion:.52,holy:1.7},d:{potion:.3,holy:2},days:3},
  {n:"성직자들이 포션 회사에 투자",tag:"막장",txt:"교단이 갑자기 새 교리를 발표했습니다. 투자설은 부인했습니다.",p:{potion:1.65,holy:.86},d:{potion:1.9,holy:.75},days:2},
  {n:"유명 용사가 검 광고",tag:"유행",txt:"“마왕도 한 방!” 광고가 대박 났습니다. 실제 마왕은 인터뷰를 거부했습니다.",p:{sword:1.48},d:{sword:1.85},days:2},
  {n:"유명 용사는 사실 도끼 유저",tag:"정정",txt:"광고 촬영용으로만 검을 들었다는 사실이 밝혀졌습니다.",p:{sword:.7},d:{sword:.55},days:2},
  {n:"용사가 마왕을 너무 빨리 잡았습니다",tag:"세계",txt:"전쟁 특수가 조기 종료됐습니다. 대신 전국에서 축하 연회가 열립니다.",p:{sword:.66,armor:.7,spice:1.42,beer:1.5},d:{sword:.5,armor:.55,spice:1.7,beer:1.8},days:3},
  {n:"마왕 부활",tag:"세계",txt:"사흘 전에 잡힌 마왕이 “2페이즈였다”고 주장하며 돌아왔습니다.",p:{sword:1.72,armor:1.75,potion:1.4,holy:1.55},d:{sword:2,armor:2,potion:1.7,holy:1.8},days:3},
  {n:"왕실 갑옷 패션 유행",tag:"유행",txt:"귀족들이 전쟁도 없는데 갑옷을 입고 무도회에 나타나기 시작했습니다.",p:{armor:1.55,gem:1.15},d:{armor:1.8,gem:1.25},days:2},
  {n:"갑옷은 너무 무겁습니다",tag:"유행",txt:"귀족들이 허리 통증을 호소하며 갑옷 패션을 버렸습니다.",p:{armor:.62,potion:1.12},d:{armor:.45,potion:1.2},days:2},
  {n:"대풍년",tag:"농업",txt:"곡창지대가 기록적인 수확을 냈습니다.",p:{wheat:.55,bread:.72,beer:.8},d:{wheat:.72,bread:.8,beer:.9},days:4},
  {n:"메뚜기떼",tag:"재난",txt:"대풍년 기사를 읽은 메뚜기들이 몰려왔습니다.",p:{wheat:1.8,bread:1.62,beer:1.22},d:{wheat:1.9,bread:1.75,beer:1.3},days:3},
  {n:"왕실 회계관이 0을 하나 더 썼습니다",tag:"행정",txt:"왕실 발주서 수량이 열 배로 찍혔습니다. 아직 아무도 실수를 인정하지 않습니다.",p:{sword:1.35,armor:1.32,bread:1.2},d:{sword:1.7,armor:1.65,bread:1.35},days:1},
  {n:"드래곤이 세관을 점거했습니다",tag:"막장",txt:"통행료로 금화 대신 양고기를 요구 중입니다. 항구 물동량이 꼬였습니다.",p:{spice:1.35,gem:1.28,bread:1.12},d:{spice:1.45,gem:1.35,bread:1.2},days:2},
  {n:"왕실 연금술사가 포션을 물에 탔습니다",tag:"사기",txt:"포션 신뢰도가 추락했습니다. 약초상만 신났습니다.",p:{potion:.48,herb:1.42},d:{potion:.3,herb:1.6},days:2},
  {n:"마법사가 금을 복제했습니다",tag:"마법",txt:"보석상들이 울고 있습니다. 문제는 복제 금이 3일 뒤 치즈로 변한다는 소문입니다.",p:{gem:.58,spice:1.05},d:{gem:.45},days:2},
  {n:"복제 금이 치즈로 변했습니다",tag:"정정",txt:"금값은 돌아왔고 왕도는 치즈 냄새로 뒤덮였습니다.",p:{gem:1.6,bread:1.12,beer:1.15},d:{gem:1.75},days:2}
];

const BASE_DEMAND = {food:1.05,metal:.82,weapon:.72,alchemy:.84,luxury:.62,magic:.7};
const RANK_KEY = "fantasyMerchantRanksV2";
let S;

function fee(){
  const t = (S.capacity - 20) / 5;
  return Math.round(10 + t * 8 + t * t * 2);
}
function upgradeCost(){
  const t = (S.capacity - 20) / 5;
  return Math.round(240 * Math.pow(1.48, t));
}
function used(){
  return Object.keys(ITEMS).reduce((a,k) => a + S.inv[k] * ITEMS[k].w, 0);
}
function effectMult(item,key){
  let m = 1;
  for(const e of S.active) m *= ((e[key] || {})[item] || 1);
  return m;
}
function cityPrice(city,item){
  const noise = .93 + Math.random() * .14;
  return Math.max(2, Math.round(ITEMS[item].base * CITIES[city].mods[item] * effectMult(item,"p") * noise));
}
function demand(item){
  return (BASE_DEMAND[ITEMS[item].cat] || 1) * effectMult(item,"d");
}
function seedWorld(){
  for(const c of Object.keys(CITIES)){
    S.world[c] = {};
    for(const k of Object.keys(ITEMS)) S.world[c][k] = cityPrice(c,k);
  }
}
function refreshCurrentMarket(){
  for(const k of Object.keys(ITEMS)){
    S.prev[k] = S.prices[k];
    S.prices[k] = cityPrice(S.city,k);
    S.world[S.city][k] = S.prices[k];
  }
}
function stockValue(){
  let v = 0;
  for(const k of Object.keys(ITEMS)) v += S.inv[k] * S.prices[k];
  for(const o of S.orders) v += o.qty * (S.world[o.city][o.item] || S.prices[o.item]);
  return v;
}
function net(){
  return S.cash + stockValue();
}
function toast(t){
  $("#toast").textContent = t;
}
function checkBlocked(){
  if(S.gameOver){ toast("이미 파산했습니다."); return true; }
  if(S.travelOpen){ toast("내일 이동지를 먼저 골라주세요."); return true; }
  return false;
}
function marketRumor(){
  const choices = [];
  for(const c of Object.keys(CITIES)){
    for(const k of Object.keys(ITEMS)){
      const ratio = S.world[c][k] / ITEMS[k].base;
      if(ratio > 1.30) choices.push({c,k,high:true,ratio});
      if(ratio < .74) choices.push({c,k,high:false,ratio});
    }
  }
  if(!choices.length) return "오늘은 딱히 미친 가격이 없다는군.";
  const x = pick(choices);
  const city = CITIES[x.c].name;
  const item = ITEMS[x.k].name;
  const high = [
    city + "에서 " + item + " 값이 정신 나갔다더군.",
    city + "에서는 " + item + "을 금덩이처럼 취급한대.",
    "지금 " + city + " 가면 " + item + " 팔고 웃으면서 돌아온다는 소문이 있어."
  ];
  const low = [
    city + " 창고에 " + item + "이 산처럼 쌓였대.",
    city + "에선 " + item + "을 거의 덤핑 중이라더군.",
    city + "에서 " + item + " 사는 건 길바닥에서 줍는 느낌이래."
  ];
  return pick(x.high ? high : low);
}
function newIntel(){
  const e = Object.assign({}, pick(EVENTS));
  e.remaining = e.days;
  S.today = e;
  S.active.push(e);
  S.rumor = marketRumor();
  S.extra = null;
}
function init(){
  S = {
    day:1, city:"capital", cash:1000, capacity:20,
    inv:{}, orders:[], prices:{}, prev:{}, world:{},
    active:[], today:null, rumor:"", extra:null,
    insurance:false, guard:false, informant:false,
    travelOpen:false, gameOver:false, peak:1000, cause:""
  };
  for(const k of Object.keys(ITEMS)){
    S.inv[k] = 0;
    S.prices[k] = ITEMS[k].base;
    S.prev[k] = ITEMS[k].base;
  }
  seedWorld();
  newIntel();
  refreshCurrentMarket();
  $("#gameOver").classList.add("hidden");
  $("#travelPanel").classList.add("hidden");
  render();
  renderRanks();
}

function bankrupt(cause){
  if(S.gameOver) return;
  S.gameOver = true;
  S.cause = cause;
  $("#gameOver").classList.remove("hidden");
  $("#gameOverText").textContent = S.day + "일차 · " + cause + " · 최고 자산 " + fmt(S.peak);
  toast("상단이 파산했습니다.");
  render();
}
function buy(item,qty){
  if(checkBlocked()) return;
  const maxCash = Math.floor((S.cash - 1) / S.prices[item]);
  const maxCap = Math.floor((S.capacity - used()) / ITEMS[item].w);
  if(qty === 999) qty = Math.min(maxCash,maxCap);
  qty = Math.max(0,Math.min(qty,maxCash,maxCap));
  if(qty < 1){ toast("돈 또는 운송 한도가 부족합니다."); return; }
  S.cash -= S.prices[item] * qty;
  S.inv[item] += qty;
  toast(ITEMS[item].name + " " + qty + "개 매입.");
  render();
}
function listForSale(item,qty){
  if(checkBlocked()) return;
  if(qty === 999) qty = S.inv[item];
  qty = Math.max(0,Math.min(qty,S.inv[item]));
  if(qty < 1){ toast("판매할 재고가 없습니다."); return; }
  S.inv[item] -= qty;
  S.orders.push({item,qty,ask:S.prices[item],city:S.city,listed:S.day});
  toast(ITEMS[item].name + " " + qty + "개를 판매 등록했습니다.");
  render();
}
function cancelOrder(i){
  if(checkBlocked()) return;
  const o = S.orders[i];
  if(!o) return;
  S.inv[o.item] += o.qty;
  S.orders.splice(i,1);
  toast("판매 등록을 회수했습니다.");
  render();
}
function processOrders(){
  const keep = [];
  let soldText = [];
  for(const o of S.orders){
    const currentMarket = S.world[o.city][o.item] || S.prices[o.item];
    const premium = o.ask / Math.max(1,currentMarket);
    const age = S.day - o.listed;
    let chance = .15 * demand(o.item) * (1 + age * .15) / Math.max(.72,premium);
    chance = Math.max(.02,Math.min(.93,chance));
    let sold = 0;
    for(let i=0;i<o.qty;i++) if(Math.random() < chance) sold++;
    if(sold > 0){
      S.cash += sold * o.ask;
      soldText.push(ITEMS[o.item].name + " " + sold + "개");
    }
    if(sold < o.qty) keep.push(Object.assign({},o,{qty:o.qty-sold}));
  }
  S.orders = keep;
  if(soldText.length) toast("판매 체결: " + soldText.join(", "));
}
function trouble(){
  if(Math.random() > .24) return;
  if(Math.random() < .48){
    if(S.guard){
      toast("도적이 나타났지만 호위대가 막았습니다.");
    }else{
      const loss = Math.min(Math.max(0,S.cash - 1),Math.round(45 + Math.random() * 105));
      if(loss > 0){
        S.cash -= loss;
        toast("도적에게 " + fmt(loss) + " 털렸습니다.");
      }
    }
  }else{
    if(S.insurance){
      toast("창고 사고가 났지만 보험사가 이를 악물고 보상했습니다.");
    }else{
      const candidates = Object.keys(ITEMS).filter(k => S.inv[k] > 0);
      if(candidates.length){
        const k = pick(candidates);
        const loss = Math.max(1,Math.ceil(S.inv[k] * .2));
        S.inv[k] -= loss;
        toast(ITEMS[k].name + " " + loss + "개가 창고 사고로 사라졌습니다.");
      }
    }
  }
}
function openTravel(){
  if(checkBlocked()) return;
  S.travelOpen = true;
  render();
}
function advanceDay(dest){
  if(!S.travelOpen || S.gameOver) return;
  const moveCost = dest === S.city ? 0 : CITIES[dest].travel;
  const total = moveCost + fee();
  if(S.cash <= total){
    toast("이동/유지비 " + fmt(total) + "를 내면 파산합니다.");
    return;
  }
  S.cash -= total;
  S.day += 1;
  S.city = dest;
  S.active.forEach(e => e.remaining--);
  S.active = S.active.filter(e => e.remaining > 0);
  S.insurance = false;
  S.guard = false;
  S.informant = false;
  S.travelOpen = false;

  for(const c of Object.keys(CITIES)){
    for(const k of Object.keys(ITEMS)) S.world[c][k] = cityPrice(c,k);
  }

  newIntel();
  processOrders();
  trouble();

  if(S.cash <= 0){
    bankrupt("하루 비용을 버티지 못함");
    return;
  }
  refreshCurrentMarket();
  S.peak = Math.max(S.peak,net());
  render();
}
function useInformant(){
  if(checkBlocked()) return;
  if(S.informant){ toast("정보상은 오늘 이미 떠들었습니다."); return; }
  if(S.cash <= 35){ toast("정보료를 내면 파산합니다."); return; }
  S.cash -= 35;
  S.informant = true;
  if(Math.random() < .78){
    S.extra = "[그럴듯함] " + marketRumor();
  }else{
    const c = pick(Object.keys(CITIES));
    const k = pick(Object.keys(ITEMS));
    S.extra = "[출처: 정보상의 처남] " + CITIES[c].name + "에서 " + ITEMS[k].name + " 값이 곧 세 배가 된답니다. 책임은 안 집니다.";
  }
  render();
}
function upgrade(){
  if(checkBlocked()) return;
  const cost = upgradeCost();
  if(S.cash <= cost){ toast("확장하면 바로 파산합니다."); return; }
  S.cash -= cost;
  S.capacity += 5;
  toast("상단을 확장했습니다. 운송 한도 " + S.capacity + ".");
  render();
}
function oneDayService(key,cost,label){
  if(checkBlocked()) return;
  if(S[key]) return;
  if(S.cash <= cost){ toast(label + " 비용을 내면 파산합니다."); return; }
  S.cash -= cost;
  S[key] = true;
  toast(label + "이 오늘 하루 적용됩니다.");
  render();
}

function render(){
  if(S.cash <= 0 && !S.gameOver){ bankrupt("현금이 바닥남"); return; }
  S.peak = Math.max(S.peak,net());

  $("#dayChip").textContent = S.day + "일차";
  $("#cityChip").textContent = CITIES[S.city].name;
  $("#cashChip").textContent = fmt(S.cash);
  $("#cashStat").textContent = fmt(S.cash);
  $("#netStat").textContent = fmt(net());
  $("#feeStat").textContent = fmt(fee());
  $("#capStat").textContent = used() + " / " + S.capacity;
  $("#marketTitle").textContent = CITIES[S.city].name + " 시장";
  $("#capBar").style.width = Math.min(100,used()/S.capacity*100) + "%";

  const inv = Object.keys(ITEMS).filter(k => S.inv[k] > 0).map(k => ITEMS[k].name + " " + S.inv[k] + "개");
  $("#inventoryText").textContent = inv.length ? inv.join(" · ") : "재고 없음";

  $("#upgradeBtn").textContent = "운송 한도 +5 · " + fmt(upgradeCost());
  const old = S.capacity;
  S.capacity += 5;
  $("#upgradeHint").textContent = "확장 후 유지비 " + fmt(fee()) + "/일";
  S.capacity = old;

  $("#insuranceBtn").textContent = S.insurance ? "창고 보험 활성" : "창고 보험 40G";
  $("#guardBtn").textContent = S.guard ? "호위대 활성" : "호위대 50G";
  $("#serviceText").textContent = [S.insurance && "보험",S.guard && "호위대"].filter(Boolean).join(" · ") || "오늘은 무방비입니다.";

  $("#newsBox").innerHTML = "<b>[" + S.today.tag + "] " + S.today.n + "</b><p>" + S.today.txt + "</p>";
  $("#rumorBox").innerHTML = "<p>" + S.rumor + "</p>";
  $("#extraBox").textContent = S.extra || "아직 돈을 주지 않았습니다.";
  $("#informantBtn").disabled = S.informant || S.gameOver || S.travelOpen;
  $("#endDayBtn").disabled = S.gameOver || S.travelOpen;

  renderMarket();
  renderOrders();
  renderTravel();

  if(S.gameOver){
    document.querySelectorAll("button").forEach(b => {
      if(!["restart","saveRank","clearRank"].includes(b.id)) b.disabled = true;
    });
  }else{
    $("#upgradeBtn").disabled = S.travelOpen;
    $("#insuranceBtn").disabled = S.insurance || S.travelOpen;
    $("#guardBtn").disabled = S.guard || S.travelOpen;
  }
}
function renderMarket(){
  const box = $("#marketCards");
  box.innerHTML = "";
  let avgDemand = 0;

  for(const [k,it] of Object.entries(ITEMS)){
    const p = S.prices[k];
    const d = demand(k);
    const delta = (p - S.prev[k]) / Math.max(1,S.prev[k]) * 100;
    avgDemand += d;

    const card = document.createElement("article");
    card.className = "market-card";
    const priceClass = delta > 4 ? "price-up" : delta < -4 ? "price-down" : "";
    const demandClass = d > 1.4 ? "demand-high" : d < .7 ? "demand-low" : "";
    const demandText = d > 1.6 ? "수요 폭발" : d > 1.25 ? "수요 높음" : d > .8 ? "수요 보통" : "수요 낮음";
    const listed = S.orders.filter(o => o.item === k).reduce((a,o) => a + o.qty,0);

    card.innerHTML =
      '<div class="title-row"><div><h3>' + it.name + '</h3><span class="' + priceClass + '">' +
      fmt(p) + ' ' + (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta).toFixed(0) +
      '%</span></div><b class="' + demandClass + '">' + demandText + '</b></div>' +
      '<div class="market-meta"><span>재고 ' + S.inv[k] + '</span><span>판매중 ' + listed + '</span><span>무게 ' + it.w + '</span></div>' +
      '<div class="market-actions"><div class="qty">' +
      '<button data-buy="' + k + '" data-q="1">1개 매입</button>' +
      '<button data-buy="' + k + '" data-q="5">5개</button>' +
      '<button data-buy="' + k + '" data-q="999">최대</button></div>' +
      '<button data-sell="' + k + '" data-q="1">1개 판매등록</button>' +
      '<button data-sell="' + k + '" data-q="999">전부 등록</button></div>';

    box.appendChild(card);
  }
  $("#marketMood").textContent = avgDemand / Object.keys(ITEMS).length > 1.15 ? "시장 과열" : "시장 평온";
}
function renderOrders(){
  const box = $("#orders");
  box.innerHTML = "";
  if(!S.orders.length){
    box.innerHTML = '<p class="muted">등록된 상품이 없습니다.</p>';
    return;
  }
  S.orders.forEach((o,i) => {
    const row = document.createElement("article");
    row.className = "order";
    row.innerHTML =
      "<div><b>" + ITEMS[o.item].name + " " + o.qty + "개</b><p>" +
      CITIES[o.city].name + " · 희망가 " + fmt(o.ask) + " · " + (S.day-o.listed) +
      '일째</p></div><button data-cancel="' + i + '">회수</button>';
    box.appendChild(row);
  });
}
function renderTravel(){
  const panel = $("#travelPanel");
  document.body.classList.toggle("modal-open",S.travelOpen);
  if(!S.travelOpen){
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  const box = $("#travelChoices");
  box.innerHTML = "";

  for(const [id,c] of Object.entries(CITIES)){
    const stay = id === S.city;
    const card = document.createElement("article");
    card.className = "travel-card";
    card.innerHTML =
      "<b>" + (stay ? "여기서 하루 더 · " : "") + c.name + "</b><p>" + c.desc + "</p>" +
      '<span class="mini muted">' + (stay ? "이동비 없음" : "이동비 " + fmt(c.travel)) +
      " + 유지비 " + fmt(fee()) + '</span><button data-travel="' + id + '">' +
      (stay ? "체류" : "이동") + "</button>";
    box.appendChild(card);
  }
}
function getRanks(){
  try{ return JSON.parse(localStorage.getItem(RANK_KEY) || "[]"); }
  catch{ return []; }
}
function saveRank(){
  const name = $("#rankName").value.trim() || "무명 상인";
  const list = getRanks();
  list.push({name,score:Math.round(S.peak),day:S.day});
  list.sort((a,b) => b.score - a.score);
  localStorage.setItem(RANK_KEY,JSON.stringify(list.slice(0,20)));
  toast("랭킹에 기록했습니다.");
  renderRanks();
}
function renderRanks(){
  const list = getRanks();
  $("#rankList").innerHTML = list.length
    ? list.slice(0,10).map(x => "<li><b>" + escapeHtml(x.name) + "</b> · " + fmt(x.score) + ' <span class="muted">' + x.day + "일</span></li>").join("")
    : '<li class="muted">아직 기록 없음</li>';
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g,m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

$("#marketCards").addEventListener("click",(e) => {
  const b = e.target.closest("button");
  if(!b) return;
  if(b.dataset.buy) buy(b.dataset.buy,Number(b.dataset.q));
  if(b.dataset.sell) listForSale(b.dataset.sell,Number(b.dataset.q));
});
$("#orders").addEventListener("click",(e) => {
  const b = e.target.closest("[data-cancel]");
  if(b) cancelOrder(Number(b.dataset.cancel));
});
$("#travelChoices").addEventListener("click",(e) => {
  const b = e.target.closest("[data-travel]");
  if(b) advanceDay(b.dataset.travel);
});
$("#endDayBtn").addEventListener("click",openTravel);
$("#travelCancel").addEventListener("click",() => {
  if(!S.gameOver){
    S.travelOpen = false;
    render();
  }
});
$("#informantBtn").addEventListener("click",useInformant);
$("#upgradeBtn").addEventListener("click",upgrade);
$("#insuranceBtn").addEventListener("click",() => oneDayService("insurance",40,"창고 보험"));
$("#guardBtn").addEventListener("click",() => oneDayService("guard",50,"호위대"));
$("#restart").addEventListener("click",init);
$("#saveRank").addEventListener("click",saveRank);
$("#clearRank").addEventListener("click",() => {
  localStorage.removeItem(RANK_KEY);
  renderRanks();
  toast("이 기기의 랭킹을 초기화했습니다.");
});

init();
