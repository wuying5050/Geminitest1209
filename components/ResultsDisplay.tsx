import React from 'react';
import { ScoreResult } from '../types';
import { Trophy, Info, RotateCcw } from 'lucide-react';

interface ResultsDisplayProps {
  result: ScoreResult | null;
  loading: boolean;
  onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, loading, onReset }) => {
  if (loading) {
    return (
      <div className="bg-white/90 p-8 rounded-xl shadow-xl border border-stone-200 text-center animate-pulse min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-semibold text-stone-700">The referee is calculating...</p>
        <p className="text-stone-500 text-sm mt-2">Consulting the 81 Fan rules</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl border border-stone-200">
      <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-full text-yellow-700">
            <Trophy size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Total Score</h2>
            <p className="text-sm text-stone-500">Guobiao Standard</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-5xl font-black text-green-700">{result.totalFan}</span>
          <span className="text-xl font-medium text-stone-400 ml-1">Fan</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">Breakdown</h3>
        <div className="space-y-3">
          {result.breakdown.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between bg-stone-50 p-3 rounded-lg">
              <div>
                <span className="font-semibold text-stone-800">{item.name}</span>
                {item.description && (
                  <p className="text-xs text-stone-500 mt-1">{item.description}</p>
                )}
              </div>
              <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-sm min-w-[3rem] text-center">
                {item.fan}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {result.reasoning && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-900 flex gap-3">
          <Info className="flex-shrink-0 mt-0.5" size={18} />
          <p>{result.reasoning}</p>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={18} />
        Score New Hand
      </button>
    </div>
  );
};
