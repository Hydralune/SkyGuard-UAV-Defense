import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import FileViewer from '@/components/FileViewer'
import ImageGallery from '@/components/ImageGallery'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import {
  Eye,
  Play,
  Pause,
  RotateCcw,
  Download,
  Maximize,
  Settings,
  Image,
  BarChart3,
  TrendingUp,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function Visualization() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedView, setSelectedView] = useState('gallery')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [taskId, setTaskId] = useState(null)
  const [taskResults, setTaskResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imagesByType, setImagesByType] = useState({})
  const [selectedType, setSelectedType] = useState(null)
  const [fullScreenImage, setFullScreenImage] = useState(null)
  const [selectedTab, setSelectedTab] = useState('gallery')

  // 模拟数据
  const attackProgress = [
    { step: 0, name: '原始图像', confidence: 0.95, detected: true },
    { step: 1, name: '扰动生成', confidence: 0.92, detected: true },
    { step: 2, name: '扰动应用', confidence: 0.78, detected: true },
    { step: 3, name: '攻击完成', confidence: 0.23, detected: false }
  ]

  const detectionResults = [
    { class: 'person', original: 0.95, adversarial: 0.23, change: -0.72 },
    { class: 'car', original: 0.88, adversarial: 0.15, change: -0.73 },
    { class: 'bicycle', original: 0.76, adversarial: 0.08, change: -0.68 },
    { class: 'dog', original: 0.82, adversarial: 0.31, change: -0.51 }
  ]

  const perturbationAnalysis = [
    { pixel: 0, original: 128, adversarial: 135, perturbation: 7 },
    { pixel: 100, original: 64, adversarial: 71, perturbation: 7 },
    { pixel: 200, original: 192, adversarial: 185, perturbation: -7 },
    { pixel: 300, original: 96, adversarial: 103, perturbation: 7 },
    { pixel: 400, original: 160, adversarial: 153, perturbation: -7 }
  ]

  const defenseEffectiveness = [
    { method: 'PGD Training', clean: 92, robust: 78, improvement: 45 },
    { method: 'FGM', clean: 90, robust: 72, improvement: 38 },
    { method: 'Preprocessing', clean: 89, robust: 65, improvement: 25 },
    { method: 'Detection', clean: 91, robust: 85, improvement: 52 }
  ]

  // 从URL获取任务ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('task_id');
    if (id) {
      setTaskId(id);
    }
  }, []);

  // 获取任务结果数据
  useEffect(() => {
    const fetchTaskResults = async () => {
      if (!taskId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 获取可视化结果 - 使用代理路径
        const apiUrl = `/visualization/results/${taskId}`;
        console.log(`尝试获取结果: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`获取结果失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('获取到的可视化结果:', data);
        
        setTaskResults(data);
        
        // 按类型组织图像
        if (data && data.images && data.images.length > 0) {
          const imageTypes = {};
          
          // 按类型分组图像
          data.images.forEach(img => {
            if (!imageTypes[img.type]) {
              imageTypes[img.type] = [];
            }
            imageTypes[img.type].push(img);
          });
          
          setImagesByType(imageTypes);
          console.log('按类型分组的图像:', imageTypes);
        }
      } catch (error) {
        console.error('获取任务结果失败:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskResults();
  }, [taskId]);
  
  // 动画播放控制
  useEffect(() => {
    let interval
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % attackProgress.length)
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">攻防过程可视化</h1>
          <p className="text-muted-foreground mt-2">
            {taskId ? `任务ID: ${taskId}` : '请传入task_id参数'}
          </p>
          {loading && <p className="text-blue-500">加载中...</p>}
          {error && <p className="text-red-500">错误: {error}</p>}
        </div>
        <div className="flex space-x-2">
          {taskResults && (
            <div className="flex space-x-2">
              <Select
                value={selectedType || (Object.keys(imagesByType)[0] || '')}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择图像类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(imagesByType).map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                      <span className="ml-2 text-xs text-muted-foreground">({imagesByType[type].length})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedTab}
                onValueChange={setSelectedTab}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="选择视图" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gallery">图库视图</SelectItem>
                  <SelectItem value="comparison">对比视图</SelectItem>
                  <SelectItem value="metrics">指标分析</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>
      </div>

      {/* 主要可视化区域 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧图像对比 */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    样本对比分析
                  </CardTitle>
                  <CardDescription>
                    原始样本与对抗样本的视觉对比
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>缩放:</Label>
                  <Slider
                    value={[zoomLevel]}
                    onValueChange={(value) => setZoomLevel(value[0])}
                    max={3}
                    min={0.5}
                    step={0.1}
                    className="w-20"
                  />
                  <Button variant="outline" size="sm">
                    <Maximize className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedView} onValueChange={setSelectedView}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="detection">原始检测</TabsTrigger>
                  <TabsTrigger value="adversarial">对抗样本</TabsTrigger>
                  <TabsTrigger value="comparison">对比结果</TabsTrigger>
                  <TabsTrigger value="perturbation">扰动图</TabsTrigger>
                </TabsList>

                <TabsContent value="detection" className="mt-4">
                  {imagesByType['detection_results'] ? (
                    <FileViewer 
                      files={imagesByType['detection_results']} 
                      type="detection_results" 
                      title="原始检测结果" 
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">无原始检测结果</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="adversarial" className="mt-4">
                  {imagesByType['adversarial_results'] ? (
                    <FileViewer 
                      files={imagesByType['adversarial_results']} 
                      type="adversarial_results" 
                      title="对抗样本检测结果" 
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-2" />
                        <p className="text-sm text-red-600">无对抗样本结果</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="comparison" className="mt-4">
                  {imagesByType['comparison_results'] ? (
                    <FileViewer 
                      files={imagesByType['comparison_results']} 
                      type="comparison_results" 
                      title="检测结果对比" 
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                        <p className="text-sm text-blue-600">无对比结果</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="perturbation" className="mt-4">
                  {imagesByType['perturbation_results'] ? (
                    <FileViewer 
                      files={imagesByType['perturbation_results']} 
                      type="perturbation_results" 
                      title="扰动可视化" 
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Zap className="h-12 w-12 mx-auto text-purple-500 mb-2" />
                        <p className="text-sm text-purple-600">无扰动可视化结果</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="gallery" className="mt-4">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">图像库</h4>
                      {fullScreenImage && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFullScreenImage(null)}
                        >
                          关闭全屏
                        </Button>
                      )}
                    </div>
                    
                    {fullScreenImage ? (
                      <ImageGallery 
                        images={imagesByType[selectedType] || []} 
                        initialIndex={selectedImageIndex} 
                        onClose={() => setFullScreenImage(null)} 
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.keys(imagesByType).length > 0 ? (
                          Object.entries(imagesByType).map(([type, images]) => (
                            <div key={`image-type-${type}`} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h5 className="text-sm font-medium capitalize">{type.replace('_', ' ')} ({images.length})</h5>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedType(type);
                                    setSelectedImageIndex(0);
                                    setFullScreenImage(true);
                                  }}
                                >
                                  查看全部
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {images.slice(0, 6).map((image, idx) => (
                                  <div 
                                    key={`image-${type}-${idx}`} 
                                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                                    onClick={() => {
                                      setSelectedType(type);
                                      setSelectedImageIndex(idx);
                                      setFullScreenImage(true);
                                    }}
                                  >
                                    <img 
                                      src={image.url} 
                                      alt={`${type} ${idx}`} 
                                      className="max-w-full max-h-full object-cover hover:scale-105 transition-transform"
                                    />
                                  </div>
                                ))}
                                {images.length > 6 && (
                                  <div 
                                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() => {
                                      setSelectedType(type);
                                      setSelectedImageIndex(6);
                                      setFullScreenImage(true);
                                    }}
                                  >
                                    <div className="text-center">
                                      <p className="text-sm text-muted-foreground">
                                        +{images.length - 6} 更多
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center col-span-3">
                            <div className="text-center">
                              <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">无可用图像</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="plots" className="mt-4">
                  {imagesByType['plots'] ? (
                    <FileViewer 
                      files={imagesByType['plots']} 
                      type="plots" 
                      title="分析图表" 
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                        <p className="text-sm text-blue-600">无分析图表</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 检测结果对比 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                检测结果对比
              </CardTitle>
              <CardDescription>原始样本与对抗样本的检测置信度对比</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value="metrics" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="metrics">指标对比</TabsTrigger>
                  <TabsTrigger value="vulnerability">类别脆弱性</TabsTrigger>
                  <TabsTrigger value="confidence">置信度分析</TabsTrigger>
                </TabsList>
                
                <TabsContent value="metrics" className="mt-4">
                  {taskResults?.metrics?.progress?.metrics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">检测减少率</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-red-500">
                              {(taskResults.metrics.progress.metrics.detection_reduction_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">检测结果减少百分比</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">置信度降低</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-amber-500">
                              {(taskResults.metrics.progress.metrics.avg_confidence_drop * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">平均置信度降低百分比</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">原始检测数</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-green-500">
                              {taskResults.metrics.progress.metrics.total_original_detections}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">原始图像中的检测目标数</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">对抗检测数</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-blue-500">
                              {taskResults.metrics.progress.metrics.total_adversarial_detections}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">对抗图像中的检测目标数</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">平均推理时间</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold">
                              {taskResults.metrics.progress.metrics.avg_inference_time.toFixed(3)}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground">秒</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">模型推理平均时间</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">平均攻击时间</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold">
                              {taskResults.metrics.progress.metrics.avg_attack_time.toFixed(3)}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground">秒</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">生成对抗样本平均时间</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">无指标数据</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="vulnerability" className="mt-4">
                  {taskResults?.metrics?.progress?.metrics?.class_vulnerability ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={Object.entries(taskResults.metrics.progress.metrics.class_vulnerability).map(([className, value]) => ({
                          class: className,
                          vulnerability: value
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="class" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="vulnerability" 
                          name="类别脆弱性" 
                          fill="#8884d8"
                          // 根据值的正负设置不同颜色
                          >
                          {Object.entries(taskResults.metrics.progress.metrics.class_vulnerability).map(([className, value], index) => (
                            <Cell key={`vulnerability-cell-${className}-${index}`} fill={value > 0 ? "#ef4444" : "#22c55e"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">无类别脆弱性数据</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="confidence" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={detectionResults}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="class" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="original" fill="#22c55e" name="原始置信度" />
                      <Bar dataKey="adversarial" fill="#ef4444" name="对抗置信度" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* 右侧控制和统计 */}
        <div className="space-y-6">
          {/* 攻击进度 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>攻击进度</CardTitle>
              <CardDescription>当前攻击步骤和状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {attackProgress.map((step, index) => (
                <div key={`progress-step-${index}`} className={`flex items-center space-x-3 p-2 rounded-lg ${
                  index === currentStep ? 'bg-blue-50 border border-blue-200' : ''
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    index < currentStep ? 'bg-green-500' :
                    index === currentStep ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">
                      置信度: {step.confidence}
                    </p>
                  </div>
                  {step.detected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 扰动分析 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>扰动分析</CardTitle>
              <CardDescription>像素级扰动统计</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={perturbationAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pixel" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="perturbation" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>平均扰动</span>
                  <span className="font-medium">±5.2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>最大扰动</span>
                  <span className="font-medium">±8.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>L∞范数</span>
                  <span className="font-medium">0.031</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 防御效果 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>防御效果评估</CardTitle>
              <CardDescription>不同防御方法的效果对比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defenseEffectiveness.map((defense, index) => (
                  <div key={`defense-method-${index}`} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{defense.method}</span>
                      <Badge variant={defense.improvement > 40 ? 'default' : 'secondary'}>
                        +{defense.improvement}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>清洁准确率</span>
                        <span>{defense.clean}%</span>
                      </div>
                      <Progress value={defense.clean} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span>鲁棒准确率</span>
                        <span>{defense.robust}%</span>
                      </div>
                      <Progress value={defense.robust} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 可视化设置 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                可视化设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">实时更新</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">显示置信度</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">显示边界框</Label>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">高对比度模式</Label>
                <Switch />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">更新频率 (ms)</Label>
                <Slider defaultValue={[1000]} max={5000} min={100} step={100} />
              </div>
              
              <Button variant="outline" className="w-full">
                <Download className="h-3 w-3 mr-2" />
                导出可视化
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

