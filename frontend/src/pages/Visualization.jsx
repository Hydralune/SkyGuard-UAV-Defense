import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiGet, API_ENDPOINTS } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
  const [selectedView, setSelectedView] = useState('gallery') // 默认显示图库
  const [selectedCompareTab, setSelectedCompareTab] = useState('metrics')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [taskId, setTaskId] = useState(null)
  const [taskResults, setTaskResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imagesByType, setImagesByType] = useState({})
  const [selectedType, setSelectedType] = useState(null)
  const [fullScreenImage, setFullScreenImage] = useState(null)
  const [taskInfo, setTaskInfo] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [manualTaskId, setManualTaskId] = useState('')
  const [resolvingTask, setResolvingTask] = useState(false)
  const [taskSelectOpen, setTaskSelectOpen] = useState(false)

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

  // 从URL获取任务ID，如果没有则获取最新任务
  useEffect(() => {
    const initializeVisualization = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('task_id');
        console.log('URL参数 task_id:', id);
        
        if (id) {
          console.log('使用URL中的task_id:', id);
          setTaskId(id);
        } else {
          console.log('URL中没有task_id，获取最新任务');
          // 如果没有指定task_id，获取最新的任务
          await fetchLatestTask();
        }
      } catch (error) {
        console.error('初始化可视化失败:', error);
        setError(`初始化失败: ${error.message}`);
      }
    };

    initializeVisualization();
  }, []);

  // 周期性获取最近任务（如果后端仅提供 latest-task，则维护一个简单的最近列表）
  const fetchRecentTasks = async () => {
    try {
      // 优先读新的 recent 列表；后备到 latest
      const res = await apiGet(API_ENDPOINTS.VISUALIZATION_RECENT_TASKS, { limit: 10 })
      if (res.ok) {
        const list = await res.json()
        if (Array.isArray(list) && list.length) {
          setRecentTasks(list)
          return
        }
      }
      const res2 = await apiGet(API_ENDPOINTS.VISUALIZATION_LATEST_TASK)
      if (res2.ok) {
        const lt = await res2.json()
        if (lt?.task_id) setRecentTasks([lt])
      }
    } catch (_) {}
  }

  useEffect(() => {
    fetchRecentTasks()
    const t = setInterval(fetchRecentTasks, 5000)
    return () => clearInterval(t)
  }, [])

  const fetchTaskResultsById = async (id) => {
    try {
      setLoading(true)
      const response = await apiGet(API_ENDPOINTS.VISUALIZATION_RESULTS(id))
      const data = await response.json()
      setTaskResults(data)
      if (data?.images?.length) {
        const grouped = {}
        data.images.forEach(img => {
          if (!grouped[img.type]) grouped[img.type] = []
          grouped[img.type].push(img)
        })
        // 兼容：将 original_results 也映射到 detection_results，便于“原始检测”页签显示
        if (!grouped['detection_results'] && grouped['original_results']) {
          grouped['detection_results'] = grouped['original_results']
        }
        setImagesByType(grouped)
        if (!selectedType) setSelectedType(Object.keys(grouped)[0])
      } else {
        setImagesByType({})
      }
    } finally {
      setLoading(false)
    }
  }

  const resolveTaskId = async (id) => {
    if (!id) return
    try {
      setResolvingTask(true)
      setError(null)
      setTaskId(id)
      setTaskInfo({ ...(taskInfo || {}), task_id: id })
      const newUrl = new URL(window.location)
      newUrl.searchParams.set('task_id', id)
      window.history.replaceState({}, '', newUrl)
      await fetchTaskResultsById(id)
    } catch (e) {
      setError(`任务 ${id} 加载失败：${e.message}`)
    } finally {
      setResolvingTask(false)
    }
  }

  // 获取最新完成的任务
  const fetchLatestTask = async () => {
    try {
      console.log('开始获取最新任务...');
      setLoading(true);
      setError(null);
      
      const response = await apiGet(API_ENDPOINTS.VISUALIZATION_LATEST_TASK);
      console.log('最新任务API响应状态:', response.status);
      
      const latestTask = await response.json();
      console.log('获取到最新任务:', latestTask);
      
      if (latestTask && latestTask.task_id) {
        console.log('设置task_id:', latestTask.task_id);
        setTaskId(latestTask.task_id);
        setTaskInfo(latestTask);
        // 更新URL以便用户可以刷新或分享
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('task_id', latestTask.task_id);
        window.history.replaceState({}, '', newUrl);
        console.log('已更新URL:', newUrl.toString());
      } else {
        console.warn('最新任务响应中没有task_id');
        setError('未找到有效的任务ID');
      }
    } catch (error) {
      console.error('获取最新任务失败:', error);
      setError(`获取最新任务失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 获取任务结果数据
  useEffect(() => {
    const fetchTaskResults = async () => {
      if (!taskId) {
        console.log('没有taskId，跳过获取任务结果');
        return;
      }
      
      try {
        console.log('开始获取任务结果，taskId:', taskId);
        setLoading(true);
        setError(null);
        
        // 获取可视化结果 - 使用代理路径
        const apiUrl = API_ENDPOINTS.VISUALIZATION_RESULTS(taskId);
        console.log(`尝试获取结果: ${apiUrl}`);
        
        const response = await apiGet(apiUrl);
        console.log('任务结果API响应状态:', response.status);
        
        const data = await response.json();
        console.log('获取到的可视化结果:', data);
        console.log('图像数量:', data.images ? data.images.length : 0);
        console.log('指标数据:', data.metrics ? 'exists' : 'missing');
        
        setTaskResults(data);
        
        // 按类型组织图像
        if (data && Array.isArray(data.images) && data.images.length > 0) {
          const imageTypes = {};
          
          // 按类型分组图像
          data.images.forEach(img => {
            if (!imageTypes[img.type]) {
              imageTypes[img.type] = [];
            }
            imageTypes[img.type].push(img);
          });
          // 兼容：将 original_results 也映射到 detection_results
          if (!imageTypes['detection_results'] && imageTypes['original_results']) {
            imageTypes['detection_results'] = imageTypes['original_results']
          }
          
          setImagesByType(imageTypes);
          console.log('按类型分组的图像:', imageTypes);
          
          // 设置默认选择的类型
          if (Object.keys(imageTypes).length > 0 && !selectedType) {
            const firstType = Object.keys(imageTypes)[0];
            console.log('设置默认选择类型:', firstType);
            setSelectedType(firstType);
          }
        } else {
          console.warn('没有找到图像数据');
          setImagesByType({});
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
  
  // 分析图表类型：排除基础检测类，剩余即为分析/图表类
  const baseImageTypes = [
    'detection_results',
    'adversarial_results',
    'comparison_results',
    'perturbation_results',
    // 兼容后端可能返回的额外命名
    'detections', 'attacks', 'defenses',
    // 兼容防御评估
    'original_results', 'defended_results'
  ]
  const analysisImageTypes = Object.keys(imagesByType).filter(type => !baseImageTypes.includes(type))

  // 映射后端图表文件名到中文标题
  const getChartTitle = (file) => {
    const sourceRaw = (file?.filename || file?.path || '')
    const source = sourceRaw.toLowerCase()
    // 更全面的匹配（根据后端常见命名与图标题关键词）
    if (source.includes('detection_count_comparison') || source.includes('count_comparison')) return '检测数量对比（原/攻）'
    if (source.includes('detection_count_triplet')) return '检测数量三段对比（原/攻/防）'
    if (source.includes('class_distribution_comparison')) return '类别分布对比'
    if (source.includes('class_distribution_triplet')) return '类别分布三段对比'
    if (source.includes('confidence_distribution_comparison')) return '置信度分布对比'
    if (source.includes('confidence_distribution_triplet')) return '置信度分布三段对比'
    if (source.includes('confusion_matrix')) return '混淆矩阵'
    if (source.includes('pr_curve') || source.includes('precision-recall') || source.includes('precision_recall')) return '精确率-召回曲线'
    if (source.includes('class_distribution')) return '类别分布'
    if (source.includes('confidence_distribution')) return '置信度分布'
    // 新增：Top 10 Most Vulnerable Classes
    if (source.includes('most_vulnerable_classes') || source.includes('vulnerable_classes') || source.includes('top10_vulnerable') || source.includes('top_10_most_vulnerable')) return 'Top 10 易受攻击类别'
    // 新增：Attack Time Distribution
    if (source.includes('attack_time_distribution') || source.replace(/[^a-z]/g,'').includes('attacktimedistribution')) return '攻击时间分布'
    // 新增：Confidence Drop by Image
    if (source.includes('confidence_drop_by_image') || source.replace(/[^a-z]/g,'').includes('confidencedropbyimage') || source.includes('confidence_drop')) return '按图像的置信度下降'
    // 新增：Detection Drop Rate by Image
    if (source.includes('detection_drop_rate_by_image') || source.replace(/[^a-z]/g,'').includes('detectiondropratebyimage') || source.includes('detection_drop_rate')) return '按图像的检测下降率'
    if (source.includes('detection_counts_by_image')) return '按图像的检测数（原/攻/防）'
    if (source.includes('retention_by_image')) return '按图像保留率（攻/防相对原）'
    if (source.includes('recovery_by_class')) return '类别恢复（(防-攻)/原）'
    if (source.includes('delta_by_class')) return '类别差值（防-攻）'
    if (source.startsWith('metrics_') || source.includes('metrics')) return '性能指标'
    return '图表'
  }

  // 将所有分析图表按中文标题分组（聚合所有 analysisImageTypes）
  // 将所有分析图表合并为一个数组，并在每项上携带中文标题与来源类型
  const allAnalysisFiles = (() => {
    const list = []
    analysisImageTypes.forEach((type) => {
      const arr = imagesByType[type] || []
      arr.forEach((img) => list.push({ ...img, _originType: type, _title: getChartTitle(img) }))
    })
    return list
  })()
  
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
    <>
      {/* 全屏图片查看器 */}
      {fullScreenImage && selectedType && imagesByType[selectedType] && (
        <ImageGallery 
          images={imagesByType[selectedType]} 
          initialIndex={selectedImageIndex} 
          onClose={() => setFullScreenImage(null)} 
        />
      )}

      <div className={`space-y-6 ${fullScreenImage ? 'hidden' : ''}`}>
        {/* 页面标题和控制 */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">攻防过程可视化</h1>
          {error && <p className="text-red-500">错误: {error}</p>}
          <div className="w-full flex items-center justify-between gap-2 flex-wrap">
          {/* 任务ID 选择 + 手动输入（集成在同一个下拉中） */}
          <div className="flex items-center space-x-2">
            <Select
              value={taskId || ''}
              onOpenChange={setTaskSelectOpen}
              open={taskSelectOpen}
              onValueChange={(val) => resolveTaskId(val)}
            >
              <SelectTrigger className="w-full sm:w-[520px] max-w-[620px]" title={taskId || ''}>
                <SelectValue placeholder="选择或输入任务ID" />
              </SelectTrigger>
              <SelectContent className="z-[10000] max-h-64">
                <div className="p-2 border-b sticky top-0 bg-popover">
                  <div className="flex items-center space-x-2">
                    <Input
                      id="manual-task-input"
                      className="w-[320px]"
                      placeholder="手动输入任务ID"
                      value={manualTaskId}
                      onChange={(e) => setManualTaskId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { resolveTaskId(manualTaskId.trim()); setTaskSelectOpen(false); }
                      }}
                    />
                    <Button
                      variant="default"
                      disabled={!manualTaskId || resolvingTask}
                      onClick={() => { resolveTaskId(manualTaskId.trim()); setTaskSelectOpen(false); }}
                    >
                      {resolvingTask ? '加载中...' : '载入任务'}
                    </Button>
                  </div>
                </div>
                {recentTasks.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    暂无最近任务
                  </SelectItem>
                )}
                {recentTasks.map(t => (
                  <SelectItem key={t.task_id} value={t.task_id}>
                    {t.task_id}
                    {t.task_type && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t.task_type === 'adversarial_results' ? '攻击' : t.task_type === 'defense_results' ? '防御' : '评估'}
                        {t.attack_name ? ` · ${t.attack_name}` : t.defense_type ? ` · ${t.defense_type}` : ''}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* 已按要求移除右侧两个下拉列表（图像类型、视图切换） */}
            {!fullScreenImage && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchLatestTask} disabled={loading}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  获取最新任务
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置
                </Button>
              </div>
            )}
          </div>
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
                 <TabsList className="grid w-full grid-cols-5">
                   <TabsTrigger value="detection">原始检测</TabsTrigger>
                   <TabsTrigger value="adversarial">对抗样本</TabsTrigger>
                   <TabsTrigger value="defended" disabled={taskResults?.metadata?.task_group !== 'defense'}>防御结果</TabsTrigger>
                   <TabsTrigger value="comparison">{taskResults?.metadata?.task_group === 'defense' ? '三段对比' : '对比结果'}</TabsTrigger>
                   <TabsTrigger value="plots">分析图表</TabsTrigger>
                 </TabsList>

                <TabsContent value="detection" className="mt-4">
                  {imagesByType['detection_results'] && imagesByType['detection_results'].length > 0 ? (
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
                        <p className="text-xs text-gray-400 mt-1">
                          可用类型: {Object.keys(imagesByType).join(', ') || '无'}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="adversarial" className="mt-4">
                  {imagesByType['adversarial_results'] && imagesByType['adversarial_results'].length > 0 ? (
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
                        <p className="text-xs text-gray-400 mt-1">
                          可用类型: {Object.keys(imagesByType).join(', ') || '无'}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="defended" className="mt-4">
                  {imagesByType['defended_results'] && imagesByType['defended_results'].length > 0 ? (
                    <FileViewer 
                      files={imagesByType['defended_results']} 
                      type="defended_results" 
                      title="防御结果检测" 
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-green-600">无防御结果</p>
                        <p className="text-xs text-gray-400 mt-1">
                          可用类型: {Object.keys(imagesByType).join(', ') || '无'}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="comparison" className="mt-4">
                  {imagesByType['comparison_results'] && imagesByType['comparison_results'].length > 0 ? (
                    <FileViewer 
                      files={imagesByType['comparison_results']} 
                      type="comparison_results" 
                      title={taskResults?.metadata?.task_group === 'defense' ? '原始/对抗/防御 三段对比' : '检测结果对比'} 
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                        <p className="text-sm text-blue-600">无对比结果</p>
                        <p className="text-xs text-gray-400 mt-1">
                          可用类型: {Object.keys(imagesByType).join(', ') || '无'}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="perturbation" className="mt-4">
                  {imagesByType['perturbation_results'] && imagesByType['perturbation_results'].length > 0 ? (
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
                        <p className="text-xs text-gray-400 mt-1">
                          可用类型: {Object.keys(imagesByType).join(', ') || '无'}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="gallery" className="mt-4">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">图像库</h4>
                    </div>
                    
                    {!fullScreenImage && (
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
                                    // 跳转到对应的标签页
                                    if (type === 'detection_results') {
                                      setSelectedView('detection');
                                    } else if (type === 'adversarial_results') {
                                      setSelectedView('adversarial');
                                    } else if (type === 'comparison_results') {
                                      setSelectedView('comparison');
                                    } else if (type === 'perturbation_results') {
                                      setSelectedView('perturbation');
                                    } else if (type === 'plots') {
                                      setSelectedView('plots');
                                    }
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
                                      // 跳转到对应的标签页，而不是打开全屏
                                      if (type === 'detection_results') {
                                        setSelectedView('detection');
                                      } else if (type === 'adversarial_results') {
                                        setSelectedView('adversarial');
                                      } else if (type === 'comparison_results') {
                                        setSelectedView('comparison');
                                      } else if (type === 'perturbation_results') {
                                        setSelectedView('perturbation');
                                      } else if (type === 'plots') {
                                        setSelectedView('plots');
                                      }
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
                  {allAnalysisFiles.length > 0 ? (
                    <FileViewer
                      files={allAnalysisFiles}
                      type="分析图表"
                      title="分析图表"
                      getTitle={(file) => file?._title || getChartTitle(file)}
                      getTypeLabel={(file) => (file?._originType || file?.type)?.replace?.('_',' ') || ''}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">无分析图表</p>
                        <p className="text-xs text-gray-400 mt-1">
                          可用类型: {Object.keys(imagesByType).join(', ') || '无'}
                        </p>
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
              <Tabs value={selectedCompareTab} onValueChange={setSelectedCompareTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="metrics">指标对比</TabsTrigger>
                   <TabsTrigger value="vulnerability">类别脆弱性/恢复</TabsTrigger>
                   <TabsTrigger value="confidence">置信度分析</TabsTrigger>
                 </TabsList>
                
                <TabsContent value="metrics" className="mt-4">
                  {taskResults?.metrics?.progress?.metrics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">检测减少率（攻击）</h3>
                          <div className="mt-2 flex items-baseline">
                             <span className="text-3xl font-semibold text-red-500">
                               {typeof taskResults.metrics.progress.metrics.detection_reduction_rate === 'number' ? (taskResults.metrics.progress.metrics.detection_reduction_rate * 100).toFixed(1) : '—'}%
                             </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">攻击相对原始的检测减少</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">防御恢复率</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-green-600">
                              {typeof taskResults.metrics.progress.metrics.defense_recovery_rate === 'number' ? (taskResults.metrics.progress.metrics.defense_recovery_rate * 100).toFixed(1) : '—'}%
                             </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">防御相对原始的恢复（{'>'}0 越好）</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">原始检测数</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-green-500">
                               {taskResults.metrics.progress.metrics.total_original_detections ?? '—'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">原始图像中的检测目标数</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">对抗检测数</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-red-500">
                               {taskResults.metrics.progress.metrics.total_adversarial_detections ?? '—'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">对抗图像中的检测目标数</p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">防御检测数</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold text-blue-500">
                              {taskResults.metrics.progress.metrics.total_defended_detections ?? '—'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">防御图像中的检测目标数</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">平均推理时间</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold">
                               {typeof taskResults.metrics.progress.metrics.avg_inference_time === 'number' ? taskResults.metrics.progress.metrics.avg_inference_time.toFixed(3) : '—'}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground">秒</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">模型推理平均时间</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">平均攻击时间</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold">
                               {typeof taskResults.metrics.progress.metrics.avg_attack_time === 'number' ? taskResults.metrics.progress.metrics.avg_attack_time.toFixed(3) : '—'}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground">秒</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">生成对抗样本平均时间</p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                          <h3 className="text-sm font-medium">平均防御时间</h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-semibold">
                               {typeof taskResults.metrics.progress.metrics.avg_defense_time === 'number' ? taskResults.metrics.progress.metrics.avg_defense_time.toFixed(3) : '—'}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground">秒</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">应用防御的平均时间</p>
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
                   {taskResults?.metrics?.progress?.metrics && (
                     <div className="space-y-6">
                       {/* 攻击脆弱性 */}
                       {taskResults.metrics.progress.metrics.class_vulnerability_attack && (
                         <div>
                           <h4 className="text-sm font-medium mb-2">攻击下类别脆弱性（越高越脆弱）</h4>
                           <ResponsiveContainer width="100%" height={260}>
                             <BarChart 
                               data={Object.entries(taskResults.metrics.progress.metrics.class_vulnerability_attack).map(([className, value]) => ({ class: className, vuln: value }))}
                               margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                             >
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="class" />
                               <YAxis />
                               <Tooltip />
                               <Legend />
                               <Bar dataKey="vuln" name="脆弱性" fill="#ef4444" />
                             </BarChart>
                           </ResponsiveContainer>
                         </div>
                       )}

                       {/* 防御恢复 */}
                       {taskResults.metrics.progress.metrics.class_recovery_defense && (
                         <div>
                           <h4 className="text-sm font-medium mb-2">防御后类别恢复（(Def-Adv)/Orig，越高越好）</h4>
                           <ResponsiveContainer width="100%" height={260}>
                             <BarChart 
                               data={Object.entries(taskResults.metrics.progress.metrics.class_recovery_defense).map(([className, value]) => ({ class: className, rec: value }))}
                               margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                             >
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="class" />
                               <YAxis />
                               <Tooltip />
                               <Legend />
                               <Bar dataKey="rec" name="恢复" >
                                 {Object.entries(taskResults.metrics.progress.metrics.class_recovery_defense).map(([className, value], idx) => (
                                   <Cell key={`rec-cell-${className}-${idx}`} fill={value > 0 ? "#22c55e" : "#ef4444"} />
                                 ))}
                               </Bar>
                             </BarChart>
                           </ResponsiveContainer>
                         </div>
                       )}

                       {!(taskResults.metrics.progress.metrics.class_vulnerability_attack || taskResults.metrics.progress.metrics.class_recovery_defense) && (
                         <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                           <div className="text-center">
                             <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                             <p className="text-sm text-gray-500">无类别脆弱性/恢复数据</p>
                           </div>
                         </div>
                       )}
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
    </>
  )
}

