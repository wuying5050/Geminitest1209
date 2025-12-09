import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, imageUrl, onClose, title }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="relative bg-white rounded-lg overflow-hidden max-w-4xl max-h-[90vh] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-stone-200 bg-stone-50">
          <h3 className="font-semibold text-stone-700 flex items-center gap-2">
            <ZoomIn size={18} />
            {title || 'Image Preview'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-stone-200 rounded-full transition-colors text-stone-500"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-2">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
        <div className="p-3 bg-stone-50 text-center text-xs text-stone-500 border-t border-stone-200">
           Click outside or press X to close and continue editing tiles
        </div>
      </div>
    </div>
  );
};