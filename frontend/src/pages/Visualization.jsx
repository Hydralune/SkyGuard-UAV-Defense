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
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">攻防过程可视化</h1>
          <p className="text-gray-600 mt-2">
            攻防过程实时可视化和分析
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            视图设置
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            导出结果
          </Button>
        </div>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">样本对比</TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">差异分析</TabsTrigger>
          <TabsTrigger value="animation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">动画演示</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 原始样本 */}
            <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">原始样本</CardTitle>
                <CardDescription className="text-gray-600">
                  攻击前的原始图像和检测结果
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">原始图像预览</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">检测置信度</span>
                    <span className="text-sm font-bold text-green-600">95%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">检测状态</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">已检测</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 对抗样本 */}
            <Card className="bg-white backdrop-blur-sm border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">对抗样本</CardTitle>
                <CardDescription className="text-gray-600">
                  攻击后的对抗图像和检测结果
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">对抗图像预览</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">检测置信度</span>
                    <span className="text-sm font-bold text-red-600">23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">检测状态</span>
                    <Badge className="bg-red-100 text-red-800 border-red-200">未检测</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 检测结果对比 */}
          <Card className="bg-white backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">检测结果对比</CardTitle>
              <CardDescription className="text-gray-600">
                不同类别的检测置信度变化
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={detectionResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="class" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #dbeafe',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="original" fill="#22c55e" name="原始置信度" />
                  <Bar dataKey="adversarial" fill="#ef4444" name="对抗置信度" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 差异图 */}
            <Card className="bg-white backdrop-blur-sm border-yellow-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">扰动差异图</CardTitle>
                <CardDescription className="text-gray-600">
                  显示攻击添加的扰动分布
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">扰动热力图</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 热力图 */}
            <Card className="bg-white backdrop-blur-sm border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">注意力热力图</CardTitle>
                <CardDescription className="text-gray-600">
                  模型注意力区域可视化
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">注意力分布</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 扰动分析 */}
          <Card className="bg-white backdrop-blur-sm border-indigo-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">扰动分析</CardTitle>
              <CardDescription className="text-gray-600">
                扰动强度和分布统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={perturbationAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="pixel" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #dbeafe',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="original" stroke="#22c55e" strokeWidth={2} name="原始值" />
                  <Line type="monotone" dataKey="adversarial" stroke="#ef4444" strokeWidth={2} name="对抗值" />
                  <Line type="monotone" dataKey="perturbation" stroke="#3b82f6" strokeWidth={2} name="扰动值" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="animation" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">攻击过程动画</CardTitle>
              <CardDescription className="text-gray-600">
                动态展示攻击过程的关键步骤
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  onClick={handlePlayPause}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
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
                
                <Button 
                  onClick={handleReset}
                  variant="outline" 
                  className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置
                </Button>
                
                <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                  <Maximize className="h-4 w-4 mr-2" />
                  全屏
                </Button>
              </div>

              <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {attackProgress[currentStep]?.name || '准备中...'}
                  </div>
                  <div className="text-sm text-gray-600">
                    置信度: {attackProgress[currentStep]?.confidence || 0}%
                  </div>
                  <div className="mt-2">
                    <Badge className={
                      attackProgress[currentStep]?.detected 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }>
                      {attackProgress[currentStep]?.detected ? '已检测' : '未检测'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">进度</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentStep + 1} / {attackProgress.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

