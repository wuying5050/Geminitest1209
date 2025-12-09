import React from 'react';
import { TileData, Suit } from '../types';

interface TileProps {
  tile: Omit<TileData, 'id'>;
  onClick?: () => void;
  selected?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Tile: React.FC<TileProps> = ({ tile, onClick, selected, size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-9 text-lg',
    sm: 'w-9 h-12 text-2xl',
    md: 'w-11 h-16 text-4xl', 
    lg: 'w-14 h-20 text-5xl',
    xl: 'w-20 h-28 text-6xl',
  };

  const getColorClass = () => {
    switch(tile.suit) {
      case Suit.Man: return 'text-red-700'; // Characters typically red/black mixed, using red for visibility
      case Suit.Sou: return 'text-green-700'; // Bamboo typically green
      case Suit.Pin: return 'text-blue-700'; // Dots typically blue/green
      case Suit.Honor:
        if (tile.value === 6) return 'text-green-700'; // Green Dragon
        if (tile.value === 7) return 'text-red-700'; // Red Dragon
        return 'text-black'; // Winds and others
      default: return 'text-black';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex items-center justify-center 
        bg-white rounded-[2px] 
        cursor-pointer select-none
        transition-transform duration-100
        ${sizeClasses[size]}
        ${selected ? '-translate-y-3' : ''}
        ${className}
      `}
      style={{
         // Realistic 3D Block Effect: Simulating the green back of the tile
         boxShadow: selected 
            ? '1px 1px 4px rgba(0,0,0,0.5), 2px 2px 0 #059669' // Green-600 shadow when popped up
            : '2px 2px 5px rgba(0,0,0,0.3), 3px 3px 0 #15803d', // Green-700 depth block
         borderTop: '1px solid #f5f5f4', // Top Highlight
         borderLeft: '1px solid #f5f5f4', // Left Highlight
      }}
    >
      {/* 
         White Dragon (z5): Standard Guobiao uses a Blue Frame. 
         We draw this with CSS to ensure it looks correct without needing external fonts or images.
      */}
      {tile.suit === Suit.Honor && tile.value === 5 ? (
         <div className="w-full h-full p-[15%] flex items-center justify-center">
             <div className="w-full h-full border-[3px] border-blue-800 rounded-[2px] flex items-center justify-center">
                 <div className="w-[85%] h-[85%] border border-blue-800 rounded-[1px]"></div>
             </div>
         </div>
      ) : (
         <span className={`${getColorClass()} font-serif leading-none filter drop-shadow-sm scale-[1.2] pb-1`}>{tile.symbol}</span>
      )}
    </div>
  );
};