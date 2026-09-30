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
  holy:{name:"성수",base:92,w:1,cat:"alchemy"},
  flour:{name:"밀가루",base:22,w:1,cat:"food",craftOnly:true},
  steel:{name:"강철재",base:88,w:2,cat:"metal",craftOnly:true},
  extract:{name:"약초 농축액",base:52,w:1,cat:"alchemy",craftOnly:true}
};

const CRAFT_LINKS = {
  flour:["wheat","bread"],
  steel:["iron","sword"],
  extract:["herb","potion"]
};
const tradableKeys = () => Object.keys(ITEMS).filter(k => !ITEMS[k].craftOnly);
const CITIES = {
  capital:{name:"왕도",desc:"평시 치안이 가장 좋지만 거래 수수료가 매우 비싼 대도시",travel:0,fee:.12,mods:{bread:1.15,wheat:1.2,iron:1.08,sword:1.08,armor:1.12,herb:1.1,potion:1.15,gem:1.32,spice:1.25,mana:1.2,beer:1.15,holy:1.2}},
  farm:{name:"풍요 평원",desc:"곡물과 술이 넘치는 농업지대",travel:14,fee:.03,mods:{bread:.72,wheat:.58,iron:1.28,sword:1.22,armor:1.3,herb:.83,potion:1.03,gem:1.2,spice:1.16,mana:1.14,beer:.65,holy:1.05}},
  mine:{name:"철산 광산도시",desc:"철은 싸고 빵은 귀한 광산도시",travel:18,fee:.04,mods:{bread:1.35,wheat:1.26,iron:.58,sword:.76,armor:.78,herb:1.12,potion:1.12,gem:1.04,spice:1.22,mana:1.12,beer:1.28,holy:1.05}},
  port:{name:"청해 항구",desc:"향신료·보석이 쏟아지는 무역항",travel:22,fee:.06,mods:{bread:1,wheat:.95,iron:1.02,sword:1.05,armor:1.08,herb:1,potion:1,gem:.84,spice:.56,mana:1.04,beer:.92,holy:1.1}},
  arcane:{name:"마도도시 아르카나",desc:"마법석·포션이 생활필수품인 도시",travel:26,fee:.05,mods:{bread:1.2,wheat:1.16,iron:1.12,sword:1.04,armor:1.08,herb:.88,potion:.72,gem:1.15,spice:1.12,mana:.54,beer:1.12,holy:1.18}}
};

const CRAFT_LIMIT = 3;
const CRAFT_RECIPES = [
  {id:"farm_flour",city:"farm",stage:1,shop:"풍요 제분소",name:"밀 제분",inputs:{wheat:2},output:{flour:1},fee:2},
  {id:"farm_bread",city:"farm",stage:2,shop:"풍요 제빵소",name:"빵 굽기",inputs:{flour:1},output:{bread:2},fee:3},
  {id:"farm_beer",city:"farm",stage:1,shop:"평원 양조장",name:"농가 맥주 양조",inputs:{wheat:2},output:{beer:1},fee:4},

  {id:"mine_steel",city:"mine",stage:1,shop:"철산 제련소",name:"강철 제련",inputs:{iron:2},output:{steel:1},fee:5},
  {id:"mine_sword",city:"mine",stage:2,shop:"철산 대장간",name:"강철검 제작",inputs:{steel:1},output:{sword:1},fee:7},
  {id:"mine_armor",city:"mine",stage:2,shop:"철산 대장간",name:"강철 갑옷 제작",inputs:{steel:1,iron:1},output:{armor:1},fee:10},

  {id:"arcane_extract",city:"arcane",stage:1,shop:"연금술 공방",name:"약초 농축",inputs:{herb:2},output:{extract:1},fee:4},
  {id:"arcane_potion",city:"arcane",stage:2,shop:"연금술 공방",name:"회복 포션 조제",inputs:{extract:1},output:{potion:1},fee:6},
  {id:"arcane_holy",city:"arcane",stage:2,shop:"성수 조제실",name:"성수 정제",inputs:{extract:1},output:{holy:1},fee:12}
];

