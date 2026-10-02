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

  elf_silk:{name:"엘프 비단",base:148,w:1,cat:"luxury"},
  starlight_wine:{name:"별빛 포도주",base:88,w:1,cat:"luxury"},
  holy_oil:{name:"성유",base:136,w:1,cat:"alchemy"},
  blessed_incense:{name:"축복받은 향",base:124,w:1,cat:"luxury"},

  flour:{name:"밀가루",base:22,w:1,cat:"food",craftOnly:true},
  steel:{name:"강철재",base:88,w:2,cat:"metal",craftOnly:true},
  extract:{name:"약초 농축액",base:52,w:1,cat:"alchemy",craftOnly:true},
  beast_hide:{name:"마수 가죽",base:0,w:0,cat:"material",craftOnly:true,monsterMaterial:true},
  slime_core:{name:"슬라임 핵",base:0,w:0,cat:"material",craftOnly:true,monsterMaterial:true},
  ogre_horn:{name:"오우거 뿔",base:0,w:0,cat:"material",craftOnly:true,monsterMaterial:true},
  wyvern_scale:{name:"와이번 비늘",base:0,w:0,cat:"material",craftOnly:true,monsterMaterial:true},
  demon_claw:{name:"마족 발톱",base:0,w:0,cat:"material",craftOnly:true,monsterMaterial:true},
  monster_hide_cover:{name:"마수가죽 화물덮개",base:520,w:3,cat:"gear",craftOnly:true,monsterGear:true},
  monster_slime_cooler:{name:"슬라임 핵 냉각상자",base:820,w:2,cat:"gear",craftOnly:true,monsterGear:true},
  monster_ogre_horn:{name:"오우거뿔 경적",base:1050,w:2,cat:"gear",craftOnly:true,monsterGear:true},
  monster_wyvern_armor:{name:"와이번 비늘 마차갑옷",base:1650,w:5,cat:"gear",craftOnly:true,monsterGear:true},
  monster_demon_compass:{name:"마족 추적 나침반",base:2350,w:1,cat:"gear",craftOnly:true,monsterGear:true}
};

const CRAFT_LINKS = {
  flour:["wheat","bread"],
  steel:["iron","sword"],
  extract:["herb","potion"]
};
const tradableKeys = () => Object.keys(ITEMS).filter(k => !ITEMS[k].craftOnly);
const CITIES = {
  capital:{
    name:"왕도",
    desc:"왕실과 귀족이 몰려 있는 인간 왕국의 수도. 평시 치안은 좋지만 거래 수수료가 매우 비쌉니다.",
    travel:0,fee:.12,
    mods:{bread:1.15,wheat:1.20,iron:1.08,sword:1.08,armor:1.12,herb:1.18,potion:1.15,gem:1.32,spice:1.25,mana:1.20,beer:1.15,holy:1.18,elf_silk:1.34,starlight_wine:1.30,holy_oil:1.22,blessed_incense:1.26}
  },
  farm:{
    name:"풍요 평원",
    desc:"밀·빵·맥주가 넘쳐나는 인간 농업지대. 약초 산지는 이제 엘프 대삼림으로 넘어갔습니다.",
    travel:14,fee:.03,
    mods:{bread:.72,wheat:.58,iron:1.28,sword:1.22,armor:1.30,herb:1.12,potion:1.05,gem:1.20,spice:1.16,mana:1.14,beer:.65,holy:1.12,elf_silk:1.20,starlight_wine:1.10,holy_oil:1.12,blessed_incense:1.10}
  },
  mine:{
    name:"철산 카르둠",
    desc:"산을 파서 도시를 만든 드워프들의 거대 제련도시. 철·강철·무기는 싸고 식량과 고급 술은 귀합니다.",
    travel:18,fee:.04,
    mods:{bread:1.35,wheat:1.26,iron:.56,sword:.74,armor:.76,herb:1.22,potion:1.14,gem:1.04,spice:1.22,mana:1.12,beer:.82,holy:1.10,elf_silk:1.30,starlight_wine:1.38,holy_oil:1.12,blessed_incense:1.18}
  },
  port:{
    name:"청해 항구",
    desc:"보석·향신료와 외국 물자가 몰리는 국제 무역항.",
    travel:22,fee:.06,
    mods:{bread:1.00,wheat:.95,iron:1.02,sword:1.05,armor:1.08,herb:1.02,potion:1.00,gem:.84,spice:.56,mana:1.04,beer:.92,holy:1.10,elf_silk:.94,starlight_wine:.96,holy_oil:1.08,blessed_incense:.90}
  },
  arcane:{
    name:"마도도시 아르카나",
    desc:"마법석과 포션을 대량 소비·생산하는 마도학술도시. 전쟁 후 교화된 마족들도 정착해 살아가며 성도 루미에르와 사이는 매우 나쁩니다.",
    travel:26,fee:.05,
    mods:{bread:1.20,wheat:1.16,iron:1.12,sword:1.04,armor:1.08,herb:1.06,potion:.72,gem:1.15,spice:1.12,mana:.54,beer:1.12,holy:1.12,elf_silk:1.08,starlight_wine:1.12,holy_oil:1.04,blessed_incense:1.08}
  },
  forest:{
    name:"대삼림 실바렌",
    desc:"고대 수목 사이에 자리한 엘프 도시. 약초·엘프 비단·별빛 포도주의 본산입니다.",
    travel:24,fee:.04,
    mods:{bread:1.12,wheat:1.10,iron:1.26,sword:1.24,armor:1.30,herb:.54,potion:.92,gem:1.12,spice:1.04,mana:.92,beer:1.18,holy:1.14,elf_silk:.56,starlight_wine:.60,holy_oil:1.20,blessed_incense:1.12}
  },
  holycity:{
    name:"성도 루미에르",
    desc:"성녀와 대성당을 중심으로 움직이는 신성도시. 성수·성유·축복받은 향이 쏟아지며 암시장은 존재하지 않습니다.",
    travel:28,fee:.05,
    mods:{bread:1.08,wheat:1.06,iron:1.10,sword:1.16,armor:1.14,herb:.88,potion:.90,gem:1.18,spice:1.06,mana:1.18,beer:1.24,holy:.50,elf_silk:1.15,starlight_wine:1.20,holy_oil:.58,blessed_incense:.62}
  }
};

const CITY_RIVALS = {
  farm:"port", port:"farm",
  mine:"forest", forest:"mine",
  arcane:"holycity", holycity:"arcane"
};

const CITY_NPCS = {
  capital:{
    name:"왕실 상무관 엘레노아",title:"왕도 상무관",favorite:"spice",
    desc:"왕실 조달과 상인조합 사이를 오가는 실무 관료. 상인에게 친절하지만 숫자에는 더 친절합니다.",
    perk:"왕도 판매 수수료 우대"
  },
  farm:{
    name:"대농장주 마르타",title:"평원 농장연합 대표",favorite:"iron",
    desc:"풍요 평원의 절반쯤은 자기 밭이라고 농담하는 농장주. 청해 항구의 값싼 수입 농산물을 매우 싫어합니다.",
    perk:"밀·빵·맥주 현지 매입 우대"
  },
  mine:{
    name:"룬장인 브루노",title:"카르둠 대장간 대표",favorite:"beer",
    desc:"드워프 장인들의 대표. 엘프 물건은 예쁘기만 하고 오래 못 간다고 주장합니다.",
    perk:"카르둠 제작 공임 우대"
  },
  port:{
    name:"선주 세일라",title:"청해 상선연합 대표",favorite:"wheat",
    desc:"항구의 상선을 여럿 거느린 선주. 평원 상인들이 항구세를 비싸다고 욕하는 걸 아주 잘 알고 있습니다.",
    perk:"보석·향신료 현지 매입 우대"
  },
  arcane:{
    name:"네르 교수",title:"교화 마족 마도학 교수",favorite:"herb",
    desc:"전쟁 후 아르카나에 정착한 교화 마족. 마법이 종족보다 중요하다고 믿으며 루미에르 교단과 자주 충돌합니다.",
    perk:"마법석·포션 현지 매입 우대"
  },
  forest:{
    name:"수림상단주 리시엘",title:"실바렌 수림상단주",favorite:"mana",
    desc:"엘프 상단의 대표. 카르둠의 광산 확장이 숲을 망친다고 생각해 드워프들과 사이가 좋지 않습니다.",
    perk:"약초·엘프 특산품 현지 매입 우대"
  },
  holycity:{
    name:"성녀 아리아",title:"루미에르 성녀",favorite:"bread",
    desc:"대성당의 상징이자 공주의 발언과 자주 정면충돌하는 성녀. 교화 마족을 받아들인 아르카나를 아직 신뢰하지 않습니다.",
    perk:"성수·성유·축복받은 향 우대 및 교단 신뢰"
  }
};

const NPC_QUESTS = {
  capital:[
    {rep:20,title:"사라진 왕실 조달장부",text:"엘레노아가 누군가 일부러 숨긴 조달장부를 찾고 있습니다. 왕실에 조용히 돌려놓을지 상인조합과 내용을 공유할지 결정해야 합니다.",options:[
      {label:"왕실 서기관을 고용해 복구한다 · 70G",cost:70,npcRep:6,factions:{kingdom:3},message:"장부가 조용히 복구됐고 엘레노아는 당신을 믿을 수 있는 실무자로 기억합니다."},
      {label:"상인조합과 가격 자료를 공유한다",npcRep:5,factions:{merchant:3,kingdom:-1},message:"상인들이 조달가 폭주를 미리 막았습니다. 엘레노아는 못마땅했지만 결과는 인정했습니다."}
    ]},
    {rep:50,title:"공주의 사치예산",text:"공주의 취향 한마디마다 조달 예산이 출렁입니다. 엘레노아가 시장을 덜 흔드는 새 구매 규칙을 만들고 싶어 합니다.",options:[
      {label:"시장 평균가 기준을 제안한다 · 향신료 1개",item:"spice",qty:1,npcRep:7,factions:{merchant:3,kingdom:2},message:"왕실 구매가 조금 덜 즉흥적으로 변했습니다."},
      {label:"왕실 재량을 남기되 상인 보상조항을 넣는다",npcRep:6,factions:{merchant:4},message:"상인조합이 크게 환영했고 왕실도 체면은 지켰습니다."}
    ]},
    {rep:80,title:"독립 조달권",text:"엘레노아가 당신 상단에 왕실과 직접 거래하는 독립 조달권을 제안합니다. 서류 비용은 비싸지만 영구적인 거래 혜택이 생깁니다.",options:[
      {label:"조달권을 인수한다 · 180G",cost:180,npcRep:10,factions:{kingdom:4,merchant:2},legacy:true,message:"왕실 직거래 인장이 발급됐습니다. 왕도 거래 수수료 혜택이 영구 강화됩니다."},
      {label:"상인조합 공동명의로 받는다 · 120G",cost:120,npcRep:8,factions:{merchant:5,kingdom:1},legacy:true,message:"조달권이 상인조합과 공동 명의가 됐습니다. 독립성을 지키면서 혜택을 확보했습니다."}
    ]}
  ],
  farm:[
    {rep:20,title:"무너진 관개수로",text:"마르타의 밭을 먹여 살리는 수로가 무너졌습니다. 항구에서 수입할 자재를 기다리면 늦습니다.",options:[
      {label:"철괴 1개를 내어 보강한다",item:"iron",qty:1,npcRep:7,factions:{merchant:1},message:"수로가 복구됐고 올해 첫 수확분을 당신 상단에 먼저 보여주기로 했습니다."},
      {label:"수리 인부를 고용한다 · 65G",cost:65,npcRep:6,factions:{merchant:1},message:"인부들이 밤새 수로를 살렸습니다."}
    ]},
    {rep:50,title:"곡물 운임 전쟁",text:"청해 항구가 곡물 운임을 올리자 평원 농장주들이 출하 중단을 검토합니다. 마르타가 당신의 중재를 요구합니다.",options:[
      {label:"평원 편을 들어 운임 인하를 압박한다",npcRep:8,rival:-4,factions:{merchant:2},message:"항구 선주들은 화가 났지만 평원에서는 당신 이름이 크게 올랐습니다."},
      {label:"항구와 절충안을 만든다",npcRep:6,rival:2,factions:{merchant:3},message:"양쪽 모두 불평했지만 화물은 다시 움직이기 시작했습니다."}
    ]},
    {rep:80,title:"농장연합 전용 창고",text:"마르타가 상단 전용 곡물창고를 내주겠다고 합니다. 초기 시설비만 부담하면 됩니다.",options:[
      {label:"창고를 정비한다 · 160G",cost:160,npcRep:10,factions:{merchant:3},legacy:true,message:"전용 창고가 생겼습니다. 평원 특산품 현지가 혜택이 영구 강화됩니다."},
      {label:"농민 공동창고로 운영한다 · 밀 3개",item:"wheat",qty:3,npcRep:9,factions:{merchant:4},legacy:true,message:"공동창고가 완성됐고 농민들이 당신 상단을 우선 거래처로 삼았습니다."}
    ]}
  ],
  mine:[
    {rep:20,title:"꺼져가는 대용광로",text:"브루노의 대용광로가 연료 조절 실패로 멈출 위기입니다. 드워프들은 이런 날엔 맥주가 기술보다 중요하다고 주장합니다.",options:[
      {label:"맥주 2개를 작업반에 돌린다",item:"beer",qty:2,npcRep:7,factions:{artisan:2},message:"작업반 사기가 올라 용광로가 다시 돌아가기 시작했습니다."},
      {label:"긴급 부품비를 낸다 · 80G",cost:80,npcRep:6,factions:{artisan:2},message:"브루노가 직접 새 밸브를 깎아냈습니다."}
    ]},
    {rep:50,title:"엘프 목재 검사 분쟁",text:"카르둠이 실바렌산 목재 검사를 강화하자 엘프 상단이 거래 중단을 경고했습니다.",options:[
      {label:"드워프 안전기준을 지지한다",npcRep:8,rival:-4,factions:{artisan:3},message:"브루노는 만족했지만 실바렌 상단은 당신을 경계합니다."},
      {label:"공동 검사단을 제안한다",npcRep:6,rival:2,factions:{merchant:2,artisan:2},message:"드워프와 엘프가 같은 책상에 앉았습니다. 기적에 가깝습니다."}
    ]},
    {rep:80,title:"룬대장간 명예열쇠",text:"브루노가 카르둠 최고의 공방을 자유롭게 이용할 수 있는 명예열쇠를 내밉니다.",options:[
      {label:"장인기금 200G를 후원한다",cost:200,npcRep:10,factions:{artisan:5},legacy:true,message:"명예열쇠를 받았습니다. 카르둠 제작 공임 혜택이 영구 강화됩니다."},
      {label:"오우거 뿔 1개를 전시품으로 기증한다",item:"ogre_horn",qty:1,npcRep:10,factions:{artisan:4,mercenary:1},legacy:true,message:"오우거 뿔이 대장간 입구에 걸렸고 당신 이름도 그 아래 새겨졌습니다."}
    ]}
  ],
  port:[
    {rep:20,title:"폭풍에 부러진 돛대",text:"세일라의 상선 한 척이 폭풍을 맞아 출항하지 못하고 있습니다.",options:[
      {label:"철괴 1개를 수리부품으로 제공한다",item:"iron",qty:1,npcRep:7,factions:{merchant:1},message:"상선이 출항했고 세일라는 다음 화물을 먼저 보여주겠다고 합니다."},
      {label:"조선소 비용을 댄다 · 70G",cost:70,npcRep:6,factions:{merchant:1},message:"부두의 망치 소리가 밤새 이어졌습니다."}
    ]},
    {rep:50,title:"항구세와 곡물상",text:"평원 상인들이 항구세를 이유로 청해 항구를 우회하려 합니다. 세일라는 강경 대응을 원합니다.",options:[
      {label:"항구의 입장을 대변한다",npcRep:8,rival:-4,factions:{merchant:2},message:"항구 조합은 환호했지만 풍요 평원에서는 당신 이야기가 좋지 않게 돌기 시작했습니다."},
      {label:"곡물 전용 부두를 제안한다",npcRep:6,rival:2,factions:{merchant:3},message:"전용 부두가 절충안이 되어 양쪽의 물류가 다시 움직입니다."}
    ]},
    {rep:80,title:"상단 전용 부두",text:"세일라가 당신 상단만 쓰는 작은 부두와 창고를 내어주려 합니다.",options:[
      {label:"부두 사용권을 산다 · 190G",cost:190,npcRep:10,factions:{merchant:4},legacy:true,message:"전용 부두가 생겼습니다. 청해 항구로 오가는 이동비가 영구 감소합니다."},
      {label:"선원 복지기금으로 전환한다 · 140G",cost:140,npcRep:9,factions:{merchant:5},legacy:true,message:"선원들이 먼저 당신 상단의 화물을 실어주기 시작했습니다."}
    ]}
  ],
  arcane:[
    {rep:20,title:"마족 견습생의 입학서류",text:"네르 교수의 교화 마족 제자가 종족 때문에 입학 서류 심사에서 막혔습니다.",options:[
      {label:"약초 2개를 실험재료로 후원한다",item:"herb",qty:2,npcRep:7,factions:{merchant:2,church:-1},message:"견습생이 실험시험을 통과했습니다. 루미에르 쪽에서는 곱지 않은 시선이 옵니다."},
      {label:"왕국 행정절차로 재심을 청구한다 · 60G",cost:60,npcRep:6,factions:{kingdom:2},message:"왕국의 공식 재심으로 입학이 승인됐습니다."}
    ]},
    {rep:50,title:"루미에르 교단의 감사단",text:"교단 감사단이 아르카나의 교화 마족 연구실을 조사하겠다고 왔습니다.",options:[
      {label:"연구실을 숨겨 시간을 번다",npcRep:8,rival:-5,factions:{merchant:2,church:-3},message:"감사단은 빈 방만 보고 돌아갔습니다. 네르는 크게 고마워했습니다."},
      {label:"공개 검증을 제안한다",npcRep:6,rival:2,factions:{church:2,merchant:2},message:"긴 논쟁 끝에 일부 연구가 공식 승인을 받았습니다."}
    ]},
    {rep:80,title:"공존 연구헌장",text:"네르가 인간과 교화 마족이 함께 운영하는 연구조합의 첫 상단 후원자가 되어달라고 합니다.",options:[
      {label:"연구기금 180G를 낸다",cost:180,npcRep:10,factions:{merchant:4,church:-1},legacy:true,message:"공존 연구조합이 출범했습니다. 아르카나 특산품 혜택이 영구 강화됩니다."},
      {label:"마법석 2개를 설립자산으로 낸다",item:"mana",qty:2,npcRep:10,factions:{merchant:3},legacy:true,message:"마법석이 조합의 첫 공동자산이 됐습니다."}
    ]}
  ],
  forest:[
    {rep:20,title:"시들어가는 정령숲",text:"리시엘이 숲 일부가 갑자기 시들고 있다며 마력 보충에 쓸 마법석을 구합니다.",options:[
      {label:"마법석 1개를 건넨다",item:"mana",qty:1,npcRep:7,factions:{merchant:1},message:"정령목의 잎이 다시 빛나기 시작했습니다."},
      {label:"치유사들을 부른다 · 75G",cost:75,npcRep:6,factions:{merchant:1},message:"치유사들이 숲의 병든 뿌리를 정리했습니다."}
    ]},
    {rep:50,title:"카르둠 광산 확장",text:"실바렌 경계 근처에서 카르둠이 새 광맥을 찾았습니다. 리시엘은 채굴 중단을 원합니다.",options:[
      {label:"엘프 측 채굴중단 요구를 지지한다",npcRep:8,rival:-4,factions:{merchant:2},message:"숲은 지켰지만 드워프 장인들이 당신 상단을 기억했습니다."},
      {label:"채굴구역과 보호림 경계를 다시 긋는다",npcRep:6,rival:2,factions:{merchant:3,artisan:1},message:"양쪽 모두 완벽히 만족하진 않았지만 싸움은 멈췄습니다."}
    ]},
    {rep:80,title:"정령 교역서약",text:"리시엘이 외부 상인에게 거의 내주지 않는 정령 교역서약을 제안합니다.",options:[
      {label:"숲 보전기금 170G를 낸다",cost:170,npcRep:10,factions:{merchant:4},legacy:true,message:"정령 교역서약이 맺어졌습니다. 실바렌 특산품 혜택이 영구 강화됩니다."},
      {label:"엘프 비단 1개를 공동기금에 돌린다",item:"elf_silk",qty:1,npcRep:9,factions:{merchant:4},legacy:true,message:"상인들이 판매품을 되돌려놓는 장면에 리시엘이 드물게 웃었습니다."}
    ]}
  ],
  holycity:[
    {rep:20,title:"성녀의 무료 진료소",text:"아리아가 빈민가 무료 진료소를 열었지만 식량과 약이 모자랍니다.",options:[
      {label:"빵 2개를 기부한다",item:"bread",qty:2,npcRep:7,factions:{church:3},message:"진료소 앞에서 당신 상단의 이름을 기억하는 사람이 늘었습니다."},
      {label:"치료비 70G를 지원한다",cost:70,npcRep:6,factions:{church:3},message:"아리아가 직접 감사인사를 전했습니다."}
    ]},
    {rep:50,title:"교화 마족 논쟁",text:"아리아에게 아르카나의 교화 마족을 시민으로 인정해야 하느냐는 압박이 쏟아집니다.",options:[
      {label:"아르카나와 공개 대화를 제안한다",npcRep:7,rival:3,factions:{church:2,merchant:2},message:"성녀와 네르 교수 사이에 처음으로 공식 대화 채널이 열렸습니다."},
      {label:"교단의 엄격한 검증을 지지한다",npcRep:8,rival:-4,factions:{church:4},message:"교단 보수파가 당신을 신뢰하기 시작했지만 아르카나와의 거리는 더 멀어졌습니다."}
    ]},
    {rep:80,title:"성물 유통서약",text:"아리아가 당신 상단에 대성당 공인 성물 유통권을 제안합니다.",options:[
      {label:"구휼기금 180G를 기부한다",cost:180,npcRep:10,factions:{church:5},legacy:true,message:"성물 유통서약이 체결됐습니다. 신성상품과 제작 혜택이 영구 강화됩니다."},
      {label:"성수 2개를 순례소에 기부한다",item:"holy",qty:2,npcRep:9,factions:{church:5},legacy:true,message:"순례소에 성수가 채워졌고 아리아가 직접 유통증서를 건넸습니다."}
    ]}
  ]
};

function cityNpcRep(city=S.city){
  return Math.max(0,Math.min(100,Number(S?.npcRep?.[city] || 0)));
}
function cityNpcTier(city=S.city){
  const rep=cityNpcRep(city);
  return rep>=80?3:rep>=50?2:rep>=20?1:0;
}
function cityNpcPriceFactor(city,item){
  const tier=cityNpcTier(city);
  if(!tier) return 1;
  const rates=[1,.98,.95,.92];
  const specialties={
    farm:["wheat","bread","beer"],
    port:["gem","spice"],
    arcane:["mana","potion"],
    forest:["herb","elf_silk","starlight_wine"],
    holycity:["holy","holy_oil","blessed_incense"]
  };
  let factor=specialties[city]?.includes(item) ? rates[tier] : 1;
  if(S?.npcLegacy?.[city] && specialties[city]?.includes(item)) factor*=.95;
  return factor;
}
function cityNpcFeeDiscount(city){
  if(city!=="capital") return 0;
  return ([0,.005,.01,.015][cityNpcTier(city)] || 0) + (S?.npcLegacy?.[city] ? .005 : 0);
}
function cityNpcCraftDiscount(city){
  if(!["mine","holycity"].includes(city)) return 0;
  return Math.min(.30,([0,.05,.10,.15][cityNpcTier(city)] || 0) + (S?.npcLegacy?.[city] ? .10 : 0));
}
function cityNpcBenefitText(city){
  const tier=cityNpcTier(city);
  const npc=CITY_NPCS[city];
  if(!npc) return "";
  if(!tier) return npc.perk + " · 우호도 20부터 시작";
  const legacy=S?.npcLegacy?.[city] ? " · ★ 개인 스토리 완결 보너스" : "";
  const pct=tier===1?2:tier===2?5:8;
  if(city==="capital") return "왕도 수수료 추가 -" + ([0,.5,1,1.5][tier] + (S?.npcLegacy?.[city] ? .5 : 0)) + "%p" + legacy;
  if(city==="mine") return "카르둠 제작 공임 -" + Math.round(cityNpcCraftDiscount(city)*100) + "%" + legacy;
  if(city==="holycity") return "신성상품 현지가 약 -" + pct + "% · 제작 공임 -" + Math.round(cityNpcCraftDiscount(city)*100) + "%" + legacy;
  if(city==="port" && S?.npcLegacy?.port) return npc.perk + " · 현지가 약 -" + pct + "% · 항구 이동비 -4G · ★ 개인 스토리 완결";
  return npc.perk + " · 현지가 약 -" + pct + "%" + legacy;
}
function changeCityNpcRep(city,amount,{rival=true}={}){
  if(!CITY_NPCS[city]) return;
  S.npcRep ||= {};
  S.npcRep[city]=Math.max(0,Math.min(100,(S.npcRep[city]||0)+Number(amount||0)));
  if(amount>0 && rival && CITY_RIVALS[city]){
    const other=CITY_RIVALS[city];
    const penalty=Math.max(1,Math.floor(amount/4));
    S.npcRep[other]=Math.max(0,(S.npcRep[other]||0)-penalty);
  }
}
function talkCityNpc(){
  if(checkBlocked()) return;
  const city=S.city,npc=CITY_NPCS[city];
  if(!npc) return;
  S.npcTalkDay ||= {};
  if(S.npcTalkDay[city]===S.day){ toast(npc.name+"과는 오늘 이미 이야기를 나눴습니다."); return; }
  S.npcTalkDay[city]=S.day;
  changeCityNpcRep(city,1,{rival:false});
  toast(npc.name+"과 이야기를 나눴습니다. 개인 우호도 +1.");
  render();
}
function helpCityNpc(){
  if(checkBlocked()) return;
  const city=S.city,npc=CITY_NPCS[city];
  if(!npc) return;
  S.npcFavorDay ||= {};
  if(S.npcFavorDay[city]===S.day){ toast("오늘의 개인 부탁은 이미 해결했습니다."); return; }
  const item=npc.favorite;
  if((S.inv[item]||0)<1){ toast(npc.name+"의 부탁에는 "+ITEMS[item].name+" 1개가 필요합니다."); return; }
  S.inv[item]-=1;
  S.npcFavorDay[city]=S.day;
  changeCityNpcRep(city,5,{rival:true});
  if(city==="holycity") changeFactionRep("church",2);
  if(city==="arcane") changeFactionRep("church",-1);
  if(city==="capital") changeFactionRep("kingdom",1);
  else changeFactionRep("merchant",.5);
  toast(npc.name+"의 부탁을 해결했습니다. 개인 우호도 +5"+(CITY_RIVALS[city]?" · 라이벌 도시 인맥 -1":"")+".");
  render();
}
function npcQuestState(city=S.city){
  S.npcQuestStage ||= {};
  return Math.max(0,Math.min(3,Number(S.npcQuestStage[city]||0)));
}
function nextNpcQuest(city=S.city){
  const stage=npcQuestState(city);
  return NPC_QUESTS[city]?.[stage] || null;
}
function canPayQuestOption(opt){
  if(opt.cost && S.cash<=opt.cost) return false;
  if(opt.item && (S.inv[opt.item]||0)<(opt.qty||1)) return false;
  return true;
}
function resolveNpcQuest(city,index){
  if(checkBlocked() || city!==S.city) return;
  const stage=npcQuestState(city);
  const quest=NPC_QUESTS[city]?.[stage];
  if(!quest || cityNpcRep(city)<quest.rep) return;
  const opt=quest.options?.[index];
  if(!opt) return;
  if(opt.cost && S.cash<=opt.cost){ toast(fmt(opt.cost)+"가 필요합니다."); return; }
  if(opt.item && (S.inv[opt.item]||0)<(opt.qty||1)){ toast(ITEMS[opt.item].name+" "+(opt.qty||1)+"개가 필요합니다."); return; }

  if(opt.cost) S.cash-=opt.cost;
  if(opt.item) S.inv[opt.item]-=(opt.qty||1);
  if(opt.cashReward){ S.cash+=opt.cashReward; recordDayIncome(opt.cashReward,"NPC 개인 퀘스트"); }
  if(opt.npcRep) changeCityNpcRep(city,opt.npcRep,{rival:false});
  if(opt.rival && CITY_RIVALS[city]){
    const r=CITY_RIVALS[city];
    S.npcRep[r]=Math.max(0,Math.min(100,(S.npcRep[r]||0)+opt.rival));
  }
  for(const [f,v] of Object.entries(opt.factions||{})) changeFactionRep(f,v);
  S.npcQuestStage[city]=stage+1;
  if(opt.legacy || stage+1>=3){
    S.npcLegacy ||= {};
    S.npcLegacy[city]=true;
  }
  toast(opt.message || CITY_NPCS[city].name+"의 개인 퀘스트를 완료했습니다.");
  render();
}
function npcQuestHtml(city){
  const stage=npcQuestState(city);
  const quest=NPC_QUESTS[city]?.[stage];
  if(!quest) return '<div class="npc-story-complete"><b>개인 스토리 완료</b><span>'+CITY_NPCS[city].name+'과의 특별한 인연이 완성됐습니다.</span></div>';
  const unlocked=cityNpcRep(city)>=quest.rep;
  return '<div class="npc-quest-card '+(unlocked?'available':'locked')+'">'+
    '<div class="npc-quest-head"><span>개인 퀘스트 '+(stage+1)+' / 3</span><b>'+quest.title+'</b></div>'+
    '<p>'+quest.text+'</p>'+
    (unlocked
      ? '<div class="npc-quest-options">'+quest.options.map((o,i)=>'<button data-npc-quest="'+city+'" data-option="'+i+'"'+(canPayQuestOption(o)?'':' disabled')+'>'+o.label+'</button>').join("")+'</div>'
      : '<div class="npc-quest-lock">우호도 '+quest.rep+'에서 해금 · 현재 '+Math.round(cityNpcRep(city))+'</div>')+
  '</div>';
}

