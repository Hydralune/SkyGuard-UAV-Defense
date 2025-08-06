import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download } from 'lucide-react';

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-gray-500">没有可用图像</p>
      </div>
    );
  }
  
  const currentImage = images[currentIndex];
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };
  
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };
  
  const handleDownload = () => {
    // 创建一个临时链接并触发下载
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = currentImage.path.split('/').pop() || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col">
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
        <div className="text-white">
          {currentImage.path.split('/').pop()} ({currentIndex + 1}/{images.length})
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
      
      {/* 图像显示区域 */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <Button 
          variant="ghost" 
          className="absolute left-4 z-10 rounded-full bg-black bg-opacity-50"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </Button>
        
        <div className="h-full w-full flex items-center justify-center overflow-auto">
          <img
            src={currentImage.url}
            alt={currentImage.path}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          />
        </div>
        
        <Button 
          variant="ghost" 
          className="absolute right-4 z-10 rounded-full bg-black bg-opacity-50"
          onClick={handleNext}
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </Button>
      </div>
      
      {/* 缩略图预览 */}
      <div className="h-20 bg-black bg-opacity-50 flex items-center overflow-x-auto p-2">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className={`h-16 w-16 flex-shrink-0 mx-1 cursor-pointer border-2 ${idx === currentIndex ? 'border-blue-500' : 'border-transparent'}`}
            onClick={() => setCurrentIndex(idx)}
          >
            <img 
              src={img.url} 
              alt={`缩略图 ${idx + 1}`} 
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;