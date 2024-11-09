import React from 'react';
import { SlideFile } from '../types';

interface SlideListProps {
  slides: SlideFile[];
  selectedSlide: string | null;
  onSelectSlide: (path: string) => void;
}

export const SlideList: React.FC<SlideListProps> = ({ 
  slides, 
  selectedSlide, 
  onSelectSlide 
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Slides</h2>
      <ul className="space-y-2">
        {slides.map((slide) => (
          <li key={slide.path}>
            <button
              className={`w-full text-left px-3 py-2 rounded ${
                selectedSlide === slide.path
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectSlide(slide.path)}
            >
              {slide.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};