const EVENTS = [
  {id:"bandits",n:"도적떼 출몰",tag:"위험",noCapital:true,txt:"북부 교역로에 도적떼가 나타났습니다. 식량과 호위장비가 귀해집니다.",p:{bread:1.42,wheat:1.3,sword:1.25,armor:1.2},d:{bread:1.6,wheat:1.35,sword:1.45,armor:1.35},days:3},
  {id:"rat_swarm",n:"쥐떼 창궐",tag:"재난",noCapital:true,txt:"곡물창고마다 쥐가 바글거립니다. 고양이 값은 데이터에 없어서 다행입니다.",p:{wheat:1.35,bread:1.28,beer:1.12},d:{wheat:1.45,bread:1.35},days:2},
  {id:"border_tension",n:"국경 긴장 고조",tag:"전쟁",txt:"국경 초소가 병력을 늘리고 있습니다. 아직 전쟁은 아니지만 상인들은 이미 갑옷을 사고 있습니다.",p:{sword:1.28,armor:1.34,iron:1.2,holy:1.08},d:{sword:1.45,armor:1.5,iron:1.3},days:2,follow:{id:"conscription",chance:.45}},
  {id:"peace",n:"평화 협정 체결",tag:"정치",txt:"왕국과 이웃 나라가 악수했습니다. 무기상들은 악수 대신 계산기를 두드립니다.",p:{sword:.62,armor:.66,gem:1.25,spice:1.2,beer:1.12},d:{sword:.4,armor:.45,gem:1.45,spice:1.4,beer:1.25},days:4},
  {id:"conscription",n:"왕실 대규모 징집",tag:"전쟁",chainOnly:true,txt:"징집령이 내려졌습니다. 군부가 검과 갑옷을 보이는 족족 사들이고 있습니다.",p:{sword:1.72,armor:1.82,iron:1.32,bread:1.16},d:{sword:2.2,armor:2.25,iron:1.5,bread:1.3},days:3,follow:{id:"war_supply",chance:.55}},
  {id:"war_supply",n:"전선 보급난",tag:"전쟁",chainOnly:true,txt:"보급마차가 늦어졌습니다. 병사들이 검보다 빵과 포션을 더 찾는 중입니다.",p:{bread:1.55,potion:1.48,herb:1.25,holy:1.2},d:{bread:1.9,potion:1.8,herb:1.4},days:2,follow:{id:"victory_feast",chance:.35}},
  {id:"victory_feast",n:"승전 축하연",tag:"축제",chainOnly:true,txt:"전쟁이 끝났습니다. 검은 창고로, 맥주와 향신료는 식탁으로 갑니다.",p:{sword:.68,armor:.72,beer:1.48,spice:1.4,gem:1.22},d:{sword:.55,armor:.6,beer:1.75,spice:1.65,gem:1.3},days:3},

  {id:"bread_ban",n:"왕이 빵을 금지했습니다",tag:"막장",cities:["capital"],txt:"아침 식사 중 이가 아팠다는 이유로 왕이 빵 금지령을 내렸습니다.",p:{bread:.42,wheat:.78,beer:1.15},d:{bread:.2,wheat:.7,beer:1.35},days:2,follow:{id:"bread_black",chance:.65}},
  {id:"bread_black",n:"왕도 뒷골목에 빵 밀거래",tag:"막장",cities:["capital"],chainOnly:true,txt:"금지된 빵 한 덩이가 향신료보다 비싸졌다는 소문입니다. 경비대는 못 들은 척합니다.",p:{bread:1.75,wheat:1.25},d:{bread:1.9,wheat:1.35},days:1,follow:{id:"bread_repeal",chance:.85}},
  {id:"bread_repeal",n:"빵 금지령 철회",tag:"정정",cities:["capital"],chainOnly:true,txt:"왕실 치과의사가 문제는 빵이 아니라 충치였다고 밝혔습니다.",p:{bread:1.3,wheat:1.12},d:{bread:1.45,wheat:1.15},days:2},
  {id:"royal_feast",n:"왕실 대연회 개최",tag:"축제",cities:["capital"],txt:"왕궁이 사흘 동안 연회를 엽니다. 보석, 향신료, 맥주가 미친 듯이 팔립니다.",p:{gem:1.48,spice:1.52,beer:1.38,bread:1.16},d:{gem:1.75,spice:1.85,beer:1.65,bread:1.25},days:3},
  {id:"royal_wedding",n:"왕실 결혼식 발표",tag:"왕실",cities:["capital"],txt:"왕실 결혼식이 잡혔습니다. 귀족들이 보석과 향신료를 싹쓸이합니다.",p:{gem:1.65,spice:1.42,armor:1.08},d:{gem:2,spice:1.65},days:3,follow:{id:"wedding_cancel",chance:.18}},
  {id:"wedding_cancel",n:"왕실 결혼식 돌연 취소",tag:"막장",cities:["capital"],chainOnly:true,txt:"신랑이 도망갔다는 소문이 있습니다. 보석상들은 더 빠르게 도망가고 싶어합니다.",p:{gem:.58,spice:.72,beer:1.3},d:{gem:.45,spice:.6,beer:1.45},days:2},
  {id:"armor_fashion",n:"왕실 갑옷 패션 유행",tag:"유행",cities:["capital"],txt:"귀족들이 전쟁도 없는데 갑옷을 입고 무도회에 나타나기 시작했습니다.",p:{armor:1.55,gem:1.15},d:{armor:1.8,gem:1.25},days:2,follow:{id:"armor_heavy",chance:.7}},
  {id:"armor_heavy",n:"갑옷은 너무 무겁습니다",tag:"유행",cities:["capital"],chainOnly:true,txt:"귀족들이 허리 통증을 호소하며 갑옷 패션을 버렸습니다.",p:{armor:.62,potion:1.15},d:{armor:.45,potion:1.25},days:2},
  {id:"royal_accounting",n:"왕실 회계관이 0을 하나 더 썼습니다",tag:"행정",cities:["capital"],txt:"왕실 발주서 수량이 열 배로 찍혔습니다. 아직 아무도 실수를 인정하지 않습니다.",p:{sword:1.35,armor:1.32,bread:1.2},d:{sword:1.7,armor:1.65,bread:1.35},days:1},
  {id:"tax_audit",n:"상인 세무조사 주간",tag:"행정",cities:["capital"],txt:"왕실 세무관들이 시장을 돌아다닙니다. 귀족들은 현금 대신 보석으로 거래하기 시작했습니다.",p:{gem:1.25,spice:.92},d:{gem:1.4,spice:.85},days:2},

  {id:"goblin_strike",n:"고블린 광부 노조 파업",tag:"노동",cities:["mine"],txt:"“곡괭이도 쉬어야 한다!” 고블린 광부들이 파업에 돌입했습니다.",p:{iron:1.72,sword:1.22,armor:1.22,beer:1.15},d:{iron:1.8,sword:1.25,armor:1.25,beer:1.3},days:3,follow:{id:"goblin_deal",chance:.75}},
  {id:"goblin_deal",n:"고블린 노조 협상 타결",tag:"노동",cities:["mine"],chainOnly:true,txt:"밀린 광석이 한꺼번에 시장으로 쏟아집니다. 노조는 맥주 보너스를 얻었습니다.",p:{iron:.52,sword:.86,armor:.88,beer:1.25},d:{iron:.65,sword:.88,armor:.9,beer:1.4},days:3},
  {id:"cave_in",n:"광산 갱도 붕괴",tag:"재난",cities:["mine"],txt:"주요 갱도가 무너졌습니다. 철괴 공급이 멈추고 포션 수요가 급증합니다.",p:{iron:1.58,potion:1.38,herb:1.2},d:{iron:1.65,potion:1.7,herb:1.35},days:3},
  {id:"new_vein",n:"대형 철광맥 발견",tag:"발견",cities:["mine"],txt:"광산 깊은 곳에서 거대한 철광맥이 발견됐습니다. 광부들이 신났고 철값은 울었습니다.",p:{iron:.58,sword:.8,armor:.82},d:{iron:.75,sword:.88,armor:.9},days:4,follow:{id:"iron_flood",chance:.5}},
  {id:"iron_flood",n:"철괴 재고 산더미",tag:"과잉",cities:["mine"],chainOnly:true,txt:"새 광맥에서 너무 많이 캤습니다. 창고에 철괴를 쌓을 곳이 없습니다.",p:{iron:.46,sword:.76,armor:.78},d:{iron:.55,sword:.82,armor:.85},days:2},
  {id:"forge_fire",n:"대장간 화재",tag:"사고",cities:["mine"],txt:"대형 대장간에 불이 났습니다. 완성품은 줄고 철괴 재고만 남았습니다.",p:{sword:1.5,armor:1.55,iron:.82},d:{sword:1.7,armor:1.75,iron:.75},days:2},
  {id:"dwarf_festival",n:"드워프 맥주 축제",tag:"축제",cities:["mine"],txt:"광부들이 곡괭이를 내려놓고 맥주잔을 들었습니다. 오늘만큼은 철보다 맥주가 중요합니다.",p:{beer:1.7,bread:1.2,iron:1.08},d:{beer:2,bread:1.3},days:2},
  {id:"mine_monster",n:"갱도에서 거대 슬라임 발견",tag:"괴물",cities:["mine"],txt:"광부들이 작업을 거부하고 있습니다. 검, 포션, 성수가 갑자기 팔립니다.",p:{sword:1.3,potion:1.45,holy:1.5,iron:1.22},d:{sword:1.55,potion:1.75,holy:1.8},days:2},

  {id:"bumper_crop",n:"대풍년",tag:"농업",cities:["farm"],txt:"곡창지대가 기록적인 수확을 냈습니다. 밀 가격이 바닥을 긁고 있습니다.",p:{wheat:.5,bread:.68,beer:.78},d:{wheat:.65,bread:.78,beer:.85},days:4,follow:{id:"locust",chance:.28}},
  {id:"locust",n:"메뚜기떼 습격",tag:"재난",cities:["farm"],chainOnly:true,txt:"대풍년 기사를 읽은 메뚜기들이 몰려왔습니다.",p:{wheat:1.9,bread:1.68,beer:1.24},d:{wheat:2,bread:1.8,beer:1.35},days:3},
  {id:"drought",n:"평원 가뭄",tag:"재난",cities:["farm"],txt:"비가 오지 않습니다. 곡물 생산량이 줄고 약초도 말라갑니다.",p:{wheat:1.55,bread:1.4,herb:1.3,beer:1.2},d:{wheat:1.65,bread:1.5,herb:1.35},days:3,follow:{id:"rain",chance:.55}},
  {id:"rain",n:"기적의 폭우",tag:"날씨",cities:["farm"],chainOnly:true,txt:"드디어 비가 옵니다. 너무 많이 와서 농부들이 약간 불안해합니다.",p:{wheat:.75,herb:.82,bread:.9},d:{wheat:.85,herb:.9},days:2},
  {id:"mill_fire",n:"대형 제분소 화재",tag:"사고",cities:["farm"],txt:"밀은 넘치는데 빵을 만들 곳이 부족합니다.",p:{wheat:.72,bread:1.65},d:{wheat:.78,bread:1.85},days:2},
  {id:"harvest_festival",n:"수확제",tag:"축제",cities:["farm"],txt:"평원 전체가 축제 분위기입니다. 빵과 맥주가 순식간에 사라집니다.",p:{bread:1.25,beer:1.5,spice:1.12},d:{bread:1.55,beer:1.85,spice:1.2},days:2},
  {id:"giant_pumpkin",n:"세계 최대 호박 수확",tag:"막장",cities:["farm"],txt:"호박 하나가 마차보다 큽니다. 구경꾼이 몰려와 빵과 맥주만 잘 팔리고 있습니다.",p:{bread:1.18,beer:1.32},d:{bread:1.35,beer:1.55},days:1},
  {id:"brew_contest",n:"왕국 맥주 품평회",tag:"축제",cities:["farm"],txt:"양조장들이 체면을 걸었습니다. 밀과 맥주가 동시에 동납니다.",p:{wheat:1.22,beer:1.62},d:{wheat:1.35,beer:1.9},days:2},

  {id:"customs_strike",n:"항구 세관 파업",tag:"노동",cities:["port"],txt:"세관 직원들이 서류를 내려놓았습니다. 수입품이 배 안에 갇혔습니다.",p:{spice:1.55,gem:1.42,mana:1.18},d:{spice:1.7,gem:1.55},days:3,follow:{id:"customs_backlog",chance:.7}},
  {id:"customs_backlog",n:"세관 업무 재개, 창고 폭발 직전",tag:"과잉",cities:["port"],chainOnly:true,txt:"밀린 화물이 한꺼번에 풀렸습니다. 향신료 자루가 길을 막고 있습니다.",p:{spice:.48,gem:.7,mana:.86},d:{spice:.6,gem:.75},days:3},
  {id:"pirates",n:"해적 봉쇄",tag:"위험",cities:["port"],txt:"해적선이 항로를 막았습니다. 수입품과 포션 가격이 뛰고 있습니다.",p:{spice:1.62,gem:1.4,potion:1.2,sword:1.18},d:{spice:1.8,gem:1.5,sword:1.35},days:3,follow:{id:"navy_clear",chance:.55}},
  {id:"navy_clear",n:"왕실 해군이 항로 확보",tag:"정정",cities:["port"],chainOnly:true,txt:"해적들이 도망갔습니다. 묶였던 화물이 한꺼번에 들어옵니다.",p:{spice:.65,gem:.78,sword:.9},d:{spice:.75,gem:.82},days:2},
  {id:"spice_ship",n:"향신료 대형 선단 입항",tag:"무역",cities:["port"],txt:"항구가 향신료 냄새로 가득합니다. 가격은 냄새만큼 강하지 않습니다.",p:{spice:.5,gem:.9,beer:.95},d:{spice:.65},days:3},
  {id:"dock_fire",n:"부두 창고 화재",tag:"재난",cities:["port"],txt:"수입 창고 일부가 불탔습니다. 보석은 멀쩡한 척하지만 향신료는 연기 냄새가 납니다.",p:{spice:1.38,gem:1.3,bread:1.08},d:{spice:1.5,gem:1.4},days:2},
  {id:"sea_monster",n:"바다괴물 출몰",tag:"괴물",cities:["port"],txt:"선원들이 출항을 거부합니다. 검과 성수를 싣고 가겠다는 배만 움직입니다.",p:{sword:1.25,holy:1.45,spice:1.35},d:{sword:1.5,holy:1.7,spice:1.4},days:2},
  {id:"merchant_fleet",n:"대상선단 귀환",tag:"무역",cities:["port"],txt:"반년 만에 대상선단이 돌아왔습니다. 보석과 향신료가 넘쳐납니다.",p:{gem:.62,spice:.58,mana:.88},d:{gem:.7,spice:.68},days:3},
  {id:"dragon_customs",n:"드래곤이 세관을 점거했습니다",tag:"막장",cities:["port"],txt:"통행료로 금화 대신 양고기를 요구 중입니다. 항구 물동량이 꼬였습니다.",p:{spice:1.35,gem:1.28,bread:1.12},d:{spice:1.45,gem:1.35,bread:1.2},days:2},

  {id:"magic_exam",n:"마법대학 시험기간",tag:"학사",cities:["arcane"],txt:"학생들이 밤샘 중입니다. 마법석, 포션, 맥주가 동시에 팔립니다.",p:{mana:1.5,potion:1.45,beer:1.28},d:{mana:1.8,potion:1.7,beer:1.5},days:3,follow:{id:"magic_vacation",chance:.65}},
  {id:"magic_vacation",n:"마법대학 방학",tag:"학사",cities:["arcane"],chainOnly:true,txt:"학생들이 전부 떠났습니다. 마법석 상인들이 서로 눈만 마주칩니다.",p:{mana:.62,potion:.72,beer:.82,spice:1.1},d:{mana:.5,potion:.65,beer:.8},days:3},
  {id:"lab_boom",n:"마법대학 실험실 폭발",tag:"사고",cities:["arcane"],txt:"이번에도 실험실이 터졌습니다. 교수는 '데이터는 얻었다'고 주장합니다.",p:{mana:1.6,potion:1.5,herb:1.32},d:{mana:1.9,potion:1.8,herb:1.5},days:2},
  {id:"mana_discovery",n:"마법석 결정층 발견",tag:"발견",cities:["arcane"],txt:"도시 지하에서 마법석이 쏟아집니다. 마법사들은 행복하고 상인들은 복잡합니다.",p:{mana:.48,potion:.88},d:{mana:.58,potion:.9},days:4},
  {id:"teleport_bug",n:"텔레포트 관문 오작동",tag:"마법",cities:["arcane"],txt:"화물이 엉뚱한 창고로 날아갑니다. 물류가 꼬여 거의 모든 생활재가 비싸졌습니다.",p:{bread:1.22,wheat:1.18,iron:1.18,spice:1.2,beer:1.18},d:{bread:1.3,wheat:1.25,spice:1.3},days:2},
  {id:"familiar_craze",n:"마법사들 사이 사역마 열풍",tag:"유행",cities:["arcane"],txt:"학생들이 사역마 먹이를 산다고 식비를 털고 있습니다. 왜인지 약초와 빵이 잘 팔립니다.",p:{herb:1.35,bread:1.25},d:{herb:1.55,bread:1.4},days:2},
  {id:"archmage_lecture",n:"대마법사 공개 강연",tag:"행사",cities:["arcane"],txt:"전국에서 마법사들이 몰려왔습니다. 마법석과 맥주가 동시에 동납니다.",p:{mana:1.38,beer:1.36,gem:1.12},d:{mana:1.65,beer:1.55},days:2},
  {id:"potion_allergy",n:"포션 알레르기 소동",tag:"사고",cities:["arcane"],txt:"학생 몇 명이 파랗게 변했습니다. 포션 수요는 추락하고 약초가 대신 팔립니다.",p:{potion:.52,herb:1.5},d:{potion:.35,herb:1.7},days:2},

  {id:"potion_heresy",n:"성직자들이 포션을 이단으로 규정",tag:"종교",txt:"회복 포션 불매운동이 시작됐습니다. 성수 판매상들은 매우 신앙심이 깊어졌습니다.",p:{potion:.52,holy:1.7},d:{potion:.3,holy:2},days:3,follow:{id:"church_invest",chance:.42}},
  {id:"church_invest",n:"성직자들이 포션 회사에 투자",tag:"막장",chainOnly:true,txt:"교단이 갑자기 새 교리를 발표했습니다. 투자설은 부인했습니다.",p:{potion:1.65,holy:.86},d:{potion:1.9,holy:.75},days:2},
  {id:"antihero_foundation",n:"반용사 경제피해대책위원회 결성",tag:"단체",chainOnly:true,txt:"용사의 한마디에 재고가 폭등락하자 상인들이 '반용사 경제피해대책위원회'를 만들었습니다. 첫 회의 안건은 용사 광고 금지입니다.",p:{sword:.82,armor:.9,beer:1.16},d:{sword:.72,armor:.82,beer:1.3},days:2,follow:{id:"antihero_rally",chance:.78}},
  {id:"antihero_rally",n:"반용사 단체 대규모 시위",tag:"단체",chainOnly:true,txt:"'용사는 마왕만 잡고 시세는 건드리지 마라!'라는 현수막이 왕도 앞을 뒤덮었습니다. 구경꾼 때문에 맥주와 빵은 잘 팔립니다.",p:{sword:.68,armor:.78,beer:1.38,bread:1.2},d:{sword:.5,armor:.65,beer:1.7,bread:1.35},days:2,follow:{id:"hero_fan_counter",chance:.55}},
  {id:"hero_fan_counter",n:"용사 팬클럽 맞불 집회",tag:"유행",chainOnly:true,txt:"용사 팬클럽이 '우리 용사님이 뭘 잘못했냐'며 맞불 집회를 열었습니다. 검 굿즈가 다시 팔립니다.",p:{sword:1.38,gem:1.15,beer:1.2},d:{sword:1.65,gem:1.25,beer:1.3},days:2,follow:{id:"hero_axe",chance:.7}},
  {id:"antihero_lawsuit",n:"상인연합, 용사에게 시세조작 손해배상 청구",tag:"단체",txt:"반용사 단체가 용사의 인터뷰 한마디로 손해를 봤다며 집단소송을 냈습니다. 변호사들은 보석으로 수임료를 받습니다.",p:{sword:.8,gem:1.28,spice:1.12},d:{sword:.7,gem:1.45},days:2},
  {id:"antihero_boycott",n:"반용사 단체 '검 안 사기 운동'",tag:"단체",txt:"용사가 또 검을 칭찬하자 반용사 상인연합이 검 불매운동을 시작했습니다. 갑옷은 왜 같이 안 사는지 아무도 모릅니다.",p:{sword:.58,armor:.88,beer:1.18},d:{sword:.38,armor:.8,beer:1.28},days:2},
  {id:"antihero_merch",n:"반용사 굿즈 대박",tag:"단체",txt:"반용사 단체의 '시세를 지켜라' 배지가 유행했습니다. 보석상들이 배지를 금으로 만들기 시작했습니다.",p:{gem:1.3,beer:1.15},d:{gem:1.5,beer:1.25},days:2},
  {id:"hero_ad",n:"유명 용사가 검 광고",tag:"유행",txt:"“마왕도 한 방!” 광고가 대박 났습니다. 실제 마왕은 인터뷰를 거부했습니다.",p:{sword:1.48},d:{sword:1.85},days:2,follow:{id:"antihero_foundation",chance:.72}},
  {id:"hero_axe",n:"유명 용사는 사실 도끼 유저",tag:"정정",chainOnly:true,txt:"광고 촬영용으로만 검을 들었다는 사실이 밝혀졌습니다.",p:{sword:.7},d:{sword:.55},days:2},
  {id:"hero_fast",n:"용사가 마왕을 너무 빨리 잡았습니다",tag:"세계",txt:"전쟁 특수가 조기 종료됐습니다. 대신 전국에서 축하 연회가 열립니다.",p:{sword:.66,armor:.7,spice:1.42,beer:1.5},d:{sword:.5,armor:.55,spice:1.7,beer:1.8},days:3,follow:{id:"demon_return",chance:.38}},
  {id:"demon_return",n:"마왕 부활",tag:"전쟁",chainOnly:true,txt:"사흘 전에 잡힌 마왕이 “2페이즈였다”고 주장하며 돌아왔습니다.",p:{sword:1.72,armor:1.75,potion:1.4,holy:1.55},d:{sword:2,armor:2,potion:1.7,holy:1.8},days:3},
  {id:"plague_rumor",n:"전염병 소문",tag:"소문",txt:"아직 확진자는 없지만 사람들은 이미 포션과 약초를 사재기하고 있습니다.",p:{herb:1.42,potion:1.5,holy:1.25},d:{herb:1.7,potion:1.8,holy:1.4},days:2,follow:{id:"plague_false",chance:.5}},
  {id:"plague_false",n:"전염병은 그냥 숙취였습니다",tag:"정정",chainOnly:true,txt:"왕실 의원이 대규모 숙취였다고 발표했습니다. 약초상들이 발표를 싫어합니다.",p:{herb:.7,potion:.72,beer:1.12},d:{herb:.6,potion:.62,beer:1.2},days:2},
  {id:"alchemist_water",n:"왕실 연금술사가 포션을 물에 탔습니다",tag:"사기",txt:"포션 신뢰도가 추락했습니다. 약초상만 신났습니다.",p:{potion:.48,herb:1.42},d:{potion:.3,herb:1.6},days:2,follow:{id:"potion_recall",chance:.55}},
  {id:"potion_recall",n:"불량 포션 전량 회수",tag:"정정",chainOnly:true,txt:"문제 포션이 회수됐습니다. 정상 포션은 오히려 귀해졌습니다.",p:{potion:1.45,herb:1.18},d:{potion:1.65,herb:1.25},days:2},
  {id:"gold_clone",n:"마법사가 금을 복제했습니다",tag:"마법",txt:"보석상들이 울고 있습니다. 문제는 복제 금이 3일 뒤 치즈로 변한다는 소문입니다.",p:{gem:.58,spice:1.05},d:{gem:.45},days:2,follow:{id:"gold_cheese",chance:.8}},
  {id:"gold_cheese",n:"복제 금이 치즈로 변했습니다",tag:"정정",chainOnly:true,txt:"금값은 돌아왔고 왕도는 치즈 냄새로 뒤덮였습니다.",p:{gem:1.6,bread:1.12,beer:1.15},d:{gem:1.75},days:2},
  {id:"fake_gems",n:"가짜 보석 대량 유통",tag:"사기",txt:"유리구슬에 마법을 걸어 보석으로 팔던 일당이 적발됐습니다. 진짜 보석까지 의심받습니다.",p:{gem:.55,mana:1.12},d:{gem:.42,mana:1.2},days:2,follow:{id:"gem_cert",chance:.5}},
  {id:"gem_cert",n:"왕실 보석 감정제 도입",tag:"행정",chainOnly:true,txt:"공인 감정서가 생겼습니다. 진짜 보석 신뢰가 돌아옵니다.",p:{gem:1.38},d:{gem:1.55},days:2},
  {id:"holy_pilgrimage",n:"대규모 성지순례",tag:"종교",txt:"순례객이 전국을 이동합니다. 성수와 빵, 맥주가 예상보다 많이 팔립니다.",p:{holy:1.45,bread:1.18,beer:1.16},d:{holy:1.7,bread:1.3,beer:1.25},days:3},
  {id:"beer_purity",n:"맥주 순수령 선포",tag:"행정",txt:"왕실이 맥주에 물을 타지 말라고 명령했습니다. 양조장들은 '원래 안 탔다'고 주장합니다.",p:{beer:1.42,wheat:1.16},d:{beer:1.65,wheat:1.25},days:2},
  {id:"knight_tournament",n:"왕국 기사 토너먼트",tag:"행사",txt:"기사들이 검과 갑옷을 새로 맞춥니다. 관중은 맥주를 새로 맞춥니다.",p:{sword:1.38,armor:1.42,beer:1.28},d:{sword:1.6,armor:1.65,beer:1.45},days:3},
  {id:"meteor",n:"마법석 운석 낙하",tag:"발견",txt:"밤하늘에서 마법석이 떨어졌습니다. 학자와 사기꾼이 같은 속도로 현장에 도착했습니다.",p:{mana:.62,gem:1.12,potion:1.08},d:{mana:.72,gem:1.18},days:2},
  {id:"adventurer_boom",n:"모험가 길드 신규 가입 폭증",tag:"경기",txt:"젊은이들이 전부 모험가가 되겠답니다. 검, 갑옷, 포션이 잘 팔립니다.",p:{sword:1.28,armor:1.3,potion:1.32},d:{sword:1.5,armor:1.5,potion:1.55},days:3},
  {id:"adventurer_quit",n:"모험가 절반이 첫 슬라임 보고 은퇴",tag:"정정",txt:"신규 모험가들이 현실을 깨달았습니다. 중고 장비가 시장에 쏟아집니다.",p:{sword:.68,armor:.7,potion:.88},d:{sword:.58,armor:.6,potion:.85},days:2},
  {id:"royal_lottery",n:"왕실 복권 대박 당첨자 등장",tag:"유행",txt:"평민 한 명이 갑자기 부자가 됐습니다. 따라 사려는 사람들 때문에 보석과 향신료가 뜁니다.",p:{gem:1.22,spice:1.18},d:{gem:1.38,spice:1.32},days:2},
  {id:"royal_curfew",n:"왕실 야간 통행금지령",tag:"통제",blockedCities:["capital"],txt:"왕도가 이틀간 통행금지에 들어갔습니다. 왕도 출입이 막혀 길드 의뢰 일정이 꼬이기 시작했습니다.",p:{bread:1.12,beer:.9,holy:1.08},d:{bread:1.2,beer:.8,holy:1.15},days:2},
  {id:"great_bridge_collapse",n:"철산 대교 붕괴",tag:"교통",blockedCities:["mine"],txt:"광산도시로 이어지는 대교가 무너졌습니다. 복구 전까지 철산 광산도시 출입이 금지됩니다.",p:{iron:1.25,sword:1.12,armor:1.12},d:{iron:1.35},days:2},
  {id:"port_quarantine",n:"청해 항구 검역 봉쇄",tag:"통제",blockedCities:["port"],txt:"정체불명의 열병 신고로 항구가 봉쇄됐습니다. 배도 마차도 들어오고 나갈 수 없습니다.",p:{spice:1.32,gem:1.2,potion:1.25},d:{spice:1.4,potion:1.4},days:2},
  {id:"arcane_lockdown",n:"마도도시 마력폭주 봉쇄",tag:"마법",blockedCities:["arcane"],txt:"도시 외곽 마법진이 폭주해 아르카나 출입이 전면 통제됐습니다. 교수들은 '예정된 실험'이라고 주장합니다.",p:{mana:1.35,potion:1.2},d:{mana:1.5,potion:1.3},days:2}
];