function renderCityNpc(){
  const box=$("#cityNpcBox");
  if(!box) return;
  const city=S.city,npc=CITY_NPCS[city];
  if(!npc){ box.innerHTML=""; return; }
  const rep=cityNpcRep(city);
  const rival=CITY_RIVALS[city];
  const favorite=ITEMS[npc.favorite]?.name||npc.favorite;
  const talked=S.npcTalkDay?.[city]===S.day;
  const helped=S.npcFavorDay?.[city]===S.day;
  box.innerHTML =
    '<article class="city-npc-card"><div class="city-npc-head"><div><span>'+npc.title+'</span><h3>'+npc.name+'</h3></div><strong>'+Math.round(rep)+' / 100</strong></div>'+
    '<div class="npc-meter"><i style="width:'+rep+'%"></i></div>'+
    '<p>'+npc.desc+'</p>'+
    '<div class="npc-benefit"><b>현재 혜택</b><span>'+cityNpcBenefitText(city)+'</span></div>'+
    (rival?'<div class="npc-rival">⚡ 라이벌: '+CITIES[rival].name+' · 큰 부탁을 들어주면 상대 인맥이 조금 나빠집니다.</div>':'')+
    '<div class="npc-actions"><button id="npcTalkBtn"'+(talked?' disabled':'')+'>'+(talked?'오늘 대화 완료':'대화하기 · 우호도 +1')+'</button>'+
    '<button id="npcFavorBtn"'+(helped || (S.inv[npc.favorite]||0)<1?' disabled':'')+'>'+(helped?'오늘 부탁 완료':favorite+' 1개 건네기 · 우호도 +5')+'</button></div>'+
    npcQuestHtml(city)+'</article>';
}


const CRAFT_LIMIT = 3;
const CRAFT_RECIPES = [
  {id:"farm_flour",city:"farm",stage:1,shop:"풍요 제분소",name:"밀 제분",inputs:{wheat:2},output:{flour:1},fee:2},
  {id:"farm_bread",city:"farm",stage:2,shop:"풍요 제빵소",name:"빵 굽기",inputs:{flour:1},output:{bread:2},fee:3},
  {id:"farm_beer",city:"farm",stage:1,shop:"평원 양조장",name:"농가 맥주 양조",inputs:{wheat:2},output:{beer:1},fee:4},

  {id:"mine_steel",city:"mine",stage:1,shop:"카르둠 대제련소",name:"드워프식 강철 제련",inputs:{iron:2},output:{steel:1},fee:5},
  {id:"mine_sword",city:"mine",stage:2,shop:"카르둠 룬대장간",name:"강철검 제작",inputs:{steel:1},output:{sword:1},fee:7},
  {id:"mine_armor",city:"mine",stage:2,shop:"카르둠 룬대장간",name:"강철 갑옷 제작",inputs:{steel:1,iron:1},output:{armor:1},fee:10},

  {id:"arcane_extract",city:"arcane",stage:1,shop:"아르카나 연금술 공방",name:"약초 농축",inputs:{herb:2},output:{extract:1},fee:4},
  {id:"arcane_potion",city:"arcane",stage:2,shop:"아르카나 연금술 공방",name:"회복 포션 조제",inputs:{extract:1},output:{potion:1},fee:6},

  {id:"holy_oil_craft",city:"holycity",stage:2,shop:"루미에르 축성소",name:"성유 축성",inputs:{holy:1,herb:1},output:{holy_oil:1},fee:8},
  {id:"holy_incense_craft",city:"holycity",stage:2,shop:"대성당 향공방",name:"축복받은 향 제작",inputs:{holy:1,spice:1},output:{blessed_incense:1},fee:10}
];
const MERC_MAX_ROSTER = 6;
const MERC_RECRUIT_COST = 300;
const MERC_NAMES = ["리아","브람","세라","카엘","미라","토르빈","유나","베른","엘리","로웬","니아","가론"];
const NAMED_MERCS = [
  {id:"liana",name:"잿빛 검 리아나",city:"capital",unlockDay:10,gradeIndex:1,cost:560,trait:"escort",
    traitName:"왕실 호위술",desc:"전직 왕실 호위병. 상단 호위 배치 시 같은 등급보다 도적 방어가 강합니다."},
  {id:"bron",name:"오우거 사냥꾼 브론",city:"mine",unlockDay:18,gradeIndex:2,cost:820,trait:"hunter",
    traitName:"거물 사냥꾼",desc:"카르둠 출신 사냥꾼. 원정에서 마수 가죽과 오우거 뿔을 더 많이 챙깁니다."},
  {id:"miel",name:"떠돌이 음유용병 미엘",city:"port",unlockDay:14,gradeIndex:1,cost:620,trait:"promoter",
    traitName:"입소문 장사",desc:"칼보다 입이 빠른 용병. 홍보 활동 배치 시 판매 확률과 물량 보너스가 커집니다."},
  {id:"kasha",name:"교화 마족 창병 카샤",city:"arcane",unlockDay:25,gradeIndex:2,cost:900,trait:"pathfinder",
    traitName:"마계 길눈",desc:"아르카나에 정착한 마족 출신 용병. 모든 원정 시간이 추가로 1일 줄어듭니다."},
  {id:"aelrin",name:"수림 추적자 아엘린",city:"forest",unlockDay:22,gradeIndex:2,cost:860,trait:"rare",
    traitName:"정령의 눈",desc:"실바렌 추적자. 희귀 몬스터 소재 획득 확률이 조금 더 높습니다."}
];

const NAMED_MERC_STORIES = {
  liana:[
    {bond:10,missions:1,title:"버려진 왕실 휘장",text:"리아나가 오래된 왕실 휘장을 꺼냅니다. 예전 호위대에서 쫓겨난 날 버리지 못한 물건입니다.",options:[
      {label:"왕궁에 명예회복을 요청한다",bond:5,xp:2,factions:{kingdom:3},message:"왕궁은 공식 복직 대신 명예기록을 복구했습니다. 리아나는 그걸로 충분하다고 말합니다."},
      {label:"과거보다 지금 상단이 중요하다고 말한다",bond:7,xp:1,factions:{merchant:2},message:"리아나는 휘장을 접어 상자 깊숙이 넣었습니다."}
    ]},
    {bond:28,missions:3,title:"옛 호위대의 추적",text:"리아나의 옛 동료들이 그녀가 왕실 기밀을 들고 달아났다고 의심하며 찾아왔습니다.",options:[
      {label:"기록보관소 조사비를 낸다 · 100G",cost:100,bond:7,xp:4,factions:{kingdom:2},message:"누명이었음을 증명하는 기록을 찾았습니다."},
      {label:"리아나와 직접 대면시킨다",bond:8,xp:5,factions:{merchant:1},message:"긴 대화 끝에 옛 동료들이 검을 거뒀습니다."}
    ]},
    {bond:50,missions:5,minGrade:3,title:"호위할 사람",text:"리아나는 왕실을 지키던 시절보다 지금의 상단을 지키는 이유가 더 분명해졌다고 말합니다.",options:[
      {label:"상단의 검으로 남아달라고 한다",bond:12,xp:6,awaken:true,message:"리아나가 새 맹세를 세웠습니다. 「회색 맹세」가 각성했습니다."},
      {label:"언젠가 다시 왕실로 돌아가도 좋다고 말한다",bond:10,xp:6,awaken:true,factions:{kingdom:2},message:"리아나는 선택권을 준 당신을 위해 당분간 검을 들겠다고 답했습니다."}
    ]}
  ],
  bron:[
    {bond:10,missions:1,title:"오우거에게 남은 빚",text:"브론이 첫 사냥에서 동료를 잃은 오우거 부족의 문양을 발견했습니다.",options:[
      {label:"추적 준비를 돕는다 · 오우거 뿔 1개",item:"ogre_horn",qty:1,bond:7,xp:3,message:"브론은 뿔의 상처를 보며 놈들의 이동경로를 읽어냈습니다."},
      {label:"복수보다 살아남는 게 먼저라고 말한다",bond:5,xp:2,message:"브론은 한참 침묵하다 고개를 끄덕였습니다."}
    ]},
    {bond:28,missions:3,title:"카르둠 사냥대",text:"브론의 옛 사냥대가 그를 겁쟁이라 부르며 공개 사냥 승부를 걸어왔습니다.",options:[
      {label:"장비비 90G를 지원한다",cost:90,bond:7,xp:5,factions:{mercenary:2},message:"브론이 사냥 승부에서 압도적으로 이겼습니다."},
      {label:"상단 원정 실적으로 증명하라 한다",bond:6,xp:4,factions:{merchant:1},message:"브론은 말 대신 다음 전리품을 보여주겠다고 합니다."}
    ]},
    {bond:50,missions:5,minGrade:3,title:"오우거 왕의 뿔",text:"브론이 마침내 원수의 흔적을 찾았습니다. 이번 사냥이 끝나면 과거와 결별할 수 있습니다.",options:[
      {label:"상단 이름으로 마지막 사냥을 지원한다 · 140G",cost:140,bond:12,xp:7,awaken:true,message:"브론이 돌아왔습니다. 「왕사냥꾼」 특성이 각성했습니다."},
      {label:"혼자가 아니라 동료들과 가게 한다",bond:14,xp:6,awaken:true,factions:{mercenary:2},message:"브론은 처음으로 복수가 아니라 동료를 먼저 챙겼습니다. 「왕사냥꾼」이 각성했습니다."}
    ]}
  ],
  miel:[
    {bond:10,missions:1,title:"노래값은 누가 내나요?",text:"미엘이 상단 홍보 노래를 만들었다며 연주자들에게 줄 선금을 요구합니다.",options:[
      {label:"선금 60G를 준다",cost:60,bond:7,xp:2,factions:{merchant:2},message:"며칠 만에 시장 사람들이 상단 이름을 흥얼거리기 시작했습니다."},
      {label:"맥주 2개로 먼저 설득해본다",item:"beer",qty:2,bond:6,xp:2,message:"연주자들은 돈보다 술을 더 좋아했습니다."}
    ]},
    {bond:28,missions:3,title:"악명도 명성이다",text:"미엘이 경쟁 상단을 놀리는 노래를 만들자 예상보다 훨씬 크게 유행했습니다.",options:[
      {label:"노래를 그대로 퍼뜨린다",bond:7,xp:4,factions:{merchant:2,underworld:1},message:"평판은 시끄러워졌지만 상단 이름은 확실히 퍼졌습니다."},
      {label:"가사를 순화해 정식 광고로 바꾼다 · 70G",cost:70,bond:6,xp:4,factions:{merchant:3},message:"문제의 가사가 훌륭한 광고문구로 바뀌었습니다."}
    ]},
    {bond:50,missions:5,minGrade:3,title:"상단의 노래",text:"미엘이 당신 상단의 여정을 한 곡으로 완성했습니다. 마지막 구절에 무엇을 넣을지 묻습니다.",options:[
      {label:"돈보다 사람을 남긴 상단",bond:14,xp:6,awaken:true,factions:{merchant:3},message:"노래가 왕국 전역으로 퍼집니다. 「전설의 입소문」이 각성했습니다."},
      {label:"결국 제일 돈을 많이 번 상단",bond:11,xp:6,awaken:true,cashReward:100,message:"상인들이 웃으며 따라 부릅니다. 광고수익 100G와 「전설의 입소문」을 얻었습니다."}
    ]}
  ],
  kasha:[
    {bond:10,missions:1,title:"마족이라는 이유",text:"카샤가 선술집에서 마족이라는 이유로 출입을 거부당했습니다.",options:[
      {label:"상단 손님이라며 정면으로 항의한다",bond:8,xp:2,factions:{merchant:2,church:-1},message:"카샤는 아무 말 없이 다음 술잔을 당신 쪽으로 밀었습니다."},
      {label:"다른 가게로 조용히 자리를 옮긴다",bond:5,xp:2,message:"싸움은 없었지만 카샤는 이 일을 오래 기억할 것 같습니다."}
    ]},
    {bond:28,missions:3,title:"루미에르 관문",text:"루미에르 성기사들이 카샤의 출입을 막았습니다. 상단 계약서를 보여줘도 분위기가 험악합니다.",options:[
      {label:"성녀 아리아에게 직접 보증을 요청한다",bond:7,xp:4,factions:{church:2,merchant:2},cityRep:{holycity:3},message:"아리아의 보증으로 관문이 열렸습니다. 작은 선례가 생겼습니다."},
      {label:"검문을 포기하고 우회한다",bond:6,xp:4,factions:{church:-1},message:"카샤는 익숙한 일이라며 웃었지만 그 웃음이 밝지는 않았습니다."}
    ]},
    {bond:50,missions:5,minGrade:3,title:"두 번째 고향",text:"카샤가 마계로 돌아갈 길과 아르카나에 남을 길 사이에서 고민합니다.",options:[
      {label:"여기가 네가 선택한 고향이라고 말한다",bond:14,xp:7,awaken:true,factions:{merchant:3},cityRep:{arcane:4},message:"카샤가 상단 문장을 창에 새겼습니다. 「경계 너머의 길」이 각성했습니다."},
      {label:"어디로 가든 동료라는 약속을 한다",bond:12,xp:7,awaken:true,factions:{church:1,merchant:2},message:"카샤는 처음으로 종족보다 자신의 선택을 이야기했습니다. 특성이 각성했습니다."}
    ]}
  ],
  aelrin:[
    {bond:10,missions:1,title:"잘려나간 정령목",text:"아엘린이 불법 벌목된 정령목 조각을 발견했습니다. 흔적은 카르둠 방향으로 이어집니다.",options:[
      {label:"함께 범인을 추적한다",bond:7,xp:3,cityRep:{forest:2,mine:-1},message:"범인은 카르둠 공식 광부가 아닌 밀렵꾼이었습니다."},
      {label:"드워프 조합에도 조사 협조를 요청한다",bond:6,xp:3,cityRep:{forest:2,mine:2},message:"양 도시가 드물게 같은 범인을 쫓기 시작했습니다."}
    ]},
    {bond:28,missions:3,title:"숲과 쇠",text:"아엘린의 동료들이 카르둠과 거래하는 상단을 믿을 수 없다며 그녀에게 돌아오라고 합니다.",options:[
      {label:"상단이 두 도시를 연결할 수 있다고 설득한다",bond:8,xp:4,cityRep:{forest:2,mine:2},factions:{merchant:2},message:"아엘린은 적어도 당신 상단에서는 공존을 시험해보겠다고 합니다."},
      {label:"실바렌의 입장을 우선하겠다고 약속한다",bond:7,xp:4,cityRep:{forest:4,mine:-2},message:"엘프 추적자들이 경계를 조금 풀었습니다."}
    ]},
    {bond:50,missions:5,minGrade:3,title:"별을 읽는 눈",text:"아엘린이 대정령의 흔적을 발견했습니다. 숲의 길을 읽는 마지막 시험이 시작됩니다.",options:[
      {label:"원정 준비비 130G를 지원한다",cost:130,bond:12,xp:7,awaken:true,message:"아엘린이 대정령의 표식을 받아왔습니다. 「대정령의 시야」가 각성했습니다."},
      {label:"혼자 가지 말고 상단과 함께하라 한다",bond:14,xp:6,awaken:true,factions:{merchant:2},message:"아엘린이 혼자 사라지는 대신 돌아올 장소를 선택했습니다. 특성이 각성했습니다."}
    ]}
  ]
};



const MERC_GRADES = [
  {id:"E",name:"E급",promoteXp:6,promoteCost:180,trainCost:70,loot:1.00,rare:0.00,dayCut:0,upkeep:5},
  {id:"D",name:"D급",promoteXp:14,promoteCost:320,trainCost:110,loot:1.18,rare:0.04,dayCut:0,upkeep:8},
  {id:"C",name:"C급",promoteXp:26,promoteCost:560,trainCost:170,loot:1.42,rare:0.09,dayCut:0,upkeep:14},
  {id:"B",name:"B급",promoteXp:42,promoteCost:900,trainCost:260,loot:1.72,rare:0.15,dayCut:1,upkeep:22},
  {id:"A",name:"A급",promoteXp:65,promoteCost:1450,trainCost:400,loot:2.05,rare:0.22,dayCut:1,upkeep:35},
  {id:"S",name:"S급",promoteXp:null,promoteCost:null,trainCost:620,loot:2.55,rare:0.30,dayCut:2,upkeep:55}
];
const MERC_EXPEDITIONS = [
  {
    id:"grass_hunt",name:"근교 마수 토벌",days:2,cost:30,unlockDay:1,minGrade:0,xp:2,
    desc:"초원과 농로의 마수들을 정리합니다. E급부터 가능하며 기본 소재를 안정적으로 모읍니다.",
    yields:[
      {item:"beast_hide",min:1,max:3,chance:1},
      {item:"slime_core",min:1,max:2,chance:.55}
    ]
  },
  {
    id:"ruins_hunt",name:"폐광 몬스터 소탕",days:3,cost:55,unlockDay:10,minGrade:1,xp:3,
    desc:"폐광의 슬라임과 오우거를 상대합니다. D급 이상이 필요합니다.",
    yields:[
      {item:"slime_core",min:1,max:3,chance:1},
      {item:"ogre_horn",min:1,max:2,chance:.62},
      {item:"beast_hide",min:1,max:2,chance:.5}
    ]
  },
  {
    id:"wyvern_hunt",name:"산악 와이번 추적",days:4,cost:90,unlockDay:25,minGrade:2,xp:4,
    desc:"산악지대를 추적하는 C급 이상 원정입니다. 와이번 비늘을 본격적으로 얻습니다.",
    yields:[
      {item:"ogre_horn",min:1,max:2,chance:.7},
      {item:"wyvern_scale",min:1,max:2,chance:.58,rare:true},
      {item:"beast_hide",min:1,max:2,chance:.45}
    ]
  },
  {
    id:"demon_hunt",name:"마왕군 잔당 추적",days:5,cost:140,unlockDay:50,minGrade:3,xp:5,
    desc:"전쟁터와 마계 잔당을 쫓는 B급 이상 원정입니다. 마족 발톱을 확보할 수 있습니다.",
    yields:[
      {item:"wyvern_scale",min:1,max:2,chance:.72,rare:true},
      {item:"demon_claw",min:1,max:2,chance:.62,rare:true},
      {item:"ogre_horn",min:1,max:2,chance:.55}
    ]
  },
  {
    id:"abyss_hunt",name:"마계 심층 원정",days:6,cost:220,unlockDay:75,minGrade:4,xp:7,
    desc:"A급 이상만 들어갈 수 있는 최고위 원정입니다. 희귀 소재를 대량으로 노릴 수 있습니다.",
    yields:[
      {item:"demon_claw",min:1,max:3,chance:.82,rare:true},
      {item:"wyvern_scale",min:1,max:3,chance:.78,rare:true},
      {item:"ogre_horn",min:1,max:3,chance:.7}
    ]
  }
];

const MERC_GEAR = [
  {
    id:"hide_cover",item:"monster_hide_cover",name:"마수가죽 화물덮개",fee:140,unlockDay:1,
    inputs:{beast_hide:4,iron:1},
    desc:"질긴 마수 가죽을 덧댄 상단용 화물덮개. 초보 상단과 개척대가 자주 찾습니다."
  },
  {
    id:"slime_cooler",item:"monster_slime_cooler",name:"슬라임 핵 냉각상자",fee:220,unlockDay:10,
    inputs:{slime_core:4,steel:1,mana:1},
    desc:"슬라임 핵의 냉기를 이용한 고급 보관상자. 항구와 마도도시에서 특히 인기가 높습니다."
  },
  {
    id:"ogre_horn",item:"monster_ogre_horn",name:"오우거뿔 경적",fee:270,unlockDay:20,
    inputs:{ogre_horn:3,steel:1},
    desc:"오우거 뿔로 만든 거대한 경적. 호위대와 모험가 상단이 장식 겸 신호장비로 구매합니다."
  },
  {
    id:"wyvern_armor",item:"monster_wyvern_armor",name:"와이번 비늘 마차갑옷",fee:430,unlockDay:30,
    inputs:{wyvern_scale:3,steel:2},
    desc:"희귀 와이번 비늘을 이어붙인 고급 마차 장갑. 전시와 국경 긴장기에 값이 크게 뜁니다."
  },
  {
    id:"demon_compass",item:"monster_demon_compass",name:"마족 추적 나침반",fee:650,unlockDay:50,
    inputs:{demon_claw:2,mana:2,gem:1},
    desc:"마족의 마력을 감지하도록 만든 최고급 나침반. 귀족 탐험대와 마도 연구소가 노립니다."
  }
];

