import React, { useState, useEffect } from 'react';
import { SlideList } from './components/SlideList';
import { SlideViewer } from './components/SlideViewer';
import { SlideFile } from './types';

export default function App() {
  const [slides, setSlides] = useState<SlideFile[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null);

  useEffect(() => {
    // Get slides list
    fetch('/slides/')
      .then(response => response.text())
      .then(text => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const files = Array.from(doc.querySelectorAll('a'))
          .filter(a => a.href.endsWith('.pptx'))
          .map(a => ({
            name: a.textContent?.replace('.pptx', '') || '',
            path: a.href
          }));
        setSlides(files);
        if (files.length > 0) {
          setSelectedSlide(files[0].path);
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Slide Viewer</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SlideList 
            slides={slides} 
            selectedSlide={selectedSlide}
            onSelectSlide={setSelectedSlide}
          />
          <div className="md:col-span-3">
            <SlideViewer selectedSlide={selectedSlide} />
          </div>
        </div>
      </div>
    </div>
  );
}