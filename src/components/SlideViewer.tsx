import React, { useEffect, useState } from 'react';
import pptxgen from 'pptxgenjs';

interface SlideViewerProps {
  selectedSlide: string | null;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ selectedSlide }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSlide) return;

    const loadPresentation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(selectedSlide);
        const arrayBuffer = await response.arrayBuffer();
        
        const pptx = new pptxgen();
        await pptx.load(arrayBuffer);
        
        const slides = pptx.getSlides();
        const container = document.getElementById('slide-container');
        if (container) {
          container.innerHTML = '';
          
          slides.forEach((slide, index) => {
            const canvas = document.createElement('canvas');
            canvas.className = 'w-full mb-4 border border-gray-200 rounded';
            container.appendChild(canvas);
            slide.render(canvas);
          });
        }
      } catch (err) {
        setError('Failed to load presentation. Please make sure it\'s a valid PowerPoint file.');
        console.error('Error loading presentation:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPresentation();
  }, [selectedSlide]);

  if (!selectedSlide) {
    return (
      <div className="bg-white p-8 rounded-lg shadow min-h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          No presentation selected
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {loading && (
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center text-gray-500">
            Loading presentation...
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center text-red-500">
            {error}
          </div>
        </div>
      )}
      
      <div 
        id="slide-container"
        className="min-h-[800px] overflow-auto"
      />
    </div>
  );
};