const MERCENARY_EVENTS = [
  {
    id:"merc_feast",title:"용병단의 합동 회식",text:"최근 당신이 일을 많이 맡기자 여러 용병단이 한 선술집에 모였습니다. 계산서가 자연스럽게 당신 앞으로 왔습니다.",
    options:[
      {label:"100G를 내고 끝까지 함께 마신다",effect:"merc_feast_full"},
      {label:"50G만 보태고 먼저 빠진다",effect:"merc_feast_half"},
      {label:"고용주는 술값까지 안 냅니다",effect:"merc_feast_skip"}
    ]
  },
  {
    id:"merc_injured",title:"부상당한 용병의 부탁",text:"귀환한 용병 한 명이 치료비를 아끼려 버티고 있습니다. 동료들이 슬쩍 당신 쪽을 봅니다.",
    options:[
      {label:"포션 1개를 내준다",effect:"merc_heal_potion"},
      {label:"치료비 90G를 대신 낸다",effect:"merc_heal_cash"},
      {label:"계약은 끝났습니다",effect:"merc_heal_ignore"}
    ]
  },
  {
    id:"merc_brawl",title:"용병단끼리 선술집 난투",text:"동시에 여러 용병단을 고용하다 보니 서로 누가 더 강한지 싸움이 붙었습니다. 가구가 부서지는 소리가 납니다.",
    options:[
      {label:"수리비 80G를 내고 직접 중재한다",effect:"merc_brawl_mediate"},
      {label:"경비대에 맡긴다",effect:"merc_brawl_guard"},
      {label:"누가 이기나 구경한다",effect:"merc_brawl_watch"}
    ]
  },
  {
    id:"merc_pay_raise",title:"용병들의 급료 협상",text:"용병들이 최근 위험도가 너무 올랐다며 급료 조정을 요구합니다. 대표가 장부를 들고 꽤 진지한 표정으로 찾아왔습니다.",
    options:[
      {label:"격려금 120G를 지급한다",effect:"merc_raise_pay"},
      {label:"다음 원정 성공 시 보너스를 약속한다",effect:"merc_raise_promise"},
      {label:"계약서는 이미 썼습니다",effect:"merc_raise_refuse"}
    ]
  },
  {
    id:"merc_duel",title:"용병 길드 공개 대련",text:"길드에서 상단 소속 용병 한 명을 공개 대련에 내보내 달라고 합니다. 잘하면 이름값을 올릴 기회입니다.",
    options:[
      {label:"훈련비 70G를 지원해 참가시킨다",effect:"merc_duel_sponsor"},
      {label:"구경만 한다",effect:"merc_duel_watch"}
    ]
  },
  {
    id:"merc_loot_argument",title:"원정 전리품 분배 논쟁",text:"용병들이 가치 있는 전리품 하나를 발견했는데 계약상 누구 몫인지 애매합니다.",
    options:[
      {label:"용병들이 가지게 한다",effect:"merc_loot_give"},
      {label:"상단 몫이라며 120G에 처분한다",effect:"merc_loot_take"},
      {label:"절반씩 나눈다",effect:"merc_loot_split"}
    ]
  },
  {
    id:"merc_rescue",title:"용병이 길에서 아이를 구했습니다",text:"상단 소속 용병이 이동 중 위험에 처한 아이를 구했습니다. 소문이 빠르게 퍼지고 있습니다.",
    options:[
      {label:"치료비 60G까지 지원한다",effect:"merc_rescue_support"},
      {label:"용병 개인의 선행으로 둔다",effect:"merc_rescue_neutral"}
    ]
  }
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
  {id:"antihero_foundation",n:"상인조합 경제피해대책위원회 결성",tag:"단체",chainOnly:true,txt:"용사의 한마디에 재고가 폭등락하자 상인들이 '상인조합 경제피해대책위원회'를 만들었습니다. 첫 회의 안건은 용사 광고 금지입니다.",p:{sword:.82,armor:.9,beer:1.16},d:{sword:.72,armor:.82,beer:1.3},days:2,follow:{id:"antihero_rally",chance:.78}},
  {id:"antihero_rally",n:"상인조합 피해대책위 대규모 시위",tag:"단체",chainOnly:true,txt:"'용사는 마왕만 잡고 시세는 건드리지 마라!'라는 현수막이 왕도 앞을 뒤덮었습니다. 구경꾼 때문에 맥주와 빵은 잘 팔립니다.",p:{sword:.68,armor:.78,beer:1.38,bread:1.2},d:{sword:.5,armor:.65,beer:1.7,bread:1.35},days:2,follow:{id:"hero_fan_counter",chance:.55}},
  {id:"hero_fan_counter",n:"용사 팬클럽 맞불 집회",tag:"유행",chainOnly:true,txt:"용사 팬클럽이 '우리 용사님이 뭘 잘못했냐'며 맞불 집회를 열었습니다. 검 굿즈가 다시 팔립니다.",p:{sword:1.38,gem:1.15,beer:1.2},d:{sword:1.65,gem:1.25,beer:1.3},days:2,follow:{id:"hero_axe",chance:.7}},
  {id:"antihero_lawsuit",n:"상인연합, 용사에게 시세조작 손해배상 청구",tag:"단체",txt:"상인조합 피해대책위가 용사의 인터뷰 한마디로 손해를 봤다며 집단소송을 냈습니다. 변호사들은 보석으로 수임료를 받습니다.",p:{sword:.8,gem:1.28,spice:1.12},d:{sword:.7,gem:1.45},days:2},
  {id:"antihero_boycott",n:"상인조합 피해대책위 '검 안 사기 운동'",tag:"단체",txt:"용사가 또 검을 칭찬하자 반용사 상인연합이 검 불매운동을 시작했습니다. 갑옷은 왜 같이 안 사는지 아무도 모릅니다.",p:{sword:.58,armor:.88,beer:1.18},d:{sword:.38,armor:.8,beer:1.28},days:2},
  {id:"antihero_merch",n:"반용사 굿즈 대박",tag:"단체",txt:"상인조합 피해대책위의 '시세를 지켜라' 배지가 유행했습니다. 보석상들이 배지를 금으로 만들기 시작했습니다.",p:{gem:1.3,beer:1.15},d:{gem:1.5,beer:1.25},days:2},
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
  {id:"royal_curfew",n:"왕실 야간 통행금지령",tag:"통제",cities:["capital"],blockedCities:["capital"],txt:"왕도가 이틀간 통행금지에 들어갔습니다. 왕도 출입이 막혀 길드 의뢰 일정이 꼬이기 시작했습니다.",p:{bread:1.12,beer:.9,holy:1.08},d:{bread:1.2,beer:.8,holy:1.15},days:2},
  {id:"great_bridge_collapse",n:"철산 대교 붕괴",tag:"교통",cities:["mine"],blockedCities:["mine"],txt:"광산도시로 이어지는 대교가 무너졌습니다. 복구 전까지 철산 광산도시 출입이 금지됩니다.",p:{iron:1.25,sword:1.12,armor:1.12},d:{iron:1.35},days:2},
  {id:"port_quarantine",n:"청해 항구 검역 봉쇄",tag:"통제",cities:["port"],blockedCities:["port"],txt:"정체불명의 열병 신고로 항구가 봉쇄됐습니다. 배도 마차도 들어오고 나갈 수 없습니다.",p:{spice:1.32,gem:1.2,potion:1.25},d:{spice:1.4,potion:1.4},days:2},
  {id:"arcane_lockdown",n:"마도도시 마력폭주 봉쇄",tag:"마법",cities:["arcane"],blockedCities:["arcane"],txt:"도시 외곽 마법진이 폭주해 아르카나 출입이 전면 통제됐습니다. 교수들은 '예정된 실험'이라고 주장합니다.",p:{mana:1.35,potion:1.2},d:{mana:1.5,potion:1.3},days:2},
  {id:"princess_bread_diet",n:"공주: '요즘 빵 먹으면 얼굴이 붓는 것 같아요'",tag:"공주 발언",princess:true,
    txt:"공주의 아침 인터뷰 한마디에 귀족들이 빵을 식탁에서 치우기 시작했습니다. 제빵사들은 왕궁 방향을 바라보며 깊게 한숨 쉽니다.",
    p:{bread:.55,wheat:.68,spice:1.16},d:{bread:.38,wheat:.55,spice:1.25},shock:{bread:.84,wheat:.90},days:1,
    follow:{id:"princess_bread_reverse",chance:.5}},
  {id:"princess_bread_reverse",n:"공주: '아, 크림빵은 매일 먹는데요?'",tag:"공주 정정",princess:true,chainOnly:true,
    txt:"어제 빵을 던진 상인들이 오늘은 다시 빵을 사기 위해 줄을 섰습니다. 공주는 왜 시장이 시끄러운지 모르겠다는 표정입니다.",
    p:{bread:1.82,wheat:1.42,spice:1.18},d:{bread:2.05,wheat:1.55,spice:1.3},shock:{bread:1.18,wheat:1.10},days:1},

  {id:"princess_potion_skin",n:"공주: '피부 관리에는 포션 세 병이 기본이죠'",tag:"공주 발언",princess:true,
    txt:"전국 귀족가에서 회복 포션을 화장수처럼 주문하기 시작했습니다. 약초상들은 의학적 근거를 묻지 않기로 했습니다.",
    p:{potion:1.72,herb:1.38,holy:.92},d:{potion:2.1,herb:1.55,holy:.82},shock:{potion:1.16,herb:1.08},days:1,
    follow:{id:"princess_potion_reverse",chance:.5}},
  {id:"princess_potion_reverse",n:"공주: '포션 냄새가 싫어서 성수로 바꿨어요'",tag:"공주 정정",princess:true,chainOnly:true,
    txt:"어제 포션을 사재기한 귀족들이 오늘 전부 성수를 찾습니다. 연금술사들은 공주의 피부가 아니라 자기 혈압을 걱정합니다.",
    p:{potion:.54,herb:.78,holy:1.75},d:{potion:.35,herb:.7,holy:2.05},shock:{potion:.82,holy:1.16},days:1},

  {id:"princess_gem_old",n:"공주: '보석은 좀... 어머니 세대 취향 아닌가요?'",tag:"공주 발언",princess:true,
    txt:"귀족 영애들이 보석함을 급히 처분하고 마법석 장식을 찾기 시작했습니다. 보석상 조합장이 인터뷰 도중 말을 잃었습니다.",
    p:{gem:.52,mana:1.68,spice:1.08},d:{gem:.32,mana:1.95,spice:1.15},shock:{gem:.82,mana:1.15},days:1,
    follow:{id:"princess_gem_reverse",chance:.5}},
  {id:"princess_gem_reverse",n:"공주: '근데 파란 보석은 정말 예쁘던데요?'",tag:"공주 정정",princess:true,chainOnly:true,
    txt:"파란 보석만 찾는 손님이 몰렸지만 시장은 색상 구분 데이터가 없습니다. 결국 모든 보석 가격이 미쳐 날뛰고 있습니다.",
    p:{gem:1.88,mana:.62},d:{gem:2.15,mana:.5},shock:{gem:1.18,mana:.86},days:1},

  {id:"princess_weapon_scary",n:"공주: '검이랑 갑옷은 너무 무섭고 칙칙해요'",tag:"공주 발언",princess:true,
    txt:"귀족 호위대가 체면 때문에 주문을 취소하기 시작했습니다. 전쟁터의 기사들은 인터뷰를 보고 한동안 아무 말도 하지 않았습니다.",
    p:{sword:.56,armor:.60,gem:1.12},d:{sword:.38,armor:.4,gem:1.2},shock:{sword:.84,armor:.85},days:1,
    follow:{id:"princess_weapon_reverse",chance:.5}},
  {id:"princess_weapon_reverse",n:"공주, 갑옷 입고 화보 촬영",tag:"공주 정정",princess:true,chainOnly:true,
    txt:"오늘 공개된 왕실 화보에서 공주가 갑옷과 장식검을 들었습니다. 어제 주문을 취소한 귀족들이 두 배 가격으로 다시 주문합니다.",
    p:{sword:1.58,armor:1.86,gem:1.22},d:{sword:1.8,armor:2.1,gem:1.35},shock:{sword:1.12,armor:1.18},days:1},

  {id:"princess_beer_smell",n:"공주: '맥주는 냄새 때문에 정말 싫어요'",tag:"공주 발언",princess:true,
    txt:"왕도 선술집들이 갑자기 와인 흉내를 내기 시작했습니다. 맥주 재고는 창고를 가득 채우고 양조장 주인들의 표정도 같이 썩어갑니다.",
    p:{beer:.48,wheat:.84,spice:1.16},d:{beer:.3,wheat:.72,spice:1.28},shock:{beer:.80},days:1,
    follow:{id:"princess_beer_reverse",chance:.5}},
  {id:"princess_beer_reverse",n:"공주: '과일맥주는 맛있던데요? 그건 맥주 아닌가요?'",tag:"공주 정정",princess:true,chainOnly:true,
    txt:"어제 맥주를 버린 상인들이 오늘 빈 통까지 주워 담고 있습니다. 양조장들은 왕궁에 감사 편지 대신 청구서를 보내고 싶어합니다.",
    p:{beer:1.92,wheat:1.28,spice:1.25},d:{beer:2.2,wheat:1.4,spice:1.38},shock:{beer:1.20,wheat:1.07},days:1},

  {id:"princess_wyvern_pretty",n:"공주: '와이번 비늘은 반짝반짝해서 너무 예뻐요'",tag:"공주 발언",princess:true,
    txt:"귀족 상단들이 와이번 비늘 장비를 장식품처럼 사들이기 시작했습니다. 용병 길드는 산을 향해 뛰어가는 상인들을 말리지 않습니다.",
    p:{armor:1.12,gem:1.08},d:{armor:1.2,gem:1.15},
    gearP:{monster_wyvern_armor:1.72,monster_ogre_horn:1.18,monster_hide_cover:1.12},days:1,
    follow:{id:"princess_wyvern_reverse",chance:.5}},
  {id:"princess_wyvern_reverse",n:"공주: '가까이서 보니까 비늘이 좀 징그러워요'",tag:"공주 정정",princess:true,chainOnly:true,
    txt:"어제 와이번 갑옷을 웃돈 주고 산 귀족들이 오늘 중고 매물을 쏟아냅니다. 철산 장비공방에서 욕설이 들린다는 신고가 접수됐습니다.",
    p:{armor:.88},d:{armor:.8},
    gearP:{monster_wyvern_armor:.48,monster_ogre_horn:.82,monster_hide_cover:.9},days:1},

  {id:"princess_magic_compass",n:"공주: '마족 나침반 하나 갖고 싶어요. 신기하잖아요?'",tag:"공주 발언",princess:true,
    txt:"귀족 탐험대들이 마족 추적 나침반을 경쟁적으로 주문합니다. 아무도 실제로 마족을 추적할 생각은 없습니다.",
    p:{mana:1.18,gem:1.12},d:{mana:1.28,gem:1.2},
    gearP:{monster_demon_compass:1.85,monster_slime_cooler:1.18},days:1,
    follow:{id:"princess_magic_reverse",chance:.5}},
  {id:"princess_magic_reverse",n:"공주: '나침반 바늘이 계속 움직여서 무서워요'",tag:"공주 정정",princess:true,chainOnly:true,
    txt:"왕실이 주문을 취소하자 귀족 탐험대도 일제히 따라 취소했습니다. 마족보다 공주의 취향 변화가 더 추적하기 어렵습니다.",
    p:{mana:.9},d:{mana:.82},
    gearP:{monster_demon_compass:.50,monster_slime_cooler:.84},days:1},

  {id:"dwarf_forge_festival",n:"카르둠 대용광로 축제",tag:"드워프",cities:["mine"],
    txt:"드워프 장인들이 밤새 용광로를 돌리며 제작 경연을 벌입니다. 철은 넘쳐나지만 완성품을 사려는 외지 상단도 몰려듭니다.",
    p:{iron:.78,sword:1.18,armor:1.20,beer:1.25},d:{iron:.82,sword:1.35,armor:1.38,beer:1.45},days:2},
  {id:"elf_moon_festival",n:"실바렌 달빛 축제",tag:"엘프",cities:["forest"],
    txt:"엘프들이 수백 년 된 숲의 개화기를 맞아 달빛 축제를 엽니다. 약초와 비단이 시장에 쏟아지고 별빛 포도주는 도시 밖으로 빠르게 팔려나갑니다.",
    p:{herb:.72,elf_silk:.76,starlight_wine:1.18},d:{herb:.84,elf_silk:.90,starlight_wine:1.55},days:2},
  {id:"holy_pilgrimage",n:"루미에르 대순례 기간 시작",tag:"교단",cities:["holycity"],
    txt:"각지의 순례객이 성도로 몰려들었습니다. 성수·성유·축복받은 향을 사려는 줄이 대성당 밖까지 이어집니다.",
    p:{holy:1.28,holy_oil:1.30,blessed_incense:1.34,bread:1.08},d:{holy:1.65,holy_oil:1.70,blessed_incense:1.75,bread:1.25},days:3},

  {id:"princess_holy_smell",n:"공주: '성수는 냄새가 좀 병원 같지 않아요?'",tag:"공주 발언",princess:true,
    txt:"왕도 귀족들이 성수 주문을 취소하기 시작했습니다. 루미에르 성직자들은 왕궁 쪽을 바라보며 아주 길게 침묵했습니다.",
    p:{holy:.58,holy_oil:.68,blessed_incense:.82,gem:1.08},d:{holy:.40,holy_oil:.52,blessed_incense:.70},shock:{holy:.84,holy_oil:.88,blessed_incense:.93},days:1,
    follow:{id:"saint_holy_rebuke",chance:.5}},
  {id:"saint_holy_rebuke",n:"성녀: '신앙을 유행처럼 논하지 마십시오'",tag:"성녀 선언",saint:true,chainOnly:true,
    txt:"성녀의 정면 반박 이후 전국 교회가 성수와 성유를 대량 주문했습니다. 왕궁과 대성당의 사이가 싸늘해졌고 상인들만 계산기를 두드립니다.",
    p:{holy:1.75,holy_oil:1.62,blessed_incense:1.42},d:{holy:2.10,holy_oil:1.95,blessed_incense:1.70},shock:{holy:1.18,holy_oil:1.14,blessed_incense:1.10},days:1},

  {id:"saint_luxury_abstinence",n:"성녀: '지금은 사치보다 구휼이 먼저입니다'",tag:"성녀 선언",saint:true,
    txt:"성녀가 귀족들의 사치 경쟁을 공개적으로 비판했습니다. 보석과 엘프 비단 주문은 줄고, 약과 성물 기부 주문이 몰립니다.",
    p:{gem:.66,spice:.78,elf_silk:.70,holy:1.22,holy_oil:1.25,potion:1.18},d:{gem:.48,spice:.65,elf_silk:.52,holy:1.55,holy_oil:1.60,potion:1.42},shock:{gem:.90,elf_silk:.91,holy:1.07},days:2},
  {id:"saint_temperance",n:"성녀: '축제라 해도 취할 이유는 없습니다'",tag:"성녀 선언",saint:true,
    txt:"교단이 절제 주간을 선포했습니다. 맥주와 별빛 포도주 소비가 급감하고 축복받은 향 판매대는 오히려 붐빕니다.",
    p:{beer:.64,starlight_wine:.58,blessed_incense:1.32},d:{beer:.48,starlight_wine:.42,blessed_incense:1.65},shock:{beer:.91,starlight_wine:.88,blessed_incense:1.08},days:2},
  {id:"saint_healing_mission",n:"성녀, 빈민가 무료 치료단 파견",tag:"성녀 선언",saint:true,
    txt:"성녀가 왕국 각지에 무료 치료단을 보냈습니다. 약초·포션·성유 주문이 폭증했습니다.",
    p:{herb:1.24,potion:1.30,holy_oil:1.28},d:{herb:1.55,potion:1.72,holy_oil:1.65},shock:{herb:1.07,potion:1.09,holy_oil:1.08},days:2},

  {id:"arcane_holy_dispute",n:"아르카나와 루미에르, 교화 마족 문제로 공개 설전",tag:"도시 갈등",cities:["arcane","holycity"],
    txt:"아르카나는 교화된 마족도 시민이라고 선언했고 루미에르 교단은 검증 없는 공존은 위험하다고 반박했습니다. 양 도시의 상인들까지 편을 나누기 시작했습니다.",
    p:{mana:1.22,holy:1.20,holy_oil:1.14,potion:1.12},d:{mana:1.38,holy:1.36,holy_oil:1.28},days:2},
  {id:"elf_dwarf_trade_spat",n:"실바렌-카르둠 무역분쟁",tag:"도시 갈등",cities:["forest","mine"],
    txt:"엘프 장로회가 광산 먼지를 문제 삼자 드워프 장인들이 엘프 목제품 검사를 강화했습니다. 서로 안 산다더니 중간상인만 바빠졌습니다.",
    p:{iron:1.18,elf_silk:1.18,herb:1.12,sword:1.10},d:{iron:1.30,elf_silk:1.32,herb:1.22},days:2},
  {id:"port_farm_trade_spat",n:"청해 항구와 풍요 평원, 운임·곡물세 충돌",tag:"도시 갈등",cities:["port","farm"],
    txt:"평원 농장주들은 항구 운임이 폭리라고 주장하고 선주들은 곡물 상인들이 배를 창고처럼 쓴다고 맞받았습니다.",
    p:{wheat:1.18,spice:1.14,beer:1.12},d:{wheat:1.30,spice:1.25,beer:1.22},days:2},

  {id:"royal_weapon_sale_ban",n:"왕실, 민간 무기 판매 3일간 금지",tag:"판매금지",txt:"왕실이 치안 안정을 이유로 검과 갑옷의 민간 판매를 전면 금지했습니다. 이미 진열한 물건도 거래가 중지됩니다.",bannedItems:["sword","armor"],p:{sword:.86,armor:.88},d:{sword:.35,armor:.38},days:3},
  {id:"potion_sale_ban",n:"왕실 보건국, 포션 판매 일시 금지",tag:"판매금지",txt:"성분표시 오류가 발견됐다는 이유로 포션 판매가 며칠간 금지됐습니다. 약초상들은 자기들은 무관하다며 웃고 있습니다.",bannedItems:["potion"],p:{potion:.72,herb:1.18},d:{potion:.2,herb:1.3},days:2},
  {id:"grain_sale_control",n:"왕실, 곡물 사재기 방지 판매통제",tag:"판매금지",txt:"빵과 밀을 비축한 상인이 너무 많아지자 왕실이 민간 판매를 잠시 막았습니다. 창고에 곡물이 있는 상인들의 표정이 굳었습니다.",bannedItems:["bread","wheat"],p:{bread:.78,wheat:.74},d:{bread:.28,wheat:.25},days:2},
  {id:"luxury_capital_ban",n:"왕도 사치품 거래 자숙령",tag:"판매금지",cities:["capital"],banCities:["capital"],txt:"왕실이 민심 수습을 이유로 왕도에서 보석과 향신료 판매를 금지했습니다. 귀족들은 즉시 하인들을 다른 도시로 보냈습니다.",bannedItems:["gem","spice"],p:{gem:.64,spice:.7},d:{gem:.25,spice:.3},days:3},
  {id:"monster_gear_inspection",n:"몬스터 소재 장비 안전검사 명령",tag:"판매금지",txt:"가공 불량 신고가 접수돼 몬스터 소재 장비 전 품목의 판매가 잠시 중지됐습니다. 철산 공방들은 검사가 끝날 때까지 재고를 쌓아야 합니다.",bannedItems:["monster_hide_cover","monster_slime_cooler","monster_ogre_horn","monster_wyvern_armor","monster_demon_compass"],days:2},

  {id:"farm_entry_ban",n:"풍요 평원 외부인 출입금지",tag:"출입금지",cities:["farm"],blockedCities:["farm"],txt:"가축 전염병 의심 신고로 풍요 평원이 봉쇄됐습니다. 주민은 나갈 수 없고 외부 상단도 들어갈 수 없습니다.",p:{wheat:1.18,bread:1.15,herb:1.1},d:{wheat:1.3,bread:1.25},days:3},
  {id:"mine_entry_ban",n:"철산 광산도시 군사통제구역 지정",tag:"출입금지",cities:["mine"],blockedCities:["mine"],txt:"갱도 깊은 곳에서 정체불명의 폭발이 발생해 철산 전체가 임시 군사통제구역으로 지정됐습니다.",p:{iron:1.28,sword:1.14,armor:1.16},d:{iron:1.4},days:3},
  {id:"port_entry_ban",n:"청해 항구 전면 입항·입성 금지",tag:"출입금지",cities:["port"],blockedCities:["port"],txt:"밀수선 추적작전 때문에 항구 출입문과 부두가 동시에 봉쇄됐습니다. 멀쩡한 상인들까지 같이 갇혔습니다.",p:{spice:1.25,gem:1.18},d:{spice:1.35,gem:1.3},days:2},
  {id:"arcane_entry_ban",n:"아르카나 외부인 접근금지",tag:"출입금지",cities:["arcane"],blockedCities:["arcane"],txt:"마법대학이 '도시 규모의 실험'을 시작한다며 외부인 접근을 막았습니다. 교수들은 안전하다는 말만 반복합니다.",p:{mana:1.3,potion:1.16},d:{mana:1.42,potion:1.26},days:2},
  {id:"forest_entry_ban",n:"실바렌 장로회, 외부 상단 출입 제한",tag:"출입금지",cities:["forest"],blockedCities:["forest"],
    txt:"대삼림의 정령 이상 현상으로 엘프 장로회가 외부인 출입을 막았습니다. 약초와 엘프 비단 공급이 즉시 줄어듭니다.",
    p:{herb:1.30,elf_silk:1.26,starlight_wine:1.18},d:{herb:1.45,elf_silk:1.40},days:2},
  {id:"holycity_entry_ban",n:"루미에르 대성당, 성도 임시 봉쇄",tag:"출입금지",cities:["holycity"],blockedCities:["holycity"],
    txt:"대규모 종교행사를 이유로 성도 관문이 닫혔습니다. 성수와 성유를 실은 마차들이 성벽 밖에서 줄을 섭니다.",
    p:{holy:1.32,holy_oil:1.28,blessed_incense:1.22},d:{holy:1.48,holy_oil:1.42},days:2},

  {id:"prosperity_trade_fair",phases:["prosperity"],n:"왕국 대교역 박람회 개막",tag:"호황",txt:"전국 상인이 왕도로 몰려들었습니다. 보석과 향신료는 진열하자마자 팔립니다.",p:{gem:1.12,spice:1.14},d:{gem:1.45,spice:1.5},days:2},
  {id:"prosperity_tourism",phases:["prosperity"],n:"용사 성지순례 관광상품 대박",tag:"유행",txt:"아직 마왕도 안 나타났는데 용사 생가 관광상품이 먼저 대박 났습니다.",p:{beer:1.14,bread:1.08,gem:1.08},d:{beer:1.4,bread:1.25,gem:1.2},days:2},
  {id:"tension_tariff",phases:["tension"],n:"국경 통행세 임시 인상",tag:"국경",txt:"왕실이 국경 수비 비용을 이유로 통행세를 올렸습니다. 상인들은 '임시'라는 말을 믿지 않습니다.",p:{spice:1.12,gem:1.1,iron:1.08},d:{iron:1.18},days:2},
  {id:"tension_stockpile",phases:["tension"],n:"주민들의 전쟁 대비 사재기",tag:"긴장",txt:"아직 전쟁은 아니라는데 빵과 포션 진열대가 먼저 비었습니다.",p:{bread:1.16,potion:1.18,holy:1.1},d:{bread:1.45,potion:1.5,holy:1.25},days:2},
  {id:"tension_refugees",phases:["tension"],n:"국경 마을 주민 대피 시작",tag:"국경",txt:"국경 주민들이 내륙으로 이동하며 식량과 숙박 수요가 급증했습니다.",p:{bread:1.12,beer:1.08},d:{bread:1.35,beer:1.25},days:2},
  {id:"war_requisition",phases:["war"],n:"왕실 군수품 긴급 징발",tag:"전쟁",war:true,txt:"왕실이 검·갑옷·포션을 우선 매입합니다. 상인들은 애국심과 가격표를 동시에 확인합니다.",p:{sword:1.2,armor:1.2,potion:1.18},d:{sword:1.7,armor:1.65,potion:1.7},days:2},
  {id:"war_field_hospitals",phases:["war"],n:"야전병원 포화",tag:"전쟁",war:true,txt:"부상병이 늘면서 포션과 성수 수요가 폭발했습니다.",p:{potion:1.25,holy:1.28,herb:1.15},d:{potion:1.85,holy:1.8,herb:1.45},days:2},
  {id:"war_supply_cut",phases:["war"],n:"주요 보급로 차단",tag:"전쟁",war:true,txt:"마왕군이 보급로를 끊었습니다. 식량과 철이 동시에 귀해졌습니다.",p:{bread:1.18,wheat:1.16,iron:1.2},d:{bread:1.55,wheat:1.45,iron:1.5},days:2},
  {id:"recovery_building",phases:["recovery"],n:"전국 재건 공사 발주",tag:"복구",txt:"무너진 다리와 성벽을 고치기 위해 철과 식량이 대량 발주됐습니다.",p:{iron:1.18,bread:1.08},d:{iron:1.65,bread:1.3},days:3},
  {id:"recovery_surplus",phases:["recovery"],n:"전쟁 잉여 군수품 대방출",tag:"복구",txt:"왕실 창고에서 남은 검과 갑옷이 쏟아져 나옵니다. 대장장이들이 표정을 잃었습니다.",p:{sword:.72,armor:.75},d:{sword:.62,armor:.65},days:3},
  {id:"recovery_veterans",phases:["recovery"],n:"귀향병들의 선술집 창업 붐",tag:"복구",txt:"전역한 병사들이 하나같이 선술집을 열면서 맥주 수요가 이상하게 늘었습니다.",p:{beer:1.16},d:{beer:1.55},days:2},
  {id:"merchant_consolidation",phases:["merchant_age"],n:"대형 상단 합병전 시작",tag:"상단",txt:"전후 시장을 장악하기 위해 대형 상단들이 경쟁사를 사들이기 시작했습니다.",p:{gem:1.12,spice:1.1,mana:1.08},d:{gem:1.3,spice:1.3,mana:1.25},days:2},
  {id:"merchant_price_war",phases:["merchant_age"],n:"상단 간 가격전쟁",tag:"상단",txt:"대형 상단들이 서로 손해를 감수하며 가격을 내리고 있습니다. 소비자만 신났습니다.",p:{bread:.88,beer:.88,sword:.9,potion:.9},d:{bread:1.25,beer:1.25,sword:1.2,potion:1.2},days:2}
];

