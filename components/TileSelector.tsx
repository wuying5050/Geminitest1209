import React from 'react';
import { TILES_DEF } from '../constants';
import { TileData } from '../types';
import { Tile } from './Tile';

interface TileSelectorProps {
  onSelect: (tile: Omit<TileData, 'id'>) => void;
}

export const TileSelector: React.FC<TileSelectorProps> = ({ onSelect }) => {
  return (
    <div className="bg-stone-800 p-4 rounded-lg shadow-inner overflow-x-auto">
      <h3 className="text-stone-300 text-sm font-semibold mb-3 uppercase tracking-wider">Select Tiles</h3>
      <div className="flex flex-col gap-4 min-w-max">
        {/* Group by category for cleaner UI */}
        <div className="flex gap-2">
           {TILES_DEF.filter(t => t.suit === 'm').map((tile) => (
             <Tile key={`sel-${tile.suit}-${tile.value}`} tile={tile} size="sm" onClick={() => onSelect(tile)} />
           ))}
        </div>
        <div className="flex gap-2">
           {TILES_DEF.filter(t => t.suit === 'p').map((tile) => (
             <Tile key={`sel-${tile.suit}-${tile.value}`} tile={tile} size="sm" onClick={() => onSelect(tile)} />
           ))}
        </div>
        <div className="flex gap-2">
           {TILES_DEF.filter(t => t.suit === 's').map((tile) => (
             <Tile key={`sel-${tile.suit}-${tile.value}`} tile={tile} size="sm" onClick={() => onSelect(tile)} />
           ))}
        </div>
        <div className="flex gap-2">
           {TILES_DEF.filter(t => t.suit === 'z').map((tile) => (
             <Tile key={`sel-${tile.suit}-${tile.value}`} tile={tile} size="sm" onClick={() => onSelect(tile)} />
           ))}
        </div>
      </div>
    </div>
  );
};