const BASE_DEMAND = {food:1.05,metal:.82,weapon:.72,alchemy:.84,luxury:.62,magic:.7};
const RANK_KEY = "fantasyMerchantRanksV2";
const SAVE_KEY = "fantasyMerchantSaveV1";
const SAVE_VERSION = 1;
const ENDING_GOALS = {day:100,wealth:100000,contracts:10,trialDays:7};
const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id,e]));
const CHOICE_EVENTS = [
  {id:"customs_bribe",title:"세관원이 서류를 유심히 봅니다",text:"세관원이 '서류에 아주 작은 문제가 있군요'라며 손가락 두 개를 비빕니다.",options:[
    {label:"60G를 조용히 건넨다",effect:"bribe"},
    {label:"원칙대로 검사받는다",effect:"inspection"}
  ]},
  {id:"wounded_adventurer",title:"부상당한 모험가",text:"길가에 쓰러진 모험가가 포션 하나만 달라고 합니다. 등에 멘 주머니는 꽤 무거워 보입니다.",options:[
    {label:"포션 1개를 준다",effect:"help_adventurer"},
    {label:"못 본 척 지나간다",effect:"ignore_adventurer"}
  ]},
  {id:"mystery_mana",title:"수상한 마법석 상자",text:"마법사가 '절대 폭발하지 않습니다'라고 세 번 강조하며 상자를 110G에 넘기려 합니다.",options:[
    {label:"110G에 산다",effect:"buy_mystery"},
    {label:"세 번 강조한 게 더 수상하다",effect:"skip_mystery"}
  ]},
  {id:"smuggler_request",title:"밀수업자의 부탁",text:"밀수업자가 잠깐만 마차 밑에 상자를 숨겨달라고 합니다. 상자에서는 가끔 '야옹' 소리가 납니다.",options:[
    {label:"숨겨주고 사례금을 노린다",effect:"hide_smuggler"},
    {label:"경비대에 신고한다",effect:"report_smuggler"}
  ]},
  {id:"antihero_donation",title:"반용사 단체 모금함",text:"'용사는 마왕만 잡고 경제에는 손대지 마라!'라고 적힌 모금함이 놓여 있습니다.",options:[
    {label:"50G 후원한다",effect:"support_antihero"},
    {label:"용사도 먹고살아야지",effect:"support_hero"}
  ]},
  {id:"merchant_tip",title:"술 취한 대상인의 귀띔",text:"대상인이 '내일은 이게 오른다'며 품목 하나를 속삭입니다. 문제는 꽤 취해 있습니다.",options:[
    {label:"30G 주고 끝까지 듣는다",effect:"buy_tip"},
    {label:"취객 정보는 거른다",effect:"skip_tip"}
  ]},
  {id:"broken_wagon",title:"길드 마차가 길을 막았습니다",text:"바퀴가 부러진 길드 마차가 도움을 요청합니다. 고치면 오늘 장사는 조금 귀찮아지지만 사례는 해준답니다.",options:[
    {label:"80G를 들여 수리를 돕는다",effect:"repair_wagon"},
    {label:"길은 넓으니 돌아간다",effect:"skip_wagon"}
  ]},
  {id:"gamble_crate",title:"내용물 미확인 화물",text:"창고 관리인이 주인 없는 상자를 75G에 처분합니다. 안에는 무엇이 들었는지 아무도 모릅니다.",options:[
    {label:"75G에 상자를 산다",effect:"buy_crate"},
    {label:"남의 불행은 사지 않는다",effect:"skip_crate"}
  ]}
];
let S;