const BASE_DEMAND = {food:1.05,metal:.82,weapon:.72,alchemy:.84,luxury:.62,magic:.7};
const RANK_KEY = "fantasyMerchantRanksV2";
const SAVE_KEY = "fantasyMerchantSaveV1";
const SAVE_VERSION = 1;
const ENDING_GOALS = {day:100,wealth:100000,contracts:10,trialDays:7};
const ROUTE_THRESHOLD = 12;
const ROUTE_LEAD = 2;
const ROUTES = {
  royal:{name:"왕실",ending:"왕실 공인 대상인",desc:"왕실·길드와의 신뢰를 쌓아 제도권 상단의 정점에 섭니다."},
  antihero:{name:"독립상인",ending:"시세를 지킨 경제수호자",desc:"상인조합 안에서 왕실·용사·유명인의 시장 개입에 맞서 독립 상인의 목소리를 키웁니다."},
  underworld:{name:"암시장",ending:"뒷골목의 상왕",desc:"합법과 불법의 경계를 넘나들며 왕국의 그림자 유통망을 장악합니다."},
  artisan:{name:"장인",ending:"왕국 제일의 공방상단",desc:"단순 시세차익을 넘어 직접 생산과 가공으로 상단의 이름을 남깁니다."}
};
const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id,e]));
const WORLD_PHASES = [
  {
    id:"prosperity",start:1,end:24,name:"왕국 호황기",short:"호황",
    desc:"마왕 소식도 국경 분쟁도 잠잠합니다. 사치품과 축제가 잘 팔리고 도로 사정도 안정적입니다.",
    news:"왕국 전역에 긴 평화와 호황이 이어집니다.",
    newsText:"상인조합는 올해를 '돈 벌기 좋은 해'라고 선언했습니다. 이 말이 불길하다는 사람도 있습니다.",
    travel:0,risk:0,volatility:.82,war:false,
    p:{gem:1.06,spice:1.08,beer:1.05},d:{gem:1.12,spice:1.12,beer:1.12}
  },
  {
    id:"tension",start:25,end:49,name:"국경 긴장기",short:"긴장",
    desc:"국경에서 소규모 충돌이 이어집니다. 군수품과 비축품 수요가 오르고 검문 때문에 이동비가 늘어납니다.",
    news:"국경 수비대가 비상경계에 돌입했습니다.",
    newsText:"왕실은 아직 전쟁이 아니라고 강조했지만, 상인들은 이미 갑옷과 포션을 쓸어 담고 있습니다.",
    travel:3,risk:.03,volatility:1.0,war:false,
    p:{sword:1.12,armor:1.12,potion:1.07,holy:1.08,bread:1.04},d:{sword:1.25,armor:1.25,potion:1.18,holy:1.15}
  },
  {
    id:"war",start:50,end:74,name:"마왕군 전쟁기",short:"전쟁",
    desc:"마왕군의 공세로 왕국이 전시체제로 전환됐습니다. 군수품은 폭등하고 길은 위험하며 왕도의 평시 안전도 사라집니다.",
    news:"마왕군이 국경 요새를 공격했습니다.",
    newsText:"왕실이 총동원령을 선포했습니다. 검과 포션 가격표를 보던 상인들이 동시에 웃었다가 곧 표정을 숨겼습니다.",
    travel:8,risk:.13,volatility:1.38,war:true,
    p:{sword:1.28,armor:1.26,potion:1.24,holy:1.30,bread:1.14,beer:1.08,gem:.86,spice:.91},
    d:{sword:1.65,armor:1.6,potion:1.7,holy:1.65,bread:1.3,gem:.68,spice:.76}
  },
  {
    id:"recovery",start:75,end:99,name:"전후 복구기",short:"복구",
    desc:"큰 전투가 끝나고 왕국은 폐허를 복구하고 있습니다. 철과 식량 수요가 크고 전쟁 중 쌓인 무기 재고는 처분되기 시작합니다.",
    news:"왕실이 전후 복구 100일 계획을 발표했습니다.",
    newsText:"병사들은 집으로 돌아가고 대장간은 무기 대신 삽과 못을 만들기 시작했습니다. 전쟁특수는 끝났지만 복구특수가 왔습니다.",
    travel:2,risk:.02,volatility:.94,war:false,
    p:{iron:1.16,bread:1.08,wheat:1.08,beer:1.12,sword:.84,armor:.88},
    d:{iron:1.42,bread:1.22,wheat:1.2,beer:1.28,sword:.68,armor:.72}
  },
  {
    id:"merchant_age",start:100,end:99999,name:"상단 재편기",short:"재편",
    desc:"전쟁 이후 왕국 경제의 주도권을 두고 왕실·상인연합·암시장·장인조합이 경쟁합니다. 모든 선택이 최종 엔딩에 직접 연결됩니다.",
    news:"왕국 경제 재편 회의가 시작됐습니다.",
    newsText:"누가 다음 시대의 유통망을 지배할 것인지 결정될 시간입니다. 이상하게도 용사보다 상인들이 더 긴장하고 있습니다.",
    travel:4,risk:.05,volatility:1.22,war:false,
    p:{gem:1.08,spice:1.08,mana:1.08,iron:1.05},d:{gem:1.15,spice:1.15,mana:1.18,iron:1.12}
  }
];

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
  {id:"antihero_donation",title:"상인조합 피해대책위 모금함",text:"'용사는 마왕만 잡고 경제에는 손대지 마라!'라고 적힌 모금함이 놓여 있습니다.",options:[
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
  ]},
  {id:"royal_economy_meeting",title:"왕실 경제회의 초청장",text:"왕실이 상인들의 의견을 듣겠다며 당신을 불렀습니다. 회의장 밖에는 상인조합 피해대책위와 장인조합도 모여 있습니다.",options:[
    {label:"왕실 정책 자문에 협조한다",effect:"route_royal_meeting"},
    {label:"상인조합 피해대책위의 성명서를 대신 읽는다",effect:"route_antihero_meeting"},
    {label:"장인조합의 유통권을 요구한다",effect:"route_artisan_meeting"}
  ]},
  {id:"underground_auction",title:"초대받지 않은 지하 경매",text:"검은 봉투 안에 오늘 밤 열리는 비밀 경매의 좌표가 적혀 있습니다. 왕실 압수품도 나온다는 소문입니다.",options:[
    {label:"경매에 참가한다 · 90G",effect:"route_underworld_auction"},
    {label:"경비대에 좌표를 넘긴다",effect:"route_royal_report"},
    {label:"봉투를 태운다",effect:"route_neutral_ignore"}
  ]},
  {id:"craft_guild_crisis",title:"장인조합 폐업 위기",text:"값싼 외지 물건 때문에 지역 공방들이 문을 닫을 위기입니다. 조합장이 상인들에게 도움을 요청합니다.",options:[
    {label:"100G를 투자해 공방을 살린다",effect:"route_artisan_invest"},
    {label:"남은 재고를 암시장에 연결한다",effect:"route_underworld_factory"},
    {label:"왕실 보조금을 신청해준다",effect:"route_royal_subsidy"}
  ]},
  {id:"hero_market_speech",title:"용사의 공개 연설",text:"용사가 또 특정 물건을 칭찬하려 합니다. 상인조합 피해대책위는 연설을 막아달라 하고, 왕실은 질서 유지를 요청합니다.",options:[
    {label:"상인조합 피해대책위와 연설을 저지한다",effect:"route_antihero_block"},
    {label:"왕실 요청대로 질서를 유지한다",effect:"route_royal_order"},
    {label:"사람 몰린 틈에 굿즈를 제작해 판다",effect:"route_artisan_merch"}
  ]},
  {id:"black_ledger",title:"정체불명의 검은 장부",text:"밀수조직의 거래 장부가 우연히 손에 들어왔습니다. 어느 쪽에 넘기느냐에 따라 적과 친구가 달라집니다.",options:[
    {label:"밀수조직에 돌려주고 빚을 만든다",effect:"route_underworld_ledger"},
    {label:"왕실 수사관에게 넘긴다",effect:"route_royal_ledger"},
    {label:"상인조합 피해대책위에 흘려 상인 피해를 폭로한다",effect:"route_antihero_ledger"}
  ]}
];
const ROUTE_STORIES = {
  royal:[
    {stage:1,minScore:3,minDay:10,title:"왕실 조달국의 시험",text:"왕실 조달국이 당신에게 낮은 마진의 시범 납품을 제안합니다. 돈보다는 신뢰를 보는 계약입니다.",options:[
      {label:"손해를 감수하고 왕실 규격에 맞춘다 · 70G",effect:"route_story",route:"royal",amount:2,cost:70,message:"왕실 조달관이 당신의 이름 옆에 '신뢰 가능'이라고 적었습니다."},
      {label:"장인조합과 공동 납품을 제안한다",effect:"route_story",route:"artisan",amount:1.4,bonusRoute:"royal",bonusAmount:.5,message:"왕실은 조건부로 공동 납품을 허가했습니다. 장인조합도 당신을 기억합니다."},
      {label:"마진이 없으면 장사도 없다",effect:"route_story",route:"royal",amount:-.8,message:"조달관은 고개를 끄덕였지만 추천서에는 아무것도 적지 않았습니다."}
    ]},
    {stage:2,minScore:6,minDay:30,title:"왕실 세관 개혁안",text:"왕실이 세관 장부 공개와 밀수 단속 강화에 상인 대표의 지지를 요구합니다.",options:[
      {label:"장부 공개와 단속 강화에 서명한다",effect:"route_story",route:"royal",amount:2.2,message:"왕실 재무관이 당신을 개혁 지지 상단으로 발표했습니다."},
      {label:"상인 부담 완화를 조건으로 협상한다",effect:"route_story",route:"antihero",amount:1.2,bonusRoute:"royal",bonusAmount:.7,message:"왕실과 상인 양쪽에서 불평이 나왔습니다. 협상은 잘했다는 뜻일지도 모릅니다."},
      {label:"암시장 연락책에게 개혁안 사본을 넘긴다",effect:"route_story",route:"underworld",amount:2,message:"그날 밤부터 세관 단속을 피하는 마차가 이상하게 늘었습니다."}
    ]},
    {stage:3,minScore:9,minDay:50,title:"전시 군수위원회",text:"마왕군과의 전쟁이 시작되자 왕실은 대형 상단에 군수품 공급을 요청합니다.",options:[
      {label:"정가로 군수품을 공급한다",effect:"route_story",route:"royal",amount:2.4,reward:120,message:"왕실은 120G의 수송 보조금과 함께 당신을 핵심 공급상으로 지정했습니다."},
      {label:"장인조합의 생산권 보장을 요구한다",effect:"route_story",route:"artisan",amount:1.7,bonusRoute:"royal",bonusAmount:.6,message:"군수위원회는 장인조합의 독립 생산권을 인정했습니다."},
      {label:"전쟁특수를 최대한 챙긴다",effect:"route_story",route:"underworld",amount:1.8,reward:180,message:"당장 180G를 벌었지만 왕실 기록에는 '가격 협조 거부'가 남았습니다."}
    ]},
    {stage:4,minScore:11,minDay:80,title:"왕실 전속상단 서약",text:"전후 복구를 앞두고 왕실이 당신에게 전속상단 지위를 제안합니다. 받아들이면 사실상 왕실 경제권의 일부가 됩니다.",options:[
      {label:"왕실 전속상단에 충성을 맹세한다 · 200G",effect:"route_story",route:"royal",amount:3,cost:200,message:"국왕의 인장이 찍힌 전속상단 증서가 당신의 손에 들어왔습니다."},
      {label:"왕실과 협력하되 독립권을 보장받는다",effect:"route_story",route:"royal",amount:1.8,bonusRoute:"antihero",bonusAmount:.7,message:"왕실은 못마땅해했지만 독립 상단 지위를 인정했습니다."},
      {label:"전속 제안을 공개적으로 거부한다",effect:"route_story",route:"antihero",amount:2,message:"상인연합이 환호했고 왕실 재무관은 조용히 당신의 이름에 밑줄을 그었습니다."}
    ]}
  ],
  antihero:[
    {stage:1,minScore:3,minDay:10,title:"피해상인 연명부",text:"용사의 광고 한마디로 손해를 본 상인들이 보상을 요구하는 연명부를 돌리고 있습니다.",options:[
      {label:"상인들을 모아 직접 서명운동을 이끈다",effect:"route_story",route:"antihero",amount:2,message:"연명부 맨 위에 당신의 상단명이 적혔습니다."},
      {label:"왕실에 중재안을 제출한다",effect:"route_story",route:"royal",amount:1.2,bonusRoute:"antihero",bonusAmount:.6,message:"왕실은 검토하겠다고 답했고 피해상인들은 일단 기다려보기로 했습니다."},
      {label:"시장 문제는 시장이 해결하게 둔다",effect:"route_story",route:"antihero",amount:-.8,message:"피해상인들은 당신을 현실적인 사람이라 부르며 다시는 찾아오지 않았습니다."}
    ]},
    {stage:2,minScore:6,minDay:30,title:"용사 광고 감시대",text:"상인조합 피해대책위가 용사의 상업 광고와 시세 발언을 감시할 상설 조직을 만들려 합니다.",options:[
      {label:"감시대 운영비 100G를 후원한다",effect:"route_story",route:"antihero",amount:2.4,cost:100,pendingFollow:{id:"antihero_rally",chance:.95},message:"감시대가 출범했고 용사의 인터뷰마다 상인 둘이 따라붙기 시작했습니다."},
      {label:"광고는 허용하되 피해보상 규칙을 만든다",effect:"route_story",route:"antihero",amount:1.5,bonusRoute:"royal",bonusAmount:.5,message:"용사 팬클럽도 마지못해 피해보상 규칙에 동의했습니다."},
      {label:"용사 굿즈 사업에 투자한다",effect:"route_story",route:"artisan",amount:1.5,reward:100,message:"감시대는 화를 냈지만 굿즈는 100G어치 팔렸습니다."}
    ]},
    {stage:3,minScore:9,minDay:50,title:"전시 가격통제 청문회",text:"왕실은 전쟁을 이유로 일부 품목의 가격을 강제로 제한하려 합니다. 상인연합은 시장 붕괴를 우려합니다.",options:[
      {label:"상인 대표로 가격통제에 반대한다",effect:"route_story",route:"antihero",amount:2.5,message:"청문회 기록에 당신의 연설이 그대로 남았습니다. 상인들은 거리에서 이름을 외쳤습니다."},
      {label:"전시에는 왕실 통제가 필요하다고 지지한다",effect:"route_story",route:"royal",amount:2,message:"왕실은 환영했지만 상인조합 피해대책위 본부 창문에서 당신 포스터가 내려갔습니다."},
      {label:"통제 품목을 암시장으로 돌릴 길을 찾는다",effect:"route_story",route:"underworld",amount:2.1,message:"공식 시장은 조용했지만 골목 가격표는 세 배로 늘었습니다."}
    ]},
    {stage:4,minScore:11,minDay:80,title:"독립 상인연맹 창설",text:"전후 경제를 누가 이끌지 결정할 시점입니다. 상인조합 피해대책위는 왕실과 용사 양쪽에서 독립한 상인연맹을 만들자고 합니다.",options:[
      {label:"초대 의장직을 맡는다 · 150G",effect:"route_story",route:"antihero",amount:3,cost:150,message:"독립 상인연맹이 창설됐고 당신이 초대 의장으로 선출됐습니다."},
      {label:"왕실과 공동 운영 체제로 타협한다",effect:"route_story",route:"royal",amount:1.4,bonusRoute:"antihero",bonusAmount:1,message:"완전한 독립은 아니지만 상인들의 발언권은 크게 늘었습니다."},
      {label:"조직보다는 각자 장사하는 게 낫다",effect:"route_story",route:"antihero",amount:-1,message:"연맹은 다른 의장을 뽑았고 당신은 다시 장부로 돌아갔습니다."}
    ]}
  ],
  underworld:[
    {stage:1,minScore:3,minDay:10,title:"검은 동전",text:"암시장 거래를 마친 뒤 누군가 검은 동전 하나를 마차에 던져두었습니다. 뒷면에는 항구 창고 번호가 적혀 있습니다.",options:[
      {label:"표시된 창고를 찾아간다",effect:"route_story",route:"underworld",amount:2,reward:60,message:"창고 안의 연락책이 60G와 함께 '다음부터는 문을 세 번 두드리라'고 말했습니다."},
      {label:"동전을 왕실 경비대에 넘긴다",effect:"route_story",route:"royal",amount:1.5,message:"경비대는 동전을 압수했고 항구의 몇몇 사람들이 당신을 노려보기 시작했습니다."},
      {label:"동전을 녹여버린다",effect:"route_story",route:"underworld",amount:-.7,message:"검은 동전은 사라졌고 초대도 함께 사라졌습니다."}
    ]},
    {stage:2,minScore:6,minDay:30,title:"비밀 창고의 열쇠",text:"뒷세계 중개상이 세관 기록에 존재하지 않는 창고의 공동 사용권을 제안합니다.",options:[
      {label:"사용권을 산다 · 120G",effect:"route_story",route:"underworld",amount:2.4,cost:120,message:"당신은 지도에 없는 창고의 열쇠를 얻었습니다."},
      {label:"장인조합 물건만 숨겨주겠다고 협상한다",effect:"route_story",route:"artisan",amount:1.2,bonusRoute:"underworld",bonusAmount:.8,message:"장인조합과 암시장 양쪽에서 당신을 애매하게 믿기 시작했습니다."},
      {label:"왕실에 창고 위치를 신고한다",effect:"route_story",route:"royal",amount:1.8,reward:70,message:"경비대가 창고를 압수했고 신고 포상금 70G를 받았습니다."}
    ]},
    {stage:3,minScore:9,minDay:50,title:"전시 밀수로",text:"전쟁으로 공식 보급로가 끊기자 뒷세계가 국경을 넘는 비밀 통로를 열었습니다.",options:[
      {label:"밀수로 운영에 투자한다 · 160G",effect:"route_story",route:"underworld",amount:2.7,cost:160,reward:260,message:"위험한 밤이었지만 260G가 돌아왔습니다. 이제 밀수조직은 당신을 동업자로 봅니다."},
      {label:"부상병용 포션만 통과시킨다",effect:"route_story",route:"underworld",amount:1.5,bonusRoute:"antihero",bonusAmount:.8,message:"공식 기록은 없지만 많은 부상병이 약을 받았습니다."},
      {label:"왕실에 비밀 통로를 넘긴다",effect:"route_story",route:"royal",amount:2.2,message:"왕실군이 통로를 접수했고 뒷골목에서 당신 이름의 가격이 올라갔습니다."}
    ]},
    {stage:4,minScore:11,minDay:80,title:"지하 상단 회합",text:"전쟁이 끝나자 각 도시의 암시장 대표들이 하나의 거대 유통망을 만들자며 당신을 초대했습니다.",options:[
      {label:"지하 유통망의 대표가 된다 · 220G",effect:"route_story",route:"underworld",amount:3,cost:220,message:"공식 지도에는 없지만 왕국 전체를 잇는 또 하나의 상단이 탄생했습니다."},
      {label:"합법 상단과 암시장의 중개자만 맡는다",effect:"route_story",route:"underworld",amount:1.7,bonusRoute:"royal",bonusAmount:.5,message:"양쪽 모두 당신을 완전히 믿지는 않지만 아무도 무시할 수는 없게 됐습니다."},
      {label:"이제 손을 씻고 장인 사업에 집중한다",effect:"route_story",route:"artisan",amount:1.8,message:"뒷골목 대표들은 웃었지만 당신이 정말 빠져나갈 수 있을지는 두고 볼 일입니다."}
    ]}
  ],
  artisan:[
    {stage:1,minScore:3,minDay:10,title:"장인조합 공동생산",text:"지역 공방들이 값싼 대량생산품에 밀리고 있습니다. 장인조합이 공동 브랜드를 만들자고 제안합니다.",options:[
      {label:"공동 브랜드 설립비 80G를 댄다",effect:"route_story",route:"artisan",amount:2,cost:80,message:"공방 간판에 당신 상단의 문장이 함께 걸렸습니다."},
      {label:"왕실 품질보증을 먼저 받자고 제안한다",effect:"route_story",route:"royal",amount:1.1,bonusRoute:"artisan",bonusAmount:.8,message:"장인들은 귀찮아했지만 품질보증 절차를 시작했습니다."},
      {label:"싼 물건을 더 많이 파는 게 답이다",effect:"route_story",route:"artisan",amount:-.7,message:"장인조합은 조용히 다음 상인을 찾아갔습니다."}
    ]},
    {stage:2,minScore:6,minDay:30,title:"왕국 품질인증 심사",text:"장인조합 제품을 왕국 공식 특산품으로 등록할 기회가 왔습니다. 심사관은 까다롭기로 유명합니다.",options:[
      {label:"최고급 재료와 심사비에 120G를 쓴다",effect:"route_story",route:"artisan",amount:2.4,cost:120,message:"품질인증 도장이 찍혔습니다. 장인들이 처음으로 당신을 '우리 상인'이라 불렀습니다."},
      {label:"왕실 인맥으로 심사를 빠르게 처리한다",effect:"route_story",route:"royal",amount:1.4,bonusRoute:"artisan",bonusAmount:.8,cost:60,message:"심사는 빨리 끝났지만 몇몇 장인이 과정이 마음에 들지 않는 눈치입니다."},
      {label:"인증 없이 암시장 고급품으로 판다",effect:"route_story",route:"underworld",amount:1.8,reward:90,message:"인증 도장은 없지만 '비밀 명품'이라는 소문으로 90G를 벌었습니다."}
    ]},
    {stage:3,minScore:9,minDay:50,title:"전시 공방연합",text:"전쟁으로 대형 공장이 군수품만 찍어내자 작은 공방들이 생활필수품 생산을 맡겠다며 연합을 제안합니다.",options:[
      {label:"공방연합의 생산망을 조직한다",effect:"route_story",route:"artisan",amount:2.6,message:"여러 도시의 장인들이 당신의 발주표를 기준으로 움직이기 시작했습니다."},
      {label:"왕실 군수계약에 공방연합을 편입한다",effect:"route_story",route:"royal",amount:1.4,bonusRoute:"artisan",bonusAmount:1,message:"왕실은 생산량을 얻었고 장인들은 안정적인 일감을 얻었습니다."},
      {label:"희귀품만 만들어 암시장에 판다",effect:"route_story",route:"underworld",amount:2,reward:120,message:"품질 좋은 물건은 늘 조용한 골목에서 더 비싸게 팔렸습니다. 120G를 벌었습니다."}
    ]},
    {stage:4,minScore:11,minDay:80,title:"왕국 장인박람회",text:"전후 첫 대형 박람회의 총괄 상단을 맡아달라는 요청이 왔습니다. 성공하면 장인경제의 중심이 될 수 있습니다.",options:[
      {label:"박람회에 200G를 투자하고 총괄한다",effect:"route_story",route:"artisan",amount:3,cost:200,reward:100,message:"박람회는 대성공이었습니다. 순수익 100G보다 더 큰 건 왕국 전체에 남은 당신의 이름입니다."},
      {label:"왕실 후원 행사로 확대한다",effect:"route_story",route:"royal",amount:1.5,bonusRoute:"artisan",bonusAmount:1.2,message:"박람회는 왕실 행사로 커졌고 장인조합도 큰 판로를 얻었습니다."},
      {label:"독립 장인시장으로 유지한다",effect:"route_story",route:"artisan",amount:2.4,bonusRoute:"antihero",bonusAmount:.6,message:"왕실 후원 없이도 박람회가 성공하며 독립 상인들의 상징이 됐습니다."}
    ]}
  ]
};


let S;

function isWarActive(){
  if(currentWorldPhase().war) return true;
  return S.active.some(e => e.war === true || ["conscription","war_supply","demon_return"].includes(e.id));
}

