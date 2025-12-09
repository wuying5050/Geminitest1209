import React from 'react';
import { StrategyAdvice, Language, TileData, Suit } from '../types';
import { TRANSLATIONS, TILES_DEF, getTileDisplayName } from '../constants';
import { Lightbulb, Target, ArrowRight } from 'lucide-react';
import { Tile } from './Tile';

interface StrategyDisplayProps {
  advice: StrategyAdvice | null;
  loading: boolean;
  lang: Language;
}

// Helper to convert code string "m1" to tile definition and visual info
const getTileFromCode = (code: string, lang: Language) => {
  const suitMap: Record<string, Suit> = { m: Suit.Man, p: Suit.Pin, s: Suit.Sou, z: Suit.Honor };
  
  if (!code || code.length < 2) return null;
  
  const sChar = code.charAt(0);
  const vChar = parseInt(code.charAt(1));
  const suit = suitMap[sChar];
  
  if (!suit || isNaN(vChar)) return null;

  const def = TILES_DEF.find(t => t.suit === suit && t.value === vChar);
  if (!def) return null;

  return {
    def,
    name: getTileDisplayName(suit, vChar, lang)
  };
};

export const StrategyDisplay: React.FC<StrategyDisplayProps> = ({ advice, loading, lang }) => {
  const t = TRANSLATIONS[lang];

  if (loading) {
    return (
      <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 animate-pulse flex flex-col items-center justify-center min-h-[200px]">
        <Lightbulb className="text-purple-400 mb-3 animate-bounce" size={32} />
        <p className="text-purple-800 font-semibold">{t.gettingAdvice}</p>
      </div>
    );
  }

  if (!advice) return null;

  const discardInfo = getTileFromCode(advice.recommendedDiscard, lang);
  const keepInfos = advice.keepTiles.map(code => getTileFromCode(code, lang)).filter(x => x !== null);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-200 shadow-lg">
      <div className="flex items-center gap-2 mb-4 text-purple-800 border-b border-purple-100 pb-2">
        <Lightbulb size={24} />
        <h3 className="font-bold text-lg">{t.adviceTitle}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider block mb-2">{t.recommendedDiscard}</span>
            <div className="flex items-center gap-4 bg-white/50 p-3 rounded-lg border border-purple-100">
               <ArrowRight size={24} className="text-red-500" />
               {discardInfo ? (
                 <>
                   <Tile tile={discardInfo.def} size="sm" />
                   <span className="text-xl font-bold text-stone-800">{discardInfo.name}</span>
                 </>
               ) : (
                 <span className="text-xl font-bold text-stone-800">{advice.recommendedDiscard}</span>
               )}
            </div>
          </div>
          
           <div className="mb-4">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider block mb-2">{t.keepTiles}</span>
            <div className="flex flex-wrap gap-2">
               {keepInfos.length > 0 ? (
                 keepInfos.map((info, i) => (
                   <div key={i} className="flex flex-col items-center bg-white border border-purple-100 p-1.5 rounded-lg shadow-sm">
                      <Tile tile={info!.def} size="xs" />
                   </div>
                 ))
               ) : (
                 advice.keepTiles.map((k, i) => (
                   <span key={i} className="bg-white border border-purple-100 px-2 py-1 rounded text-sm text-purple-900">
                     {k}
                   </span>
                 ))
               )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Target size={12} /> {t.targetFan}
            </span>
             <div className="flex flex-wrap gap-2">
               {advice.targetFanPatterns.map((p, i) => (
                 <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                   {p}
                 </span>
               ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-purple-100 text-sm text-stone-700 leading-relaxed italic relative">
            <span className="absolute top-2 left-2 text-3xl text-purple-200 font-serif -z-10">“</span>
            {advice.advice}
          </div>
        </div>
      </div>
    </div>
  );
};