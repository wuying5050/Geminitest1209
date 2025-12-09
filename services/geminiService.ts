import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameContext, Meld, ScoreResult, TileData, StrategyAdvice, Language } from "../types";
import { TILES_DEF } from "../constants";
import { v4 as uuidv4 } from 'uuid';

const processEnvApiKey = process.env.API_KEY;

const getAiClient = () => {
  if (!processEnvApiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: processEnvApiKey });
};

// Helper to find tile definition
const findTileDef = (suit: string, value: number) => {
  return TILES_DEF.find(t => t.suit === suit && t.value === value);
};

// Helper to map code strings (e.g., "m1") to TileData objects
const mapCodesToTiles = (codes: string[]): TileData[] => {
  const mapped: TileData[] = [];
  codes.forEach(code => {
    // Sanity check for format "m1", "z6" etc.
    if (code.length < 2) return;
    const suit = code.charAt(0);
    const value = parseInt(code.charAt(1));
    const def = findTileDef(suit, value);
    if (def) {
      mapped.push({ ...def, id: uuidv4() });
    }
  });
  return mapped;
};

// Helper to correct counts exceeding 4
const correctTileCounts = (codes: string[]): string[] => {
   const counts: Record<string, number> = {};
   const result = [...codes];
   
   // Count frequencies
   result.forEach(c => counts[c] = (counts[c] || 0) + 1);
   
   // Check for overflow
   for (let i = 0; i < result.length; i++) {
      const code = result[i];
      if (counts[code] > 4) {
         // This tile appears too often. It's likely a misidentified neighbor.
         // Simple heuristic swap for common confusions
         let replacement = code;
         if (code === 's2') replacement = 's8';
         else if (code === 's8') replacement = 's2';
         else if (code === 's3') replacement = 's4';
         else if (code === 's6') replacement = 's9';
         else if (code === 's9') replacement = 's6';
         else if (code === 'p7') replacement = 'p6';
         else if (code === 'p1') replacement = 'p2'; // Rare but possible
         else if (code === 'm1') replacement = 'm2'; 
         
         // Only replace if the replacement is valid (count < 4)
         if (replacement !== code && (counts[replacement] || 0) < 4) {
             result[i] = replacement;
             counts[code]--;
             counts[replacement] = (counts[replacement] || 0) + 1;
         }
      }
   }
   return result;
};

export const calculateScore = async (
  standingTiles: TileData[],
  exposedMelds: Meld[],
  winningTile: TileData | null,
  context: GameContext,
  lang: Language = 'zh'
): Promise<ScoreResult> => {
  const ai = getAiClient();

  const handData = {
    standingTiles: standingTiles.map(t => `${t.suit}${t.value} (${t.symbol})`),
    melds: exposedMelds.map(m => ({
      type: m.type,
      isConcealed: m.isConcealed,
      tiles: m.tiles.map(t => `${t.suit}${t.value} (${t.symbol})`)
    })),
    winningTile: winningTile ? `${winningTile.suit}${winningTile.value} (${winningTile.symbol})` : "Not selected",
    gameContext: {
      prevalentWind: context.prevalentWind,
      seatWind: context.seatWind,
      winBySelfDraw: context.isSelfDrawn,
      lastTileDraw: context.isLastTile,
      robbingTheKong: context.isRobbingKong,
      kongBloom: context.isKongBloom
    }
  };

  const systemInstruction = `
    You are a professional referee for Chinese Official Mahjong (Guobiao Majiang).
    Your task is to calculate the Fan (points) for a winning hand based on the provided tiles and context.
    
    Rules:
    1. STRICTLY follow the 81 standard Fan types of Guobiao Mahjong.
    2. Analyze the combination of "Standing Tiles" (in hand) and "Melds" (exposed/fixed sets) plus the "Winning Tile".
    3. Determine the best possible structure (grouping into Chows, Pungs, Pairs) to maximize the score.
    4. Account for "Non-repeat" principle: Do not count the same pattern twice if implied.
    5. Return the result in a strict JSON format.
    6. Respond in ${lang === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English'}.
    
    Output JSON Schema:
    {
      "totalFan": number,
      "breakdown": [
        { "name": "string (Fan Name)", "fan": number, "description": "string (Reasoning)" }
      ],
      "reasoning": "string (Overall summary)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Calculate score for: ${JSON.stringify(handData)}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalFan: { type: Type.NUMBER },
            breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  fan: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                }
              }
            },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    return JSON.parse(jsonText) as ScoreResult;

  } catch (error) {
    console.error("Scoring error:", error);
    throw new Error(lang === 'zh' ? "计算失败，请重试" : "Failed to calculate score. Please try again.");
  }
};

export const identifyTilesFromImage = async (base64Image: string): Promise<TileData[]> => {
  const ai = getAiClient();

  // Clean base64 string
  const data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const prompt = `
    You are an expert Mahjong Tile Counter. 
    Analyze the image row by row, from Left to Right.
    
    CRITICAL INSTRUCTION: COUNT the details on each tile to distinguish them.
    
    VISUAL DICTIONARY (Bamboo/Sticks - 's'):
    - s1: A BIRD.
    - s2: ONE vertical stick (2 segments). Looks like a single LINE.
    - s3: One stick below, two hanging.
    - s4: Two sticks below, two hanging.
    - s5: 2 top, 1 center, 2 bottom. 
    - s6: 2 top, 4 bottom.
    - s7: 2 top, 3 middle, 2 bottom.
    - s8: TWO 'M' or 'W' shapes stacked. Curvy. NOT straight lines.
    - s9: Three rows of 3 sticks.
    
    Dots ('p'):
    - p1: One huge circle.
    - p2-p9: Count the circles exactly.
    - p7: 3 circles on top (diagonal), 4 on bottom (square).
    
    Characters ('m'):
    - Look for top Chinese number: 一(1) 二(2) 三(3) 四(4) 五(5) 六(6) 七(7) 八(8) 九(9).
    
    Honors ('z'):
    - z5 (White): Blue frame or Blank.
    - z6 (Green): '發'.
    - z7 (Red): '中'.

    PHYSICAL CONSTRAINT: 
    - There are only 4 of each tile. If you think you see 5 's2', check if one is 's8' (W shape) or 's3'.
    - Distinguish s2 (Line) vs s8 (W shape).
    - Distinguish s6 (2+4) vs s9 (3+3+3).
    - Distinguish p7 (diagonal top) vs p6 (2 cols).

    OUTPUT:
    Return a JSON object with a simple list of codes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data } },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0, // Deterministic
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Short reasoning to force model to think without being too verbose
            reasoning: { type: Type.STRING, description: "Briefly list any ambiguous tiles or corrections made based on counts." },
            tiles: {
              type: Type.ARRAY,
              items: { type: Type.STRING } // Simple string array for speed
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    const tileCodes: string[] = result.tiles || [];
    
    const correctedCodes = correctTileCounts(tileCodes);
    return mapCodesToTiles(correctedCodes);
  } catch (error) {
    console.error("Vision error:", error);
    throw new Error("Failed to identify tiles.");
  }
};