function isWarActive(){
  return S.active.some(e => e.tag === "전쟁" || e.n.includes("마왕"));
}
function capitalIsSafe(){
  return S.city === "capital" && !isWarActive();
}
function travelBlockEvent(dest){
  if(dest === S.city) return null;
  return S.active.find(e => e.blockedCities && (e.blockedCities.includes(dest) || e.blockedCities.includes(S.city))) || null;
}
function contractPenalty(type,reward){
  const rate = type === "rush" ? .70 : type === "sale" ? .50 : type === "courier" ? .45 : .45;
  const floor = type === "rush" ? 120 : type === "sale" ? 90 : 70;
  return Math.max(floor,Math.round(reward * rate));
}
function contractFlavor(item){
  const cat = ITEMS[item].cat;
  if(cat === "weapon") return pick(["기사단 창고가 비었습니다","경비대장이 숫자를 잘못 셌습니다","귀족 자제가 갑자기 기사 놀이에 빠졌습니다"]);
  if(cat === "food") return pick(["시장님의 야식이 끊겼습니다","축제 준비가 하루 늦었습니다","주방장이 재고를 다 태웠습니다"]);
  if(cat === "alchemy" || cat === "magic") return pick(["마법대학 실험실이 또 터졌습니다","연금술사가 계산을 틀렸습니다","치유사 길드가 비상 주문을 넣었습니다"]);
  return pick(["귀족 결혼식이 코앞입니다","상단 하나가 통째로 길을 잃었습니다","왕실 창고 담당자가 휴가를 갔습니다"]);
}
function makeContractOffer(){
  const cities = Object.keys(CITIES);
  const item = pick(tradableKeys());
  const types = ["delivery","delivery","rush","courier","sale"];
  const type = pick(types);
  let target = pick(cities.filter(c => c !== S.city));
  const qty = 2 + Math.floor(Math.random() * 5);

  if(type === "courier"){
    const reward = 90 + Math.floor(Math.random() * 80);
    return {
      type,target,deadline:S.day + 2,reward,
      penalty:contractPenalty(type,reward),
      title:pick(["봉인된 편지를 전달해주세요","길드 장부 긴급 배송","귀족 계약서 당일 전달"]),
      desc:CITIES[target].name + "의 길드 지부에 서류를 전달"
    };
  }

  if(type === "sale"){
    const reward = Math.round(ITEMS[item].base * qty * .65 + 90);
    return {
      type,item,target,qty,progress:0,deadline:S.day + 4,reward,
      penalty:contractPenalty(type,reward),
      title:pick(["시장 점유율을 보여주세요","길드 판촉 지원 요청","판매 실적 긴급 모집"]),
      desc:CITIES[target].name + " 정규 시장에서 " + ITEMS[item].name + " " + qty + "개 판매"
    };
  }

  const rush = type === "rush";
  const reward = Math.round(ITEMS[item].base * qty * (rush ? 2.45 : 1.85) + (rush ? 95 : 55));
  return {
    type,item,target,qty,deadline:S.day + (rush ? 2 : 3),reward,
    penalty:contractPenalty(type,reward),
    title:rush ? pick(["오늘 안에 사람 하나 살려야 합니다","왕실 급전보급 요청","마차가 출발하기 직전입니다"]) : contractFlavor(item),
    desc:CITIES[target].name + "에 " + ITEMS[item].name + " " + qty + "개 납품"
  };
}
function generateContractOffer(){
  if(S.contractActive || S.contractDoneDay === S.day){
    S.contractOffers = [];
    S.contractOffer = null;
    return;
  }
  S.contractOffers = [makeContractOffer(),makeContractOffer(),makeContractOffer()];
  S.contractOffer = S.contractOffers[0] || null;
}
function generateSpecialDeal(){
  S.specialDeal = null;
  if(Math.random() > .52) return;
  const held = tradableKeys().filter(k => S.inv[k] > 0);
  const type = Math.random() < .5 ? "buy" : "sell";
  let item;
  if(type === "sell" && held.length && Math.random() < .75) item = pick(held);
  else item = pick(tradableKeys());
  const qty = 2 + Math.floor(Math.random() * 4);
  const market = S.prices[item] || ITEMS[item].base;
  if(type === "buy"){
    const each = Math.max(1,Math.round(market * (.62 + Math.random() * .16)));
    S.specialDeal = {
      type,item,qty,each,
      text:pick([
        "후드를 눌러쓴 상인이 골목에서 손짓합니다. 출처는 묻지 말랍니다.",
        "마차 바퀴가 빠진 상인이 오늘 안에만 떨이로 넘긴답니다.",
        "세관 직원이 오기 전에 빨리 팔아야 한다는 상인이 있습니다."
      ])
    };
  }else{
    const each = Math.round(market * (1.32 + Math.random() * .30));
    S.specialDeal = {
      type,item,qty,each,
      text:pick([
        "정체불명의 수집가가 시세를 무시한 가격을 부릅니다.",
        "귀족 집사가 오늘 안에 꼭 필요하다며 웃돈을 얹었습니다.",
        "모험가 파티가 출발 직전이라 가격표를 볼 정신이 없답니다."
      ])
    };
  }
}
function checkContractDeadline(){
  if(S.contractActive && S.day > S.contractActive.deadline){
    const c = S.contractActive;
    const penalty = c.penalty || contractPenalty(c.type,c.reward || 100);
    S.cash -= penalty;
    S.contractActive = null;
    S.contractOffers = [];
    toast("의뢰 실패! 계약 위약금 " + fmt(penalty) + "을 지불했습니다.");
    if(S.cash <= 0){
      bankrupt("의뢰 실패 위약금을 감당하지 못함");
      return false;
    }
    return true;
  }
  return true;
}

