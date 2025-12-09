import { Suit, TileData, Language } from './types';

export const TILES_DEF: Omit<TileData, 'id'>[] = [
  // Man (Characters)
  { suit: Suit.Man, value: 1, symbol: '🀇' },
  { suit: Suit.Man, value: 2, symbol: '🀈' },
  { suit: Suit.Man, value: 3, symbol: '🀉' },
  { suit: Suit.Man, value: 4, symbol: '🀊' },
  { suit: Suit.Man, value: 5, symbol: '🀋' },
  { suit: Suit.Man, value: 6, symbol: '🀌' },
  { suit: Suit.Man, value: 7, symbol: '🀍' },
  { suit: Suit.Man, value: 8, symbol: '🀎' },
  { suit: Suit.Man, value: 9, symbol: '🀏' },
  // Pin (Dots)
  { suit: Suit.Pin, value: 1, symbol: '🀙' },
  { suit: Suit.Pin, value: 2, symbol: '🀚' },
  { suit: Suit.Pin, value: 3, symbol: '🀛' },
  { suit: Suit.Pin, value: 4, symbol: '🀜' },
  { suit: Suit.Pin, value: 5, symbol: '🀝' },
  { suit: Suit.Pin, value: 6, symbol: '🀞' },
  { suit: Suit.Pin, value: 7, symbol: '🀟' },
  { suit: Suit.Pin, value: 8, symbol: '🀠' },
  { suit: Suit.Pin, value: 9, symbol: '🀡' },
  // Sou (Bamboo)
  { suit: Suit.Sou, value: 1, symbol: '🀐' },
  { suit: Suit.Sou, value: 2, symbol: '🀑' },
  { suit: Suit.Sou, value: 3, symbol: '🀒' },
  { suit: Suit.Sou, value: 4, symbol: '🀓' },
  { suit: Suit.Sou, value: 5, symbol: '🀔' },
  { suit: Suit.Sou, value: 6, symbol: '🀕' },
  { suit: Suit.Sou, value: 7, symbol: '🀖' },
  { suit: Suit.Sou, value: 8, symbol: '🀗' },
  { suit: Suit.Sou, value: 9, symbol: '🀘' },
  // Honors (Winds & Dragons)
  { suit: Suit.Honor, value: 1, symbol: '🀀' }, // East
  { suit: Suit.Honor, value: 2, symbol: '🀁' }, // South
  { suit: Suit.Honor, value: 3, symbol: '🀂' }, // West
  { suit: Suit.Honor, value: 4, symbol: '🀃' }, // North
  { suit: Suit.Honor, value: 5, symbol: '🀆' }, // White
  { suit: Suit.Honor, value: 6, symbol: '🀅' }, // Green
  { suit: Suit.Honor, value: 7, symbol: '🀄' }, // Red
];

export const getTileLabel = (tile: Omit<TileData, 'id'>): string => {
  if (tile.suit === Suit.Honor) {
    const map: Record<number, string> = { 1: 'East', 2: 'South', 3: 'West', 4: 'North', 5: 'White', 6: 'Green', 7: 'Red' };
    return map[tile.value] || '';
  }
  return `${tile.value}`;
};

export const getTileDisplayName = (suit: string, value: number, lang: Language): string => {
  if (suit === Suit.Honor) {
    const mapZh: Record<number, string> = { 1: '东风', 2: '南风', 3: '西风', 4: '北风', 5: '白板', 6: '发财', 7: '红中' };
    const mapEn: Record<number, string> = { 1: 'East Wind', 2: 'South Wind', 3: 'West Wind', 4: 'North Wind', 5: 'White Dragon', 6: 'Green Dragon', 7: 'Red Dragon' };
    return lang === 'zh' ? mapZh[value] : mapEn[value];
  }

  const numZh = ['一', '二', '三', '四', '五', '六', '七', '八', '九'][value - 1];
  
  if (lang === 'zh') {
    switch (suit) {
      case Suit.Man: return `${numZh}万`;
      case Suit.Pin: return `${numZh}筒`;
      case Suit.Sou: return `${numZh}条`;
      default: return '';
    }
  } else {
    // English
    switch (suit) {
      case Suit.Man: return `${value} Character`;
      case Suit.Pin: return `${value} Dot`;
      case Suit.Sou: return `${value} Bamboo`;
      default: return '';
    }
  }
};

