import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X, Trash2, Settings, User, Wind as WindIcon, Camera, HelpCircle, BrainCircuit, ZoomIn, Share2, Copy, Check, Info } from 'lucide-react';

import { TileSelector } from './components/TileSelector';
import { Tile } from './components/Tile';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RulesModal } from './components/RulesModal';
import { StrategyDisplay } from './components/StrategyDisplay';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { calculateScore, identifyTilesFromImage, identifyMeldsFromImage, getStrategyAdvice } from './services/geminiService';
import { TileData, Meld, MeldType, GameContext, Wind, ScoreResult, Language, StrategyAdvice } from './types';
import { TRANSLATIONS } from './constants';

// Helper to generate IDs
const createTile = (def: Omit<TileData, 'id'>): TileData => ({ ...def, id: uuidv4() });

// Helper to resize image
const resizeImage = (file: File, maxWidth: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.8 quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function App() {
  // --- State ---
  const [lang, setLang] = useState<Language>('zh');
  const [showRules, setShowRules] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Exposed/Fixed sets (Chi/Pon/Kan)
  const [exposedMelds, setExposedMelds] = useState<Meld[]>([]);
  // Standing tiles in hand
  const [standingTiles, setStandingTiles] = useState<TileData[]>([]);
  // Table Tiles (Discards) for strategy
  const [tableTiles, setTableTiles] = useState<TileData[]>([]);
  
  // The specific winning tile
  const [winningTile, setWinningTile] = useState<TileData | null>(null);
  
  // Game Context
  const [context, setContext] = useState<GameContext>({
    prevalentWind: Wind.East,
    seatWind: Wind.East,
    isSelfDrawn: true,
    isLastTile: false,
    isRobbingKong: false,
    isKongBloom: false,
  });

  // Images
  const [capturedImages, setCapturedImages] = useState<{
    standing: string | null;
    table: string | null;
    meld: string | null;
  }>({ standing: null, table: null, meld: null });
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // UI State
  const [activeSection, setActiveSection] = useState<'meld' | 'standing' | 'winning' | 'table'>('standing');
  const [builderMeldId, setBuilderMeldId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [advice, setAdvice] = useState<StrategyAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  // --- Handlers ---

  const handleAddTile = (def: Omit<TileData, 'id'>) => {
    if (result) return; 

    if (activeSection === 'winning') {
      setWinningTile(createTile(def));
      return;
    }

    if (activeSection === 'standing') {
      if (standingTiles.length >= 14) return;
      setStandingTiles([...standingTiles, createTile(def)]);
      return;
    }

    if (activeSection === 'table') {
      setTableTiles([...tableTiles, createTile(def)]);
      return;
    }
  };

  const handleRemoveStandingTile = (id: string) => {
    setStandingTiles(standingTiles.filter(t => t.id !== id));
  };
  
  const handleRemoveTableTile = (id: string) => {
    setTableTiles(tableTiles.filter(t => t.id !== id));
  };

  const startMeldBuild = (type: MeldType, isConcealed: boolean) => {
    const newMeld: Meld = {
      id: uuidv4(),
      type,
      isConcealed,
      tiles: []
    };
    setExposedMelds([...exposedMelds, newMeld]);
    setBuilderMeldId(newMeld.id);
    setActiveSection('meld');
  };

  const handleTileSelectForMeld = (def: Omit<TileData, 'id'>) => {
    if (!builderMeldId) return;
    
    setExposedMelds(melds => melds.map(m => {
      if (m.id === builderMeldId) {
        // Limit size based on type
        const limit = m.type === MeldType.Kong ? 4 : 3;
        if (m.tiles.length >= limit) return m;
        return { ...m, tiles: [...m.tiles, createTile(def)] };
      }
      return m;
    }));
  };

  const deleteMeld = (id: string) => {
    setExposedMelds(melds => melds.filter(m => m.id !== id));
    if (builderMeldId === id) {
      setBuilderMeldId(null);
      setActiveSection('standing');
    }
  };

  const handleGlobalTileSelect = (def: Omit<TileData, 'id'>) => {
    if (result) return;

    if (activeSection === 'meld' && builderMeldId) {
      handleTileSelectForMeld(def);
    } else if (activeSection === 'winning') {
      setWinningTile(createTile(def));
      setActiveSection('standing'); 
    } else {
      handleAddTile(def);
    }
  };

  const calculate = async () => {
    if (!winningTile) {
      setError(lang === 'zh' ? "请选择胡牌" : "Please select a Winning Tile.");
      return;
    }
    setError(null);
    setLoading(true);
    setAdvice(null);
    try {
      const res = await calculateScore(standingTiles, exposedMelds, winningTile, context, lang);
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Calculation failed");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGetStrategy = async () => {
     if (standingTiles.length === 0) {
        setError(lang === 'zh' ? "请先添加手牌" : "Add hand tiles first");
        return;
     }
     setAdviceLoading(true);
     setResult(null);
     setError(null);
     try {
       const adv = await getStrategyAdvice(standingTiles, exposedMelds, tableTiles, lang);
       setAdvice(adv);
     } catch (e: any) {
       setError(e.message || "Strategy failed");
     } finally {
       setAdviceLoading(false);
     }
  };

  const reset = () => {
    setExposedMelds([]);
    setStandingTiles([]);
    setTableTiles([]);
    setWinningTile(null);
    setResult(null);
    setAdvice(null);
    setError(null);
    setCapturedImages({ standing: null, table: null, meld: null });
    setActiveSection('standing');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'standing' | 'table' | 'meld') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingImage(true);
    setError(null);
    
    try {
      // 1. Resize image first to speed up processing
      const base64 = await resizeImage(file, 1024);
      
      // Store image
      setCapturedImages(prev => ({ ...prev, [target]: base64 }));

      // 2. Send to AI
      if (target === 'meld') {
          const meldGroups = await identifyMeldsFromImage(base64);
          
          const newMelds: Meld[] = meldGroups.map(tiles => {
            // Infer type
            let type = MeldType.Chow;
            const uniqueCodes = new Set(tiles.map(t => `${t.suit}${t.value}`));
            if (uniqueCodes.size === 1) {
                type = tiles.length === 4 ? MeldType.Kong : MeldType.Pung;
            }
            
            return {
                id: uuidv4(),
                type,
                isConcealed: false, // Default to exposed when scanning
                tiles
            };
          });
          
          setExposedMelds(prev => [...prev, ...newMelds]);
          if (newMelds.length > 0) setActiveSection('meld');

      } else if (target === 'standing') {
          const detectedTiles = await identifyTilesFromImage(base64);
          // Append to standing tiles
          const availableSlots = 14 - standingTiles.length;
          const tilesToAdd = detectedTiles.slice(0, availableSlots);
          setStandingTiles(prev => [...prev, ...tilesToAdd]);
      } else {
          const detectedTiles = await identifyTilesFromImage(base64);
          setTableTiles(prev => [...prev, ...detectedTiles]);
      }
    } catch (err: any) {
      console.error(err);
      setError(lang === 'zh' ? "图片识别失败" : "Failed to process image");
    } finally {
      setAnalyzingImage(false);
      // Reset input value to allow re-uploading same file
      e.target.value = '';
    }
  };

  const openShare = () => {
    const currentUrl = window.location.href;
    const isLocal = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
    
    if (isLocal && !shareUrl.includes('ngrok')) {
       setShareUrl(''); 
    } else if (!shareUrl) {
       setShareUrl(currentUrl);
    }
    setShowShare(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} lang={lang} />
      
      <ImagePreviewModal 
        isOpen={!!previewImage} 
        imageUrl={previewImage?.url || null} 
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)} 
      />

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowShare(false)}>
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between w-full items-center mb-2">
                 <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                   <Share2 size={20} /> {t.share}
                 </h3>
                 <button onClick={() => setShowShare(false)} className="p-1 hover:bg-stone-100 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-inner">
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl || ' ')}`} 
                   alt="QR Code" 
                   className="w-48 h-48"
                 />
              </div>
              <p className="text-sm text-stone-500 text-center">{t.scanQr}</p>
              
              <div className="flex w-full gap-2">
                 <input 
                   type="text" 
                   value={shareUrl} 
                   onChange={(e) => setShareUrl(e.target.value)}
                   placeholder="在此粘贴网址..."
                   className="flex-1 bg-stone-100 border border-stone-200 rounded px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-green-500"
                   autoFocus
                 />
                 <button 
                   onClick={copyLink}
                   className="bg-stone-800 text-white px-3 py-2 rounded text-xs font-medium flex items-center gap-1 hover:bg-stone-700 transition-colors"
                 >
                    {copied ? <Check size={14}/> : <Copy size={14}/>}
                    {copied ? t.linkCopied : t.copyLink}
                 </button>
              </div>
              
              <div className="flex flex-col gap-2 w-full">
                 {/* Tips Section */}
                 {shareUrl.includes('ngrok') && (
                    <div className="flex gap-2 items-start text-[10px] text-stone-500 bg-stone-50 p-2 rounded w-full">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <p>提示：请确保电脑上的 ngrok 窗口保持开启状态。</p>
                    </div>
                 )}
                 {shareUrl.includes('vercel.app') && (
                    <div className="flex gap-2 items-start text-[10px] text-amber-700 bg-amber-50 p-2 rounded w-full border border-amber-100">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <p>{t.vercelTip}</p>
                    </div>
                 )}
                 {(!shareUrl.includes('ngrok') && !shareUrl.includes('vercel.app')) && (
                    <div className="flex gap-2 items-start text-[10px] text-stone-400 bg-stone-50 p-2 rounded w-full">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <p>{t.urlTip}</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* LEFT PANEL: Game Board / Input */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            {/* Logo Section */}
            <div className="relative group">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/3132/3132714.png" 
                alt="YOUI Logo" 
                className="w-12 h-12 rounded-lg shadow-md bg-green-800 p-1 object-cover" 
              />
            </div>
            
            <div>
               <h1 className="text-2xl font-bold text-stone-800 tracking-tight">{t.appTitle}</h1>
               <div className="flex gap-2 text-xs text-stone-500">
                  <button onClick={() => setLang('zh')} className={`hover:text-green-700 ${lang === 'zh' ? 'font-bold text-green-700' : ''}`}>中文</button>
                  <span>|</span>
                  <button onClick={() => setLang('en')} className={`hover:text-green-700 ${lang === 'en' ? 'font-bold text-green-700' : ''}`}>English</button>
               </div>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button 
              onClick={openShare} 
              className="px-3 py-2 bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-sm"
            >
              <Share2 size={16} /> {t.share}
            </button>
             <button 
              onClick={() => setShowRules(true)} 
              className="px-3 py-2 bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-sm"
            >
              <HelpCircle size={16} /> {t.rules}
            </button>
            <button 
              onClick={reset} 
              className="px-3 py-2 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} /> {t.reset}
            </button>
          </div>
        </header>

        {/* --- Hand Builder Area --- */}
        <div className="space-y-6">
          
          {/* 1. Exposed Melds */}
          <section>
            <div className="flex flex-wrap justify-between items-end mb-2 gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">{t.fixedSets}</h2>
                <label className="cursor-pointer flex items-center gap-1 text-xs bg-white text-stone-600 border border-stone-200 px-2 py-1 rounded hover:bg-stone-50 transition-colors shadow-sm">
                  <Camera size={14} />
                  <span className="hidden sm:inline">{analyzingImage ? t.analyzing : t.uploadMelds}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'meld')} disabled={analyzingImage} />
                </label>
                {capturedImages.meld && (
                  <div 
                    className="relative w-8 h-8 rounded border border-stone-300 overflow-hidden cursor-zoom-in group hover:ring-2 hover:ring-green-400"
                    onClick={() => setPreviewImage({ url: capturedImages.meld!, title: t.fixedSets })}
                  >
                     <img src={capturedImages.meld} alt="Meld" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startMeldBuild(MeldType.Chow, false)} className="text-xs bg-white border border-stone-200 hover:bg-stone-50 px-2 py-1 rounded shadow-sm">
                  + {t.chow}
                </button>
                <button onClick={() => startMeldBuild(MeldType.Pung, false)} className="text-xs bg-white border border-stone-200 hover:bg-stone-50 px-2 py-1 rounded shadow-sm">
                  + {t.pung}
                </button>
                <button onClick={() => startMeldBuild(MeldType.Kong, false)} className="text-xs bg-white border border-stone-200 hover:bg-stone-50 px-2 py-1 rounded shadow-sm">
                  + {t.kong}
                </button>
                 <button onClick={() => startMeldBuild(MeldType.Kong, true)} className="text-xs bg-white border border-stone-200 hover:bg-stone-50 px-2 py-1 rounded shadow-sm">
                  + {t.darkKong}
                </button>
              </div>
            </div>
            
            <div className="bg-green-800/90 p-4 rounded-xl min-h-[90px] shadow-inner border-b-4 border-green-900 flex flex-wrap gap-4">
              {exposedMelds.length === 0 && (
                <div className="w-full text-center text-green-200/50 italic text-xs sm:text-sm py-2">
                  {t.noExposed}
                </div>
              )}
              {exposedMelds.map((meld) => (
                <div 
                  key={meld.id} 
                  onClick={() => { setBuilderMeldId(meld.id); setActiveSection('meld'); }}
                  className={`
                    relative bg-black/20 p-2 rounded-lg flex gap-1 items-center
                    ${builderMeldId === meld.id ? 'ring-2 ring-yellow-400 bg-black/40' : 'hover:bg-black/30'}
                    cursor-pointer transition-all
                  `}
                >
                  <div className="absolute -top-2 -right-2 z-10">
                     <button onClick={(e) => { e.stopPropagation(); deleteMeld(meld.id); }} className="bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600">
                       <X size={10} />
                     </button>
                  </div>
                  {meld.type === MeldType.Kong && meld.isConcealed && meld.tiles.length === 4 ? (
                     <>
                        <div className="w-8 h-10 bg-blue-900 rounded border border-white/20"></div>
                        <Tile tile={meld.tiles[1]} size="sm" />
                        <Tile tile={meld.tiles[2]} size="sm" />
                        <div className="w-8 h-10 bg-blue-900 rounded border border-white/20"></div>
                     </>
                  ) : (
                    meld.tiles.length > 0 
                      ? meld.tiles.map(t => <Tile key={t.id} tile={t} size="sm" />)
                      : <div className="w-24 h-10 flex items-center justify-center text-white/50 text-xs">{t.selectTiles}</div>
                  )}
                  <span className="text-[10px] text-white/70 uppercase absolute bottom-0 right-0 p-0.5 font-bold tracking-widest bg-black/50 rounded-tl">
                    {meld.isConcealed ? 'Dark' : ''} {meld.type}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Standing Hand & Winning Tile */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <section className="lg:col-span-3">
               <div 
                 className={`flex justify-between items-end mb-2 cursor-pointer ${activeSection === 'standing' ? 'text-green-700' : 'text-stone-500'}`}
               >
                <div 
                   className="flex items-center gap-2"
                   onClick={() => { setActiveSection('standing'); setBuilderMeldId(null); }}
                >
                    <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                      {t.standingHand}
                      {activeSection === 'standing' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                    </h2>
                    <span className="text-xs text-stone-400">({standingTiles.length})</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                    <Camera size={14} />
                    <span>{analyzingImage ? t.analyzing : t.uploadHand}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'standing')} disabled={analyzingImage} />
                  </label>
                  {capturedImages.standing && (
                    <div 
                      className="relative w-8 h-8 rounded border border-stone-300 overflow-hidden cursor-zoom-in group hover:ring-2 hover:ring-green-400"
                      onClick={() => setPreviewImage({ url: capturedImages.standing!, title: t.standingHand })}
                    >
                      <img src={capturedImages.standing} alt="Hand" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>
                  )}
                </div>
              </div>
              <div 
                className={`
                  bg-green-800 p-4 rounded-xl min-h-[110px] shadow-inner border-b-8 border-green-900 flex flex-wrap gap-2 items-center
                  ${activeSection === 'standing' ? 'ring-2 ring-green-500/50' : ''}
                `}
                onClick={() => { setActiveSection('standing'); setBuilderMeldId(null); }}
              >
                {standingTiles.length === 0 && (
                   <div className="w-full text-center text-green-200/50 italic text-sm">
                    {t.clickToAdd}
                  </div>
                )}
                {standingTiles.map((tile) => (
                  <Tile key={tile.id} tile={tile} onClick={() => handleRemoveStandingTile(tile.id)} />
                ))}
              </div>
            </section>

            <section className="lg:col-span-1">
              <div 
                 className={`flex justify-between items-end mb-2 cursor-pointer ${activeSection === 'winning' ? 'text-green-700' : 'text-stone-500'}`}
                 onClick={() => { setActiveSection('winning'); setBuilderMeldId(null); }}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                  {t.winningTile}
                  {activeSection === 'winning' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                </h2>
              </div>
              <div 
                className={`
                  bg-green-800 p-4 rounded-xl min-h-[110px] shadow-inner border-b-8 border-green-900 flex justify-center items-center
                  ${activeSection === 'winning' ? 'ring-2 ring-yellow-400' : ''}
                `}
                onClick={() => { setActiveSection('winning'); setBuilderMeldId(null); }}
              >
                {winningTile ? (
                  <div className="relative">
                    <Tile tile={winningTile} size="lg" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setWinningTile(null); }} 
                      className="absolute -top-2 -right-2 bg-stone-800 text-white rounded-full p-1 hover:bg-black"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-16 border-2 border-dashed border-green-400/50 rounded flex items-center justify-center text-green-200/50 text-xs text-center px-1">
                    {t.selectTiles}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 3. Strategy Area (Table Tiles) */}
           <section className="bg-stone-50 p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                 <div 
                    className={`flex items-center gap-2 cursor-pointer ${activeSection === 'table' ? 'text-blue-700' : 'text-stone-500'}`}
                    onClick={() => setActiveSection('table')}
                 >
                    <h2 className="text-sm font-semibold uppercase tracking-wider">{t.tableTiles}</h2>
                    {activeSection === 'table' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                 </div>
                 <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                      <Camera size={14} />
                      <span>{analyzingImage ? t.analyzing : t.uploadTable}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'table')} disabled={analyzingImage} />
                    </label>
                    {capturedImages.table && (
                      <div 
                        className="relative w-8 h-8 rounded border border-stone-300 overflow-hidden cursor-zoom-in group hover:ring-2 hover:ring-blue-400"
                        onClick={() => setPreviewImage({ url: capturedImages.table!, title: t.tableTiles })}
                      >
                        <img src={capturedImages.table} alt="Table" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                    )}
                 </div>
              </div>
              
              <div 
                className={`
                   min-h-[80px] rounded-lg border border-stone-300 p-2 flex flex-wrap gap-1
                   ${activeSection === 'table' ? 'bg-white ring-2 ring-blue-200' : 'bg-stone-100'}
                `}
                onClick={() => setActiveSection('table')}
              >
                 {tableTiles.length === 0 && (
                   <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs italic">
                     {t.uploadTable} / {t.clickToFill}
                   </div>
                 )}
                 {tableTiles.map((tile) => (
                    <Tile key={tile.id} tile={tile} size="sm" className="opacity-80 scale-75 origin-center" onClick={() => handleRemoveTableTile(tile.id)} />
                 ))}
              </div>
           </section>

          {/* 4. Game Settings */}
          <section className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
             <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Settings size={16} /> {t.context}
             </h2>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Prevalent Wind */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t.prevalentWind}</label>
                  <div className="flex bg-stone-100 rounded-lg p-1">
                    {[Wind.East, Wind.South, Wind.West, Wind.North].map(w => (
                      <button 
                        key={w}
                        onClick={() => setContext({...context, prevalentWind: w})}
                        className={`flex-1 text-xs py-1 rounded ${context.prevalentWind === w ? 'bg-white shadow text-green-700 font-bold' : 'text-stone-400'}`}
                      >
                        {t[w.toLowerCase() as keyof typeof t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seat Wind */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t.seatWind}</label>
                  <div className="flex bg-stone-100 rounded-lg p-1">
                    {[Wind.East, Wind.South, Wind.West, Wind.North].map(w => (
                      <button 
                        key={w}
                        onClick={() => setContext({...context, seatWind: w})}
                        className={`flex-1 text-xs py-1 rounded ${context.seatWind === w ? 'bg-white shadow text-green-700 font-bold' : 'text-stone-400'}`}
                      >
                        {t[w.toLowerCase() as keyof typeof t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Win Type */}
                <div className="space-y-1">
                   <label className="text-xs font-bold text-stone-400 uppercase">{t.winType}</label>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setContext({...context, isSelfDrawn: !context.isSelfDrawn})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${context.isSelfDrawn ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-stone-200 text-stone-500'}`}
                      >
                        {context.isSelfDrawn ? t.selfDrawn : t.discard}
                      </button>
                   </div>
                </div>

                {/* Special Conditions */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t.specials}</label>
                   <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setContext({...context, isLastTile: !context.isLastTile})}
                        className={`px-2 py-1 rounded text-[10px] border ${context.isLastTile ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-stone-200'}`}
                      >
                        {t.lastTile}
                      </button>
                      <button 
                        onClick={() => setContext({...context, isRobbingKong: !context.isRobbingKong})}
                        className={`px-2 py-1 rounded text-[10px] border ${context.isRobbingKong ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-stone-200'}`}
                      >
                        {t.robKong}
                      </button>
                      <button 
                        onClick={() => setContext({...context, isKongBloom: !context.isKongBloom})}
                        className={`px-2 py-1 rounded text-[10px] border ${context.isKongBloom ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-stone-200'}`}
                      >
                        {t.kongBloom}
                      </button>
                   </div>
                </div>
             </div>
          </section>

          {/* 5. Messages */}
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}
          
        </div>
      </div>

      {/* RIGHT PANEL: Picker & Results */}
      <div className="w-full md:w-[380px] bg-white border-l border-stone-200 flex flex-col h-[50vh] md:h-screen shadow-xl z-20">
        
        {/* Results / Strategy overlay */}
        {loading || result || advice || adviceLoading ? (
          <div className="flex-1 p-4 overflow-y-auto bg-stone-50 space-y-4">
             {adviceLoading && <StrategyDisplay advice={null} loading={true} lang={lang} />}
             {advice && <StrategyDisplay advice={advice} loading={false} lang={lang} />}
             <ResultsDisplay result={result} loading={loading} onReset={reset} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-stone-100 bg-stone-50">
              <h3 className="font-semibold text-stone-800">
                {activeSection === 'meld' ? t.fixedSets : 
                 activeSection === 'winning' ? t.chooseWinning : 
                 activeSection === 'table' ? t.tableTiles :
                 t.addTiles}
              </h3>
              <p className="text-xs text-stone-500">
                {activeSection === 'meld' ? t.clickToFill : 
                 activeSection === 'winning' ? t.chooseWinning : 
                 t.clickToAdd}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-stone-100 p-2">
              <TileSelector onSelect={handleGlobalTileSelect} />
            </div>

            <div className="p-4 border-t border-stone-200 bg-white space-y-3">
               <button 
                 onClick={handleGetStrategy}
                 disabled={loading || adviceLoading}
                 className="w-full py-3 rounded-xl font-bold text-sm shadow-sm transition-all bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200 flex items-center justify-center gap-2"
               >
                 <BrainCircuit size={18} />
                 {t.getAdvice}
               </button>

               <button 
                 onClick={calculate}
                 disabled={!winningTile}
                 className={`
                   w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                   ${!winningTile 
                     ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                     : 'bg-green-700 hover:bg-green-600 text-white hover:scale-[1.02]'}
                 `}
               >
                 {t.calculate}
               </button>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}