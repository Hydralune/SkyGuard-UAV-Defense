import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download, RotateCw, Maximize, Minimize } from 'lucide-react';

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  
  // 防止页面滚动
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
    setRotation(0);
  }, [images.length]);
  
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setRotation(0);
  }, [images.length]);
  
  // 键盘快捷键（迁移到下方，确保依赖的回调已定义）
  
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-gray-500">没有可用图像</p>
      </div>
    );
  }
  
  const currentImage = images[currentIndex];
  
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 5));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.1));
  }, []);

  // 键盘快捷键（确保依赖的回调已定义再注册监听）
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '=':
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          setRotation(prev => prev + 90);
          break;
        case 'f':
        case 'F':
          setIsFullscreen(prev => !prev);
          break;
        case 't':
        case 'T':
          setShowThumbnails(prev => !prev);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut]);
  
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
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
  
  // 处理背景点击关闭
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 获取图像类型和文件名的显示格式
  const getImageInfo = (image) => {
    const fileName = image.path.split('/').pop() || 'image';
    const fileType = image.type || 'unknown';
    return { fileName, fileType };
  };

  return (
    <div 
      className={`fixed inset-0 bg-black ${isFullscreen ? 'bg-opacity-95' : 'bg-opacity-85'} z-[9999] flex flex-col transition-all duration-300`}
      onClick={handleBackgroundClick}
    >
      {/* 顶部控制栏 */}
      <div className={`flex justify-between items-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300 ${isFullscreen ? 'bg-opacity-40' : ''}`}>
        <div className="text-white flex items-center space-x-3">
          <div>
            <div className="text-sm font-medium">{getImageInfo(currentImage).fileName}</div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {getImageInfo(currentImage).fileType.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-gray-300">
                {currentIndex + 1} / {images.length}
              </span>
              <span className="text-xs text-gray-300">
                {Math.round(zoomLevel * 100)}% 
                {rotation !== 0 && ` • ${rotation}°`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleZoomOut}
            className="text-white hover:bg-white/20 transition-colors"
            title="缩小 (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleZoomIn}
            className="text-white hover:bg-white/20 transition-colors"
            title="放大 (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRotate}
            className="text-white hover:bg-white/20 transition-colors"
            title="旋转 (R)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="text-white hover:bg-white/20 transition-colors text-xs px-2"
            title="重置"
          >
            1:1
          </Button>
          <div className="mx-1 h-4 border-l border-white/30"></div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-white hover:bg-white/20 transition-colors"
            title="全屏 (F)"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="text-white hover:bg-white/20 transition-colors text-xs px-2"
            title="缩略图 (T)"
          >
            T
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="text-white hover:bg-white/20 transition-colors"
            title="下载"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-red-500/50 transition-colors"
            title="关闭 (ESC)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 图像显示区域 */}
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左侧导航按钮 */}
        {images.length > 1 && (
          <Button 
            variant="ghost" 
            className="absolute left-4 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 opacity-80 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="上一张 (←)"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </Button>
        )}
        
        {/* 图像容器 */}
        <div 
          className="h-full w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={zoomLevel === 1 ? handleZoomIn : handleReset}
        >
          <img
            src={currentImage.url}
            alt={currentImage.path}
            className="max-h-full max-w-full object-contain transition-all duration-300 select-none shadow-2xl"
            style={{ 
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              filter: isFullscreen ? 'drop-shadow(0 0 20px rgba(255,255,255,0.1))' : 'none'
            }}
            draggable={false}
          />
        </div>
        
        {/* 右侧导航按钮 */}
        {images.length > 1 && (
          <Button 
            variant="ghost" 
            className="absolute right-4 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 opacity-80 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="下一张 (→)"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>
      
      {/* 缩略图预览 */}
      {showThumbnails && images.length > 1 && (
        <div 
          className={`bg-black bg-opacity-60 backdrop-blur-sm flex items-center overflow-x-auto p-3 transition-all duration-300 ${
            isFullscreen ? 'h-16 bg-opacity-40' : 'h-20'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center space-x-2">
            {images.map((img, idx) => {
              const { fileType } = getImageInfo(img);
              return (
                <div 
                  key={`thumb-${idx}`} 
                  className={`relative flex-shrink-0 cursor-pointer border-2 rounded-lg transition-all duration-200 hover:border-blue-400 ${
                    idx === currentIndex 
                      ? 'border-blue-500 shadow-lg scale-105' 
                      : 'border-gray-600 hover:border-gray-400'
                  } ${isFullscreen ? 'h-10 w-10' : 'h-14 w-14'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  title={`${getImageInfo(img).fileName} (${fileType})`}
                >
                  <img 
                    src={img.url} 
                    alt={`缩略图 ${idx + 1}`} 
                    className="h-full w-full object-cover rounded pointer-events-none"
                    draggable={false}
                  />
                  {idx === currentIndex && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded pointer-events-none"></div>
                  )}
                  {/* 类型标签 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded-b truncate">
                    {fileType.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* 快捷键提示 */}
      {!isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs p-2 rounded-lg opacity-60 hover:opacity-90 transition-opacity">
          <div className="space-y-1">
            <div>ESC: 关闭 | ←→: 切换 | +/-: 缩放</div>
            <div>R: 旋转 | F: 全屏 | T: 缩略图 | 双击: 缩放</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;