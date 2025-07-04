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
  const [selectedView, setSelectedView] = useState('comparison')
  const [zoomLevel, setZoomLevel] = useState(1)

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
            实时可视化攻防演练过程和结果分析
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <Button onClick={handlePlayPause}>
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                暂停
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                播放
              </>
            )}
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
                  <TabsTrigger value="comparison">对比视图</TabsTrigger>
                  <TabsTrigger value="difference">差异图</TabsTrigger>
                  <TabsTrigger value="heatmap">热力图</TabsTrigger>
                  <TabsTrigger value="animation">动画</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-center">原始图像</h4>
                      <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                        <div className="text-center">
                          <Image className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                          <p className="text-sm text-blue-600">原始样本</p>
                          <p className="text-xs text-muted-foreground">置信度: 95%</p>
                        </div>
                      </div>
                      <div className="flex justify-center space-x-2">
                        <Badge variant="default">person: 0.95</Badge>
                        <Badge variant="secondary">car: 0.88</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-center">对抗样本</h4>
                      <div className="aspect-square bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300">
                        <div className="text-center">
                          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-2" />
                          <p className="text-sm text-red-600">对抗样本</p>
                          <p className="text-xs text-muted-foreground">置信度: 23%</p>
                        </div>
                      </div>
                      <div className="flex justify-center space-x-2">
                        <Badge variant="destructive">person: 0.23</Badge>
                        <Badge variant="outline">car: 0.15</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="difference" className="mt-4">
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border-2 border-dashed border-purple-300">
                      <div className="text-center">
                        <Zap className="h-16 w-16 mx-auto text-purple-500 mb-2" />
                        <p className="text-lg font-medium text-purple-600">扰动差异图</p>
                        <p className="text-sm text-muted-foreground">显示添加的对抗扰动</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mx-auto mb-1"></div>
                        <span>负扰动</span>
                      </div>
                      <div className="text-center">
                        <div className="w-4 h-4 bg-gray-300 rounded mx-auto mb-1"></div>
                        <span>无变化</span>
                      </div>
                      <div className="text-center">
                        <div className="w-4 h-4 bg-red-500 rounded mx-auto mb-1"></div>
                        <span>正扰动</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="heatmap" className="mt-4">
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 rounded-lg flex items-center justify-center border-2 border-dashed border-orange-300">
                      <div className="text-center">
                        <Target className="h-16 w-16 mx-auto text-orange-500 mb-2" />
                        <p className="text-lg font-medium text-orange-600">注意力热力图</p>
                        <p className="text-sm text-muted-foreground">模型关注区域分析</p>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>低关注</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>中等关注</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>高关注</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="animation" className="mt-4">
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-green-300">
                      <div className="text-center">
                        <div className={`h-16 w-16 mx-auto mb-2 ${isPlaying ? 'animate-pulse' : ''}`}>
                          <Play className="h-16 w-16 text-green-500" />
                        </div>
                        <p className="text-lg font-medium text-green-600">攻击过程动画</p>
                        <p className="text-sm text-muted-foreground">
                          步骤 {currentStep + 1}/4: {attackProgress[currentStep]?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Progress value={(currentStep + 1) * 25} className="w-64" />
                    </div>
                  </div>
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
                <div key={index} className={`flex items-center space-x-3 p-2 rounded-lg ${
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
                  <div key={index} className="space-y-2">
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