export const TRANSLATIONS = {
  zh: {
    appTitle: "YOUI国标",
    reset: "重置",
    rules: "番种规则",
    share: "分享/手机端",
    scanQr: "扫码在手机打开",
    copyLink: "复制链接",
    linkCopied: "已复制",
    urlTip: "提示：如果是开发环境预览地址（如localhost或cloud shell），手机可能无法访问。请确保使用公网可访问的地址。",
    vercelTip: "注意：vercel.app 域名在国内移动网络下可能会无法访问。建议在 Vercel 绑定自定义域名，或使用 WiFi/VPN 访问。",
    fixedSets: "明牌 (吃/碰/杠)",
    standingHand: "手牌",
    winningTile: "胡牌",
    addTiles: "添加牌张",
    selectTiles: "选择牌张",
    clickToFill: "点击牌张填入",
    chooseWinning: "选择这张胡牌",
    context: "局况设置",
    prevalentWind: "圈风",
    seatWind: "门风",
    winType: "胡牌方式",
    selfDrawn: "自摸",
    discard: "点炮",
    specials: "特殊情况",
    lastTile: "海底捞月",
    robKong: "抢杠胡",
    kongBloom: "杠上开花",
    calculate: "开始算番",
    calculating: "裁判正在计算...",
    totalScore: "总番数",
    breakdown: "番种明细",
    scoreNew: "计算下一把",
    noExposed: "无明牌，点击上方按钮添加",
    clickToAdd: "点击下方牌张添加",
    uploadHand: "拍照识别手牌",
    uploadTable: "拍照识别牌河",
    uploadMelds: "拍照识别明牌",
    analyzing: "AI目标检测中...",
    strategy: "AI 军师",
    getAdvice: "获取打法建议",
    gettingAdvice: "军师思考中...",
    adviceTitle: "军师锦囊",
    recommendedDiscard: "建议打出",
    targetFan: "目标番种",
    keepTiles: "建议保留",
    tableTiles: "牌河 (已打出的牌)",
    chow: "吃",
    pung: "碰",
    kong: "杠",
    darkKong: "暗杠",
    east: "东", south: "南", west: "西", north: "北",
    selectLang: "语言 / Language",
    rulesModalTitle: "国标麻将81番种简表",
    close: "关闭"
  },
  en: {
    appTitle: "YOUI Guobiao",
    reset: "Reset",
    rules: "Rules",
    share: "Share / Mobile",
    scanQr: "Scan to open on mobile",
    copyLink: "Copy Link",
    linkCopied: "Copied",
    urlTip: "Note: Preview URLs (localhost/cloud shell) may not work on mobile. Ensure the URL is publicly accessible.",
    vercelTip: "Note: vercel.app domains may be blocked on some mobile networks in specific regions. Try a custom domain or WiFi.",
    fixedSets: "Fixed Sets (Melds)",
    standingHand: "Standing Hand",
    winningTile: "Winning Tile",
    addTiles: "Add Tiles",
    selectTiles: "Select Tiles",
    clickToFill: "Click tiles to fill",
    chooseWinning: "Choose the winning tile",
    context: "Context & Conditions",
    prevalentWind: "Prevalent Wind",
    seatWind: "Seat Wind",
    winType: "Win Type",
    selfDrawn: "Self-Drawn",
    discard: "Discard (Ron)",
    specials: "Specials",
    lastTile: "Last Tile",
    robKong: "Rob Kong",
    kongBloom: "Kong Bloom",
    calculate: "Calculate Score",
    calculating: "Referee is calculating...",
    totalScore: "Total Score",
    breakdown: "Score Breakdown",
    scoreNew: "Score New Hand",
    noExposed: "No exposed sets. Click above to add.",
    clickToAdd: "Click tiles below to add",
    uploadHand: "Scan Hand",
    uploadTable: "Scan Table",
    uploadMelds: "Scan Melds",
    analyzing: "Detecting objects...",
    strategy: "AI Strategy",
    getAdvice: "Get Advice",
    gettingAdvice: "Thinking...",
    adviceTitle: "Strategy Advice",
    recommendedDiscard: "Discard",
    targetFan: "Target Patterns",
    keepTiles: "Keep",
    tableTiles: "Table (Discarded)",
    chow: "Chow",
    pung: "Pung",
    kong: "Kong",
    darkKong: "Dark Kong",
    east: "E", south: "S", west: "W", north: "N",
    selectLang: "Language",
    rulesModalTitle: "Guobiao 81 Fan Rules (Simplified)",
    close: "Close"
  }
};