function endingRequirementsMet(){
  return S.day >= ENDING_GOALS.day &&
    net() >= ENDING_GOALS.wealth &&
    S.completedContracts >= ENDING_GOALS.contracts;
}
function checkFinalChapter(){
  if(S.gameOver || S.ending) return;

  if(!S.finalTrial && endingRequirementsMet()){
    S.finalTrial = {
      startDay:S.day,
      endDay:S.day + ENDING_GOALS.trialDays
    };
    toast("왕실 대상단 최종심사가 시작됐습니다. " + ENDING_GOALS.trialDays + "일을 버티세요.");
  }

  if(S.finalTrial && S.day >= S.finalTrial.endDay){
    S.ending = true;
    S.travelOpen = false;
    S.choiceEvent = null;
    $("#endingPanel").classList.remove("hidden");
    $("#endingText").textContent =
      "100일 넘게 왕국의 시세와 사고를 버티고, 왕실의 마지막 심사까지 통과했습니다. 이제 당신의 상단은 왕실 공인 대상단입니다.";
    $("#endingStats").innerHTML =
      "<b>" + S.day + "일 생존</b><span>최종 자산 " + fmt(net()) + "</span><span>완료 의뢰 " + S.completedContracts + "회</span><span>최고 자산 " + fmt(S.peak) + "</span>";
    toast("엔딩 달성: 왕실 공인 대상인");
  }
}
function renderEndingGoal(){
  const box = $("#endingGoalBox");
  if(S.ending){
    box.innerHTML = '<p class="success-note">왕실 공인 대상단 자격 획득 완료</p>';
    return;
  }

  if(S.finalTrial){
    const passed = Math.max(0,S.day - S.finalTrial.startDay);
    const remain = Math.max(0,S.finalTrial.endDay - S.day);
    box.innerHTML =
      '<p><b>왕실 최종심사 진행 중</b></p>' +
      '<div class="ending-progress"><i style="width:' + Math.min(100,(passed/ENDING_GOALS.trialDays)*100) + '%"></i></div>' +
      '<p class="mini muted">' + passed + ' / ' + ENDING_GOALS.trialDays + '일 통과 · 앞으로 ' + remain + '일</p>' +
      '<p class="mini">심사 중에도 유지비·결산·도적·시장 제한은 그대로 적용됩니다.</p>';
    return;
  }

  const dayPct = Math.min(100,S.day / ENDING_GOALS.day * 100);
  const wealth = net();
  const wealthPct = Math.min(100,wealth / ENDING_GOALS.wealth * 100);
  const contractPct = Math.min(100,S.completedContracts / ENDING_GOALS.contracts * 100);
  box.innerHTML =
    '<div class="goal-row"><span>생존</span><b>' + Math.min(S.day,ENDING_GOALS.day) + ' / ' + ENDING_GOALS.day + '일</b></div>' +
    '<div class="ending-progress"><i style="width:' + dayPct + '%"></i></div>' +
    '<div class="goal-row"><span>총자산</span><b>' + fmt(wealth) + ' / ' + fmt(ENDING_GOALS.wealth) + '</b></div>' +
    '<div class="ending-progress"><i style="width:' + wealthPct + '%"></i></div>' +
    '<div class="goal-row"><span>의뢰 성공</span><b>' + S.completedContracts + ' / ' + ENDING_GOALS.contracts + '회</b></div>' +
    '<div class="ending-progress"><i style="width:' + contractPct + '%"></i></div>' +
    '<p class="mini muted">세 조건을 모두 달성하면 7일간 왕실 최종심사가 시작됩니다.</p>';
}
function merchantTier(){
  const wealth = net();
  if(wealth >= 20000) return {name:"대형 상단",overhead:110,level:3};
  if(wealth >= 8000) return {name:"중형 상단",overhead:45,level:2};
  if(wealth >= 3000) return {name:"소상단",overhead:15,level:1};
  return {name:"행상인",overhead:0,level:0};
}
function settlementRate(){
  if(S.day < 14) return .04;
  return Math.min(.06,.04 + Math.floor(S.day / 14) * .005);
}
function nextSettlementDay(){
  return S.day % 7 === 0 ? S.day + 7 : S.day + (7 - (S.day % 7));
}
function projectedSettlement(){
  return Math.max(80,Math.round(net() * settlementRate()));
}
function carriedMarketValue(){
  return Object.keys(ITEMS).reduce((a,k) => a + S.inv[k] * (S.prices[k] || ITEMS[k].base),0);
}
function listedMarketValue(){
  return S.orders.reduce((a,o) => a + o.qty * (S.world[o.city]?.[o.item] || o.ask || ITEMS[o.item].base),0);
}
function holdingCost(){
  // 손에 든 재고 0.30%, 판매 등록 재고 0.60%/일. 무한 대기 전략에 실제 비용을 만듭니다.
  return Math.round(carriedMarketValue() * .003 + listedMarketValue() * .006);
}
function fee(){
  const t = (S.capacity - 20) / 5;
  const caravan = Math.round(10 + t * 8 + t * t * 2);
  return caravan + merchantTier().overhead + holdingCost();
}
function upgradeCost(){
  const t = (S.capacity - 20) / 5;
  return Math.round(240 * Math.pow(1.48, t));
}
function used(){
  return Object.keys(ITEMS).reduce((a,k) => a + S.inv[k] * ITEMS[k].w, 0);
}
function effectMult(city,item,key){
  let m = 1;
  for(const e of S.active){
    if(e.cities && !e.cities.includes(city)) continue;
    const direct = (e[key] || {})[item];
    if(direct != null){
      m *= direct;
      continue;
    }
    const links = CRAFT_LINKS[item];
    if(links){
      const vals = links.map(k => ((e[key] || {})[k] || 1));
      m *= Math.sqrt(vals[0] * vals[1]);
    }
  }
  return m;
}
function marketIndexFor(item){
  if(!ITEMS[item].craftOnly) return S.marketIndex[item] || 1;
  const links = CRAFT_LINKS[item] || [];
  if(!links.length) return 1;
  return links.reduce((a,k) => a + (S.marketIndex[k] || 1),0) / links.length;
}
function cityPrice(city,item){
  const noise = .975 + Math.random() * .05;
  const mod = CITIES[city].mods[item] ?? 1;
  const pressure = (S.tradePressure?.[city]?.[item] || 0);
  return Math.max(2,Math.round(
    ITEMS[item].base *
    mod *
    marketIndexFor(item) *
    (1 + pressure) *
    effectMult(city,item,"p") *
    noise
  ));
}
function demand(item,city=S.city){
  return (BASE_DEMAND[ITEMS[item].cat] || 1) * effectMult(city,item,"d");
}
function updateTradePressure(){
  if(!S.world || !Object.keys(S.world).length) return;
  for(const k of tradableKeys()){
    const vals = Object.keys(CITIES).map(c => S.world[c]?.[k]).filter(Number.isFinite);
    if(!vals.length) continue;
    const avg = vals.reduce((a,v)=>a+v,0)/vals.length;
    for(const c of Object.keys(CITIES)){
      const current = S.world[c]?.[k];
      if(!Number.isFinite(current)) continue;
      const rel = current / Math.max(1,avg);
      let correction = 0;
      if(rel > 1.16) correction = -Math.min(.10,(rel-1) * .28);
      else if(rel < .84) correction = Math.min(.10,(1-rel) * .28);
      const old = S.tradePressure[c][k] || 0;
      S.tradePressure[c][k] = Math.max(-.12,Math.min(.12,old * .52 + correction));
    }
  }
}
function updateGlobalMarket(){
  const keys = tradableKeys();
  const shockCount = S.day >= 50 ? 3 : 2;
  const shockSet = new Set();
  while(shockSet.size < Math.min(shockCount,keys.length)) shockSet.add(pick(keys));

  for(const k of keys){
    const old = S.marketIndex[k] || 1;
    let momentum = (S.marketMomentum[k] || 0) * .72;

    // 과열/폭락한 가격은 언젠가 되돌아오지만, 단기 추세는 며칠 더 이어질 수 있습니다.
    momentum += (1 - old) * .025;

    if(shockSet.has(k)){
      let sign = Math.random() < .5 ? -1 : 1;
      if(old > 1.38 && Math.random() < .68) sign = -1;
      if(old < .68 && Math.random() < .68) sign = 1;
      momentum += sign * (.045 + Math.random() * .075);
    }

    // 플레이어가 한 품목을 시장에 과하게 풀면 상인들이 따라붙어 왕국 전체 가격도 조금 눌립니다.
    const listed = S.orders.filter(o => o.item === k).reduce((a,o)=>a+o.qty,0);
    if(listed >= 8) momentum -= Math.min(.045,listed * .0025);

    momentum = Math.max(-.14,Math.min(.14,momentum));
    const next = Math.max(.52,Math.min(1.85,old * (1 + momentum)));
    S.marketIndex[k] = next;
    S.marketMomentum[k] = momentum;
    S.marketChange[k] = (next / old - 1) * 100;
  }
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
    S.prices[k] = S.world[S.city]?.[k] ?? cityPrice(S.city,k);
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
  if(S.ending){ toast("이미 왕실 공인 대상인이 되었습니다."); return true; }
  if(S.gameOver){ toast("이미 파산했습니다."); return true; }
  if(S.choiceEvent){ toast("돌발 선택지부터 결정해주세요."); return true; }
  if(S.travelOpen){ toast("내일 이동지를 먼저 골라주세요."); return true; }
  return false;
}
function marketRumor(){
  const choices = [];
  for(const c of Object.keys(CITIES)){
    for(const k of tradableKeys()){
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
  let source = null;
  if(S.pendingFollow && Math.random() < S.pendingFollow.chance){
    source = EVENT_BY_ID[S.pendingFollow.id] || null;
  }

  if(!source){
    const pool = EVENTS.filter(e => {
      if(e.chainOnly) return false;
      if(e.noCapital && S.city === "capital" && !isWarActive()) return false;
      return true;
    });
    source = pick(pool);
  }

  const e = Object.assign({},source);
  e.remaining = e.days;
  S.today = e;
  S.active.push(e);
  S.pendingFollow = e.follow || null;
  S.extra = null;
}
function saveGame(){
  if(!S) return;
  try{
    const payload = {
      version:SAVE_VERSION,
      savedAt:Date.now(),
      state:S
    };
    localStorage.setItem(SAVE_KEY,JSON.stringify(payload));
    const el = $("#saveStatus");
    if(el) el.textContent = "자동 저장됨 · " + S.day + "일차";
  }catch{
    const el = $("#saveStatus");
    if(el) el.textContent = "자동 저장 실패";
  }
}
function clearSavedGame(){
  try{ localStorage.removeItem(SAVE_KEY); }catch{}
}
function normalizeSavedState(state){
  if(!state || typeof state !== "object") return null;

  state.inv ||= {};
  state.prices ||= {};
  state.prev ||= {};
  state.world ||= {};
  state.orders = Array.isArray(state.orders) ? state.orders : [];
  state.active = Array.isArray(state.active) ? state.active : [];
  state.contractOffers = Array.isArray(state.contractOffers) ? state.contractOffers : [];
  state.marketIndex ||= {};
  state.marketMomentum ||= {};
  state.marketChange ||= {};
  state.tradePressure ||= {};

  state.craftUsed ??= 0;
  state.completedContracts ??= 0;
  state.contractDoneDay ??= 0;
  state.choiceResolvedDay ??= 0;
  state.rankSaved ??= false;
  state.ending ??= false;
  state.gameOver ??= false;
  state.travelOpen ??= false;
  state.insurance ??= false;
  state.guard ??= false;
  state.informant ??= false;

  for(const k of Object.keys(ITEMS)){
    state.inv[k] ??= 0;
    state.prices[k] ??= ITEMS[k].base;
    state.prev[k] ??= ITEMS[k].base;
    state.marketIndex[k] ??= 1;
    state.marketMomentum[k] ??= 0;
    state.marketChange[k] ??= 0;
  }
  for(const c of Object.keys(CITIES)){
    state.world[c] ||= {};
    state.tradePressure[c] ||= {};
    for(const k of Object.keys(ITEMS)){
      state.world[c][k] ??= cityPriceFallbackForSave(c,k,state);
      state.tradePressure[c][k] ??= 0;
    }
  }
  return state;
}
function cityPriceFallbackForSave(city,item,state){
  const mod = CITIES[city].mods[item] ?? 1;
  const idx = state.marketIndex?.[item] || 1;
  return Math.max(2,Math.round(ITEMS[item].base * mod * idx));
}
function restoreSavedGame(){
  let raw;
  try{ raw = localStorage.getItem(SAVE_KEY); }catch{ return false; }
  if(!raw) return false;

  try{
    const payload = JSON.parse(raw);
    const restored = normalizeSavedState(payload.state);
    if(!restored) return false;
    S = restored;

    $("#gameOver").classList.toggle("hidden",!S.gameOver);
    $("#endingPanel").classList.toggle("hidden",!S.ending);
    $("#travelPanel").classList.toggle("hidden",!S.travelOpen);

    if(S.gameOver){
      $("#gameOverText").textContent = S.day + "일차 · " + (S.cause || "파산") + " · 최고 자산 " + fmt(S.peak || 0);
    }
    if(S.ending){
      $("#endingText").textContent =
        "100일 넘게 왕국의 시세와 사고를 버티고, 왕실의 마지막 심사까지 통과했습니다. 이제 당신의 상단은 왕실 공인 대상단입니다.";
      $("#endingStats").innerHTML =
        "<b>" + S.day + "일 생존</b><span>최종 자산 " + fmt(net()) + "</span><span>완료 의뢰 " + S.completedContracts + "회</span><span>최고 자산 " + fmt(S.peak) + "</span>";
      $("#saveSharedRank").textContent = S.rankSaved ? "저장 완료" : "공용 랭킹에 저장";
      $("#endingRankStatus").textContent = S.rankSaved
        ? "이 클리어 기록은 이미 공용 랭킹에 저장되었습니다."
        : "클리어 기록은 모든 플레이어가 보는 공용 랭킹에 등록할 수 있습니다.";
    }

    render();
    loadSharedRanks();

    const savedAt = Number(payload.savedAt || 0);
    const elapsed = savedAt ? Math.max(0,Math.round((Date.now()-savedAt)/60000)) : 0;
    toast("저장된 게임을 이어합니다. " + S.day + "일차" + (elapsed >= 1 ? " · 약 " + elapsed + "분 전 저장" : "") + ".");
    return true;
  }catch{
    clearSavedGame();
    return false;
  }
}
function startNewGame(confirmFirst=false){
  if(confirmFirst && !window.confirm("현재 진행 상황을 삭제하고 새 게임을 시작할까요?")) return;
  clearSavedGame();
  init();
}
function init(){
  S = {
    day:1, city:"capital", cash:1000, capacity:20,
    inv:{}, orders:[], prices:{}, prev:{}, world:{},
    active:[], today:null, rumor:"", extra:null,
    insurance:false, guard:false, informant:false,
    travelOpen:false, gameOver:false, peak:1000, cause:"",
    contractOffer:null,contractOffers:[],contractActive:null,contractDoneDay:0,completedContracts:0,specialDeal:null,pendingFollow:null,choiceEvent:null,choiceResolvedDay:0,lastSettlement:null,finalTrial:null,ending:false,rankSaved:false,craftUsed:0,marketIndex:{},marketMomentum:{},marketChange:{},tradePressure:{}
  };
  for(const k of Object.keys(ITEMS)){
    S.inv[k] = 0;
    S.prices[k] = ITEMS[k].base;
    S.prev[k] = ITEMS[k].base;
    S.marketIndex[k] = 1;
    S.marketMomentum[k] = 0;
    S.marketChange[k] = 0;
  }
  for(const c of Object.keys(CITIES)){
    S.tradePressure[c] = {};
    for(const k of Object.keys(ITEMS)) S.tradePressure[c][k] = 0;
  }
  newIntel();
  seedWorld();
  refreshCurrentMarket();
  S.rumor = marketRumor();
  generateContractOffer();
  generateSpecialDeal();
  maybeGenerateChoiceEvent();
  $("#gameOver").classList.add("hidden");
  $("#endingPanel").classList.add("hidden");
  $("#endingRankName").value = "";
  $("#endingRankStatus").textContent = "클리어 기록은 모든 플레이어가 보는 공용 랭킹에 등록할 수 있습니다.";
  $("#saveSharedRank").textContent = "공용 랭킹에 저장";
  $("#saveSharedRank").disabled = false;
  $("#travelPanel").classList.add("hidden");
  render();
  loadSharedRanks();
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
  const needed = o.qty * ITEMS[o.item].w;
  if(used() + needed > S.capacity){
    toast("판매품을 회수할 운송 공간이 부족합니다. 마차를 비우거나 확장해주세요.");
    return;
  }
  S.inv[o.item] += o.qty;
  S.orders.splice(i,1);
  toast("판매 등록을 회수했습니다.");
  render();
}
function processOrders(){
  const keep = [];
  const soldText = [];
  const capacityLeft = {};

  for(const o of S.orders){
    const key = o.city + ":" + o.item;
    if(capacityLeft[key] == null){
      const d0 = demand(o.item,o.city);
      capacityLeft[key] = Math.max(1,Math.round(1 + d0 * 2.4 + Math.random() * 2.5));
    }

    const currentMarket = S.world[o.city][o.item] || S.prices[o.item];
    const premium = o.ask / Math.max(1,currentMarket);
    const age = S.day - o.listed;
    const freshness = Math.max(.52,1 - Math.max(0,age - 1) * .09);
    let chance = .19 * demand(o.item,o.city) * freshness / Math.max(.62,premium * premium);
    chance = Math.max(.015,Math.min(.90,chance));

    let sold = 0;
    const possible = Math.min(o.qty,capacityLeft[key]);
    for(let i=0;i<possible;i++){
      if(Math.random() < chance){
        sold++;
        capacityLeft[key]--;
      }
    }

    if(sold > 0){
      const gross = sold * o.ask;
      const rate = CITIES[o.city].fee || 0;
      const commission = Math.round(gross * rate);
      const payout = gross - commission;
      S.cash += payout;
      updateSaleContract(o.item,o.city,sold);
      soldText.push(ITEMS[o.item].name + " " + sold + "개 " + fmt(payout) + (commission ? " (수수료 -" + fmt(commission) + ")" : ""));
    }

    if(sold < o.qty) keep.push(Object.assign({},o,{qty:o.qty-sold}));
  }

  S.orders = keep;
  if(soldText.length) toast("판매 체결: " + soldText.join(", "));
}
function trouble(){
  if(capitalIsSafe()) return;

  const extraRisk = Math.min(.18,Math.max(0,S.day - 10) * .008);
  if(Math.random() > .24 + extraRisk) return;

  const tier = merchantTier();

  if(Math.random() < .5){
    if(S.guard){
      toast(isWarActive() && S.city === "capital"
        ? "전시 혼란을 틈탄 도적을 호위대가 막았습니다."
        : "도적이 나타났지만 호위대가 막았습니다.");
    }else{
      const rate = .08 + Math.random() * .08 + tier.level * .015;
      const loss = Math.min(Math.max(0,S.cash - 1),Math.max(60,Math.round(S.cash * rate)));
      if(loss > 0){
        S.cash -= loss;
        toast((isWarActive() && S.city === "capital" ? "전시 혼란 속 도적에게 " : "도적에게 ") + fmt(loss) + " 털렸습니다. 큰 상단일수록 표적이 되기 쉽습니다.");
      }
    }
  }else{
    if(S.insurance){
      toast("쥐떼가 창고를 습격했지만 보험사가 보상했습니다.");
    }else{
      const candidates = Object.keys(ITEMS).filter(k => S.inv[k] > 0);
      if(candidates.length){
        const hits = Math.min(candidates.length,tier.level >= 2 ? 2 : 1);
        const damaged = [];
        for(let h=0;h<hits;h++){
          const k = pick(candidates.filter(x => !damaged.some(v => v.k === x)));
          if(!k) break;
          const rate = tier.level >= 2 ? (.20 + Math.random() * .16) : (.12 + Math.random() * .13);
          const loss = Math.max(1,Math.ceil(S.inv[k] * rate));
          S.inv[k] -= loss;
          damaged.push({k,loss});
        }
        toast("쥐떼 습격: " + damaged.map(x => ITEMS[x.k].name + " " + x.loss + "개").join(", ") + " 손실.");
      }
    }
  }
}
function applyWeeklySettlement(){
  if(S.day < 7 || S.day % 7 !== 0) return true;
  const rate = settlementRate();
  const due = Math.max(80,Math.round(net() * rate));
  S.cash -= due;
  S.lastSettlement = {day:S.day,due,rate};
  toast("상인 길드 주간 결산: 자산의 " + Math.round(rate * 1000) / 10 + "% · " + fmt(due) + " 납부.");
  if(S.cash <= 0){
    bankrupt("주간 결산금을 감당하지 못함");
    return false;
  }
  return true;
}
function openTravel(){
  if(checkBlocked()) return;
  S.travelOpen = true;
  render();
}
function advanceDay(dest){
  if(!S.travelOpen || S.gameOver || S.ending) return;
  const blocked = travelBlockEvent(dest);
  if(blocked){
    toast(blocked.n + " 때문에 " + CITIES[dest].name + " 이동이 불가능합니다.");
    return;
  }
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
  S.craftUsed = 0;
  S.travelOpen = false;

  updateTradePressure();
  updateGlobalMarket();
  newIntel();
  seedWorld();
  S.rumor = marketRumor();
  processOrders();
  trouble();
  if(checkContractDeadline() === false) return;
  if(!applyWeeklySettlement()) return;

  if(S.cash <= 0){
    bankrupt("하루 비용을 버티지 못함");
    return;
  }
  refreshCurrentMarket();
  if(!S.contractActive) generateContractOffer();
  generateSpecialDeal();
  maybeGenerateChoiceEvent();
  S.peak = Math.max(S.peak,net());
  checkFinalChapter();
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
    const k = pick(tradableKeys());
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
  if(capitalIsSafe()){
    toast("왕도는 평시 도적·쥐 피해가 없어 이 서비스가 필요 없습니다.");
    return;
  }
  if(S[key]) return;
  if(S.cash <= cost){ toast(label + " 비용을 내면 파산합니다."); return; }
  S.cash -= cost;
  S[key] = true;
  toast(label + "이 오늘 하루 적용됩니다.");
  render();
}
function acceptContract(index=0){
  if(checkBlocked()) return;
  const offer = S.contractOffers?.[index] || S.contractOffer;
  if(!offer) return;
  S.contractActive = Object.assign({},offer,{progress:offer.progress || 0});
  S.contractOffers = [];
  S.contractOffer = null;
  toast("길드 의뢰를 수락했습니다. " + S.contractActive.deadline + "일차까지 완료하세요.");
  render();
}
function completeContract(message="의뢰 완료!"){
  if(!S.contractActive) return;
  const reward = S.contractActive.reward;
  S.cash += reward;
  S.completedContracts += 1;
  S.contractDoneDay = S.day;
  S.contractActive = null;
  S.contractOffers = [];
  S.contractOffer = null;
  toast(message + " 보상 " + fmt(reward) + "을 받았습니다.");
}
function deliverContract(){
  if(checkBlocked() || !S.contractActive) return;
  const c = S.contractActive;
  if(c.type === "courier"){
    if(S.city !== c.target){ toast(CITIES[c.target].name + "에 도착해야 합니다."); return; }
    completeContract("서류 전달 완료!");
    render();
    return;
  }
  if(c.type === "sale"){
    toast("이 의뢰는 정규 시장에서 실제 판매가 체결되어야 진행됩니다.");
    return;
  }
  if(S.city !== c.target){ toast(CITIES[c.target].name + "에서 납품해야 합니다."); return; }
  if(S.inv[c.item] < c.qty){ toast(ITEMS[c.item].name + "이 " + c.qty + "개 필요합니다."); return; }
  S.inv[c.item] -= c.qty;
  completeContract(c.type === "rush" ? "긴급 납품 성공!" : "납품 완료!");
  render();
}
function updateSaleContract(item,city,qty){
  const c = S.contractActive;
  if(!c || c.type !== "sale" || c.item !== item || c.target !== city) return;
  c.progress = Math.min(c.qty,(c.progress || 0) + qty);
  if(c.progress >= c.qty) completeContract("길드 판매 목표 달성!");
}
function maybeGenerateChoiceEvent(){
  if(S.gameOver || S.choiceEvent || S.choiceResolvedDay === S.day) return;
  if(Math.random() < .34) S.choiceEvent = Object.assign({},pick(CHOICE_EVENTS));
}
function resolveChoice(effect){
  if(!S.choiceEvent || S.gameOver) return;
  const finish = (msg) => {
    S.choiceResolvedDay = S.day;
    S.choiceEvent = null;
    toast(msg);
    if(S.cash <= 0){ bankrupt("돌발 사건 비용을 감당하지 못함"); return; }
    render();
  };

  if(effect === "bribe"){
    if(S.cash <= 60){ toast("60G가 없습니다."); return; }
    S.cash -= 60; finish("세관원은 갑자기 서류가 완벽하다고 말했습니다."); return;
  }
  if(effect === "inspection"){
    if(Math.random() < .25){
      const fine = 80; S.cash -= fine; finish("세관원이 트집을 잡아 " + fmt(fine) + " 벌금을 매겼습니다.");
    }else finish("검사가 끝났습니다. 아무 일도 없었습니다. 괜히 긴장했습니다.");
    return;
  }
  if(effect === "help_adventurer"){
    if(S.inv.potion < 1){ toast("포션이 없습니다."); return; }
    S.inv.potion--; const tip = 120 + Math.floor(Math.random()*81); S.cash += tip;
    finish("모험가가 살아났다며 사례금 " + fmt(tip) + "을 줬습니다."); return;
  }
  if(effect === "ignore_adventurer"){ finish("모험가는 뒤에서 욕한 것 같지만 잘 들리진 않았습니다."); return; }
  if(effect === "buy_mystery"){
    if(S.cash <= 110){ toast("110G가 없습니다."); return; }
    S.cash -= 110;
    if(Math.random() < .68){ const q=2+Math.floor(Math.random()*3); S.inv.mana += q; finish("진짜였습니다! 마법석 " + q + "개를 건졌습니다."); }
    else { const loss=70; S.cash -= loss; finish("폭발했습니다. 수리비로 " + fmt(loss) + "까지 들었습니다."); }
    return;
  }
  if(effect === "skip_mystery"){ finish("멀리서 폭발음이 들렸습니다. 좋은 판단이었던 것 같습니다."); return; }
  if(effect === "hide_smuggler"){
    if(Math.random() < .65){ const pay=150; S.cash += pay; finish("밀수업자가 약속대로 " + fmt(pay) + "을 두고 사라졌습니다."); }
    else { const fine=130; S.cash -= fine; finish("경비대가 상자를 발견했습니다. 벌금 " + fmt(fine) + ". 상자 속 야옹이는 도망갔습니다."); }
    return;
  }
  if(effect === "report_smuggler"){ S.cash += 70; finish("경비대가 신고 포상금 70G를 줬습니다."); return; }
  if(effect === "support_antihero"){
    if(S.cash <= 50){ toast("50G가 없습니다."); return; }
    S.cash -= 50; S.pendingFollow = {id:"antihero_rally",chance:.92}; finish("반용사 단체가 후원자를 '경제수호자'라고 부르기 시작했습니다."); return;
  }
  if(effect === "support_hero"){ S.pendingFollow = {id:"hero_fan_counter",chance:.8}; finish("용사 팬클럽이 무료 배지를 줬습니다. 팔 수는 없습니다."); return; }
  if(effect === "buy_tip"){
    if(S.cash <= 30){ toast("30G가 없습니다."); return; }
    S.cash -= 30; S.rumor = "[취객 제보] " + marketRumor(); finish("대상인이 비밀이라며 주변 모두에게 같은 말을 했습니다."); return;
  }
  if(effect === "skip_tip"){ finish("대상인은 3분 뒤 탁자 밑에서 잠들었습니다."); return; }
  if(effect === "repair_wagon"){
    if(S.cash <= 80){ toast("80G가 없습니다."); return; }
    S.cash -= 80; S.cash += 150; finish("길드가 수리비와 사례를 합쳐 150G를 지급했습니다."); return;
  }
  if(effect === "skip_wagon"){ finish("뒤에서 길드 직원이 이름을 적는 것 같았지만 신경 쓰지 않았습니다."); return; }
  if(effect === "buy_crate"){
    if(S.cash <= 75){ toast("75G가 없습니다."); return; }
    S.cash -= 75;
    const item = pick(tradableKeys()); const q = 1 + Math.floor(Math.random()*4);
    S.inv[item] += q; finish("상자 안에는 " + ITEMS[item].name + " " + q + "개가 들어 있었습니다."); return;
  }
  finish("아무 일도 일어나지 않았습니다.");
}
function renderChoiceEvent(){
  const panel = $("#choiceEventPanel");
  if(!S.choiceEvent){
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  $("#choiceTitle").textContent = S.choiceEvent.title;
  $("#choiceText").textContent = S.choiceEvent.text;
  $("#choiceOptions").innerHTML = S.choiceEvent.options.map((o,i) =>
    '<button data-choice="' + i + '">' + o.label + '</button>'
  ).join("");
}


function craftRecipe(id,qty=1){
  if(checkBlocked()) return;
  const r = CRAFT_RECIPES.find(x => x.id === id);
  if(!r || r.city !== S.city){ toast("이 도시에서는 해당 물품을 제작할 수 없습니다."); return; }

  const left = Math.max(0,CRAFT_LIMIT - S.craftUsed);
  const inputMax = Object.entries(r.inputs).reduce((m,[k,n]) => Math.min(m,Math.floor(S.inv[k]/n)),Infinity);
  const cashMax = r.fee > 0 ? Math.floor((S.cash - 1)/r.fee) : 999;
  const inputWeight = Object.entries(r.inputs).reduce((a,[k,n]) => a + ITEMS[k].w*n,0);
  const outputWeight = Object.entries(r.output).reduce((a,[k,n]) => a + ITEMS[k].w*n,0);
  const deltaWeight = outputWeight - inputWeight;
  const capMax = deltaWeight > 0 ? Math.floor((S.capacity-used())/deltaWeight) : 999;
  let max = Math.max(0,Math.min(left,inputMax,cashMax,capMax));
  if(qty === 999) qty = max;
  qty = Math.max(0,Math.min(qty,max));

  if(qty < 1){
    toast(left <= 0 ? "오늘 제작 가능 횟수를 모두 사용했습니다." : "재료·현금 또는 운송 공간이 부족합니다.");
    return;
  }

  for(const [k,n] of Object.entries(r.inputs)) S.inv[k] -= n*qty;
  for(const [k,n] of Object.entries(r.output)) S.inv[k] += n*qty;
  S.cash -= r.fee*qty;
  S.craftUsed += qty;

  const made = Object.entries(r.output).map(([k,n]) => ITEMS[k].name + " " + (n*qty) + "개").join(", ");
  toast(r.shop + " 제작 완료: " + made + " · 공임 " + fmt(r.fee*qty));
  render();
}
function renderCrafting(){
  const box = $("#craftBox");
  const badge = $("#craftUsesBadge");
  badge.textContent = "제작 " + S.craftUsed + " / " + CRAFT_LIMIT;

  const recipes = CRAFT_RECIPES.filter(r => r.city === S.city);
  if(!recipes.length){
    box.innerHTML = '<div class="craft-empty"><b>' + CITIES[S.city].name + '에는 이용 가능한 생산 공방이 없습니다.</b><p>풍요 평원·철산 광산도시·마도도시에서 각각 다른 제작을 할 수 있습니다.</p></div>';
    return;
  }

  const left = Math.max(0,CRAFT_LIMIT - S.craftUsed);
  box.innerHTML = '<div class="craft-grid">' + recipes.map(r => {
    const inputText = Object.entries(r.inputs).map(([k,n]) => ITEMS[k].name + " " + n + "개").join(" + ");
    const outputText = Object.entries(r.output).map(([k,n]) => ITEMS[k].name + " " + n + "개").join(" + ");
    const materialMarket = Object.entries(r.inputs).reduce((a,[k,n]) => a + S.prices[k]*n,0);
    const outputMarket = Object.entries(r.output).reduce((a,[k,n]) => a + S.prices[k]*n,0);
    const canMaterial = Object.entries(r.inputs).every(([k,n]) => S.inv[k] >= n);
    const can = left > 0 && canMaterial && S.cash > r.fee;
    return '<article class="craft-card">' +
      '<div class="craft-titleline"><span class="craft-shop">' + r.shop + '</span><span class="craft-stage">' + r.stage + '단계</span></div>' +
      '<h3>' + r.name + '</h3>' +
      '<p><b>' + inputText + '</b> → <b>' + outputText + '</b></p>' +
      '<div class="craft-meta"><span>공임 ' + fmt(r.fee) + '</span><span>재료 시세 ' + fmt(materialMarket) + '</span><span>완제품 시세 ' + fmt(outputMarket) + '</span></div>' +
      '<div class="craft-actions"><button data-craft="' + r.id + '" data-q="1"' + (can ? "" : " disabled") + '>1회 제작</button>' +
      '<button data-craft="' + r.id + '" data-q="999"' + (can ? "" : " disabled") + '>가능한 만큼</button></div>' +
      '</article>';
  }).join("") + '</div>';
}

function sellBlackMarket(item,qty){
  if(checkBlocked()) return;
  if(S.city === "capital"){
    toast("왕도에는 암시장이 없습니다.");
    return;
  }
  if(qty === 999) qty = S.inv[item];
  qty = Math.max(0,Math.min(qty,S.inv[item]));
  if(qty < 1){
    toast("암시장에 넘길 재고가 없습니다.");
    return;
  }

  const each = Math.max(1,Math.round(S.prices[item] * .8));
  const gross = each * qty;
  S.inv[item] -= qty;
  S.cash += gross;

  if(Math.random() < .05){
    const fine = Math.max(60,Math.round(gross * .35));
    S.cash -= fine;
    toast("암시장 단속! " + ITEMS[item].name + " " + qty + "개를 " + fmt(gross) + "에 넘겼지만 벌금 " + fmt(fine) + "을 냈습니다.");
    if(S.cash <= 0){
      bankrupt("암시장 단속 벌금을 감당하지 못함");
      return;
    }
  }else{
    toast("암시장 즉시 매각: " + ITEMS[item].name + " " + qty + "개 · " + fmt(gross) + " 입금.");
  }
  render();
}
function renderBlackMarket(){
  const panel = $("#blackMarketPanel");
  const box = $("#blackMarketBox");

  if(S.city === "capital"){
    panel.classList.add("black-market-capital");
    box.innerHTML = '<div class="black-market-locked"><b>왕도에는 암시장이 없습니다.</b><p>경비대가 골목까지 너무 열심히 순찰합니다. 전쟁 중이어도 암시장 거래는 불가능합니다.</p></div>';
    return;
  }

  panel.classList.remove("black-market-capital");
  const held = tradableKeys().filter(k => S.inv[k] > 0);
  if(!held.length){
    box.innerHTML = '<div class="black-market-locked"><b>팔 물건이 없습니다.</b><p>재고를 들고 오면 시세의 80%로 바로 현금화할 수 있습니다.</p></div>';
    return;
  }

  box.innerHTML = '<div class="black-market-risk">⚠ 거래 1회마다 5% 확률로 단속 · 벌금은 거래액의 35%, 최소 60G</div><div class="black-market-list"></div>';
  const list = box.querySelector(".black-market-list");

  for(const k of held){
    const each = Math.max(1,Math.round(S.prices[k] * .8));
    const row = document.createElement("article");
    row.className = "black-market-item";
    row.innerHTML =
      '<div class="bm-head"><div><h3>' + ITEMS[k].name + '</h3><div class="black-market-meta">보유 ' + S.inv[k] + '개 · 정상 시세 ' + fmt(S.prices[k]) + '</div></div><div class="black-market-price">' + fmt(each) + '/개</div></div>' +
      '<div class="black-market-actions"><button data-black="' + k + '" data-q="1">1개 즉시 매각</button><button data-black="' + k + '" data-q="999">전부 매각</button></div>';
    list.appendChild(row);
  }
}
function useSpecialDeal(){
  if(checkBlocked() || !S.specialDeal) return;
  const d = S.specialDeal;
  if(d.type === "buy"){
    const total = d.each * d.qty;
    const needCap = ITEMS[d.item].w * d.qty;
    if(S.cash <= total){ toast("이 거래를 하면 파산합니다."); return; }
    if(used() + needCap > S.capacity){ toast("운송 한도가 부족합니다."); return; }
    S.cash -= total;
    S.inv[d.item] += d.qty;
    toast("수상한 거래 성사. " + ITEMS[d.item].name + " " + d.qty + "개를 " + fmt(total) + "에 샀습니다.");
  }else{
    if(S.inv[d.item] < d.qty){ toast(ITEMS[d.item].name + " " + d.qty + "개가 필요합니다."); return; }
    const total = d.each * d.qty;
    S.inv[d.item] -= d.qty;
    S.cash += total;
    toast("특수 구매자에게 즉시 판매! " + fmt(total) + " 입금.");
  }
  S.specialDeal = null;
  render();
}
function renderExtras(){
  const contractBox = $("#contractBox");
  if(S.contractActive){
    const c = S.contractActive;
    const pct = c.type === "sale" ? Math.round(((c.progress || 0) / c.qty) * 100) : 0;
    let action = "";
    if(c.type === "sale"){
      action = '<div class="contract-progress"><i style="width:' + pct + '%"></i></div><p>판매 진행 ' + (c.progress || 0) + ' / ' + c.qty + '</p><button disabled>정규 시장 체결로 진행</button>';
    }else if(c.type === "courier"){
      action = S.city === c.target
        ? '<p class="contract-arrived">목적지에 도착했습니다. 길드 지부에 직접 전달하세요.</p><button id="deliverContractBtn">서류 전달</button>'
        : '<button id="deliverContractBtn" disabled>' + CITIES[c.target].name + '에서 전달 가능</button>';
    }else{
      const canDeliver = S.city === c.target && S.inv[c.item] >= c.qty;
      action = '<button id="deliverContractBtn"' + (canDeliver ? "" : " disabled") + '>의뢰 납품</button>';
    }
    const typeName = c.type === "rush" ? "긴급 납품" : c.type === "courier" ? "운송" : c.type === "sale" ? "판매 목표" : "납품";
    contractBox.innerHTML =
      '<span class="contract-type">' + typeName + ' · 진행 중</span><h3>' + c.title + '</h3>' +
      '<p>' + (c.desc || "") + '</p>' +
      '<div class="contract-meta"><span>기한 ' + c.deadline + '일차</span><span>보상 ' + fmt(c.reward) + '</span><span class="contract-penalty">실패 위약금 -' + fmt(c.penalty || 0) + '</span></div>' +
      action;
  }else{
    const offers = S.contractOffers || [];
    if(!offers.length){
      contractBox.innerHTML = '<p class="success-note">오늘은 새 의뢰가 없습니다. 내일 다시 확인하세요.</p>';
    }else{
      contractBox.innerHTML = '<div class="contract-board">' + offers.map((c,i) => {
        const typeName = c.type === "rush" ? "긴급 납품" : c.type === "courier" ? "운송" : c.type === "sale" ? "판매 목표" : "납품";
        return '<article class="contract-offer"><span class="contract-type">' + typeName + '</span><h3>' + c.title + '</h3><p>' + c.desc + '</p><div class="contract-meta"><span>기한 ' + c.deadline + '일차</span><span>보상 ' + fmt(c.reward) + '</span><span class="contract-penalty">실패 -' + fmt(c.penalty || 0) + '</span></div><button data-contract="' + i + '">이 의뢰 수락</button></article>';
      }).join("") + '</div>';
    }
  }
  const dealBox = $("#specialDealBox");
  if(!S.specialDeal){
    dealBox.innerHTML = '<p class="muted">오늘은 수상한 사람이 안 보입니다. 오히려 더 수상합니다.</p>';
  }else{
    const d = S.specialDeal;
    const total = d.each * d.qty;
    if(d.type === "buy"){
      dealBox.innerHTML =
        "<p>" + d.text + "</p><h3>" + ITEMS[d.item].name + " " + d.qty + "개 떨이</h3>" +
        '<div class="deal-price">총 ' + fmt(total) + '</div>' +
        '<button id="specialDealBtn">묻지 말고 산다</button>';
    }else{
      dealBox.innerHTML =
        "<p>" + d.text + "</p><h3>" + ITEMS[d.item].name + " " + d.qty + "개 급구</h3>" +
        '<div class="deal-price">즉시 ' + fmt(total) + '</div>' +
        '<button id="specialDealBtn"' + (S.inv[d.item] >= d.qty ? "" : " disabled") + '>즉시 판매</button>';
    }
  }
}

function render(){
  if(S.cash <= 0 && !S.gameOver){ bankrupt("현금이 바닥남"); return; }
  S.peak = Math.max(S.peak,net());
  checkFinalChapter();

  $("#dayChip").textContent = S.day + "일차";
  $("#cityChip").textContent = CITIES[S.city].name;
  $("#cashChip").textContent = fmt(S.cash);
  $("#cashStat").textContent = fmt(S.cash);
  $("#netStat").textContent = fmt(net());
  $("#feeStat").textContent = fmt(fee());
  $("#capStat").textContent = used() + " / " + S.capacity;
  $("#marketTitle").textContent = CITIES[S.city].name + " 시장";
  $("#feeBadge").textContent = "판매 수수료 " + Math.round((CITIES[S.city].fee || 0) * 100) + "%";
  $("#capBar").style.width = Math.min(100,used()/S.capacity*100) + "%";

  const inv = Object.keys(ITEMS).filter(k => S.inv[k] > 0).map(k => ITEMS[k].name + " " + S.inv[k] + "개");
  $("#inventoryText").textContent = inv.length ? inv.join(" · ") : "재고 없음";

  $("#upgradeBtn").textContent = "운송 한도 +5 · " + fmt(upgradeCost());
  const old = S.capacity;
  S.capacity += 5;
  $("#upgradeHint").textContent = "확장 후 유지비 " + fmt(fee()) + "/일";
  S.capacity = old;
  const tier = merchantTier();
  $("#lateGameText").textContent =
    "상단 규모: " + tier.name +
    (tier.overhead ? " · 추가 운영비 " + fmt(tier.overhead) + "/일" : "") +
    " · 재고 보관비 " + fmt(holdingCost()) + "/일" +
    " · 다음 길드 결산 " + nextSettlementDay() + "일차 (현재 예상 " + fmt(projectedSettlement()) + ")";

  $("#insuranceBtn").textContent = S.insurance ? "창고 보험 활성" : "창고 보험 40G";
  $("#guardBtn").textContent = S.guard ? "호위대 활성" : "호위대 50G";
  $("#serviceText").textContent = capitalIsSafe()
    ? "왕도 평시: 도적·쥐 피해 없음 · 대신 판매 수수료 " + Math.round(CITIES.capital.fee * 100) + "%"
    : ([S.insurance && "보험",S.guard && "호위대"].filter(Boolean).join(" · ") || (isWarActive() && S.city === "capital" ? "전시 중: 왕도 안전 효과 해제" : "오늘은 무방비입니다."));

  const eventArea = S.today.cities ? " · " + S.today.cities.map(c => CITIES[c].name).join(", ") : "";
  $("#newsBox").innerHTML = "<b>[" + S.today.tag + eventArea + "] " + S.today.n + "</b><p>" + S.today.txt + "</p>";
  $("#rumorBox").innerHTML = "<p>" + S.rumor + "</p>";
  $("#extraBox").textContent = S.extra || "아직 돈을 주지 않았습니다.";
  $("#informantBtn").disabled = S.informant || S.gameOver || S.travelOpen;
  $("#endDayBtn").disabled = S.gameOver || S.travelOpen;

  renderEndingGoal();
  renderExtras();
  renderMarket();
  renderCrafting();
  renderBlackMarket();
  renderOrders();
  renderTravel();
  renderChoiceEvent();

  if(S.gameOver || S.ending){
    document.querySelectorAll("button").forEach(b => {
      if(!["restart","endingRestart","saveSharedRank","rankRefresh","newGameBtn"].includes(b.id)) b.disabled = true;
    });
    if(S.ending){
      $("#saveSharedRank").disabled = !!S.rankSaved;
      $("#rankRefresh").disabled = false;
      $("#endingRestart").disabled = false;
    }
  }else{
    $("#upgradeBtn").disabled = S.travelOpen;
    $("#insuranceBtn").disabled = S.insurance || S.travelOpen || capitalIsSafe();
    $("#guardBtn").disabled = S.guard || S.travelOpen || capitalIsSafe();
  }
  saveGame();
}
function renderMarket(){
  const box = $("#marketCards");
  box.innerHTML = "";
  let avgDemand = 0;
  let avgGlobal = 0;
  const keys = tradableKeys();

  for(const k of keys){
    const it = ITEMS[k];
    const p = S.prices[k];
    const d = demand(k,S.city);
    const delta = (p - S.prev[k]) / Math.max(1,S.prev[k]) * 100;
    const globalDelta = S.marketChange[k] || 0;
    avgDemand += d;
    avgGlobal += globalDelta;

    const card = document.createElement("article");
    card.className = "market-card";
    const priceClass = delta > 4 ? "price-up" : delta < -4 ? "price-down" : "";
    const demandClass = d > 1.4 ? "demand-high" : d < .7 ? "demand-low" : "";
    const demandText = d > 1.6 ? "수요 폭발" : d > 1.25 ? "수요 높음" : d > .8 ? "수요 보통" : "수요 낮음";
    const listed = S.orders.filter(o => o.item === k).reduce((a,o) => a + o.qty,0);
    const trendClass = globalDelta > 2 ? "price-up" : globalDelta < -2 ? "price-down" : "";
    const trendText = Math.abs(globalDelta) < 1
      ? "왕국 추세 → 보합"
      : "왕국 추세 " + (globalDelta > 0 ? "▲ +" : "▼ ") + globalDelta.toFixed(1) + "%";

    card.innerHTML =
      '<div class="title-row"><div><h3>' + it.name + '</h3><span class="' + priceClass + '">' +
      fmt(p) + ' ' + (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta).toFixed(0) +
      '%</span></div><b class="' + demandClass + '">' + demandText + '</b></div>' +
      '<div class="market-meta"><span>재고 ' + S.inv[k] + '</span><span>판매중 ' + listed + '</span><span>무게 ' + it.w + '</span><span class="' + trendClass + '">' + trendText + '</span></div>' +
      '<div class="market-actions"><div class="qty">' +
      '<button data-buy="' + k + '" data-q="1">1개 매입</button>' +
      '<button data-buy="' + k + '" data-q="5">5개</button>' +
      '<button data-buy="' + k + '" data-q="999">최대</button></div>' +
      '<button data-sell="' + k + '" data-q="1">1개 판매등록</button>' +
      '<button data-sell="' + k + '" data-q="999">전부 등록</button></div>';

    box.appendChild(card);
  }

  const marketAvg = avgGlobal / Math.max(1,keys.length);
  $("#marketMood").textContent =
    marketAvg > 2.5 ? "왕국 전체 강세" :
    marketAvg < -2.5 ? "왕국 전체 약세" :
    avgDemand / Math.max(1,keys.length) > 1.15 ? "수요 과열" : "왕국 시장 혼조";
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
      CITIES[o.city].name + " · 희망가 " + fmt(o.ask) + " · 수수료 " + Math.round((CITIES[o.city].fee || 0) * 100) + "% · " + (S.day-o.listed) +
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
    const blocked = travelBlockEvent(id);
    const card = document.createElement("article");
    card.className = "travel-card" + (blocked ? " travel-blocked" : "");
    const status = blocked
      ? '<span class="mini travel-ban">⛔ ' + blocked.n + ' · 출입 금지</span>'
      : '<span class="mini muted">' + (stay ? "이동비 없음" : "이동비 " + fmt(c.travel)) + " + 유지비 " + fmt(fee()) + '</span>';
    card.innerHTML =
      "<b>" + (stay ? "여기서 하루 더 · " : "") + c.name + "</b><p>" + c.desc + "</p>" +
      status + '<button data-travel="' + id + '"' + (blocked ? " disabled" : "") + ">" +
      (stay ? "체류" : blocked ? "통행 금지" : "이동") + "</button>";
    box.appendChild(card);
  }
}
let sharedRanks = [];
let rankLoading = false;

async function loadSharedRanks(){
  if(rankLoading) return;
  rankLoading = true;
  const list = $("#rankList");
  if(list) list.innerHTML = '<li class="muted">공용 랭킹 불러오는 중...</li>';
  try{
    const res = await fetch("/api/merchant-rankings",{cache:"no-store"});
    if(!res.ok) throw new Error("rank fetch failed");
    const data = await res.json();
    sharedRanks = Array.isArray(data.rankings) ? data.rankings : [];
  }catch{
    sharedRanks = [];
    if(list) list.innerHTML = '<li class="muted">랭킹 서버에 연결하지 못했습니다.</li>';
    rankLoading = false;
    return;
  }
  rankLoading = false;
  renderRanks();
}
async function saveSharedRank(){
  if(!S.ending || S.rankSaved) return;
  const input = $("#endingRankName");
  const status = $("#endingRankStatus");
  const name = (input?.value || "").trim();
  if(!name){
    status.textContent = "상단 이름을 입력해주세요.";
    input?.focus();
    return;
  }
  const btn = $("#saveSharedRank");
  btn.disabled = true;
  status.textContent = "공용 랭킹에 저장 중...";
  try{
    const res = await fetch("/api/merchant-rankings",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        name,
        wealth:Math.round(net()),
        peak:Math.round(S.peak),
        day:S.day,
        contracts:S.completedContracts
      })
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message || "save failed");
    S.rankSaved = true;
    sharedRanks = Array.isArray(data.rankings) ? data.rankings : sharedRanks;
    status.textContent = "공용 랭킹에 저장했습니다.";
    btn.textContent = "저장 완료";
    renderRanks();
  }catch{
    btn.disabled = false;
    status.textContent = "저장에 실패했습니다. 잠시 후 다시 눌러주세요.";
  }
}
function renderRanks(){
  const list = $("#rankList");
  if(!list) return;
  list.innerHTML = sharedRanks.length
    ? sharedRanks.slice(0,10).map((x,i) =>
      "<li><b>" + (i+1) + "위 · " + escapeHtml(x.name) + "</b> · " +
      fmt(x.wealth) + ' <span class="muted">' + x.day + "일 · 의뢰 " + x.contracts + "회</span></li>"
    ).join("")
    : '<li class="muted">아직 등록된 클리어 기록이 없습니다.</li>';
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
$("#craftBox").addEventListener("click",(e) => {
  const b = e.target.closest("[data-craft]");
  if(b) craftRecipe(b.dataset.craft,Number(b.dataset.q));
});
$("#blackMarketBox").addEventListener("click",(e) => {
  const b = e.target.closest("[data-black]");
  if(b) sellBlackMarket(b.dataset.black,Number(b.dataset.q));
});
$("#orders").addEventListener("click",(e) => {
  const b = e.target.closest("[data-cancel]");
  if(b) cancelOrder(Number(b.dataset.cancel));
});
$("#travelChoices").addEventListener("click",(e) => {
  const b = e.target.closest("[data-travel]");
  if(b) advanceDay(b.dataset.travel);
});
$("#contractBox").addEventListener("click",(e) => {
  const offer = e.target.closest("[data-contract]");
  if(offer) acceptContract(Number(offer.dataset.contract));
  if(e.target.closest("#deliverContractBtn")) deliverContract();
});
$("#choiceOptions").addEventListener("click",(e) => {
  const b = e.target.closest("[data-choice]");
  if(!b || !S.choiceEvent) return;
  const option = S.choiceEvent.options[Number(b.dataset.choice)];
  if(option) resolveChoice(option.effect);
});
$("#specialDealBox").addEventListener("click",(e) => {
  if(e.target.closest("#specialDealBtn")) useSpecialDeal();
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
$("#restart").addEventListener("click",() => startNewGame(false));
$("#endingRestart").addEventListener("click",() => startNewGame(false));
$("#newGameBtn").addEventListener("click",() => startNewGame(true));
$("#saveSharedRank").addEventListener("click",saveSharedRank);
$("#rankRefresh").addEventListener("click",loadSharedRanks);

window.addEventListener("beforeunload",saveGame);
document.addEventListener("visibilitychange",() => {
  if(document.visibilityState === "hidden") saveGame();
});

if(!restoreSavedGame()) init();
