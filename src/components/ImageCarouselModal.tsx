import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselModalProps {
  images: string[]; // First image is main, rest are additional
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageCarouselModal({ images, isOpen, onClose }: ImageCarouselModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to first image when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  if (!isOpen || images.length === 0) return null;

  const allImages = images.length > 0 ? images : [images[0]];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Image display area */}
        <div className="flex-1 flex items-center justify-center bg-black/50 rounded-t-2xl overflow-hidden min-h-[400px]">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={allImages[currentIndex]}
              alt={`Product image ${currentIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain"
            />
            
            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-b-2xl">
            <div className="flex gap-2 overflow-x-auto justify-center pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentIndex 
                      ? "border-primary scale-105" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-center text-white/70 text-xs mt-2">
              {currentIndex + 1} / {allImages.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}