export const identifyMeldsFromImage = async (base64Image: string): Promise<TileData[][]> => {
  const ai = getAiClient();
  const data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const prompt = `
    Detect distinct groups of Mahjong tiles (Melds).
    
    VISUAL DEFINITIONS:
    - Bamboo: s1=Bird. s8=W/M shapes. s2=Single Vertical line. s3-s9=Count sticks.
    - Dots: Count circles.
    - Characters: Read Chinese number on top.
    
    Constraint:
    - A group is usually 3 or 4 tiles.
    - Be precise with counts.
    
    Return a list of groups.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data } },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            groups: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    const groups: string[][] = result.groups || [];

    // Apply correction to each group? 
    // Usually melds are small enough that global correction isn't needed, but per-group it makes sense.
    // However, correctTileCounts is global. Let's just return raw groups for now as melds are distinct.
    
    return groups.map(groupCodes => mapCodesToTiles(groupCodes));
  } catch (error) {
    console.error("Vision error (melds):", error);
    throw new Error("Failed to identify melds.");
  }
};

export const getStrategyAdvice = async (
  standingTiles: TileData[],
  exposedMelds: Meld[],
  tableTiles: TileData[],
  lang: Language
): Promise<StrategyAdvice> => {
  const ai = getAiClient();

  const state = {
    hand: standingTiles.map(t => `${t.suit}${t.value}`),
    exposed: exposedMelds.map(m => m.tiles.map(t => `${t.suit}${t.value}`)),
    tableDiscards: tableTiles.map(t => `${t.suit}${t.value}`)
  };

  const systemInstruction = `
    You are a Mahjong expert. Analyze the current hand and table state.
    1. Recommend the best tile to discard.
       IMPORTANT: Return the tile code ONLY (e.g., "m1", "p5", "z6"). Do not return descriptions.
    2. Suggest which Standard Guobiao Fan patterns to aim for.
    3. Identify which tiles to keep.
       IMPORTANT: Return tile codes ONLY (e.g., ["m1", "p5"]).
    4. Consider defensive play based on table discards.
    5. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this Mahjong state: ${JSON.stringify(state)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedDiscard: { type: Type.STRING, description: "Tile code only, e.g. m1, p2" },
            targetFanPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING },
            keepTiles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of tile codes" }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as StrategyAdvice;
  } catch (error) {
    console.error("Strategy error:", error);
    throw new Error("Failed to get advice.");
  }
};