function capitalIsSafe(){
  return S.city === "capital" && !isWarActive();
}
function travelBlockEvent(dest){
  if(dest === S.city) return null;
  return S.active.find(e => e.blockedCities && (e.blockedCities.includes(dest) || e.blockedCities.includes(S.city))) || null;
}
function saleBanEvent(item,city=S.city){
  return S.active.find(e =>
    Array.isArray(e.bannedItems) &&
    e.bannedItems.includes(item) &&
    (!e.banCities || e.banCities.includes(city))
  ) || null;
}
function saleBanText(item,city=S.city){
  const e = saleBanEvent(item,city);
  return e ? e.n + " · " + e.remaining + "일 남음" : "";
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

const FACTIONS = {
  merchant:{name:"상인조합",desc:"정규 거래·길드 의뢰와 시장개입 대응을 함께 맡는 상인들의 대표 조직입니다."},
  kingdom:{name:"왕국",desc:"왕실·경비대·제도권과 협력하면 올라갑니다."},
  church:{name:"루미에르 교단",desc:"성녀와 대성당 중심의 신앙 세력. 신성상품·구휼·성도 인맥으로 신뢰를 쌓습니다."},
  underworld:{name:"지하 유통망",desc:"암시장·밀수조직과 거래할수록 깊게 연결됩니다."},
  artisan:{name:"장인조합",desc:"공방을 이용하고 장인 편을 들수록 인정받습니다."},
  mercenary:{name:"용병 길드",desc:"용병 고용·훈련·원정과 지원 이벤트로 우호도가 올라갑니다."}
};
function factionRep(key){
  if(key === "mercenary") return Math.max(0,Math.min(100,S.mercFriendship || 0));
  return Math.max(0,Math.min(100,S.factionRep?.[key] || 0));
}
function changeFactionRep(key,amount){
  if(key === "mercenary"){
    changeMercFriendship(amount);
    return;
  }
  S.factionRep ||= {merchant:0,kingdom:0,church:0,underworld:0,artisan:0};
  S.factionRep[key] = Math.max(0,Math.min(100,(S.factionRep[key] || 0) + Number(amount || 0)));
}
function repTierValue(rep,low,mid,high){
  if(rep >= 80) return high;
  if(rep >= 50) return mid;
  if(rep >= 20) return low;
  return 0;
}
function merchantRumorAccuracy(){
  const rep = factionRep("merchant");
  if(rep >= 100) return 1;
  if(rep >= 80) return .97;
  if(rep >= 50) return .85;
  if(rep >= 20) return .70;
  return .55;
}
function kingdomCommissionDiscount(){
  return repTierValue(factionRep("kingdom"),.01,.02,.03);
}
function churchCommissionDiscount(){
  return repTierValue(factionRep("church"),.005,.01,.02);
}
function effectiveCityFee(city){
  const church = city==="holycity" ? churchCommissionDiscount() : 0;
  return Math.max(.01,(CITIES[city]?.fee || 0) - kingdomCommissionDiscount() - cityNpcFeeDiscount(city) - church);
}
function antiheroShockProtection(){
  return repTierValue(factionRep("merchant"),.12,.25,.40);
}
function protectPublicShock(factor,event){
  if(factor >= 1) return factor;
  const publicShock = !!(event?.princess || String(event?.id || "").startsWith("hero_") || event?.tag === "용사 발언");
  if(!publicShock) return factor;
  const protect = antiheroShockProtection();
  return 1 - (1 - factor) * (1 - protect);
}
function underworldPayoutRate(banned=false){
  const bonus = repTierValue(factionRep("underworld"),.02,.05,.08);
  return Math.min(banned ? .99 : .92,(banned ? .95 : .80) + bonus);
}
function underworldCatchChance(banned=false){
  const rep = factionRep("underworld");
  if(banned){
    if(rep >= 80) return .12;
    if(rep >= 50) return .16;
    if(rep >= 20) return .19;
    return .22;
  }
  if(rep >= 80) return .02;
  if(rep >= 50) return .03;
  if(rep >= 20) return .04;
  return .05;
}
function artisanFeeDiscount(){
  return repTierValue(factionRep("artisan"),.05,.10,.20);
}
function artisanFee(base){
  return Math.max(0,Math.round(base * (1 - artisanFeeDiscount())));
}
function recipeFee(recipe){
  let fee=artisanFee(recipe.fee);
  fee=Math.round(fee*(1-cityNpcCraftDiscount(recipe.city)));
  if(recipe.city==="holycity") fee=Math.round(fee*(1-repTierValue(factionRep("church"),.05,.10,.20)));
  return Math.max(0,fee);
}
function craftLimitForRecipe(){
  return CRAFT_LIMIT + (factionRep("artisan") >= 80 ? 1 : 0);
}
function factionBenefitText(key){
  const rep = factionRep(key);
  if(key === "merchant") return "소문 정확도 " + Math.round(merchantRumorAccuracy()*100) + "% · 공주·용사발 하락 " + Math.round(antiheroShockProtection()*100) + "% 완충";
  if(key === "kingdom") return "정규시장 판매 수수료 -" + Math.round(kingdomCommissionDiscount()*100) + "%p";
  if(key === "church") return "성도 판매 수수료 -" + Math.round(churchCommissionDiscount()*100) + "%p · 신성 제작 공임 우대";
  if(key === "underworld") return "암시장 매입 " + Math.round(underworldPayoutRate(false)*100) + "% · 단속 " + Math.round(underworldCatchChance(false)*100) + "%";
  if(key === "artisan") return "제작 공임 -" + Math.round(artisanFeeDiscount()*100) + "% · 품목당 " + craftLimitForRecipe() + "회";
  if(key === "mercenary") return "용병 비용 -" + Math.round(mercDiscountRate()*100) + "% · 고우호 지원 이벤트";
  return "";
}
function addRoute(route,amount){
  if(!S.routeScores || !ROUTES[route]) return;
  S.routeScores[route] = Math.max(0,(S.routeScores[route] || 0) + amount);
  const factionMap = {royal:"kingdom",antihero:"merchant",underworld:"underworld",artisan:"artisan"};
  const repScale = route === "artisan" ? 1.8 : route === "underworld" ? 3 : 3.5;
  if(factionMap[route]) changeFactionRep(factionMap[route],amount * repScale);
}
function routeScoreText(v){
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function determineEndingRoute(){
  const entries = Object.keys(ROUTES)
    .map(k => [k,S.routeScores?.[k] || 0])
    .sort((a,b) => b[1]-a[1]);
  const top = entries[0], second = entries[1];
  const storyComplete = (S.routeStory?.[top[0]] || 0) >= 4;
  if(top[1] >= ROUTE_THRESHOLD && storyComplete && top[1] - second[1] >= ROUTE_LEAD) return top[0];
  return "normal";
}

function endingData(route){
  if(route === "bad_merchant") return {
    title:"평범한 상인으로 남았습니다.",
    text:"상단은 충분히 크고 유명해졌지만 마지막 7일 납품심사에서 약속을 지키지 못했습니다. 특별한 칭호도 전설도 얻지 못한 채, 왕국 어딘가에서 계속 장사하는 평범한 상인으로 남았습니다."
  };
  if(route === "royal") return {
    title:"왕실 공인 대상상이 되었습니다.",
    text:"왕실과 상인조합가 당신의 상단을 왕국 공식 대상단으로 인정했습니다. 이제 귀족들도 가격 흥정 전에 당신의 눈치를 봅니다."
  };
  if(route === "antihero") return {
    title:"시세를 지킨 경제수호자가 되었습니다.",
    text:"용사는 마왕을 쓰러뜨렸고, 당신은 용사가 뒤흔든 시세와 싸웠습니다. 상인조합 경제피해대책위원회는 당신의 초상화를 회의실 한가운데 걸었습니다."
  };
  if(route === "underworld") return {
    title:"뒷골목의 상왕이 되었습니다.",
    text:"왕실 장부에는 당신의 거래 절반이 존재하지 않습니다. 하지만 항구의 밀수업자부터 광산의 브로커까지 모두 당신의 이름을 압니다."
  };
  if(route === "artisan") return {
    title:"왕국 제일의 공방상단이 되었습니다.",
    text:"당신은 싸게 사서 비싸게 파는 데서 멈추지 않았습니다. 제분소·제련소·연금술 공방이 당신의 유통망을 따라 움직입니다."
  };
  return {
    title:"전설의 대상인이 되었습니다.",
    text:"어느 세력에도 완전히 기대지 않고 100일 넘게 살아남아 10만G의 상단을 일궜습니다. 왕국의 상인들은 당신을 그저 '대상인'이라 부릅니다."
  };
}
function renderRoutes(){
  const box = $("#routeBox");
  if(!box) return;
  const entries = Object.entries(ROUTES);
  box.innerHTML =
    '<div class="route-head"><b>상단 성향 & 전용 스토리</b><span class="mini muted">특수 엔딩: 12점 + 스토리 4장 + 2점 차</span></div>' +
    '<div class="route-grid">' + entries.map(([k,r]) => {
      const v = S.routeScores?.[k] || 0;
      const story = S.routeStory?.[k] || 0;
      const pct = Math.min(100,v/ROUTE_THRESHOLD*100);
      const next = ROUTE_STORIES[k]?.find(x => x.stage === story + 1);
      const nextText = story >= 4
        ? "전용 스토리 완료"
        : (next ? "다음 장: " + next.minDay + "일차 · " + next.minScore + "점 필요" : "스토리 완료");
      return '<article class="route-card"><div><b>' + r.name + '</b><span>' + routeScoreText(v) + '점</span></div>' +
        '<div class="route-meter"><i style="width:' + pct + '%"></i></div>' +
        '<div class="route-story-progress">스토리 ' + story + ' / 4 · ' + nextText + '</div>' +
        '<p>' + r.desc + '</p></article>';
    }).join("") + '</div>' +
    '<p class="mini muted route-note">점수만 올려서는 특수 엔딩이 열리지 않습니다. 해당 세력의 전용 스토리 4장을 끝까지 겪어야 하며, 조건이 애매하면 노멀 엔딩으로 진행됩니다.</p>' +
    '<div class="faction-head"><b>세력 우호도 & 실질 혜택</b><span class="mini muted">20 · 50 · 80에서 혜택이 크게 강화됩니다.</span></div>' +
    '<div class="faction-grid">' +
      Object.keys(FACTIONS).map(key => {
        const f = FACTIONS[key];
        const rep = factionRep(key);
        return '<article class="faction-card"><div><b>' + f.name + '</b><strong>' + Math.round(rep) + ' / 100</strong></div>' +
          '<div class="faction-meter"><i style="width:' + rep + '%"></i></div>' +
          '<p>' + factionBenefitText(key) + '</p><span>' + f.desc + '</span></article>';
      }).join("") +
    '</div>';
}

function finalTrialRequirement(){
  const pool = tradableKeys();
  const stage = Math.max(0,Math.min(ENDING_GOALS.trialDays-1,S.day - S.finalTrial.startDay));
  const targetWeights = [20,24,28,32,36,40,44];
  const targetWeight = targetWeights[stage] || 44;
  const count = stage < 2 ? 2 : 3;
  const shuffled = [...pool].sort(() => Math.random() - .5);
  const selected = shuffled.slice(0,count);
  const lines = [];
  let remainingWeight = targetWeight;

  selected.forEach((item,i) => {
    const w = ITEMS[item].w;
    const slots = count - i;
    let qty;
    if(i === count - 1){
      qty = Math.max(1,Math.ceil(remainingWeight / w));
    }else{
      const idealShare = remainingWeight / slots;
      const jitter = .88 + Math.random() * .24;
      qty = Math.max(1,Math.round((idealShare * jitter) / w));
    }
    const weight = qty * w;
    lines.push({item,qty});
    remainingWeight = Math.max(1,remainingWeight - weight);
  });

  const totalWeight = lines.reduce((a,x) => a + ITEMS[x.item].w * x.qty,0);
  return {
    day:S.day,
    stage:stage + 1,
    targetWeight,
    totalWeight,
    lines,
    delivered:false
  };
}
function normalizeFinalTrialRequirement(req){
  if(!req) return req;
  if(!Array.isArray(req.lines) && req.item){
    req.lines = [{item:req.item,qty:req.qty || 1}];
  }
  if(Array.isArray(req.lines)){
    req.totalWeight = req.lines.reduce((a,x) => a + (ITEMS[x.item]?.w || 0) * x.qty,0);
  }
  return req;
}
function ensureFinalTrialRequirement(){
  if(!S.finalTrial || S.finalTrial.finished || S.day >= S.finalTrial.endDay) return;
  if(!S.finalTrial.requirement || S.finalTrial.requirement.day !== S.day){
    S.finalTrial.requirement = finalTrialRequirement();
  }else{
    normalizeFinalTrialRequirement(S.finalTrial.requirement);
  }
}
function deliverFinalTrialGoods(){
  if(checkBlocked()) return;
  if(!S.finalTrial || S.finalTrial.finished || S.day >= S.finalTrial.endDay) return;
  ensureFinalTrialRequirement();
  const req = normalizeFinalTrialRequirement(S.finalTrial.requirement);
  if(req.delivered){ toast("오늘의 최종심사 납품은 이미 완료했습니다."); return; }

  const missing = req.lines.filter(x => (S.inv[x.item] || 0) < x.qty);
  if(missing.length){
    toast("납품 부족: " + missing.map(x => ITEMS[x.item].name + " " + x.qty + "개 필요").join(", "));
    return;
  }

  for(const x of req.lines) S.inv[x.item] -= x.qty;
  req.delivered = true;
  S.finalTrial.delivered = (S.finalTrial.delivered || 0) + 1;
  const deliveredText = req.lines.map(x => ITEMS[x.item].name + " " + x.qty + "개").join(" · ");
  toast("대량 납품 완료: " + deliveredText + " · " + S.finalTrial.delivered + " / " + ENDING_GOALS.trialDays);
  render();
}
function showEnding(route){
  S.ending = true;
  S.endingRoute = route;
  S.travelOpen = false;
  S.choiceEvent = null;
  if(S.finalTrial) S.finalTrial.finished = true;

  const data = endingData(route);
  const bad = route === "bad_merchant";
  $("#endingPanel").classList.remove("hidden");
  $("#endingKicker").textContent = bad ? "최종 납품심사 실패 · BAD END" : "상단의 결말";
  $("#endingTitle").textContent = data.title;
  $("#endingText").textContent = data.text;
  $("#endingStats").innerHTML =
    "<b>" + S.day + "일 생존</b><span>최종 자산 " + fmt(net()) + "</span><span>완료 의뢰 " + S.completedContracts + "회</span><span>최고 자산 " + fmt(S.peak) + "</span>";

  const rankForm = $(".ending-rank-form");
  const rankStatus = $("#endingRankStatus");
  if(rankForm) rankForm.classList.toggle("hidden",bad);
  if(rankStatus){
    rankStatus.textContent = bad
      ? "평범한 상인 배드엔딩은 공용 클리어 랭킹에 등록되지 않습니다."
      : (S.rankSaved ? "이 클리어 기록은 이미 공용 랭킹에 저장되었습니다." : "클리어 기록은 모든 플레이어가 보는 공용 랭킹에 등록할 수 있습니다.");
  }

  toast("엔딩 달성: " + (bad ? "평범한 상인" : route === "normal" ? "전설의 대상인" : ROUTES[route].ending));
}
function failFinalTrial(){
  if(!S.finalTrial || S.finalTrial.finished || S.ending || S.endless) return false;
  ensureFinalTrialRequirement();
  const req = S.finalTrial.requirement;
  if(req && !req.delivered){
    showEnding("bad_merchant");
    return true;
  }
  return false;
}
function continueEndlessMode(){
  if(!S.ending) return;
  const seen = S.endingRoute || "normal";
  const name = seen === "bad_merchant" ? "평범한 상인" : seen === "normal" ? "전설의 대상인" : ROUTES[seen]?.ending || "엔딩";
  S.endless = true;
  S.ending = false;
  S.travelOpen = false;
  S.choiceEvent = null;
  if(S.finalTrial) S.finalTrial.finished = true;
  $("#endingPanel").classList.add("hidden");
  toast(name + " 엔딩 이후, 엔드리스 모드로 장사를 계속합니다.");
  render();
}
function endingRequirementsMet(){
  return S.day >= ENDING_GOALS.day &&
    net() >= ENDING_GOALS.wealth &&
    S.completedContracts >= ENDING_GOALS.contracts;
}
function checkFinalChapter(){
  if(S.gameOver || S.ending || S.endless) return;

  if(!S.finalTrial && endingRequirementsMet()){
    S.finalTrial = {
      startDay:S.day,
      endDay:S.day + ENDING_GOALS.trialDays,
      delivered:0,
      requirement:null,
      finished:false
    };
    ensureFinalTrialRequirement();
    toast("마지막 7일 납품심사가 시작됐습니다. 매일 요구 물품을 납품해야 합니다.");
  }

  if(!S.finalTrial || S.finalTrial.finished) return;

  if(S.day >= S.finalTrial.endDay){
    if((S.finalTrial.delivered || 0) < ENDING_GOALS.trialDays){
      showEnding("bad_merchant");
      return;
    }
    showEnding(determineEndingRoute());
    return;
  }

  ensureFinalTrialRequirement();
}

function renderEndingGoal(){
  const box = $("#endingGoalBox");

  if(S.endless){
    const route = S.endingRoute || "normal";
    const title = route === "bad_merchant" ? "평범한 상인" : route === "normal" ? "전설의 대상인" : ROUTES[route]?.ending || "엔딩";
    box.innerHTML =
      '<p class="success-note">엔드리스 모드</p>' +
      '<p class="mini"><b>' + title + '</b> 엔딩 이후에도 왕국 경제는 계속 움직입니다. 더 이상 엔딩 조건은 없습니다.</p>';
    return;
  }

  if(S.ending){
    box.innerHTML = '<p class="success-note">상단의 결말에 도달했습니다.</p>';
    return;
  }

  if(S.finalTrial && !S.finalTrial.finished){
    ensureFinalTrialRequirement();
    const passed = Math.max(0,S.finalTrial.delivered || 0);
    const remain = Math.max(0,ENDING_GOALS.trialDays - passed);
    const req = normalizeFinalTrialRequirement(S.finalTrial.requirement);
    const canDeliver = req && !req.delivered && req.lines.every(x => (S.inv[x.item] || 0) >= x.qty);
    const daily = req
      ? '<div class="final-delivery' + (req.delivered ? ' delivered' : '') + '">' +
          '<div class="final-trial-title"><span class="label">오늘의 최종심사 대량 납품</span><b>' + req.stage + '일차 시험</b></div>' +
          '<div class="final-load-summary"><span>요구 화물중량 <b>' + req.totalWeight + '</b></span><span>현재 마차 <b>' + S.capacity + '</b></span>' +
            '<span class="' + (S.capacity >= req.totalWeight ? 'load-ok' : 'load-danger') + '">' +
            (S.capacity >= req.totalWeight ? '운송 가능' : '마차 확장 권장') + '</span></div>' +
          '<div class="final-delivery-list">' +
            req.lines.map(x => {
              const have = S.inv[x.item] || 0;
              const enough = have >= x.qty;
              return '<div class="final-delivery-row"><div><b>' + ITEMS[x.item].name + ' ' + x.qty + '개</b>' +
                '<span>무게 ' + (ITEMS[x.item].w * x.qty) + '</span></div>' +
                '<span class="' + (enough ? 'enough' : 'short') + '">보유 ' + have + '개</span></div>';
            }).join("") +
          '</div>' +
          (req.delivered
            ? '<p class="final-delivered">✓ 오늘 대량 납품 완료 · 이제 하루를 마감해도 됩니다.</p>'
            : '<button id="trialDeliveryBtn" class="primary wide"' + (canDeliver ? '' : ' disabled') + '>오늘 물품 전부 납품</button>') +
        '</div>'
      : '';

    box.innerHTML =
      '<p><b>마지막 7일 납품심사 진행 중</b></p>' +
      '<div class="ending-progress"><i style="width:' + Math.min(100,(passed/ENDING_GOALS.trialDays)*100) + '%"></i></div>' +
      '<p class="mini muted">' + passed + ' / ' + ENDING_GOALS.trialDays + '일 납품 완료 · 앞으로 ' + remain + '회</p>' +
      daily +
      '<p class="mini final-warning">⚠ 최종심사는 날이 갈수록 요구 화물량이 커집니다. 마차를 충분히 확장해두지 않았다면 후반 납품이 매우 어려워집니다. 오늘 물품을 납품하지 않은 채 하루를 마감하면 즉시 「평범한 상인」 배드엔딩입니다.</p>';
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
    '<p class="mini muted">세 조건을 모두 달성하면 대량 납품 7일 심사가 시작됩니다. 후반에는 화물중량 40 이상을 요구하므로 마차 확장이 중요합니다.</p>';
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
  return Object.keys(ITEMS).reduce((a,k) => {
    if(ITEMS[k].monsterMaterial) return a;
    return a + S.inv[k] * (S.prices[k] || ITEMS[k].base);
  },0);
}
function listedMarketValue(){
  return S.orders.reduce((a,o) => a + o.qty * (S.world[o.city]?.[o.item] || o.ask || ITEMS[o.item].base),0);
}
function holdingCost(){
  // 손에 든 재고 0.30%, 판매 등록 재고 0.60%/일. 무한 대기 전략에 실제 비용을 만듭니다.
  return Math.round(carriedMarketValue() * .003 + listedMarketValue() * .006);
}
function fee(){
  const t = Math.max(0,(S.capacity - 20) / 10);
  const caravan = Math.round(10 + t * 8 + t * t * 2);
  return caravan + merchantTier().overhead + holdingCost() + mercenaryUpkeep();
}
function upgradeCost(){
  const t = Math.max(0,(S.capacity - 20) / 10);
  return Math.round(220 * Math.pow(1.42, t));
}
function used(){
  return Object.keys(ITEMS).reduce((a,k) => a + S.inv[k] * ITEMS[k].w, 0);
}
function worldPhaseForDay(day){
  return WORLD_PHASES.find(p => day >= p.start && day <= p.end) || WORLD_PHASES[WORLD_PHASES.length-1];
}
function currentWorldPhase(){
  return worldPhaseForDay(S?.day || 1);
}
function phaseItemMult(item,key){
  const phase = currentWorldPhase();
  const direct = (phase[key] || {})[item];
  if(direct != null) return direct;
  const links = CRAFT_LINKS[item];
  if(links){
    const vals = links.map(k => ((phase[key] || {})[k] || 1));
    return Math.sqrt(vals[0] * vals[1]);
  }
  return 1;
}
function travelCostTo(dest){
  if(dest === S.city) return 0;
  let cost=CITIES[dest].travel + currentWorldPhase().travel;
  if(S?.npcLegacy?.port && (dest==="port" || S.city==="port")) cost-=4;
  return Math.max(0,cost);
}
function effectMult(city,item,key){
  let m = 1;
  for(const e of S.active){
    if(e.cities && !e.cities.includes(city)) continue;
    const direct = (e[key] || {})[item];
    if(direct != null){
      m *= protectPublicShock(direct,e);
      continue;
    }
    const links = CRAFT_LINKS[item];
    if(links){
      const vals = links.map(k => protectPublicShock(((e[key] || {})[k] || 1),e));
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
    phaseItemMult(item,"p") *
    cityNpcPriceFactor(city,item) *
    noise
  ));
}
function demand(item,city=S.city){
  return (BASE_DEMAND[ITEMS[item].cat] || 1) * effectMult(city,item,"d") * phaseItemMult(item,"d");
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
  const phaseVol = currentWorldPhase().volatility || 1;
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
      momentum += sign * (.045 + Math.random() * .075) * phaseVol;
    }

    // 플레이어가 한 품목을 시장에 과하게 풀면 상인들이 따라붙어 왕국 전체 가격도 조금 눌립니다.
    const listed = S.orders.filter(o => o.item === k).reduce((a,o)=>a+o.qty,0);
    if(listed >= 8) momentum -= Math.min(.045,listed * .0025);

    momentum = Math.max(-.18,Math.min(.18,momentum));
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
  for(const k of Object.keys(ITEMS)){
    if(ITEMS[k].monsterMaterial) continue;
    v += S.inv[k] * S.prices[k];
  }
  for(const o of S.orders) v += o.qty * (S.world[o.city][o.item] || S.prices[o.item]);
  return v;
}
function net(){
  return S.cash + stockValue();
}
function toast(t){
  $("#toast").textContent = t;
}
function recordDayIncome(amount,label){
  amount = Math.max(0,Number(amount || 0));
  if(!amount) return;
  S.dayIncomeLog ||= [];
  S.dayIncomeLog.push({amount,label:label || "기타 수입"});
}
function recordDaySale(item,qty,amount,source){
  amount = Math.max(0,Number(amount || 0));
  qty = Math.max(0,Number(qty || 0));
  if(!item || !qty || !amount) return;
  S.daySalesLog ||= [];
  S.daySalesLog.push({item,qty,amount,source:source || "판매"});
  recordDayIncome(amount,source || "상품 판매");
}
function aggregateDaySales(rows){
  const map = new Map();
  for(const r of rows || []){
    const key = r.item + "|" + r.source;
    const old = map.get(key) || {item:r.item,source:r.source,qty:0,amount:0};
    old.qty += r.qty;
    old.amount += r.amount;
    map.set(key,old);
  }
  return [...map.values()];
}
function buildDaySummary(closingDay,startCity,endCity,knownCosts,inventoryLosses){
  const startCash = Number(S.dayStartCash ?? S.cash);
  const endCash = S.cash;
  const netCash = endCash - startCash;
  const trackedIncome = (S.dayIncomeLog || []).reduce((a,x) => a + Number(x.amount || 0),0);
  const income = Math.max(trackedIncome,netCash,0);
  const outflow = Math.max(0,income - netCash);
  const remaining = Object.keys(ITEMS)
    .filter(k => (S.inv[k] || 0) > 0)
    .map(k => ({item:k,qty:S.inv[k]}));
  const listed = Object.keys(ITEMS)
    .map(k => ({item:k,qty:S.orders.filter(o => o.item === k).reduce((a,o) => a + o.qty,0)}))
    .filter(x => x.qty > 0);

  return {
    open:true,
    day:closingDay,
    nextDay:S.day,
    startCity,
    endCity,
    startCash,
    endCash,
    income,
    outflow,
    netCash,
    sales:aggregateDaySales(S.daySalesLog || []),
    incomeLog:[...(S.dayIncomeLog || [])],
    costs:knownCosts.filter(x => x.amount > 0),
    inventoryLosses:inventoryLosses || [],
    remaining,
    listed
  };
}
function renderDaySummary(){
  const panel = $("#daySummaryPanel");
  const d = S.daySummary;
  const open = !!(d && d.open && !S.gameOver);
  panel.classList.toggle("hidden",!open);
  document.body.classList.toggle("day-summary-open",open);
  if(!open) return;

  $("#daySummaryTitle").textContent = d.day + "일차 장사 결산";
  $("#daySummarySub").textContent =
    CITIES[d.startCity]?.name + " → " + CITIES[d.endCity]?.name + " · " + d.nextDay + "일차 시작";
  $("#daySummaryNet").innerHTML =
    '<span>순현금 변화</span><b class="' + (d.netCash >= 0 ? 'summary-profit' : 'summary-loss') + '">' +
    (d.netCash >= 0 ? "+" : "") + fmt(d.netCash) + '</b>';

  $("#daySummaryMoney").innerHTML =
    '<div><span>판매·의뢰 수입</span><b class="summary-profit">+' + fmt(d.income) + '</b></div>' +
    '<div><span>사용·비용·손실</span><b class="summary-loss">-' + fmt(d.outflow) + '</b></div>' +
    '<div><span>현금</span><b>' + fmt(d.startCash) + ' → ' + fmt(d.endCash) + '</b></div>';

  $("#daySummarySales").innerHTML = d.sales.length
    ? d.sales.map(x =>
        '<div class="summary-line"><span><b>' + ITEMS[x.item].name + '</b> ' + x.qty + '개 · ' + x.source +
        '</span><strong>+' + fmt(x.amount) + '</strong></div>'
      ).join("")
    : '<p class="mini muted">오늘 체결된 판매가 없습니다.</p>';

  const lossLines = [];
  for(const x of d.costs){
    lossLines.push('<div class="summary-line"><span>' + x.label + '</span><strong class="summary-loss">-' + fmt(x.amount) + '</strong></div>');
  }
  for(const x of d.inventoryLosses){
    lossLines.push('<div class="summary-line"><span>' + ITEMS[x.item].name + ' 손실</span><strong class="summary-loss">-' + x.qty + '개</strong></div>');
  }
  $("#daySummaryLosses").innerHTML = lossLines.length
    ? lossLines.join("")
    : '<p class="mini muted">특별한 비용이나 재고 손실이 없습니다.</p>';

  const stockRows = d.remaining.map(x =>
    '<span><b>' + ITEMS[x.item].name + '</b> ' + x.qty + '개</span>'
  );
  const listedRows = d.listed.map(x =>
    '<span class="listed-stock"><b>' + ITEMS[x.item].name + '</b> 판매등록 ' + x.qty + '개</span>'
  );
  $("#daySummaryStock").innerHTML = stockRows.concat(listedRows).length
    ? '<div class="summary-stock-list">' + stockRows.concat(listedRows).join("") + '</div>'
    : '<p class="mini muted">남은 재고가 없습니다.</p>';
}
function closeDaySummary(){
  if(!S.daySummary) return;
  S.daySummary.open = false;
  render();
}
function checkBlocked(){
  if(S.daySummary?.open){ toast("하루 결산부터 확인해주세요."); return true; }
  if(S.ending){ toast("이미 왕실 공인 대상인이 되었습니다."); return true; }
  if(S.gameOver){ toast("이미 파산했습니다."); return true; }
  if(S.choiceEvent){ toast("돌발 선택지부터 결정해주세요."); return true; }
  if(S.travelOpen){ toast("내일 이동지를 먼저 골라주세요."); return true; }
  return false;
}
function marketRumor(forceAccurate=false){
  const choices = [];
  for(const c of Object.keys(CITIES)){
    for(const k of tradableKeys()){
      const ratio = S.world[c][k] / ITEMS[k].base;
      if(ratio > 1.30) choices.push({c,k,high:true,ratio});
      if(ratio < .74) choices.push({c,k,high:false,ratio});
    }
  }
  if(!choices.length) return "오늘은 딱히 미친 가격이 없다는군.";

  const accurate = forceAccurate || Math.random() < merchantRumorAccuracy();
  let x;
  if(accurate){
    x = pick(choices);
  }else{
    const c = pick(Object.keys(CITIES));
    const k = pick(tradableKeys());
    const actual = S.world[c][k] / ITEMS[k].base;
    x = {c,k,high:actual < 1,ratio:actual,falseRumor:true};
  }

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

function applyEventMarketShock(event){
  if(!event?.shock) return;
  for(const [item,factor] of Object.entries(event.shock)){
    if(!ITEMS[item] || ITEMS[item].craftOnly) continue;
    const old = S.marketIndex[item] || 1;
    factor = protectPublicShock(factor,event);
    const next = Math.max(.45,Math.min(1.95,old * factor));
    S.marketIndex[item] = next;
    S.marketMomentum[item] = Math.max(-.18,Math.min(.18,(S.marketMomentum[item] || 0) + (factor - 1) * .45));
    S.marketChange[item] = (next / old - 1) * 100;
  }
}
function dailyNewsCountForDay(day){
  if(day >= 50) return 3;
  if(day >= 20) return 2;
  return 1;
}
function blockadeChanceForDay(day){
  const count = dailyNewsCountForDay(day);
  return count >= 3 ? .24 : count === 2 ? .17 : .10;
}
function planTomorrowBlockade(){
  const tomorrow = S.day + 1;

  if(S.plannedBlockade && S.plannedBlockade.day >= tomorrow) return;

  // 후속 스토리 뉴스가 예약된 날에는 봉쇄 예고를 억지로 끼워 넣지 않습니다.
  if(S.pendingFollow) {
    S.plannedBlockade = null;
    return;
  }

  // 이미 지역 봉쇄가 진행 중이면 연속 봉쇄를 남발하지 않습니다.
  if(S.active.some(e => Array.isArray(e.blockedCities) && e.blockedCities.length)){
    S.plannedBlockade = null;
    return;
  }

  if(Math.random() >= blockadeChanceForDay(tomorrow)){
    S.plannedBlockade = null;
    return;
  }

  const tomorrowPhase = worldPhaseForDay(tomorrow);
  const pool = EVENTS.filter(e =>
    Array.isArray(e.blockedCities) &&
    e.blockedCities.length &&
    !e.chainOnly &&
    (!e.phases || e.phases.includes(tomorrowPhase.id))
  );
  if(!pool.length){
    S.plannedBlockade = null;
    return;
  }

  const event = pick(pool);
  S.plannedBlockade = {
    day:tomorrow,
    eventId:event.id,
    cities:[...event.blockedCities],
    days:event.days
  };
}
function plannedBlockadeEventForToday(){
  if(!S.plannedBlockade || S.plannedBlockade.day !== S.day) return null;
  return EVENT_BY_ID[S.plannedBlockade.eventId] || null;
}
function dailyNewsCount(){
  return dailyNewsCountForDay(S.day);
}
function newIntel(){
  const phase = currentWorldPhase();
  const targetCount = dailyNewsCount();
  const sources = [];
  const usedIds = new Set();
  const previousFollow = S.pendingFollow;

  const addSource = (src) => {
    if(!src || usedIds.has(src.id) || sources.length >= targetCount) return false;
    sources.push(src);
    usedIds.add(src.id);
    return true;
  };

  if(S.lastPhaseId !== phase.id){
    addSource({
      id:"phase_intro_" + phase.id,
      n:phase.news,
      tag:"시대",
      txt:phase.newsText,
      days:2,
      phaseIntro:true
    });
    S.lastPhaseId = phase.id;
  }

  const plannedBlockade = plannedBlockadeEventForToday();
  if(plannedBlockade){
    addSource(plannedBlockade);
  }else if(S.pendingFollow && Math.random() < S.pendingFollow.chance){
    addSource(EVENT_BY_ID[S.pendingFollow.id] || null);
  }

  // 하루에 공주 발언은 최대 1개만. 뉴스 수가 늘어도 공주가 세 번 말하는 참사는 막습니다.
  const princessCooldownReady = S.day - (S.lastPrincessDay ?? -999) >= 5;
  if(sources.length < targetCount && princessCooldownReady && !sources.some(e => e.princess) && !S.active.some(e => e.princess)){
    const princessChance = phase.id === "merchant_age" ? .20 : S.day >= 50 ? .16 : .12;
    if(Math.random() < princessChance){
      const princessPool = EVENTS.filter(e =>
        e.princess &&
        !e.chainOnly &&
        !usedIds.has(e.id) &&
        (!e.phases || e.phases.includes(phase.id))
      );
      if(princessPool.length) addSource(pick(princessPool));
    }
  }

  // 성녀는 공주와 별개의 유명인입니다. 뉴스 슬롯이 남으면 독립적으로 선언할 수 있습니다.
  const saintCooldownReady = S.day - (S.lastSaintDay ?? -999) >= 6;
  if(sources.length < targetCount && saintCooldownReady && !sources.some(e => e.saint) && !S.active.some(e => e.saint)){
    const saintChance = phase.id === "war" ? .15 : S.day >= 50 ? .12 : .09;
    if(Math.random() < saintChance){
      const saintPool = EVENTS.filter(e =>
        e.saint &&
        !e.chainOnly &&
        !usedIds.has(e.id) &&
        (!e.phases || e.phases.includes(phase.id))
      );
      if(saintPool.length) addSource(pick(saintPool));
    }
  }

  let safety = 0;
  while(sources.length < targetCount && safety++ < 30){
    const pool = EVENTS.filter(e => {
      if(e.chainOnly) return false;
      if(Array.isArray(e.blockedCities) && e.blockedCities.length) return false;
      if(usedIds.has(e.id)) return false;
      if(e.phases && !e.phases.includes(phase.id)) return false;
      if(e.noCapital && S.city === "capital" && !isWarActive()) return false;
      // 같은 사건이 아직 진행 중이면 새 뉴스 슬롯에서 또 뽑지 않습니다.
      if(S.active.some(a => a.id === e.id)) return false;
      // 공주와 성녀 발언은 각각 전용 확률과 쿨다운을 통해서만 발생합니다.
      if(e.princess || e.saint) return false;
      return true;
    });
    if(!pool.length) break;
    addSource(pick(pool));
  }

  const todayNews = [];
  let nextFollow = null;

  for(const source of sources){
    const e = Object.assign({},source);
    e.remaining = e.days;
    S.active.push(e);
    todayNews.push(e);

    if(e.princess){
      S.princessStatements = (S.princessStatements || 0) + 1;
      S.lastPrincessDay = S.day;
      applyEventMarketShock(e);
    }
    if(e.saint){
      S.saintDeclarations = (S.saintDeclarations || 0) + 1;
      S.lastSaintDay = S.day;
      applyEventMarketShock(e);
    }

    if(!nextFollow && e.follow){
      nextFollow = e.princess ? {...e.follow,chance:.5} : e.follow;
    }
  }

  S.todayNews = todayNews;
  S.today = todayNews[0] || null;

  // 시대 전환 뉴스만 나온 날에는 기존 후속 사건 예약을 보존합니다.
  const onlyPhaseIntros = todayNews.length && todayNews.every(e => e.phaseIntro);
  S.pendingFollow = nextFollow || (onlyPhaseIntros ? previousFollow : null);

  if(S.plannedBlockade?.day === S.day){
    S.plannedBlockade = null;
  }
  planTomorrowBlockade();
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

  state.craftUsed = (state.craftUsed && typeof state.craftUsed === "object" && !Array.isArray(state.craftUsed))
    ? state.craftUsed
    : {};
  for(const recipe of CRAFT_RECIPES) state.craftUsed[recipe.id] ??= 0;
  state.completedContracts ??= 0;
  state.contractDoneDay ??= 0;
  state.choiceResolvedDay ??= 0;
  state.todayNews = Array.isArray(state.todayNews)
    ? state.todayNews
    : (state.today ? [state.today] : []);
  if(state.pendingFollow?.id?.startsWith("princess_")){
    state.pendingFollow.chance = .5;
  }
  state.rankSaved ??= false;
  state.ending ??= false;
  state.endingRoute ??= "normal";
  state.endless ??= false;
  state.routeScores ||= {royal:0,antihero:0,underworld:0,artisan:0};
  state.routeStory ||= {royal:0,antihero:0,underworld:0,artisan:0};
  for(const key of Object.keys(ROUTES)){
    state.routeScores[key] ??= 0;
    state.routeStory[key] ??= 0;
  }
  if(!state.factionRep){
    state.factionRep = {
      merchant:Math.min(100,(state.completedContracts || 0) * 3),
      kingdom:Math.min(100,(state.routeScores.royal || 0) * 3.5),
      church:Math.min(100,(state.saintDeclarations || 0) * 2),
      underworld:Math.min(100,(state.routeScores.underworld || 0) * 3),
      artisan:Math.min(100,(state.routeScores.artisan || 0) * 1.8)
    };
  }
  if(!state.factionMergeV2){
    state.factionRep.merchant=Math.min(100,Number(state.factionRep.merchant||0)+Number(state.factionRep.antihero||0));
    delete state.factionRep.antihero;
    state.factionRep.church ??= Math.min(100,Number(state.saintDeclarations||0)*2);
    state.factionMergeV2=true;
  }
  for(const key of ["merchant","kingdom","church","underworld","artisan"]){
    state.factionRep[key] = Math.max(0,Math.min(100,Number(state.factionRep[key] || 0)));
  }
  state.npcRep ||= {};
  state.npcTalkDay ||= {};
  state.npcFavorDay ||= {};
  state.npcQuestStage ||= {};
  state.npcLegacy ||= {};
  for(const city of Object.keys(CITY_NPCS)){
    state.npcRep[city]=Math.max(0,Math.min(100,Number(state.npcRep[city]||0)));
    state.npcQuestStage[city]=Math.max(0,Math.min(3,Number(state.npcQuestStage[city]||0)));
    state.npcLegacy[city]=!!state.npcLegacy[city];
  }
  state.lastPhaseId ??= null;
  if(state.finalTrial){
    // 이전 버전에서 이미 진행한 최종심사 일수는 납품 완료로 인정해 저장 호환성을 유지합니다.
    if(state.finalTrial.delivered == null){
      const elapsed = Math.max(0,(state.day || 1) - (state.finalTrial.startDay || state.day || 1));
      state.finalTrial.delivered = Math.min(ENDING_GOALS.trialDays,elapsed);
    }
    state.finalTrial.requirement ??= null;
    if(state.finalTrial.requirement?.item && !Array.isArray(state.finalTrial.requirement.lines)){
      state.finalTrial.requirement.lines = [{
        item:state.finalTrial.requirement.item,
        qty:state.finalTrial.requirement.qty || 1
      }];
    }
    state.finalTrial.finished ??= false;
  }
  state.mercFriendship ??= 0;
  state.mercTotalHires ??= 0;
  state.mercCompleted ??= 0;
  state.mercExpeditions = Array.isArray(state.mercExpeditions) ? state.mercExpeditions : [];
  state.mercRoster = Array.isArray(state.mercRoster) ? state.mercRoster : [];

  // 구버전 일회성 용병단은 새 육성 시스템에서 자동 용병으로 생성하지 않습니다.
  // 새 시스템은 반드시 플레이어가 직접 첫 E급 용병을 고용하면서 시작합니다.
  if(!state.mercRosterMigrationV3){
    state.mercRoster = state.mercRoster.filter(m => {
      const legacyId = String(m?.id || "").startsWith("legacy_");
      const legacyName = ["구면 용병대","오래된 동료","베테랑 용병","구면 용병"].some(n =>
        String(m?.name || "").startsWith(n)
      );
      return !(legacyId || legacyName);
    });
    state.mercExpeditions = [];
    state.mercRosterMigrationV3 = true;
  }

  for(const m of state.mercRoster){
    m.gradeIndex = Math.max(0,Math.min(MERC_GRADES.length-1,Number(m.gradeIndex || 0)));
    m.xp = Math.max(0,Number(m.xp || 0));
    m.missions = Math.max(0,Number(m.missions || 0));
    m.busyUntil = Math.max(0,Number(m.busyUntil || 0));
    m.expeditionId ??= null;
    m.assignment = ["warehouse","escort","promotion"].includes(m.assignment) ? m.assignment : null;
    m.hiredDay ??= 1;
    if(m.namedId){
      const def=NAMED_MERCS.find(n=>n.id===m.namedId);
      if(def){ m.trait ??= def.trait; m.traitName ??= def.traitName; }
      m.bond=Math.max(0,Math.min(100,Number(m.bond||5)));
      m.storyStage=Math.max(0,Math.min(3,Number(m.storyStage||0)));
      m.awakened=!!m.awakened;
      m.talkDay=Number(m.talkDay||0);
    }
  }
  state.mercRoster = state.mercRoster.slice(0,MERC_MAX_ROSTER);
  state.mercExpeditions = [];
  state.mercLog = Array.isArray(state.mercLog) ? state.mercLog : [];
  state.mercEquipment ||= {};
  if(!state.mercGearMigrationV2){
    for(const gear of MERC_GEAR){
      if(state.mercEquipment[gear.id]){
        state.inv[gear.item] = (state.inv[gear.item] || 0) + 1;
      }
    }
    state.mercEquipment = {};
    state.mercGearMigrationV2 = true;
  }
  state.princessStatements ??= 0;
  state.lastPrincessDay ??= state.active.some(e => e.princess) ? (state.day || 1) : -999;
  state.saintDeclarations ??= 0;
  state.lastSaintDay ??= state.active.some(e => e.saint) ? (state.day || 1) : -999;
  state.plannedBlockade ??= null;
  state.dayStartCash ??= state.cash;
  state.dayIncomeLog = Array.isArray(state.dayIncomeLog) ? state.dayIncomeLog : [];
  state.daySalesLog = Array.isArray(state.daySalesLog) ? state.daySalesLog : [];
  state.daySummary ??= null;
  if(state.travelOpen && state.daySummary?.open){
    state.daySummary.open = false;
  }
  state.lastMercEventDay ??= 0;
  state.banditSuppressionUntil ??= 0;
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
      const route = S.endingRoute || "normal";
      const data = endingData(route);
      const bad = route === "bad_merchant";
      $("#endingKicker").textContent = bad ? "최종 납품심사 실패 · BAD END" : "상단의 결말";
      $("#endingTitle").textContent = data.title;
      $("#endingText").textContent = data.text;
      $("#endingStats").innerHTML =
        "<b>" + S.day + "일 생존</b><span>최종 자산 " + fmt(net()) + "</span><span>완료 의뢰 " + S.completedContracts + "회</span><span>최고 자산 " + fmt(S.peak) + "</span>";
      $(".ending-rank-form")?.classList.toggle("hidden",bad);
      $("#saveSharedRank").textContent = S.rankSaved ? "저장 완료" : "공용 랭킹에 저장";
      $("#endingRankStatus").textContent = bad
        ? "평범한 상인 배드엔딩은 공용 클리어 랭킹에 등록되지 않습니다."
        : (S.rankSaved ? "이 클리어 기록은 이미 공용 랭킹에 저장되었습니다." : "클리어 기록은 모든 플레이어가 보는 공용 랭킹에 등록할 수 있습니다.");
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
    contractOffer:null,contractOffers:[],contractActive:null,contractDoneDay:0,completedContracts:0,specialDeal:null,pendingFollow:null,choiceEvent:null,choiceResolvedDay:0,lastSettlement:null,finalTrial:null,ending:false,rankSaved:false,craftUsed:{},marketIndex:{},marketMomentum:{},marketChange:{},tradePressure:{},routeScores:{royal:0,antihero:0,underworld:0,artisan:0},routeStory:{royal:0,antihero:0,underworld:0,artisan:0},factionRep:{merchant:0,kingdom:0,church:0,underworld:0,artisan:0},factionMergeV2:true,npcRep:{capital:0,farm:0,mine:0,port:0,arcane:0,forest:0,holycity:0},npcTalkDay:{},npcFavorDay:{},npcQuestStage:{capital:0,farm:0,mine:0,port:0,arcane:0,forest:0,holycity:0},npcLegacy:{},endingRoute:"normal",endless:false,lastPhaseId:null,mercFriendship:0,mercTotalHires:0,mercCompleted:0,mercRoster:[],mercExpeditions:[],mercRosterMigrationV3:true,mercLog:[],mercEquipment:{},mercGearMigrationV2:true,princessStatements:0,lastPrincessDay:-999,saintDeclarations:0,lastSaintDay:-999,plannedBlockade:null,dayStartCash:1000,dayIncomeLog:[],daySalesLog:[],daySummary:null,lastMercEventDay:0,banditSuppressionUntil:0
  };
  for(const k of Object.keys(ITEMS)){
    S.inv[k] = 0;
    S.prices[k] = ITEMS[k].base;
    S.prev[k] = ITEMS[k].base;
    S.marketIndex[k] = 1;
    S.marketMomentum[k] = 0;
    S.marketChange[k] = 0;
  }
  for(const recipe of CRAFT_RECIPES) S.craftUsed[recipe.id] = 0;
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
  $("#endingKicker").textContent = "상단의 결말";
  $(".ending-rank-form")?.classList.remove("hidden");
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
  const ban = saleBanEvent(item,S.city);
  if(ban){
    toast("판매금지령 적용 중: " + ITEMS[item].name + " · " + ban.remaining + "일 남음");
    return;
  }
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
  const promoter = assignedMerc("promotion");
  const promo = mercPromotionEffect(promoter);
  let promotedSold = 0;

  for(const o of S.orders){
    const ban = saleBanEvent(o.item,o.city);
    if(ban){
      keep.push(o);
      continue;
    }
    const key = o.city + ":" + o.item;
    if(capacityLeft[key] == null){
      const d0 = demand(o.item,o.city);
      const baseCapacity = 1 + d0 * 2.4 + Math.random() * 2.5;
      capacityLeft[key] = Math.max(1,Math.round(baseCapacity * promo.capacity));
    }

    const currentMarket = S.world[o.city][o.item] || S.prices[o.item];
    const premium = o.ask / Math.max(1,currentMarket);
    const age = S.day - o.listed;
    const freshness = Math.max(.52,1 - Math.max(0,age - 1) * .09);
    let chance = .19 * demand(o.item,o.city) * freshness / Math.max(.62,premium * premium);
    chance *= promo.chance;
    chance = Math.max(.015,Math.min(.94,chance));

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
      const rate = effectiveCityFee(o.city);
      const commission = Math.round(gross * rate);
      const payout = gross - commission;
      S.cash += payout;
      recordDaySale(o.item,sold,payout,"정규 시장");
      changeFactionRep("merchant",Math.min(1.5,.25 * sold));
      if(o.city==="holycity" && ["holy","holy_oil","blessed_incense"].includes(o.item)){
        changeFactionRep("church",Math.min(1,.20*sold));
      }
      updateSaleContract(o.item,o.city,sold);
      soldText.push(ITEMS[o.item].name + " " + sold + "개 " + fmt(payout) + (commission ? " (수수료 -" + fmt(commission) + ")" : ""));
      promotedSold += sold;
    }

    if(sold < o.qty) keep.push(Object.assign({},o,{qty:o.qty-sold}));
  }

  S.orders = keep;
  if(promoter && promotedSold > 0){
    promoter.xp += 1;
    if(promoter.namedId) changeNamedMercBond(promoter,1);
    addMercLog(promoter.name + " 홍보 성과 · 판매 " + promotedSold + "개 지원 · 경험 +1");
  }
  if(soldText.length) toast("판매 체결: " + soldText.join(", "));
}
function changeMercFriendship(amount){
  S.mercFriendship = Math.max(0,Math.min(100,(S.mercFriendship || 0) + amount));
}
function mercDiscountRate(){
  if(S.mercFriendship >= 70) return .15;
  if(S.mercFriendship >= 40) return .10;
  if(S.mercFriendship >= 20) return .05;
  return 0;
}
function mercById(id){
  return (S.mercRoster || []).find(m => String(m.id) === String(id)) || null;
}
function mercGrade(merc){
  return MERC_GRADES[Math.max(0,Math.min(MERC_GRADES.length-1,merc?.gradeIndex || 0))];
}
function mercIsBusy(merc){
  return !!(merc?.expeditionId && merc.busyUntil > S.day);
}
function mercIsAssigned(merc){
  return ["warehouse","escort","promotion"].includes(merc?.assignment);
}
function mercIsAvailable(merc){
  return !!merc && !mercIsBusy(merc) && !mercIsAssigned(merc);
}
function assignedMerc(role){
  return (S.mercRoster || []).find(m => m.assignment === role && !mercIsBusy(m)) || null;
}
function mercProtectionChance(merc,role){
  if(!merc) return 0;
  const warehouse = [.25,.40,.55,.70,.85,.97];
  const escort = [.20,.35,.50,.65,.82,.95];
  const table = role === "warehouse" ? warehouse : escort;
  let chance = table[Math.max(0,Math.min(table.length-1,merc.gradeIndex || 0))] || 0;
  if(role==="escort" && merc.trait==="escort") chance += merc.awakened ? .20 : .12;
  return Math.min(.99,chance);
}
function mercPromotionEffect(merc){
  if(!merc) return {chance:1,capacity:1};
  const chance = [1.15,1.22,1.30,1.40,1.50,1.65];
  const capacity = [1.10,1.15,1.20,1.28,1.35,1.45];
  const i = Math.max(0,Math.min(5,merc.gradeIndex || 0));
  let chanceMult=chance[i], capacityMult=capacity[i];
  if(merc.trait==="promoter"){ const b=merc.awakened?1.22:1.12; chanceMult*=b; capacityMult*=b; }
  return {chance:chanceMult,capacity:capacityMult};
}
function mercenaryUpkeep(){
  return (S.mercRoster || []).reduce((sum,m) => sum + (mercGrade(m).upkeep || 0),0);
}
function mercAssignmentName(role){
  return role === "warehouse" ? "창고 경비" : role === "escort" ? "상단 호위" : role === "promotion" ? "홍보 활동" : "대기";
}
function assignMercenary(id,role){
  if(checkBlocked()) return;
  const merc = mercById(id);
  if(!merc || !["warehouse","escort","promotion"].includes(role)) return;
  if(mercIsBusy(merc)){ toast("원정 중인 용병은 배치할 수 없습니다."); return; }

  const current = assignedMerc(role);
  if(current && current.id !== merc.id){
    current.assignment = null;
  }
  merc.assignment = role;
  addMercLog(merc.name + " 배치 · " + mercAssignmentName(role));
  toast(merc.name + "을 " + mercAssignmentName(role) + "에 배치했습니다.");
  render();
}
function unassignMercenary(id){
  if(checkBlocked()) return;
  const merc = mercById(id);
  if(!merc || !merc.assignment) return;
  const old = merc.assignment;
  merc.assignment = null;
  addMercLog(merc.name + " 배치 해제");
  toast(merc.name + "의 " + mercAssignmentName(old) + " 배치를 해제했습니다.");
  render();
}
function mercRecruitCost(){
  return Math.round(MERC_RECRUIT_COST * (1 - mercDiscountRate()));
}
function mercTrainingCost(merc){
  return mercGrade(merc).trainCost;
}
function mercExpeditionCost(def){
  return Math.max(1,Math.round(def.cost * (1 - mercDiscountRate())));
}
function mercExpeditionDays(merc,def){
  const traitCut = merc?.trait==="pathfinder" ? (merc.awakened?2:1) : 0;
  return Math.max(1,def.days - mercGrade(merc).dayCut - traitCut);
}
function addMercLog(text){
  S.mercLog ||= [];
  S.mercLog.unshift(S.day + "일차 · " + text);
  S.mercLog = S.mercLog.slice(0,8);
}
function namedMercBond(merc){
  return Math.max(0,Math.min(100,Number(merc?.bond||0)));
}
function changeNamedMercBond(merc,amount){
  if(!merc?.namedId) return;
  merc.bond=Math.max(0,Math.min(100,namedMercBond(merc)+Number(amount||0)));
}
function namedMercStory(merc){
  if(!merc?.namedId) return null;
  merc.storyStage=Math.max(0,Math.min(3,Number(merc.storyStage||0)));
  return NAMED_MERC_STORIES[merc.namedId]?.[merc.storyStage] || null;
}
function namedMercStoryReady(merc,story){
  if(!story) return false;
  if(namedMercBond(merc)<(story.bond||0)) return false;
  if((merc.missions||0)<(story.missions||0)) return false;
  if(merc.gradeIndex<(story.minGrade||0)) return false;
  return !mercIsBusy(merc);
}
function namedMercStoryRequirement(story){
  const parts=[];
  if(story.bond) parts.push("유대 "+story.bond);
  if(story.missions) parts.push("원정 "+story.missions+"회");
  if(story.minGrade!=null) parts.push(MERC_GRADES[story.minGrade].name);
  return parts.join(" · ");
}
function talkNamedMercenary(id){
  if(checkBlocked()) return;
  const merc=mercById(id);
  if(!merc?.namedId || mercIsBusy(merc)) return;
  merc.talkDay ??= 0;
  if(merc.talkDay===S.day){ toast(merc.name+"과는 오늘 이미 이야기를 나눴습니다."); return; }
  merc.talkDay=S.day;
  changeNamedMercBond(merc,2);
  changeMercFriendship(1);
  addMercLog(merc.name+"과 대화 · 유대 +2");
  toast(merc.name+"과 이야기를 나눴습니다. 유대도 +2.");
  render();
}
function resolveNamedMercStory(id,index){
  if(checkBlocked()) return;
  const merc=mercById(id);
  const story=namedMercStory(merc);
  if(!merc || !story || !namedMercStoryReady(merc,story)) return;
  const opt=story.options?.[index];
  if(!opt) return;
  if(opt.cost && S.cash<=opt.cost){ toast(fmt(opt.cost)+"가 필요합니다."); return; }
  if(opt.item && (S.inv[opt.item]||0)<(opt.qty||1)){ toast(ITEMS[opt.item].name+" "+(opt.qty||1)+"개가 필요합니다."); return; }

  if(opt.cost) S.cash-=opt.cost;
  if(opt.item) S.inv[opt.item]-=(opt.qty||1);
  if(opt.cashReward){ S.cash+=opt.cashReward; recordDayIncome(opt.cashReward,"네임드 용병 스토리"); }
  if(opt.bond) changeNamedMercBond(merc,opt.bond);
  if(opt.xp) merc.xp+=opt.xp;
  for(const [f,v] of Object.entries(opt.factions||{})) changeFactionRep(f,v);
  for(const [city,v] of Object.entries(opt.cityRep||{})){
    S.npcRep[city]=Math.max(0,Math.min(100,(S.npcRep[city]||0)+v));
  }
  merc.storyStage=(merc.storyStage||0)+1;
  if(opt.awaken || merc.storyStage>=3){
    merc.awakened=true;
    merc.traitName = merc.namedId==="liana" ? "회색 맹세" :
      merc.namedId==="bron" ? "왕사냥꾼" :
      merc.namedId==="miel" ? "전설의 입소문" :
      merc.namedId==="kasha" ? "경계 너머의 길" :
      merc.namedId==="aelrin" ? "대정령의 시야" : merc.traitName;
  }
  changeMercFriendship(2);
  addMercLog(merc.name+" 전용 스토리 "+merc.storyStage+"/3 완료");
  toast(opt.message || merc.name+"의 이야기가 한 장 진행됐습니다.");
  render();
}
function namedMercStoryHtml(merc){
  if(!merc?.namedId) return "";
  const story=namedMercStory(merc);
  const bond=namedMercBond(merc);
  const talked=merc.talkDay===S.day;
  if(!story){
    return '<div class="named-story complete"><div><b>★ 전용 스토리 완료</b><span>유대 '+bond+' / 100 · '+merc.traitName+' 각성</span></div><button data-named-talk="'+merc.id+'"'+(talked || mercIsBusy(merc)?' disabled':'')+'>'+(talked?'오늘 대화 완료':'대화하기 +2')+'</button></div>';
  }
  const ready=namedMercStoryReady(merc,story);
  return '<div class="named-story '+(ready?'ready':'locked')+'">'+
    '<div class="named-story-head"><span>전용 스토리 '+((merc.storyStage||0)+1)+' / 3</span><b>'+story.title+'</b></div>'+
    '<p>'+story.text+'</p>'+
    '<div class="named-bond-row"><span>유대 '+bond+' / 100</span><button data-named-talk="'+merc.id+'"'+(talked || mercIsBusy(merc)?' disabled':'')+'>'+(talked?'오늘 대화 완료':'대화하기 · 유대 +2')+'</button></div>'+
    (ready
      ? '<div class="named-story-options">'+story.options.map((o,i)=>'<button data-named-story="'+merc.id+'" data-option="'+i+'"'+((o.cost&&S.cash<=o.cost)||(o.item&&(S.inv[o.item]||0)<(o.qty||1))?' disabled':'')+'>'+o.label+'</button>').join("")+'</div>'
      : '<div class="named-story-lock">해금 조건: '+namedMercStoryRequirement(story)+'</div>')+
    '</div>';
}

function namedMercOffer(){
  return NAMED_MERCS.find(n =>
    n.city===S.city &&
    S.day>=n.unlockDay &&
    !(S.mercRoster||[]).some(m=>m.namedId===n.id)
  ) || null;
}
function hireNamedMercenary(id){
  if(checkBlocked()) return;
  const def=NAMED_MERCS.find(n=>n.id===id);
  if(!def || def.city!==S.city || S.day<def.unlockDay) return;
  S.mercRoster ||= [];
  if(S.mercRoster.length>=MERC_MAX_ROSTER){ toast("용병 정원이 가득 찼습니다."); return; }
  const cost=Math.round(def.cost*(1-mercDiscountRate()));
  if(S.cash<=cost){ toast("고용비 "+fmt(cost)+"가 부족합니다."); return; }
  S.cash-=cost;
  const merc={
    id:"named_"+def.id,
    namedId:def.id,
    name:def.name,
    gradeIndex:def.gradeIndex,
    xp:Math.max(0,(MERC_GRADES[def.gradeIndex-1]?.promoteXp||0)-2),
    missions:0,busyUntil:0,expeditionId:null,assignment:null,hiredDay:S.day,
    trait:def.trait,traitName:def.traitName,bond:5,storyStage:0,awakened:false,talkDay:0
  };
  S.mercRoster.push(merc);
  S.mercTotalHires+=1;
  changeMercFriendship(4);
  addMercLog(def.name+" 합류 · "+MERC_GRADES[def.gradeIndex].name+" · "+def.traitName);
  toast(def.name+"이 상단에 합류했습니다.");
  render();
}
function uniqueMercName(){
  const used = new Set((S.mercRoster || []).map(m => m.name));
  const pool = MERC_NAMES.filter(n => !used.has(n));
  return pick(pool.length ? pool : MERC_NAMES) + (pool.length ? "" : " " + (S.mercRoster.length+1));
}
function recruitMercenary(){
  if(checkBlocked()) return;
  S.mercRoster ||= [];
  if(S.mercRoster.length >= MERC_MAX_ROSTER){
    toast("상단에서 직접 관리할 수 있는 용병은 " + MERC_MAX_ROSTER + "명까지입니다.");
    return;
  }
  const cost = mercRecruitCost();
  if(S.cash <= cost){ toast("고용비 " + fmt(cost) + "를 내면 파산합니다."); return; }

  const merc = {
    id:"merc_" + S.day + "_" + Math.random().toString(36).slice(2,8),
    name:uniqueMercName(),
    gradeIndex:0,
    xp:0,
    missions:0,
    busyUntil:0,
    expeditionId:null,
    assignment:null,
    hiredDay:S.day
  };
  S.cash -= cost;
  S.mercTotalHires += 1;
  changeMercFriendship(2);
  S.mercRoster.push(merc);
  addMercLog(merc.name + " E급 용병 고용");
  toast(merc.name + "을 E급 용병으로 고용했습니다.");
  render();
}
function investMercenary(id){
  if(checkBlocked()) return;
  const merc = mercById(id);
  if(!merc) return;
  if(mercIsBusy(merc)){ toast("원정 중인 용병은 훈련시킬 수 없습니다."); return; }
  if(mercIsAssigned(merc)){ toast("경비 임무 중인 용병은 먼저 배치를 해제해야 합니다."); return; }
  const cost = mercTrainingCost(merc);
  if(S.cash <= cost){ toast("훈련 투자비 " + fmt(cost) + "가 부족합니다."); return; }

  const gain = 2 + Math.floor(Math.random()*3);
  S.cash -= cost;
  merc.xp += gain;
  if(merc.namedId) changeNamedMercBond(merc,1);
  changeMercFriendship(1);
  addMercLog(merc.name + " 훈련 투자 · 경험 +" + gain);
  toast(merc.name + "에게 " + fmt(cost) + "를 투자했습니다. 경험 +" + gain + ".");
  render();
}
function promoteMercenary(id){
  if(checkBlocked()) return;
  const merc = mercById(id);
  if(!merc) return;
  if(mercIsBusy(merc)){ toast("원정 중에는 승급 심사를 받을 수 없습니다."); return; }
  if(mercIsAssigned(merc)){ toast("경비 임무 중에는 승급 심사를 받을 수 없습니다."); return; }
  const grade = mercGrade(merc);
  if(merc.gradeIndex >= MERC_GRADES.length-1){ toast("이미 S급 최고 등급입니다."); return; }
  if(merc.xp < grade.promoteXp){
    toast("승급 경험이 부족합니다. " + merc.xp + " / " + grade.promoteXp);
    return;
  }
  if(S.cash <= grade.promoteCost){ toast("승급비 " + fmt(grade.promoteCost) + "가 부족합니다."); return; }

  S.cash -= grade.promoteCost;
  merc.gradeIndex += 1;
  if(merc.namedId) changeNamedMercBond(merc,2);
  changeMercFriendship(3);
  const next = mercGrade(merc);
  addMercLog(merc.name + " 승급 · " + next.name);
  toast(merc.name + "이 " + next.name + " 용병으로 승급했습니다.");
  render();
}
function dispatchMercenary(mercId,expeditionId){
  if(checkBlocked()) return;
  const merc = mercById(mercId);
  const def = MERC_EXPEDITIONS.find(x => x.id === expeditionId);
  if(!merc || !def) return;
  if(mercIsBusy(merc)){ toast("이미 원정 중인 용병입니다."); return; }
  if(mercIsAssigned(merc)){ toast("경비 임무 중인 용병은 먼저 배치를 해제해야 합니다."); return; }
  if(S.day < def.unlockDay){ toast(def.unlockDay + "일차부터 가능한 원정입니다."); return; }
  if(merc.gradeIndex < def.minGrade){
    toast(def.name + "은 " + MERC_GRADES[def.minGrade].name + " 이상이 필요합니다.");
    return;
  }
  const cost = mercExpeditionCost(def);
  if(S.cash <= cost){ toast("원정 준비비 " + fmt(cost) + "가 부족합니다."); return; }

  const days = mercExpeditionDays(merc,def);
  S.cash -= cost;
  merc.expeditionId = def.id;
  merc.busyUntil = S.day + days;
  addMercLog(merc.name + " → " + def.name + " 파견 · " + days + "일");
  toast(merc.name + "을 " + def.name + "에 보냈습니다. " + merc.busyUntil + "일차 귀환 예정.");
  render();
}
function rollMercenaryLoot(def,merc){
  const grade = mercGrade(merc);
  const growth = 1 + Math.min(.25,(merc.xp || 0) * .005);
  const mult = grade.loot * growth;
  const loot = {};

  for(const y of def.yields){
    const chance = Math.min(.98,y.chance + (y.rare ? grade.rare : grade.rare*.35));
    if(Math.random() <= chance){
      const base = y.min + Math.floor(Math.random() * (y.max - y.min + 1));
      const q = Math.max(1,Math.round(base * mult * (.9 + Math.random()*.22)));
      loot[y.item] = (loot[y.item] || 0) + q;
    }
  }
  if(!Object.keys(loot).length){
    const y = def.yields[0];
    loot[y.item] = Math.max(1,Math.round(y.min * mult));
  }
  if(merc?.trait==="hunter"){
    const hideMult=merc.awakened?1.55:1.30;
    const hornMult=merc.awakened?1.75:1.40;
    if(loot.beast_hide) loot.beast_hide=Math.max(1,Math.round(loot.beast_hide*hideMult));
    if(loot.ogre_horn) loot.ogre_horn=Math.max(1,Math.round(loot.ogre_horn*hornMult));
  }
  if(merc?.trait==="rare"){
    for(const y of def.yields.filter(x=>x.rare)){
      if(!loot[y.item] && Math.random()<(merc.awakened?.32:.18)) loot[y.item]=1;
    }
  }
  if(merc?.trait==="pathfinder" && merc.awakened && def.yields.some(y=>y.item==="demon_claw") && !loot.demon_claw && Math.random()<.22){
    loot.demon_claw=1;
  }
  return loot;
}
function processMercenaryExpeditions(){
  S.mercRoster ||= [];
  for(const merc of S.mercRoster){
    if(!merc.expeditionId || merc.busyUntil > S.day) continue;
    const def = MERC_EXPEDITIONS.find(x => x.id === merc.expeditionId);
    if(!def){
      merc.expeditionId = null;
      merc.busyUntil = 0;
      continue;
    }

    const loot = rollMercenaryLoot(def,merc);
    for(const [k,q] of Object.entries(loot)) S.inv[k] = (S.inv[k] || 0) + q;

    const xpGain = def.xp + Math.floor(Math.random()*3);
    merc.xp += xpGain;
    merc.missions += 1;
    if(merc.namedId) changeNamedMercBond(merc,3);
    merc.expeditionId = null;
    merc.busyUntil = 0;
    S.mercCompleted += 1;
    changeMercFriendship(2);

    const text = Object.entries(loot).map(([k,q]) => ITEMS[k].name + " " + q + "개").join(", ");
    addMercLog(merc.name + " 귀환 · " + text + " · 경험 +" + xpGain);
    toast(merc.name + " 원정 귀환: " + text);
  }
}
function mercGearCityRate(city){
  return ({capital:1.18,farm:.88,mine:1.00,port:1.10,arcane:1.14,forest:1.06,holycity:1.12})[city] || 1;
}
function mercGearPhaseRate(item){
  const phase = currentWorldPhase().id;
  if(phase === "war"){
    if(["monster_hide_cover","monster_ogre_horn","monster_wyvern_armor"].includes(item)) return 1.22;
    return 1.10;
  }
  if(phase === "tension") return 1.10;
  if(phase === "recovery") return .94;
  if(phase === "merchant_age") return 1.08;
  return 1;
}
function mercGearEventRate(item){
  let rate = 1;
  for(const e of S.active){
    if(e.gearP?.[item] != null) rate *= e.gearP[item];
  }
  return rate;
}
function mercGearSalePrice(item){
  const it = ITEMS[item];
  if(!it?.monsterGear) return 0;
  return Math.max(1,Math.round(it.base * mercGearCityRate(S.city) * mercGearPhaseRate(item) * mercGearEventRate(item)));
}
function craftMercGear(id){
  if(checkBlocked()) return;
  const gear = MERC_GEAR.find(x => x.id === id);
  if(!gear) return;
  if(S.day < gear.unlockDay){ toast(gear.unlockDay + "일차부터 제작할 수 있습니다."); return; }
  if(S.city !== "mine"){ toast("몬스터 장비 상품은 철산 카르둠 장비공방에서 제작할 수 있습니다."); return; }
  const gearFee = Math.max(0,Math.round(artisanFee(gear.fee) * (1-cityNpcCraftDiscount("mine"))));
  if(S.cash <= gearFee){ toast("공임 " + fmt(gearFee) + "를 내면 파산합니다."); return; }
  for(const [k,q] of Object.entries(gear.inputs)){
    if((S.inv[k] || 0) < q){ toast(ITEMS[k].name + " " + q + "개가 필요합니다."); return; }
  }

  const freedWeight = Object.entries(gear.inputs).reduce((a,[k,q]) => a + ITEMS[k].w*q,0);
  const outputWeight = ITEMS[gear.item].w;
  if(used() - freedWeight + outputWeight > S.capacity){
    toast("완성 장비를 실을 마차 공간이 부족합니다.");
    return;
  }

  for(const [k,q] of Object.entries(gear.inputs)) S.inv[k] -= q;
  S.cash -= gearFee;
  S.inv[gear.item] = (S.inv[gear.item] || 0) + 1;
  addRoute("artisan",.7);
  addMercLog("장비 상품 제작 · " + gear.name);
  toast(gear.name + " 제작 완료. 현재 " + CITIES[S.city].name + " 매입가 " + fmt(mercGearSalePrice(gear.item)) + ".");
  render();
}
function sellMercGear(item,qty=1){
  if(checkBlocked()) return;
  if(!ITEMS[item]?.monsterGear) return;
  const ban = saleBanEvent(item,S.city);
  if(ban){ toast("몬스터 장비 판매금지령 적용 중 · " + ban.remaining + "일 남음"); return; }
  const held = S.inv[item] || 0;
  if(qty === 999) qty = held;
  qty = Math.max(0,Math.min(qty,held));
  if(qty < 1){ toast("판매할 제작 장비가 없습니다."); return; }

  const each = mercGearSalePrice(item);
  const total = each * qty;
  S.inv[item] -= qty;
  S.cash += total;
  recordDaySale(item,qty,total,"몬스터 장비 매입상");
  addMercLog("장비 판매 · " + ITEMS[item].name + " " + qty + "개 · " + fmt(total));
  toast(CITIES[S.city].name + " 장비 매입상에게 " + ITEMS[item].name + " " + qty + "개를 " + fmt(total) + "에 판매했습니다.");
  render();
}
function mercenaryEventCandidate(){
  if(S.mercTotalHires < 3 || S.day - (S.lastMercEventDay || 0) < 4) return null;

  if(S.mercFriendship >= 60 && S.mercCompleted >= 4 && S.banditSuppressionUntil < S.day){
    if(Math.random() < .34){
      S.lastMercEventDay = S.day;
      return {
        id:"merc_bandit_nest",
        title:"용병단이 도적단 본거지를 찾아냈습니다",
        text:"오랫동안 거래한 용병들이 인근 도적단의 본거지를 찾아냈다며 먼저 소탕해주겠다고 합니다. 우호도가 쌓인 덕분입니다.",
        options:[
          {label:"부탁한다 · 보수 없이 맡긴다",effect:"merc_bandit_free"},
          {label:"150G를 추가 지급해 완전히 쓸어버린다",effect:"merc_bandit_bonus"},
          {label:"우리 일은 장사뿐입니다",effect:"merc_bandit_decline"}
        ]
      };
    }
  }

  const activeCount = (S.mercRoster || []).filter(mercIsBusy).length;
  const activeBonus = Math.min(.14,activeCount * .035);
  if(Math.random() > .12 + activeBonus) return null;
  S.lastMercEventDay = S.day;
  return Object.assign({},pick(MERCENARY_EVENTS));
}
function renderMercenaries(){
  const box = $("#mercenaryBox");
  const gearBox = $("#mercGearBox");
  const status = $("#mercenaryStatus");
  const log = $("#mercLog");
  const materials = ["beast_hide","slime_core","ogre_horn","wyvern_scale","demon_claw"];
  const roster = S.mercRoster || [];
  const active = roster.filter(mercIsBusy);
  const idle = roster.filter(mercIsAvailable);
  const discount = Math.round(mercDiscountRate() * 100);

  $("#mercFriendBadge").textContent = "길드 우호도 " + S.mercFriendship + (discount ? " · 비용 -" + discount + "%" : "");
  $("#mercActiveBadge").textContent = "용병 " + roster.length + " / " + MERC_MAX_ROSTER + " · 원정 " + active.length;

  const suppression = S.banditSuppressionUntil >= S.day
    ? '<span class="merc-safe">도적단 소탕 효과 · ' + S.banditSuppressionUntil + '일차까지</span>'
    : '<span>도적단 소탕 효과 없음</span>';
  status.innerHTML =
    '<div class="merc-materials">' + materials.map(k => '<span><b>' + ITEMS[k].name + '</b> ' + (S.inv[k] || 0) + '</span>').join("") + '</div>' +
    '<div class="merc-affinity"><span>누적 원정 ' + S.mercCompleted + '회</span><span>고용한 용병 ' + S.mercTotalHires + '명</span><span>용병 유지비 ' + fmt(mercenaryUpkeep()) + '/일</span>' + suppression + '</div>';

  const recruitCost = mercRecruitCost();
  const recruitDisabled = roster.length >= MERC_MAX_ROSTER || S.cash <= recruitCost;
  const recruit =
    '<div class="merc-recruit-bar"><div><b>상단 소속 용병</b><span>새 용병은 E급으로 시작합니다. 훈련 투자와 실전 원정으로 경험을 쌓아 승급하세요.</span></div>' +
    '<button data-merc-recruit' + (recruitDisabled ? ' disabled' : '') + '>' +
      (roster.length >= MERC_MAX_ROSTER ? '정원 가득 참' : '신규 용병 고용 · ' + fmt(recruitCost)) +
    '</button></div>';
  const namedOffer=namedMercOffer();
  const namedRecruit = namedOffer
    ? '<div class="named-merc-offer"><div><span>★ 네임드 용병</span><h3>'+namedOffer.name+'</h3><p>'+namedOffer.desc+'</p><b>'+namedOffer.traitName+' · '+MERC_GRADES[namedOffer.gradeIndex].name+' 시작</b></div>'+
      '<button data-named-merc="'+namedOffer.id+'"'+(roster.length>=MERC_MAX_ROSTER || S.cash<=Math.round(namedOffer.cost*(1-mercDiscountRate()))?' disabled':'')+'>고용 · '+fmt(Math.round(namedOffer.cost*(1-mercDiscountRate())))+'</button></div>'
    : '';

  const rosterHtml = roster.length
    ? '<div class="merc-roster-grid">' + roster.map(merc => {
        const grade = mercGrade(merc);
        const busy = mercIsBusy(merc);
        const assigned = mercIsAssigned(merc);
        const def = busy ? MERC_EXPEDITIONS.find(x => x.id === merc.expeditionId) : null;
        const nextXp = grade.promoteXp;
        const xpPct = nextXp ? Math.min(100,(merc.xp / nextXp)*100) : 100;
        const trainCost = mercTrainingCost(merc);
        const promoteReady = nextXp != null && merc.xp >= nextXp;
        const promoteText = nextXp == null
          ? '최고 등급'
          : promoteReady
            ? '승급 심사 · ' + fmt(grade.promoteCost)
            : '승급 ' + merc.xp + ' / ' + nextXp + ' XP';
        return '<article class="merc-unit-card grade-' + grade.id + '">' +
          '<div class="merc-unit-head"><div><span class="merc-grade">' + grade.name + (merc.namedId ? ' · ★ 네임드' : '') + '</span><h3>' + merc.name + '</h3></div>' +
            '<span class="' + (busy ? 'merc-busy' : assigned ? 'merc-assigned' : 'merc-idle') + '">' +
              (busy ? '원정 중' : assigned ? mercAssignmentName(merc.assignment) : '대기') +
            '</span></div>' +
          '<div class="merc-xp-row"><span>경험 ' + merc.xp + (nextXp ? ' / ' + nextXp : '') + '</span><span>완료 원정 ' + merc.missions + '회</span></div>' +
          '<div class="merc-xp-bar"><i style="width:' + xpPct + '%"></i></div>' +
          (busy
            ? '<div class="merc-mission-now"><b>' + (def?.name || '원정') + '</b><span>' + Math.max(0,merc.busyUntil-S.day) + '일 남음 · ' + merc.busyUntil + '일차 귀환</span></div>'
            : assigned
              ? (merc.assignment === 'promotion'
                  ? '<div class="merc-defense-now merc-promotion-now"><b>홍보 활동 배치</b><span>판매확률 ×' + mercPromotionEffect(merc).chance.toFixed(2) + ' · 판매물량 ×' + mercPromotionEffect(merc).capacity.toFixed(2) + '</span></div>'
                  : '<div class="merc-defense-now"><b>' + mercAssignmentName(merc.assignment) + ' 배치</b><span>방어 성공률 ' + Math.round(mercProtectionChance(merc,merc.assignment)*100) + '%</span></div>')
              : '<p class="merc-grade-bonus">소재 획득 ×' + grade.loot.toFixed(2) + (grade.rare ? ' · 희귀확률 +' + Math.round(grade.rare*100) + '%' : '') + (grade.dayCut ? ' · 원정 -' + grade.dayCut + '일' : '') + '</p>') +
          (merc.traitName ? '<div class="merc-trait"><b>'+merc.traitName+(merc.awakened?' · 각성':'')+'</b><span>'+((NAMED_MERCS.find(n=>n.id===merc.namedId)||{}).desc||"고유 특성")+'</span></div>' : '') +
          namedMercStoryHtml(merc) +
          '<div class="merc-upkeep-line">일일 유지비 <b>' + fmt(grade.upkeep) + '</b></div>' +
          '<div class="merc-unit-actions">' +
            '<button data-merc-invest="' + merc.id + '"' + (busy || assigned || S.cash <= trainCost ? ' disabled' : '') + '>훈련 투자 ' + fmt(trainCost) + '</button>' +
            '<button data-merc-promote="' + merc.id + '"' + (busy || assigned || !promoteReady || nextXp == null || S.cash <= (grade.promoteCost || 0) ? ' disabled' : '') + '>' + promoteText + '</button>' +
          '</div>' +
          '<div class="merc-defense-actions">' +
            (assigned
              ? '<button data-merc-unassign="' + merc.id + '">경비 배치 해제</button>'
              : '<button data-merc-assign="' + merc.id + '" data-role="warehouse"' + (busy ? ' disabled' : '') + '>창고 ' + Math.round(mercProtectionChance(merc,"warehouse")*100) + '%</button>' +
                '<button data-merc-assign="' + merc.id + '" data-role="escort"' + (busy ? ' disabled' : '') + '>호위 ' + Math.round(mercProtectionChance(merc,"escort")*100) + '%</button>' +
                '<button data-merc-assign="' + merc.id + '" data-role="promotion"' + (busy ? ' disabled' : '') + '>홍보 ×' + mercPromotionEffect(merc).chance.toFixed(2) + '</button>') +
          '</div>' +
        '</article>';
      }).join("") + '</div>'
    : '<div class="merc-empty"><b>아직 상단 소속 용병이 없습니다.</b><span>용병을 고용하면 계속 성장시키며 반복해서 원정을 보낼 수 있습니다.</span></div>';

  const expeditionHtml =
    '<div class="merc-expedition-head"><b>원정 게시판</b><span>높은 등급일수록 수량·희귀재료 확률이 증가하고 B급부터 귀환도 빨라집니다.</span></div>' +
    '<div class="merc-grid">' + MERC_EXPEDITIONS.map(def => {
      const unlocked = S.day >= def.unlockDay;
      const eligible = idle.filter(m => m.gradeIndex >= def.minGrade);
      const cost = mercExpeditionCost(def);
      const possible = def.yields.map(y => ITEMS[y.item].name + " " + y.min + "~" + y.max + (y.rare ? " · 희귀" : "")).join(" / ");
      return '<article class="merc-card">' +
        '<div class="merc-card-head"><h3>' + def.name + '</h3><span>' + MERC_GRADES[def.minGrade].name + ' 이상 · 기본 ' + def.days + '일</span></div>' +
        '<p>' + def.desc + '</p>' +
        '<div class="merc-yield">' + possible + '</div>' +
        '<div class="merc-dispatch-row"><select data-exp-select="' + def.id + '"' + (!unlocked || !eligible.length ? ' disabled' : '') + '>' +
          '<option value="">' + (!unlocked ? def.unlockDay + '일차 해금' : eligible.length ? '파견할 용병 선택' : MERC_GRADES[def.minGrade].name + ' 이상 대기 용병 필요') + '</option>' +
          eligible.map(m => '<option value="' + m.id + '">' + m.name + ' · ' + mercGrade(m).name + ' · ' + mercExpeditionDays(m,def) + '일</option>').join("") +
        '</select>' +
        '<button data-merc-dispatch="' + def.id + '"' + (!unlocked || !eligible.length || S.cash <= cost ? ' disabled' : '') + '>파견 · 준비비 ' + fmt(cost) + '</button></div>' +
      '</article>';
    }).join("") + '</div>';

  box.innerHTML = recruit + namedRecruit + rosterHtml + expeditionHtml;

  const heldGear = MERC_GEAR.filter(gear => (S.inv[gear.item] || 0) > 0);
  gearBox.innerHTML =
    '<div class="gear-grid">' + MERC_GEAR.map(gear => {
      const locked = S.day < gear.unlockDay;
      const inputs = Object.entries(gear.inputs).map(([k,q]) => ITEMS[k].name + " " + q + "개").join(" + ");
      const enough = Object.entries(gear.inputs).every(([k,q]) => (S.inv[k] || 0) >= q);
      const gearFee = Math.max(0,Math.round(artisanFee(gear.fee) * (1-cityNpcCraftDiscount("mine"))));
      const disabled = locked || S.city !== "mine" || !enough || S.cash <= gearFee;
      const held = S.inv[gear.item] || 0;
      return '<article class="gear-card">' +
        '<div class="gear-head"><h4>' + gear.name + '</h4><span>보유 ' + held + '개</span></div>' +
        '<p>' + gear.desc + '</p>' +
        '<div class="gear-recipe">' + inputs + ' · 공임 ' + fmt(gearFee) + (gearFee < gear.fee ? ' <s>' + fmt(gear.fee) + '</s>' : '') + ' · 무게 ' + ITEMS[gear.item].w + '</div>' +
        '<div class="gear-value">현재 ' + CITIES[S.city].name + ' 매입가 <b>' + fmt(mercGearSalePrice(gear.item)) + '</b></div>' +
        '<button data-merc-gear="' + gear.id + '"' + (disabled ? " disabled" : "") + '>' +
          (locked ? gear.unlockDay + "일차 해금" : S.city !== "mine" ? "철산에서 제작" : "1개 제작") +
        '</button></article>';
    }).join("") + '</div>' +
    '<div class="gear-buyer"><div class="gear-buyer-head"><b>몬스터 장비 전문 매입상</b><span>도시·시대에 따라 매입가 변동</span></div>' +
      (heldGear.length
        ? heldGear.map(gear => {
            const item = gear.item;
            const q = S.inv[item] || 0;
            const each = mercGearSalePrice(item);
            const ban = saleBanEvent(item,S.city);
            return '<article class="gear-sell-row"><div><b>' + ITEMS[item].name + '</b><span>보유 ' + q + '개 · ' + fmt(each) + '/개' + (ban ? ' · ⛔ 판매금지 ' + ban.remaining + '일' : '') + '</span></div>' +
              '<div><button data-merc-sell="' + item + '" data-q="1"' + (ban ? ' disabled' : '') + '>' + (ban ? '판매금지' : '1개 판매') + '</button><button data-merc-sell="' + item + '" data-q="999"' + (ban ? ' disabled' : '') + '>' + (ban ? '거래 중지' : '전부 판매') + '</button></div></article>';
          }).join("")
        : '<p class="mini muted">판매할 제작 장비가 없습니다. 철산 공방에서 먼저 제작하세요.</p>') +
    '</div>';

  log.innerHTML = S.mercLog.length
    ? '<b>용병대 기록</b>' + S.mercLog.map(x => '<span>' + x + '</span>').join("")
    : '<span class="muted">아직 용병을 고용하거나 원정을 보낸 기록이 없습니다.</span>';
}

function trouble(){
  if(capitalIsSafe()) return;

  const extraRisk = Math.min(.18,Math.max(0,S.day - 10) * .008);
  const phaseRisk = currentWorldPhase().risk || 0;
  if(Math.random() > Math.min(.65,.24 + extraRisk + phaseRisk)) return;

  const tier = merchantTier();

  if(Math.random() < .5){
    if(S.banditSuppressionUntil >= S.day){
      toast("용병단이 미리 소탕한 덕분에 이 지역에서는 도적이 모습을 보이지 않습니다.");
      return;
    }
    const escort = assignedMerc("escort");
    const escortChance = mercProtectionChance(escort,"escort");
    if(escort && Math.random() < escortChance){
      escort.xp += 1;
      if(escort.namedId) changeNamedMercBond(escort,1);
      changeMercFriendship(1);
      addMercLog(escort.name + " 호위 성공 · 도적 습격 차단 · 경험 +1");
      toast(escort.name + "이 상단을 호위하다 도적 습격을 막았습니다! (" + Math.round(escortChance*100) + "%)");
      return;
    }else{
      const patrolChance = S.mercFriendship >= 75 ? .45 : S.mercFriendship >= 50 ? .25 : 0;
      if(patrolChance && Math.random() < patrolChance){
        changeMercFriendship(1);
        addMercLog("순찰 중이던 용병단이 도적 습격을 대신 막아줌");
        toast("친분이 쌓인 용병단이 우연히 근처를 순찰하다 도적을 쫓아냈습니다.");
        return;
      }
      const rate = .08 + Math.random() * .08 + tier.level * .015;
      const loss = Math.min(Math.max(0,S.cash - 1),Math.max(60,Math.round(S.cash * rate)));
      if(loss > 0){
        S.cash -= loss;
        toast((isWarActive() && S.city === "capital" ? "전시 혼란 속 도적에게 " : "도적에게 ") + fmt(loss) + " 털렸습니다. 큰 상단일수록 표적이 되기 쉽습니다.");
      }
    }
  }else{
    const warehouse = assignedMerc("warehouse");
    const warehouseChance = mercProtectionChance(warehouse,"warehouse");
    if(warehouse && Math.random() < warehouseChance){
      warehouse.xp += 1;
      if(warehouse.namedId) changeNamedMercBond(warehouse,1);
      changeMercFriendship(1);
      addMercLog(warehouse.name + " 창고 방어 성공 · 재고 피해 차단 · 경험 +1");
      toast(warehouse.name + "이 창고 습격을 막아 재고 피해를 막았습니다! (" + Math.round(warehouseChance*100) + "%)");
      return;
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
  changeFactionRep("merchant",1);
  toast("상인조합 주간 결산: 자산의 " + Math.round(rate * 1000) / 10 + "% · " + fmt(due) + " 납부.");
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
  if(!CITIES[dest]){ toast("이동할 도시 정보를 찾지 못했습니다."); return; }
  if(!S.travelOpen){ toast("이동 선택창을 다시 열어주세요."); return; }
  if(S.gameOver){ toast("파산한 상단은 이동할 수 없습니다."); return; }
  if(S.ending){ toast("엔딩 화면을 먼저 정리해주세요."); return; }

  // 구버전/중간 배포에서 travelOpen과 이전 결산창 상태가 동시에 저장된 경우
  // 이동 버튼이 아무 반응 없이 무시되던 상태를 자동 복구합니다.
  if(S.daySummary?.open){
    S.daySummary.open = false;
  }

  const blocked = travelBlockEvent(dest);
  if(blocked){
    toast(blocked.n + " 때문에 " + CITIES[dest].name + " 이동이 불가능합니다.");
    return;
  }
  const closingDay = S.day;
  const startCity = S.city;
  const moveCost = travelCostTo(dest);
  const upkeep = fee();
  const total = moveCost + upkeep;
  if(S.cash <= total){
    toast("이동/유지비 " + fmt(total) + "를 내면 파산합니다.");
    return;
  }
  if(failFinalTrial()){
    render();
    return;
  }

  const knownCosts = [];
  if(moveCost > 0) knownCosts.push({label:"이동비",amount:moveCost});
  const mercUpkeep = mercenaryUpkeep();
  const otherUpkeep = Math.max(0,upkeep - mercUpkeep);
  if(otherUpkeep > 0) knownCosts.push({label:"상단 운영비·보관비",amount:otherUpkeep});
  if(mercUpkeep > 0) knownCosts.push({label:"용병 급료·유지비",amount:mercUpkeep});

  S.cash -= total;
  S.day += 1;
  S.city = dest;
  S.active.forEach(e => e.remaining--);
  S.active = S.active.filter(e => e.remaining > 0);
  S.informant = false;
  S.craftUsed = {};
  for(const recipe of CRAFT_RECIPES) S.craftUsed[recipe.id] = 0;
  S.travelOpen = false;

  updateTradePressure();
  updateGlobalMarket();
  newIntel();
  seedWorld();
  S.rumor = marketRumor();
  processOrders();
  processMercenaryExpeditions();

  const troubleCashBefore = S.cash;
  const troubleInvBefore = Object.fromEntries(Object.keys(ITEMS).map(k => [k,S.inv[k] || 0]));
  trouble();
  const troubleCashLoss = Math.max(0,troubleCashBefore - S.cash);
  if(troubleCashLoss) knownCosts.push({label:"도적·사고 현금 손실",amount:troubleCashLoss});
  const inventoryLosses = Object.keys(ITEMS)
    .map(k => ({item:k,qty:Math.max(0,(troubleInvBefore[k] || 0) - (S.inv[k] || 0))}))
    .filter(x => x.qty > 0);

  const beforeDeadline = S.cash;
  if(checkContractDeadline() === false) return;
  const deadlineLoss = Math.max(0,beforeDeadline - S.cash);
  if(deadlineLoss) knownCosts.push({label:"의뢰 위약금",amount:deadlineLoss});

  const beforeSettlement = S.cash;
  if(!applyWeeklySettlement()) return;
  const settlementLoss = Math.max(0,beforeSettlement - S.cash);
  if(settlementLoss) knownCosts.push({label:"상인조합 주간 결산",amount:settlementLoss});

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

  S.daySummary = buildDaySummary(closingDay,startCity,S.city,knownCosts,inventoryLosses);
  S.dayStartCash = S.cash;
  S.dayIncomeLog = [];
  S.daySalesLog = [];
  render();
}

function useInformant(){
  if(checkBlocked()) return;
  if(S.informant){ toast("정보상은 오늘 이미 떠들었습니다."); return; }
  if(S.cash <= 35){ toast("정보료를 내면 파산합니다."); return; }
  S.cash -= 35;
  S.informant = true;

  if(S.plannedBlockade && S.plannedBlockade.day === S.day + 1){
    const event = EVENT_BY_ID[S.plannedBlockade.eventId];
    const cityNames = S.plannedBlockade.cities.map(c => CITIES[c]?.name || c).join(", ");
    const trapped = S.plannedBlockade.cities.includes(S.city);
    S.extra =
      "[확정 정보 · 내일] 왕실 내부문서 입수. " + cityNames +
      "에 「" + (event?.n || "출입통제") + "」가 발효될 예정입니다. 예상 통제기간 " +
      S.plannedBlockade.days + "일. " +
      (trapped
        ? "현재 그 지역에 있습니다. 오늘 떠나지 않으면 통제기간 동안 밖으로 나갈 수 없습니다."
        : "내일 이후에는 해당 지역으로 들어갈 수 없습니다.");
  }else if(Math.random() < .78){
    S.extra = "[확인된 정보] " + marketRumor(true);
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
  S.capacity += 10;
  toast("마차를 확장했습니다. 운송 한도 +10 · 현재 " + S.capacity + ".");
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
  recordDayIncome(reward,"길드 의뢰 보상");
  S.completedContracts += 1;
  changeFactionRep("merchant",3);
  addRoute("royal",.4);
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
function nextRouteStoryEvent(){
  const candidates = [];
  for(const route of Object.keys(ROUTE_STORIES)){
    const nextStage = (S.routeStory?.[route] || 0) + 1;
    const story = ROUTE_STORIES[route].find(x => x.stage === nextStage);
    if(!story) continue;
    const score = S.routeScores?.[route] || 0;
    if(score < story.minScore || S.day < story.minDay) continue;
    candidates.push({route,score,story});
  }
  if(!candidates.length) return null;
  candidates.sort((a,b) => b.score - a.score);
  const chosen = candidates[0];
  return Object.assign({},chosen.story,{
    id:"story_" + chosen.route + "_" + chosen.story.stage,
    storyRoute:chosen.route,
    storyStage:chosen.story.stage
  });
}
function maybeGenerateChoiceEvent(){
  if(S.gameOver || S.choiceEvent || S.choiceResolvedDay === S.day) return;
  const story = nextRouteStoryEvent();
  if(story){
    S.choiceEvent = story;
    return;
  }
  const mercEvent = mercenaryEventCandidate();
  if(mercEvent){
    S.choiceEvent = mercEvent;
    return;
  }
  if(Math.random() < .34) S.choiceEvent = Object.assign({},pick(CHOICE_EVENTS));
}
function resolveChoice(choice){
  if(!S.choiceEvent || S.gameOver) return;
  const option = typeof choice === "object" && choice ? choice : null;
  const effect = option ? option.effect : choice;
  const activeStoryRoute = S.choiceEvent.storyRoute || null;
  const activeStoryStage = S.choiceEvent.storyStage || 0;
  const choiceCashBefore = S.cash;
  const finish = (msg) => {
    if(activeStoryRoute && activeStoryStage){
      S.routeStory[activeStoryRoute] = Math.max(S.routeStory[activeStoryRoute] || 0,activeStoryStage);
    }
    const choiceDelta = S.cash - choiceCashBefore;
    if(choiceDelta > 0) recordDayIncome(choiceDelta,"돌발 이벤트");
    S.choiceResolvedDay = S.day;
    S.choiceEvent = null;
    toast(msg);
    if(S.cash <= 0){ bankrupt("돌발 사건 비용을 감당하지 못함"); return; }
    render();
  };

  if(effect === "route_story" && option){
    const cost = Math.max(0,Number(option.cost || 0));
    if(cost && S.cash <= cost){ toast(fmt(cost) + "가 필요합니다."); return; }
    if(cost) S.cash -= cost;
    if(option.reward) S.cash += Number(option.reward);
    if(option.route && option.amount) addRoute(option.route,Number(option.amount));
    if(option.bonusRoute && option.bonusAmount) addRoute(option.bonusRoute,Number(option.bonusAmount));
    if(option.pendingFollow) S.pendingFollow = option.pendingFollow;
    finish(option.message || "선택이 상단의 미래에 기록됐습니다.");
    return;
  }

  if(effect === "bribe"){
    if(S.cash <= 60){ toast("60G가 없습니다."); return; }
    S.cash -= 60; addRoute("underworld",.8); finish("세관원은 갑자기 서류가 완벽하다고 말했습니다."); return;
  }
  if(effect === "inspection"){
    if(Math.random() < .25){
      const fine = 80; S.cash -= fine; finish("세관원이 트집을 잡아 " + fmt(fine) + " 벌금을 매겼습니다.");
    }else { addRoute("royal",.5); finish("검사가 끝났습니다. 아무 일도 없었습니다. 괜히 긴장했습니다."); }
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
    addRoute("underworld",2);
    if(Math.random() < .65){ const pay=150; S.cash += pay; finish("밀수업자가 약속대로 " + fmt(pay) + "을 두고 사라졌습니다."); }
    else { const fine=130; S.cash -= fine; finish("경비대가 상자를 발견했습니다. 벌금 " + fmt(fine) + ". 상자 속 야옹이는 도망갔습니다."); }
    return;
  }
  if(effect === "report_smuggler"){ S.cash += 70; addRoute("royal",1.5); finish("경비대가 신고 포상금 70G를 줬습니다."); return; }
  if(effect === "support_antihero"){
    if(S.cash <= 50){ toast("50G가 없습니다."); return; }
    S.cash -= 50; addRoute("antihero",2); S.pendingFollow = {id:"antihero_rally",chance:.92}; finish("상인조합 피해대책위가 후원자를 '경제수호자'라고 부르기 시작했습니다."); return;
  }
  if(effect === "support_hero"){ addRoute("royal",.5); S.pendingFollow = {id:"hero_fan_counter",chance:.8}; finish("용사 팬클럽이 무료 배지를 줬습니다. 팔 수는 없습니다."); return; }
  if(effect === "buy_tip"){
    if(S.cash <= 30){ toast("30G가 없습니다."); return; }
    S.cash -= 30; S.rumor = "[취객 제보] " + marketRumor(); finish("대상인이 비밀이라며 주변 모두에게 같은 말을 했습니다."); return;
  }
  if(effect === "skip_tip"){ finish("대상인은 3분 뒤 탁자 밑에서 잠들었습니다."); return; }
  if(effect === "repair_wagon"){
    if(S.cash <= 80){ toast("80G가 없습니다."); return; }
    S.cash -= 80; S.cash += 150; addRoute("royal",.5); finish("길드가 수리비와 사례를 합쳐 150G를 지급했습니다."); return;
  }
  if(effect === "skip_wagon"){ finish("뒤에서 길드 직원이 이름을 적는 것 같았지만 신경 쓰지 않았습니다."); return; }
  if(effect === "buy_crate"){
    if(S.cash <= 75){ toast("75G가 없습니다."); return; }
    S.cash -= 75;
    const item = pick(tradableKeys()); const q = 1 + Math.floor(Math.random()*4);
    S.inv[item] += q; finish("상자 안에는 " + ITEMS[item].name + " " + q + "개가 들어 있었습니다."); return;
  }
  if(effect === "merc_feast_full"){
    if(S.cash <= 100){ toast("100G가 없습니다."); return; }
    S.cash -= 100; changeMercFriendship(7); addMercLog("합동 회식 후 우호도 상승");
    finish("술값은 비쌌지만 용병들이 이제 당신을 고용주보다 동료에 가깝게 부릅니다."); return;
  }
  if(effect === "merc_feast_half"){
    if(S.cash <= 50){ toast("50G가 없습니다."); return; }
    S.cash -= 50; changeMercFriendship(4); finish("적당히 계산하고 빠졌습니다. 용병들도 적당히 고마워합니다."); return;
  }
  if(effect === "merc_feast_skip"){ changeMercFriendship(-2); finish("용병들은 계산서를 보며 당신 이름을 한 번 더 확인했습니다."); return; }
  if(effect === "merc_heal_potion"){
    if(S.inv.potion < 1){ toast("회복 포션이 없습니다."); return; }
    S.inv.potion -= 1; changeMercFriendship(8); addMercLog("부상 용병에게 포션 지원");
    finish("치료받은 용병이 다음 원정은 무조건 당신 상단 일을 먼저 받겠다고 합니다."); return;
  }
  if(effect === "merc_heal_cash"){
    if(S.cash <= 90){ toast("90G가 없습니다."); return; }
    S.cash -= 90; changeMercFriendship(5); finish("치료비를 대신 냈습니다. 용병단 분위기가 눈에 띄게 좋아졌습니다."); return;
  }
  if(effect === "merc_heal_ignore"){ changeMercFriendship(-4); finish("계약상 틀린 말은 아니었지만 용병들은 꽤 오래 기억할 것 같습니다."); return; }
  if(effect === "merc_brawl_mediate"){
    if(S.cash <= 80){ toast("80G가 없습니다."); return; }
    S.cash -= 80; changeMercFriendship(5); finish("부서진 의자는 많았지만 싸움은 끝났습니다. 두 용병단 모두 당신 중재를 받아들였습니다."); return;
  }
  if(effect === "merc_brawl_guard"){ changeMercFriendship(-3); addRoute("royal",.5); finish("경비대가 난투를 정리했습니다. 왕실은 좋아했지만 용병들은 덜 좋아했습니다."); return; }
  if(effect === "merc_brawl_watch"){
    if(Math.random() < .5){ S.cash += 60; finish("누군가 즉석 내기판을 열었고 우연히 60G를 벌었습니다."); }
    else { changeMercFriendship(-2); finish("구경만 하다 술잔 하나가 마차 창문을 깼습니다."); }
    return;
  }
  if(effect === "merc_raise_pay"){
    if(S.cash<=120){ toast("120G가 없습니다."); return; }
    S.cash-=120; changeMercFriendship(6); addMercLog("급료 협상 타결 · 격려금 지급");
    finish("용병들이 장부에 도장을 찍고 분위기가 눈에 띄게 좋아졌습니다."); return;
  }
  if(effect === "merc_raise_promise"){
    changeMercFriendship(2);
    const candidates=(S.mercRoster||[]).filter(m=>!mercIsBusy(m));
    if(candidates.length) pick(candidates).xp+=2;
    finish("다음 성과를 조건으로 타협했습니다. 용병들이 훈련장으로 향합니다."); return;
  }
  if(effect === "merc_raise_refuse"){ changeMercFriendship(-5); finish("계약상 문제는 없지만 용병들 표정이 차가워졌습니다."); return; }
  if(effect === "merc_duel_sponsor"){
    if(S.cash<=70){ toast("70G가 없습니다."); return; }
    const candidates=(S.mercRoster||[]).filter(m=>!mercIsBusy(m));
    if(!candidates.length){ toast("대련에 내보낼 용병이 없습니다."); return; }
    S.cash-=70; const m=pick(candidates); m.xp+=4; changeMercFriendship(3); addMercLog(m.name+" 공개 대련 승리 · 경험 +4");
    finish(m.name+"이 공개 대련에서 이름을 알렸습니다."); return;
  }
  if(effect === "merc_duel_watch"){ finish("남의 용병끼리 싸우는 건 무료라 꽤 재미있었습니다."); return; }
  if(effect === "merc_loot_give"){ changeMercFriendship(5); finish("용병들이 전리품을 나눠 가지며 당신을 좋은 고용주라고 부릅니다."); return; }
  if(effect === "merc_loot_take"){ S.cash+=120; changeMercFriendship(-4); finish("전리품을 팔아 120G를 벌었지만 용병들은 오래 기억할 것 같습니다."); return; }
  if(effect === "merc_loot_split"){ S.cash+=60; changeMercFriendship(2); finish("절반은 팔고 절반은 용병들에게 넘겼습니다. 60G를 확보했습니다."); return; }
  if(effect === "merc_rescue_support"){
    if(S.cash<=60){ toast("60G가 없습니다."); return; }
    S.cash-=60; changeMercFriendship(5); changeFactionRep("merchant",1); changeFactionRep("church",1);
    finish("치료비까지 지원했다는 소문이 퍼져 상단 평판이 좋아졌습니다."); return;
  }
  if(effect === "merc_rescue_neutral"){ changeMercFriendship(1); finish("용병 개인의 선행으로 남겼습니다. 그래도 좋은 소문은 조금 퍼졌습니다."); return; }

  if(effect === "merc_bandit_free"){
    S.banditSuppressionUntil = S.day + 10; changeMercFriendship(3); addMercLog("도적단 본거지 소탕 · 10일간 도적 위험 억제");
    finish("용병단이 보수도 받지 않고 도적소굴을 정리했습니다. 쌓아온 우호도가 처음으로 돈보다 강해졌습니다."); return;
  }
  if(effect === "merc_bandit_bonus"){
    if(S.cash <= 150){ toast("150G가 없습니다."); return; }
    S.cash -= 150; S.banditSuppressionUntil = S.day + 18; changeMercFriendship(6); addMercLog("도적단 대규모 소탕 · 18일간 도적 위험 억제");
    finish("용병단이 주변 도적 조직까지 연달아 쓸어버렸습니다. 한동안 이 지역 상인들은 밤에도 길을 다닐 수 있습니다."); return;
  }
  if(effect === "merc_bandit_decline"){ changeMercFriendship(-2); finish("용병단은 아쉬워했지만 계약 밖의 일이라며 물러났습니다."); return; }

  if(effect === "route_royal_meeting"){ addRoute("royal",2); finish("왕실은 당신을 '협조적인 상인' 명단에 올렸습니다."); return; }
  if(effect === "route_antihero_meeting"){ addRoute("antihero",2); S.pendingFollow={id:"antihero_rally",chance:.9}; finish("회의장 밖 상인들이 당신의 성명서에 박수를 보냈습니다."); return; }
  if(effect === "route_artisan_meeting"){ addRoute("artisan",2); finish("장인조합이 당신에게 공방상단 명예패를 건넸습니다."); return; }
  if(effect === "route_underworld_auction"){
    if(S.cash <= 90){ toast("90G가 없습니다."); return; }
    S.cash -= 90; addRoute("underworld",2.2); const item=pick(tradableKeys()); S.inv[item]+=1;
    finish("지하 경매에서 " + ITEMS[item].name + " 1개를 챙겼습니다. 출처는 기록하지 않았습니다."); return;
  }
  if(effect === "route_royal_report"){ addRoute("royal",1.8); S.cash += 40; finish("경비대가 경매장을 덮쳤고 신고 포상금 40G를 받았습니다."); return; }
  if(effect === "route_neutral_ignore"){ finish("검은 봉투는 재가 됐습니다. 아무 편에도 서지 않았습니다."); return; }
  if(effect === "route_artisan_invest"){
    if(S.cash <= 100){ toast("100G가 없습니다."); return; }
    S.cash -= 100; addRoute("artisan",2.3); finish("장인조합이 당신을 '공방을 살린 상인'으로 기억합니다."); return;
  }
  if(effect === "route_underworld_factory"){ addRoute("underworld",1.8); S.cash += 70; finish("폐업 재고가 뒷골목 유통망으로 흘러가며 사례금 70G를 받았습니다."); return; }
  if(effect === "route_royal_subsidy"){ addRoute("royal",1.4); finish("왕실 보조금이 승인됐고 길드가 당신의 이름을 추천서에 적었습니다."); return; }
  if(effect === "route_antihero_block"){ addRoute("antihero",2.2); S.pendingFollow={id:"antihero_rally",chance:.95}; finish("용사의 시세 발언은 취소됐고 상인조합 피해대책위가 당신을 전면에 세웠습니다."); return; }
  if(effect === "route_royal_order"){ addRoute("royal",1.7); finish("큰 충돌 없이 행사가 끝났고 왕실 경비대장이 당신에게 감사를 표했습니다."); return; }
  if(effect === "route_artisan_merch"){ addRoute("artisan",1.5); S.cash += 100; finish("용사 얼굴이 찍힌 조악한 굿즈가 이상하게 잘 팔려 100G를 벌었습니다."); return; }
  if(effect === "route_underworld_ledger"){ addRoute("underworld",2.4); S.cash += 80; finish("밀수조직은 장부를 되찾고 80G와 함께 '빚 하나'를 남겼습니다."); return; }
  if(effect === "route_royal_ledger"){ addRoute("royal",2); S.cash += 60; finish("왕실 수사관이 장부를 압수하고 포상금 60G를 지급했습니다."); return; }
  if(effect === "route_antihero_ledger"){ addRoute("antihero",2.1); S.pendingFollow={id:"antihero_lawsuit",chance:.9}; finish("장부 내용이 공개되자 상인조합 피해대책위가 대규모 폭로전을 시작했습니다."); return; }

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

  const usedToday = S.craftUsed?.[r.id] || 0;
  const craftLimit = craftLimitForRecipe();
  const feeNow = recipeFee(r);
  const left = Math.max(0,craftLimit - usedToday);
  const inputMax = Object.entries(r.inputs).reduce((m,[k,n]) => Math.min(m,Math.floor(S.inv[k]/n)),Infinity);
  const cashMax = feeNow > 0 ? Math.floor((S.cash - 1)/feeNow) : 999;
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
  S.cash -= feeNow*qty;
  S.craftUsed[r.id] = (S.craftUsed[r.id] || 0) + qty;
  addRoute("artisan",r.stage === 2 ? 1 : .2);

  const made = Object.entries(r.output).map(([k,n]) => ITEMS[k].name + " " + (n*qty) + "개").join(", ");
  toast(r.shop + " 제작 완료: " + made + " · 공임 " + fmt(feeNow*qty));
  render();
}
function renderCrafting(){
  const box = $("#craftBox");
  const badge = $("#craftUsesBadge");
  badge.textContent = "품목별 하루 최대 " + craftLimitForRecipe() + "회" + (artisanFeeDiscount() ? " · 장인 공임 -" + Math.round(artisanFeeDiscount()*100) + "%" : "");

  const recipes = CRAFT_RECIPES.filter(r => r.city === S.city);
  if(!recipes.length){
    box.innerHTML = '<div class="craft-empty"><b>' + CITIES[S.city].name + '에는 이용 가능한 생산 공방이 없습니다.</b><p>풍요 평원·철산 카르둠·아르카나·성도 루미에르에서 각각 다른 제작을 할 수 있습니다.</p></div>';
    return;
  }

  box.innerHTML = '<div class="craft-grid">' + recipes.map(r => {
    const usedToday = S.craftUsed?.[r.id] || 0;
    const craftLimit = craftLimitForRecipe();
    const feeNow = recipeFee(r);
    const left = Math.max(0,craftLimit - usedToday);
    const inputText = Object.entries(r.inputs).map(([k,n]) => ITEMS[k].name + " " + n + "개").join(" + ");
    const outputText = Object.entries(r.output).map(([k,n]) => ITEMS[k].name + " " + n + "개").join(" + ");
    const materialMarket = Object.entries(r.inputs).reduce((a,[k,n]) => a + S.prices[k]*n,0);
    const outputMarket = Object.entries(r.output).reduce((a,[k,n]) => a + S.prices[k]*n,0);
    const canMaterial = Object.entries(r.inputs).every(([k,n]) => S.inv[k] >= n);
    const can = left > 0 && canMaterial && S.cash > feeNow;
    return '<article class="craft-card">' +
      '<div class="craft-titleline"><span class="craft-shop">' + r.shop + '</span><span class="craft-stage">' + r.stage + '단계 · ' + usedToday + ' / ' + craftLimit + '회</span></div>' +
      '<h3>' + r.name + '</h3>' +
      '<p><b>' + inputText + '</b> → <b>' + outputText + '</b></p>' +
      '<div class="craft-meta"><span>공임 ' + fmt(feeNow) + (feeNow < r.fee ? ' <s>' + fmt(r.fee) + '</s>' : '') + '</span><span>재료 시세 ' + fmt(materialMarket) + '</span><span>완제품 시세 ' + fmt(outputMarket) + '</span><span>오늘 남은 제작 ' + left + '회</span></div>' +
      '<div class="craft-actions"><button data-craft="' + r.id + '" data-q="1"' + (can ? "" : " disabled") + '>1회 제작</button>' +
      '<button data-craft="' + r.id + '" data-q="999"' + (can ? "" : " disabled") + '>이 품목 가능한 만큼</button></div>' +
      '</article>';
  }).join("") + '</div>';
}

function blackMarketForbidden(city=S.city){
  return city === "capital" || city === "holycity";
}
function blackMarketForbiddenText(city=S.city){
  return city === "holycity"
    ? "성도 루미에르에는 암시장이 없습니다. 교단 감찰관이 장터와 골목을 함께 순찰합니다."
    : "왕도에는 암시장이 없습니다.";
}
function sellBlackMarket(item,qty){
  if(checkBlocked()) return;
  if(blackMarketForbidden()){
    toast(blackMarketForbiddenText());
    return;
  }
  if(qty === 999) qty = S.inv[item];
  qty = Math.max(0,Math.min(qty,S.inv[item]));
  if(qty < 1){
    toast("암시장에 넘길 재고가 없습니다.");
    return;
  }

  const ban = saleBanEvent(item,S.city);
  const each = Math.max(1,Math.round(S.prices[item] * underworldPayoutRate(!!ban)));
  const gross = each * qty;
  S.inv[item] -= qty;
  S.cash += gross;
  recordDaySale(item,qty,gross,ban ? "금지품 암시장" : "암시장");
  addRoute("underworld",.6);

  const catchChance = underworldCatchChance(!!ban);
  if(Math.random() < catchChance){
    const fine = Math.max(ban ? 150 : 60,Math.round(gross * (ban ? .65 : .35)));
    S.cash -= fine;
    toast((ban ? "금지품 밀매 적발! " : "암시장 단속! ") + ITEMS[item].name + " " + qty + "개를 " + fmt(gross) + "에 넘겼지만 벌금 " + fmt(fine) + "을 냈습니다.");
    if(S.cash <= 0){
      bankrupt("암시장 단속 벌금을 감당하지 못함");
      return;
    }
  }else{
    toast((ban ? "금지품 밀매 성공: " : "암시장 즉시 매각: ") + ITEMS[item].name + " " + qty + "개 · " + fmt(gross) + " 입금.");
  }
  render();
}
function renderBlackMarket(){
  const panel = $("#blackMarketPanel");
  const box = $("#blackMarketBox");

  if(blackMarketForbidden()){
    panel.classList.add("black-market-capital");
    box.innerHTML = S.city === "holycity"
      ? '<div class="black-market-locked"><b>성도 루미에르에는 암시장이 없습니다.</b><p>교단 감찰관과 성기사단이 장터를 순찰합니다. 전쟁 중이어도 지하 거래는 열리지 않습니다.</p></div>'
      : '<div class="black-market-locked"><b>왕도에는 암시장이 없습니다.</b><p>경비대가 골목까지 너무 열심히 순찰합니다. 전쟁 중이어도 암시장 거래는 불가능합니다.</p></div>';
    return;
  }

  panel.classList.remove("black-market-capital");
  const held = tradableKeys().filter(k => S.inv[k] > 0);
  if(!held.length){
    box.innerHTML = '<div class="black-market-locked"><b>팔 물건이 없습니다.</b><p>현재 지하 유통망 우호도로 정상 시세의 ' + Math.round(underworldPayoutRate(false)*100) + '%에 즉시 현금화할 수 있습니다.</p></div>';
    return;
  }

  box.innerHTML = '<div class="black-market-risk">⚠ 일반 거래 단속 ' + Math.round(underworldCatchChance(false)*100) + '% · 금지품 단속 ' + Math.round(underworldCatchChance(true)*100) + '% · 일반 매입률 ' + Math.round(underworldPayoutRate(false)*100) + '%</div><div class="black-market-list"></div>';
  const list = box.querySelector(".black-market-list");

  for(const k of held){
    const banned = !!saleBanEvent(k,S.city);
    const each = Math.max(1,Math.round(S.prices[k] * underworldPayoutRate(banned)));
    const row = document.createElement("article");
    row.className = "black-market-item";
    row.innerHTML =
      '<div class="bm-head"><div><h3>' + ITEMS[k].name + '</h3><div class="black-market-meta">보유 ' + S.inv[k] + '개 · 정상 시세 ' + fmt(S.prices[k]) + '</div></div><div class="black-market-price">' + fmt(each) + '/개</div></div>' +
      (banned ? '<div class="black-ban-warning">⛔ 금지품 밀매 · 매입률 ' + Math.round(underworldPayoutRate(true)*100) + '% / 적발 ' + Math.round(underworldCatchChance(true)*100) + '%</div>' : '') +
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
    const ban = saleBanEvent(d.item,S.city);
    if(ban){ toast("판매금지령 때문에 이 거래를 할 수 없습니다: " + ITEMS[d.item].name); return; }
    if(S.inv[d.item] < d.qty){ toast(ITEMS[d.item].name + " " + d.qty + "개가 필요합니다."); return; }
    const total = d.each * d.qty;
    S.inv[d.item] -= d.qty;
    S.cash += total;
    recordDaySale(d.item,d.qty,total,"특수 구매자");
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
        '<button id="specialDealBtn"' + (S.inv[d.item] >= d.qty && !saleBanEvent(d.item,S.city) ? "" : " disabled") + '>' +
        (saleBanEvent(d.item,S.city) ? "판매금지 적용 중" : "즉시 판매") + '</button>';
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
  if($("#tabBarNet")) $("#tabBarNet").textContent = fmt(net());
  if($("#tabEndDayBtn")){
    $("#tabEndDayBtn").textContent = S.travelOpen ? "이동지 선택 중" : "하루 넘기기";
    $("#tabEndDayBtn").disabled = S.gameOver || S.travelOpen;
  }
  $("#feeStat").textContent = fmt(fee());
  $("#capStat").textContent = used() + " / " + S.capacity;
  $("#marketTitle").textContent = CITIES[S.city].name + " 시장";
  $("#feeBadge").textContent = "판매 수수료 " + Math.round(effectiveCityFee(S.city) * 100) + "%" +
    (kingdomCommissionDiscount() ? " · 왕국 우호도 -" + Math.round(kingdomCommissionDiscount()*100) + "%p" : "");
  const worldPhase = currentWorldPhase();
  $("#worldPhaseBadge").textContent = worldPhase.name;
  $("#worldPhaseBox").innerHTML =
    '<div><b>' + worldPhase.name + '</b><span>' + worldPhase.start + (worldPhase.end >= 99999 ? '일차 이후' : ' ~ ' + worldPhase.end + '일차') + '</span></div>' +
    '<p>' + worldPhase.desc + '</p>' +
    '<div class="phase-effects"><span>이동 추가비 ' + fmt(worldPhase.travel) + '</span><span>위험도 ' + (worldPhase.risk ? '+' + Math.round(worldPhase.risk*100) + '%' : '기본') + '</span><span>시장 변동성 ×' + worldPhase.volatility.toFixed(2) + '</span>' +
      (S.active.some(e => e.princess) ? '<span class="princess-alert">👑 공주 발언 충격 진행 중</span>' : '') +
      (S.active.some(e => e.saint) ? '<span class="saint-alert">⛪ 성녀 선언 영향 진행 중</span>' : '') +
      (S.princessStatements ? '<span>공주 발언 누적 ' + S.princessStatements + '회</span>' : '') +
      (S.saintDeclarations ? '<span>성녀 선언 누적 ' + S.saintDeclarations + '회</span>' : '') +
      (S.active.some(e => e.bannedItems) ? '<span class="regulation-alert">⛔ 판매금지령 발효 중</span>' : '') +
      (S.active.some(e => e.blockedCities) ? '<span class="regulation-alert">🚧 지역 출입통제 중</span>' : '') +
    '</div>';
  $("#capBar").style.width = Math.min(100,used()/S.capacity*100) + "%";

  const inv = Object.keys(ITEMS).filter(k => S.inv[k] > 0).map(k => ITEMS[k].name + " " + S.inv[k] + "개");
  $("#inventoryText").textContent = inv.length ? inv.join(" · ") : "재고 없음";

  $("#upgradeBtn").textContent = "운송 한도 +10 · " + fmt(upgradeCost());
  const old = S.capacity;
  S.capacity += 10;
  $("#upgradeHint").textContent = "확장 후 유지비 " + fmt(fee()) + "/일";
  S.capacity = old;
  const tier = merchantTier();
  $("#lateGameText").textContent =
    "상단 규모: " + tier.name +
    (tier.overhead ? " · 추가 운영비 " + fmt(tier.overhead) + "/일" : "") +
    " · 재고 보관비 " + fmt(holdingCost()) + "/일" +
    (mercenaryUpkeep() ? " · 용병 유지비 " + fmt(mercenaryUpkeep()) + "/일" : "") +
    " · 다음 길드 결산 " + nextSettlementDay() + "일차 (현재 예상 " + fmt(projectedSettlement()) + ")";

  const warehouseGuard = assignedMerc("warehouse");
  const escortGuard = assignedMerc("escort");
  const promotionMerc = assignedMerc("promotion");
  $("#warehouseGuardStatus").innerHTML = warehouseGuard
    ? '<b>창고 경비</b><span>' + warehouseGuard.name + ' · ' + mercGrade(warehouseGuard).name + ' · 방어 ' + Math.round(mercProtectionChance(warehouseGuard,"warehouse")*100) + '%</span>'
    : '<b>창고 경비</b><span>미배치</span>';
  $("#escortGuardStatus").innerHTML = escortGuard
    ? '<b>상단 호위</b><span>' + escortGuard.name + ' · ' + mercGrade(escortGuard).name + ' · 방어 ' + Math.round(mercProtectionChance(escortGuard,"escort")*100) + '%</span>'
    : '<b>상단 호위</b><span>미배치</span>';
  $("#promotionMercStatus").innerHTML = promotionMerc
    ? '<b>홍보 활동</b><span>' + promotionMerc.name + ' · ' + mercGrade(promotionMerc).name + ' · 판매확률 ×' + mercPromotionEffect(promotionMerc).chance.toFixed(2) + '</span>'
    : '<b>홍보 활동</b><span>미배치</span>';
  $("#serviceText").textContent =
    "용병 유지비 " + fmt(mercenaryUpkeep()) + "/일 · 배치 임무 자체에는 추가 비용이 없습니다. 원정·훈련·승급 전에는 배치를 해제해야 합니다.";

  const newsList = (Array.isArray(S.todayNews) && S.todayNews.length)
    ? S.todayNews
    : [S.today || {tag:"시대",n:worldPhase.news,txt:worldPhase.newsText}];
  $("#newsBox").innerHTML =
    '<div class="news-count">' + newsList.length + '건의 왕국 뉴스</div>' +
    '<div class="news-stack">' +
      newsList.map((today,i) => {
        const eventArea = today.cities ? " · " + today.cities.map(c => CITIES[c].name).join(", ") : "";
        return '<article class="news-item' + (today.princess ? ' princess-news' : '') + '">' +
          '<span class="news-index">NEWS ' + (i+1) + '</span>' +
          '<b>[' + today.tag + eventArea + '] ' + today.n + '</b>' +
          '<p>' + today.txt + '</p>' +
        '</article>';
      }).join("") +
    '</div>';
  $("#rumorBox").innerHTML = '<div class="rumor-trust">상인조합 정보 신뢰도 <b>' + Math.round(merchantRumorAccuracy()*100) + '%</b></div><p>' + S.rumor + '</p>';
  $("#extraBox").textContent = S.extra || "아직 돈을 주지 않았습니다.";
  $("#informantBtn").disabled = S.informant || S.gameOver || S.travelOpen;
  $("#endDayBtn").disabled = S.gameOver || S.travelOpen;

  renderEndingGoal();
  renderRoutes();
  renderCityNpc();
  renderExtras();
  renderMarket();
  renderCrafting();
  renderMercenaries();
  renderBlackMarket();
  renderOrders();
  renderTravel();
  renderChoiceEvent();
  renderDaySummary();

  if(S.gameOver || S.ending){
    document.querySelectorAll("button").forEach(b => {
      if(!["restart","endingRestart","endingContinue","saveSharedRank","rankRefresh","newGameBtn","daySummaryClose"].includes(b.id)) b.disabled = true;
    });
    if(S.ending){
      $("#saveSharedRank").disabled = !!S.rankSaved;
      $("#rankRefresh").disabled = false;
      $("#endingRestart").disabled = false;
      $("#endingContinue").disabled = false;
    }
  }else{
    $("#upgradeBtn").disabled = S.travelOpen;

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
    const ban = saleBanEvent(k,S.city);
    const trendClass = globalDelta > 2 ? "price-up" : globalDelta < -2 ? "price-down" : "";
    const trendText = Math.abs(globalDelta) < 1
      ? "왕국 추세 → 보합"
      : "왕국 추세 " + (globalDelta > 0 ? "▲ +" : "▼ ") + globalDelta.toFixed(1) + "%";

    card.innerHTML =
      '<div class="title-row"><div><h3>' + it.name + '</h3><span class="' + priceClass + '">' +
      fmt(p) + ' ' + (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta).toFixed(0) +
      '%</span></div><b class="' + demandClass + '">' + demandText + '</b></div>' +
      '<div class="market-meta"><span>재고 ' + S.inv[k] + '</span><span>판매중 ' + listed + '</span><span>무게 ' + it.w + '</span><span class="' + trendClass + '">' + trendText + '</span>' +
        (ban ? '<span class="sale-ban-badge">⛔ 판매금지 · ' + ban.remaining + '일</span>' : '') +
      '</div>' +
      '<div class="market-actions"><div class="qty">' +
      '<button data-buy="' + k + '" data-q="1">1개 매입</button>' +
      '<button data-buy="' + k + '" data-q="5">5개</button>' +
      '<button data-buy="' + k + '" data-q="999">최대</button></div>' +
      '<button data-sell="' + k + '" data-q="1"' + (ban ? ' disabled' : '') + '>' + (ban ? '판매금지' : '1개 판매등록') + '</button>' +
      '<button data-sell="' + k + '" data-q="999"' + (ban ? ' disabled' : '') + '>' + (ban ? '거래 중지' : '전부 등록') + '</button></div>';

    box.appendChild(card);
  }

  const marketAvg = avgGlobal / Math.max(1,keys.length);
  $("#marketMood").textContent = S.active.some(e => e.princess)
    ? "👑 공주 발언으로 시장 패닉"
    : marketAvg > 2.5 ? "왕국 전체 강세"
    : marketAvg < -2.5 ? "왕국 전체 약세"
    : avgDemand / Math.max(1,keys.length) > 1.15 ? "수요 과열" : "왕국 시장 혼조";
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
    const ban = saleBanEvent(o.item,o.city);
    row.innerHTML =
      "<div><b>" + ITEMS[o.item].name + " " + o.qty + "개</b><p>" +
      CITIES[o.city].name + " · 희망가 " + fmt(o.ask) + " · 수수료 " + Math.round(effectiveCityFee(o.city) * 100) + "% · " + (S.day-o.listed) +
      '일째' + (ban ? ' · <span class="sale-ban-inline">⛔ 판매금지로 체결 중지</span>' : '') +
      '</p></div><button data-cancel="' + i + '">회수</button>';
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
      : '<span class="mini muted">' + (stay ? "이동비 없음" : "이동비 " + fmt(travelCostTo(id))) + " + 유지비 " + fmt(fee()) + '</span>';
    card.innerHTML =
      "<b>" + (stay ? "여기서 하루 더 · " : "") + c.name + "</b><p>" + c.desc + "</p>" +
      status + '<button type="button" data-travel="' + id + '"' + (blocked ? " disabled" : "") + ">" +
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
  if(!S.ending || S.rankSaved || S.endingRoute === "bad_merchant") return;
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
        contracts:S.completedContracts,
        ending:S.endingRoute === "normal" ? "전설의 대상인" : ROUTES[S.endingRoute]?.ending || "전설의 대상인"
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
      fmt(x.wealth) + ' <span class="muted">' + x.day + "일 · 의뢰 " + x.contracts + "회" + (x.ending ? " · " + escapeHtml(x.ending) : "") + "</span></li>"
    ).join("")
    : '<li class="muted">아직 등록된 클리어 기록이 없습니다.</li>';
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

const APP_TABS = ["market","info","craft","merc","caravan"];
function setAppTab(tab,{scroll=true}={}){
  if(!APP_TABS.includes(tab)) tab="market";
  document.body.dataset.appTab=tab;
  document.querySelectorAll("[data-app-tab]").forEach(btn=>{
    const active=btn.dataset.appTab===tab;
    btn.classList.toggle("active",active);
    btn.setAttribute("aria-selected",active?"true":"false");
    btn.setAttribute("tabindex",active?"0":"-1");
  });
  try{ localStorage.setItem("fantasyMerchantAppTab",tab); }catch{}
  if(scroll){
    const bar=$("#appTabBar");
    const y=Math.max(0,(bar?.getBoundingClientRect().top||0)+window.scrollY-4);
    if(window.scrollY>y+120 || window.scrollY<y-120) window.scrollTo({top:y,behavior:"smooth"});
  }
}
function initAppTabs(){
  let saved="market";
  try{
    saved=localStorage.getItem("fantasyMerchantAppTab") ||
      localStorage.getItem("fantasyMerchantMobileTab") || "market";
  }catch{}
  if(!APP_TABS.includes(saved)) saved="market";

  // Progressive enhancement: only after JS is alive do we hide inactive panels.
  setAppTab(saved,{scroll:false});
  document.body.classList.add("app-tabs-ready");

  $("#appTabBar")?.addEventListener("click",e=>{
    const end=e.target.closest("#tabEndDayBtn");
    if(end){ openTravel(); return; }
    const btn=e.target.closest("[data-app-tab]");
    if(btn) setAppTab(btn.dataset.appTab,{scroll:true});
  });

  $("#appTabBar")?.addEventListener("keydown",e=>{
    const btn=e.target.closest("[data-app-tab]");
    if(!btn || !["ArrowLeft","ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const i=APP_TABS.indexOf(btn.dataset.appTab);
    const next=e.key==="ArrowRight"
      ? APP_TABS[(i+1)%APP_TABS.length]
      : APP_TABS[(i-1+APP_TABS.length)%APP_TABS.length];
    setAppTab(next,{scroll:false});
    document.querySelector('[data-app-tab="'+next+'"]')?.focus();
  });
}

function mobileSectionTitle(panel){
  return panel.querySelector("h2,h3")?.textContent?.trim() || "섹션";
}
function setupSafeMobileSections(){
  if(!isMobileLayout()) return;

  document.body.classList.add("mobile-enhanced");

  const panels=[...document.querySelectorAll("[data-mobile-tab]")];
  for(const panel of panels){
    if(panel.dataset.mobileAccordionReady) continue;
    panel.dataset.mobileAccordionReady="1";

    const title=mobileSectionTitle(panel);
    const key=(panel.dataset.mobileTab||"section")+"-"+title;
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="mobile-section-toggle";
    btn.innerHTML='<span>'+title+'</span><b>접기</b>';
    panel.insertBefore(btn,panel.firstChild);

    let collapsed=false;
    try{
      collapsed=localStorage.getItem("fm-collapse:"+key)==="1";
    }catch{}

    // 핵심 섹션은 처음엔 펼쳐 둡니다.
    if(["왕도 시장","시장","오늘의 정보"].some(x=>title.includes(x))) collapsed=false;

    panel.classList.toggle("mobile-collapsed",collapsed);
    btn.querySelector("b").textContent=collapsed?"펼치기":"접기";

    btn.addEventListener("click",()=>{
      const next=!panel.classList.contains("mobile-collapsed");
      panel.classList.toggle("mobile-collapsed",next);
      btn.querySelector("b").textContent=next?"펼치기":"접기";
      try{ localStorage.setItem("fm-collapse:"+key,next?"1":"0"); }catch{}
    });
  }

  const jumpMap={
    market:'[data-mobile-tab="market"]',
    info:'[data-mobile-tab="info"]',
    craft:'[data-mobile-tab="craft"]',
    merc:'[data-mobile-tab="merc"]',
    caravan:'[data-mobile-tab="caravan"]'
  };
  $("#mobileQuickNav")?.addEventListener("click",e=>{
    const endDay=e.target.closest("#mobileEndDayBtn");
    if(endDay){
      openTravel();
      return;
    }

    const b=e.target.closest("[data-jump-target]");
    if(!b) return;
    const panel=document.querySelector(jumpMap[b.dataset.jumpTarget]||"");
    if(!panel) return;
    panel.classList.remove("mobile-collapsed");
    panel.querySelector(".mobile-section-toggle b")?.replaceChildren("접기");
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  });
}
function isMobileLayout(){
  return window.matchMedia("(max-width: 680px)").matches;
}
function setMobileTab(tab,scroll=true){
  const allowed = ["market","info","craft","merc","caravan"];
  if(!allowed.includes(tab)) tab = "market";
  document.body.dataset.mobileTab = tab;
  document.querySelectorAll("[data-mobile-nav]").forEach(btn => {
    btn.classList.toggle("active",btn.dataset.mobileNav === tab);
    btn.setAttribute("aria-current",btn.dataset.mobileNav === tab ? "page" : "false");
  });
  try{ localStorage.setItem("fantasyMerchantMobileTab",tab); }catch{}
  if(scroll && isMobileLayout()){
    const y = Math.max(0,document.querySelector(".stats")?.getBoundingClientRect().bottom + window.scrollY - 6 || 0);
    window.scrollTo({top:y,behavior:"smooth"});
  }
}
function initMobileTabs(){
  let saved = "market";
  try{ saved = localStorage.getItem("fantasyMerchantMobileTab") || "market"; }catch{}
  const allowed = ["market","info","craft","merc","caravan"];
  if(!allowed.includes(saved)) saved = "market";
  setMobileTab(saved,false);

  $("#mobileNav")?.addEventListener("click",e => {
    const btn = e.target.closest("[data-mobile-nav]");
    if(btn) setMobileTab(btn.dataset.mobileNav,true);
  });

  if(isMobileLayout()){
    requestAnimationFrame(() => {
      const maxY = Math.max(0,document.documentElement.scrollHeight - window.innerHeight);
      if(window.scrollY > maxY - 4 || window.scrollY > 900){
        window.scrollTo(0,0);
      }
    });
  }
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
$("#mercenaryBox").addEventListener("click",(e) => {
  if(e.target.closest("[data-merc-recruit]")){ recruitMercenary(); return; }
  const named=e.target.closest("[data-named-merc]");
  if(named){ hireNamedMercenary(named.dataset.namedMerc); return; }

  const namedTalk=e.target.closest("[data-named-talk]");
  if(namedTalk){ talkNamedMercenary(namedTalk.dataset.namedTalk); return; }

  const namedStory=e.target.closest("[data-named-story]");
  if(namedStory){ resolveNamedMercStory(namedStory.dataset.namedStory,Number(namedStory.dataset.option)); return; }

  const invest = e.target.closest("[data-merc-invest]");
  if(invest){ investMercenary(invest.dataset.mercInvest); return; }

  const promote = e.target.closest("[data-merc-promote]");
  if(promote){ promoteMercenary(promote.dataset.mercPromote); return; }

  const assign = e.target.closest("[data-merc-assign]");
  if(assign){ assignMercenary(assign.dataset.mercAssign,assign.dataset.role); return; }

  const unassign = e.target.closest("[data-merc-unassign]");
  if(unassign){ unassignMercenary(unassign.dataset.mercUnassign); return; }

  const dispatch = e.target.closest("[data-merc-dispatch]");
  if(dispatch){
    const expeditionId = dispatch.dataset.mercDispatch;
    const select = $("#mercenaryBox").querySelector('[data-exp-select="' + expeditionId + '"]');
    if(!select?.value){ toast("파견할 용병을 선택해주세요."); return; }
    dispatchMercenary(select.value,expeditionId);
  }
});
$("#mercGearBox").addEventListener("click",(e) => {
  const craft = e.target.closest("[data-merc-gear]");
  if(craft) craftMercGear(craft.dataset.mercGear);
  const sell = e.target.closest("[data-merc-sell]");
  if(sell) sellMercGear(sell.dataset.mercSell,Number(sell.dataset.q));
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
  if(option) resolveChoice(option);
});
$("#specialDealBox").addEventListener("click",(e) => {
  if(e.target.closest("#specialDealBtn")) useSpecialDeal();
});
$("#daySummaryClose").addEventListener("click",closeDaySummary);
$("#endingGoalBox").addEventListener("click",(e) => {
  if(e.target.closest("#trialDeliveryBtn")) deliverFinalTrialGoods();
});
$("#endDayBtn").addEventListener("click",openTravel);
$("#travelCancel").addEventListener("click",() => {
  if(!S.gameOver){
    S.travelOpen = false;
    render();
  }
});
$("#cityNpcBox")?.addEventListener("click",(e)=>{
  if(e.target.closest("#npcTalkBtn")){ talkCityNpc(); return; }
  if(e.target.closest("#npcFavorBtn")){ helpCityNpc(); return; }
  const q=e.target.closest("[data-npc-quest]");
  if(q) resolveNpcQuest(q.dataset.npcQuest,Number(q.dataset.option));
});
$("#informantBtn").addEventListener("click",useInformant);
$("#upgradeBtn").addEventListener("click",upgrade);
$("#restart").addEventListener("click",() => startNewGame(false));
$("#endingContinue").addEventListener("click",continueEndlessMode);
$("#endingRestart").addEventListener("click",() => startNewGame(false));
$("#newGameBtn").addEventListener("click",() => startNewGame(true));
$("#saveSharedRank").addEventListener("click",saveSharedRank);
$("#rankRefresh").addEventListener("click",loadSharedRanks);

window.addEventListener("beforeunload",saveGame);
document.addEventListener("visibilitychange",() => {
  if(document.visibilityState === "hidden") saveGame();
});

if(!restoreSavedGame()) init();
initAppTabs();
