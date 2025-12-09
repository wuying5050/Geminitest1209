import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { TRANSLATIONS, TILES_DEF } from '../constants';
import { Language, Suit, TileData } from '../types';
import { Tile } from './Tile';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const getTile = (code: string): Omit<TileData, 'id'> => {
  // Format: m1, p5, z1(East), z5(White)
  const suitMap: Record<string, Suit> = { m: Suit.Man, p: Suit.Pin, s: Suit.Sou, z: Suit.Honor };
  const suit = suitMap[code[0]];
  const value = parseInt(code[1]);
  return TILES_DEF.find(t => t.suit === suit && t.value === value) || TILES_DEF[0];
};

interface RuleDef {
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  example: string[];
}

interface FanSection {
  fan: number | string;
  rules: RuleDef[];
}

// Data Definition
const RULES_DATA: FanSection[] = [
  {
    fan: 88,
    rules: [
      {
        nameZh: '大四喜', nameEn: 'Big Four Winds',
        descZh: '由4副风刻（杠）加1对将牌组成的和牌。',
        descEn: 'Four Pungs/Kongs of Winds.',
        example: ['z1','z1','z1', 'z2','z2','z2', 'z3','z3','z3', 'z4','z4','z4', 'm1','m1']
      },
      {
        nameZh: '大三元', nameEn: 'Big Three Dragons',
        descZh: '和牌中，有中、发、白3副刻子。',
        descEn: 'Three Pungs/Kongs of Dragons.',
        example: ['z5','z5','z5', 'z6','z6','z6', 'z7','z7','z7', 'm1','m2','m3', 'p5','p5']
      },
      {
        nameZh: '绿一色', nameEn: 'All Green',
        descZh: '由23468条及发字中的任何牌组成的和牌。',
        descEn: 'Hand composed entirely of 2, 3, 4, 6, 8 Bamboo and Green Dragon.',
        example: ['s2','s3','s4', 's2','s3','s4', 's6','s6','s6', 's8','s8','s8', 'z6','z6']
      },
      {
        nameZh: '九莲宝灯', nameEn: 'Nine Gates',
        descZh: '由一种花色序数牌子按1112345678999组成的特定牌型，见同花色任何1张序数牌即成和牌。',
        descEn: 'Holding 1112345678999 of one suit, winning on any tile of that suit.',
        example: ['m1','m1','m1', 'm2','m3','m4', 'm5','m6','m7', 'm8','m9','m9','m9', 'm5']
      },
      {
        nameZh: '十三幺', nameEn: 'Thirteen Orphans',
        descZh: '由3种序数牌的一、九牌，7种字牌及其中一对作将组成的和牌。',
        descEn: '1 and 9 of each suit, all Winds and Dragons, plus one pair.',
        example: ['m1','m9','p1','p9','s1','s9', 'z1','z2','z3','z4','z5','z6','z7', 'z7']
      },
      {
        nameZh: '连七对', nameEn: 'Seven Shifted Pairs',
        descZh: '由一种花色序数牌组成序数相连的7个对子的和牌。',
        descEn: 'Seven pairs of the same suit in sequence (e.g. 11, 22, ... 77).',
        example: ['p1','p1', 'p2','p2', 'p3','p3', 'p4','p4', 'p5','p5', 'p6','p6', 'p7','p7']
      }
    ]
  },
  {
    fan: 64,
    rules: [
      {
        nameZh: '小四喜', nameEn: 'Little Four Winds',
        descZh: '和牌时有风牌的3副刻子及将牌。',
        descEn: 'Three Pungs/Kongs of Winds and a pair of the fourth Wind.',
        example: ['z1','z1','z1', 'z2','z2','z2', 'z3','z3','z3', 'z4','z4', 'm1','m2','m3']
      },
      {
        nameZh: '小三元', nameEn: 'Little Three Dragons',
        descZh: '和牌时有箭牌的2副刻子及将牌。',
        descEn: 'Two Pungs/Kongs of Dragons and a pair of the third Dragon.',
        example: ['z5','z5','z5', 'z6','z6','z6', 'z7','z7', 'm1','m2','m3', 'p4','p5','p6']
      },
      {
        nameZh: '字一色', nameEn: 'All Honors',
        descZh: '由字牌的刻子（杠）、将牌组成的和牌。',
        descEn: 'Hand composed entirely of Honor tiles (Winds and Dragons).',
        example: ['z1','z1','z1', 'z2','z2','z2', 'z5','z5','z5', 'z6','z6','z6', 'z7','z7']
      },
    ]
  },
  {
    fan: 48,
    rules: [
       {
        nameZh: '一色四同顺', nameEn: 'Four Pure Shifted Chows',
        descZh: '一种花色4副序数相同的顺子，不求人。',
        descEn: 'Four Chows of the same suit and same sequence.',
        example: ['m2','m3','m4', 'm2','m3','m4', 'm2','m3','m4', 'm2','m3','m4', 'p5','p5']
      },
      {
        nameZh: '一色四节高', nameEn: 'Quadruple Chow',
        descZh: '一种花色4副依次递增一位数的顺子，不求人。',
        descEn: 'Four Chows of the same suit shifted by 1 (e.g., 123, 234, 345, 456).',
        example: ['s1','s2','s3', 's2','s3','s4', 's3','s4','s5', 's4','s5','s6', 'z6','z6']
      }
    ]
  },
  {
     fan: 32,
     rules: [
       {
         nameZh: '混幺九', nameEn: 'All Terminals and Honors',
         descZh: '由字牌和序数牌一、九的刻子及将牌组成。',
         descEn: 'Pungs/Kongs/Pair of Terminals (1,9) and Honors only.',
         example: ['m1','m1','m1', 'p9','p9','p9', 's1','s1','s1', 'z1','z1','z1', 'z5','z5']
       },
       {
         nameZh: '三杠', nameEn: 'Three Kongs',
         descZh: '和牌时有3副杠子。',
         descEn: 'Three Kongs.',
         example: ['m2','m2','m2','m2', 'p5','p5','p5','p5', 'z6','z6','z6','z6', 's3','s4','s5', 's9','s9']
       }
     ]
  },
  {
     fan: 24,
     rules: [
       {
         nameZh: '七对', nameEn: 'Seven Pairs',
         descZh: '由7个对子组成。',
         descEn: 'Hand composed of seven pairs.',
         example: ['m1','m1', 'm5','m5', 'p2','p2', 'p8','p8', 's3','s3', 'z1','z1', 'z5','z5']
       },
       {
         nameZh: '清一色', nameEn: 'Full Flush',
         descZh: '由一种花色的序数牌组成。',
         descEn: 'Hand composed entirely of tiles from one suit.',
         example: ['m1','m2','m3', 'm4','m5','m6', 'm7','m8','m9', 'm2','m3','m4', 'm9','m9']
       },
       {
         nameZh: '一色三同顺', nameEn: 'Pure Triple Chow',
         descZh: '一种花色3副序数相同的顺子。',
         descEn: 'Three Chows of the same suit and same sequence.',
         example: ['p3','p4','p5', 'p3','p4','p5', 'p3','p4','p5', 's1','s2','s3', 'z1','z1']
       }
     ]
  },
  {
    fan: 16,
    rules: [
       {
         nameZh: '一色三节高', nameEn: 'Pure Shifted Chows',
         descZh: '一种花色3副依次递增一位数的顺子。',
         descEn: 'Three Chows of the same suit shifted by 1 (e.g. 123, 234, 345).',
         example: ['m1','m2','m3', 'm2','m3','m4', 'm3','m4','m5', 's8','s8','s8', 'z2','z2']
       },
       {
         nameZh: '全带五', nameEn: 'All Fives',
         descZh: '每副牌及将牌中必须有序数5。',
         descEn: 'Each Meld and the Eye must contain the number 5.',
         example: ['m3','m4','m5', 'p4','p5','p6', 's5','s6','s7', 'm5','m5','m5', 's5','s5']
       },
       {
         nameZh: '三色双龙会', nameEn: 'Three-Suited Terminal Chows',
         descZh: '2种花色2副老少副（123、789），另一种花色5作将。',
         descEn: 'Two suits each having 123 and 789 chows, pair of 5 in the third suit.',
         example: ['m1','m2','m3', 'm7','m8','m9', 'p1','p2','p3', 'p7','p8','p9', 's5','s5']
       }
    ]
  },
  {
    fan: 12,
    rules: [
      {
        nameZh: '三风刻', nameEn: 'Big Three Winds',
        descZh: '包含3副风刻。',
        descEn: 'Three Pungs/Kongs of Winds.',
        example: ['z1','z1','z1', 'z2','z2','z2', 'z3','z3','z3', 'm1','m2','m3', 'p5','p5']
      },
      {
        nameZh: '大于五', nameEn: 'Upper Four',
        descZh: '由序数牌6-9组成。',
        descEn: 'Hand composed entirely of tiles numbered 6 to 9.',
        example: ['m6','m7','m8', 'p7','p8','p9', 's6','s7','s8', 's9','s9','s9', 'm9','m9']
      },
       {
        nameZh: '小于五', nameEn: 'Lower Four',
        descZh: '由序数牌1-4组成。',
        descEn: 'Hand composed entirely of tiles numbered 1 to 4.',
        example: ['m1','m2','m3', 'p1','p2','p3', 's2','s3','s4', 's1','s1','s1', 'm4','m4']
      }
    ]
  },
  {
    fan: 8,
    rules: [
       {
        nameZh: '花龙', nameEn: 'Mixed Straight',
        descZh: '3种花色的3副顺子连接成1-9的序数。',
        descEn: 'Three Chows of different suits creating a 1-9 sequence (e.g., 123m, 456p, 789s).',
        example: ['m1','m2','m3', 'p4','p5','p6', 's7','s8','s9', 'z1','z1','z1', 'z5','z5']
      },
      {
        nameZh: '三色三同顺', nameEn: 'Mixed Triple Chow',
        descZh: '3种花色序数相同的3副顺子。',
        descEn: 'Three Chows of the same sequence but in three different suits.',
        example: ['m2','m3','m4', 'p2','p3','p4', 's2','s3','s4', 'z6','z6','z6', 'z1','z1']
      }
    ]
  },
  {
    fan: 6,
    rules: [
       {
        nameZh: '混一色', nameEn: 'Half Flush',
        descZh: '由一种花色序数牌及字牌组成。',
        descEn: 'Hand composed of tiles from one suit plus Honors.',
        example: ['m1','m2','m3', 'm5','m5','m5', 'z1','z1','z1', 'z5','z5','z5', 'm9','m9']
       },
       {
        nameZh: '碰碰和', nameEn: 'All Pungs',
        descZh: '由4副刻子（杠）、将牌组成。',
        descEn: 'Hand composed of four Pungs/Kongs and a pair.',
        example: ['m2','m2','m2', 'p5','p5','p5', 's8','s8','s8', 'z1','z1','z1', 'z5','z5']
       }
    ]
  },
  {
    fan: 'Low',
    rules: [
       {
        nameZh: '平和', nameEn: 'All Chows',
        descZh: '由4副顺子及序数牌作将组成。',
        descEn: 'Four Chows and a pair (non-Honors).',
        example: ['m1','m2','m3', 'p4','p5','p6', 's7','s8','s9', 's2','s3','s4', 'm5','m5']
       },
       {
        nameZh: '断幺', nameEn: 'All Simples',
        descZh: '和牌中没有一、九及字牌。',
        descEn: 'No Terminals (1,9) or Honors.',
        example: ['m2','m3','m4', 'p3','p4','p5', 's4','s5','s6', 's7','s8', 'm5','m5','m5']
       },
       {
        nameZh: '门前清', nameEn: 'Fully Concealed',
        descZh: '没有吃、碰、明杠，和别人打出的牌。',
        descEn: 'No open melds, winning on a discard.',
        example: ['m1','m2','m3', 'm4','m5','m6', 'p4','p5','p6', 's7','s8','s9', 'z1','z1']
       }
    ]
  }
];

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  // Filter rules based on search
  const filteredSections = RULES_DATA.map(section => ({
    ...section,
    rules: section.rules.filter(r => 
      r.nameZh.includes(searchTerm) || 
      r.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.descZh.includes(searchTerm) ||
      r.descEn.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(s => s.rules.length > 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-center bg-green-50 gap-4">
          <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
            <span className="text-2xl">🀄</span>
            {t.rulesModalTitle}
          </h2>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
               <input 
                 type="text" 
                 placeholder={lang === 'zh' ? "搜索番种..." : "Search patterns..."}
                 className="w-full pl-9 pr-4 py-2 rounded-full border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-green-200 rounded-full transition-colors text-green-800">
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6">
          <div className="space-y-8">
            {filteredSections.map((section, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 flex items-center gap-2">
                  <span className="bg-green-700 text-white text-xs font-bold px-2 py-1 rounded">
                     {typeof section.fan === 'number' ? `${section.fan} Fan` : 'Low Fan'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-px bg-stone-200">
                  {section.rules.map((rule, rIdx) => (
                    <div key={rIdx} className="bg-white p-6 flex flex-col gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg text-stone-800">
                            {lang === 'zh' ? rule.nameZh : rule.nameEn}
                          </h3>
                           <span className="text-xs text-stone-400 uppercase tracking-wider">
                            {lang === 'zh' ? rule.nameEn : rule.nameZh}
                           </span>
                        </div>
                        <p className="text-sm text-stone-600 leading-relaxed">
                          {lang === 'zh' ? rule.descZh : rule.descEn}
                        </p>
                      </div>
                      
                      <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                        <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                          {rule.example.map((code, tIdx) => (
                            <Tile 
                              key={`${rIdx}-${tIdx}`} 
                              tile={getTile(code)} 
                              size="xs"
                              className="shadow-sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="text-center py-20 text-stone-400">
                <p>{lang === 'zh' ? '未找到匹配的番种' : 'No patterns found'}</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-stone-400 mt-8 mb-4">
            {lang === 'zh' 
              ? '注：本表收录了国标麻将主要番种，完整81番请查阅官方规则手册。' 
              : 'Note: This list covers major Guobiao patterns. Refer to official rules for the full 81 patterns.'}
          </p>
        </div>
      </div>
    </div>
  );
};