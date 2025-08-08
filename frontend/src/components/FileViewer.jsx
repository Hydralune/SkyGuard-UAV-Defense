import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize, Download } from 'lucide-react';
import ImageGallery from './ImageGallery';

const FileViewer = ({ files, type, title, getTitle, getTypeLabel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // 当files变化时重置当前索引
  useEffect(() => {
    setCurrentIndex(0);
  }, [files]);
  
  if (!files || files.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-500">没有{title || '文件'}</p>
        </CardContent>
      </Card>
    );
  }
  
  const currentFile = files[currentIndex];
  const headerTitle = getTitle ? getTitle(currentFile) : (title || type);
  const headerTypeLabel = getTypeLabel ? getTypeLabel(currentFile) : (type || currentFile?.type);
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };
  
  const handleFullScreen = () => {
    setFullScreen(true);
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = currentFile.path.split('/').pop() || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium">{headerTitle}</h3>
              {headerTypeLabel && (
                <Badge variant="secondary" className="capitalize">{headerTypeLabel}</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {files.length}
              </span>
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={files.length <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={files.length <= 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleFullScreen}>
                <Maximize className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={currentFile.url}
              alt={currentFile.path}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm font-medium">{headerTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentFile.path.split('/').pop()}
            </p>
          </div>
          
          {files.length > 1 && (
            <div className="mt-4 flex items-center justify-center space-x-1 overflow-x-auto py-2">
              {files.map((file, idx) => (
                <div 
                  key={idx} 
                  className={`h-12 w-12 flex-shrink-0 cursor-pointer border ${idx === currentIndex ? 'border-primary' : 'border-gray-200'}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <img 
                    src={file.url} 
                    alt={`缩略图 ${idx + 1}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {fullScreen && (
        <ImageGallery 
          images={files} 
          initialIndex={currentIndex} 
          onClose={() => setFullScreen(false)} 
        />
      )}
    </>
  );
};

export default FileViewer;