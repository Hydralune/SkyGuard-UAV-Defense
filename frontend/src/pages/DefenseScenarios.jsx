import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  ShieldCheck,
  Target,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  FileText,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain
} from 'lucide-react'

export default function DefenseScenarios() {
  const [selectedDefenseType, setSelectedDefenseType] = useState('adversarial_training')
  const [selectedModel, setSelectedModel] = useState('yolov8s')
  const [selectedDataset, setSelectedDataset] = useState('Visdrone')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('pgd_training')
  const [parameters, setParameters] = useState({
    adversarial_ratio: 0.5,
    learning_rate: 0.001,
    epochs: 10,
    batch_size: 32,
    defense_strength: 0.7,
    regularization: 0.01
  })
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const handleDefenseTypeChange = (value) => {
    setSelectedDefenseType(value)          // 更新防御类型
    const defaultAlg = defenseAlgorithms[value]?.[0]?.id   // 取该类型列表的第一个算法
    if (defaultAlg) setSelectedAlgorithm(defaultAlg)       // 设置默认算法
  }

  const defenseAlgorithms = {
    adversarial_training: [
      { id: 'pgd_training', name: 'PGD Training', description: '基于PGD的对抗训练', effectiveness: 'high' },
      { id: 'fgm', name: 'FGM', description: '快速梯度方法训练', effectiveness: 'medium' },
      { id: 'freeadv', name: 'FreeAT', description: '免费对抗训练', effectiveness: 'medium' },
      { id: 'yopo', name: 'YOPO', description: '只传播一次对抗训练', effectiveness: 'high' },
      { id: 'freelb', name: 'FreeLB', description: '自由大批量对抗训练', effectiveness: 'high' }
    ],
    preprocessing: [
      { id: 'gaussian_blur', name: '高斯模糊', description: '图像预处理去噪', effectiveness: 'low' },
      { id: 'median_filter', name: '中值滤波', description: '中值滤波去噪', effectiveness: 'low' },
      { id: 'jpeg_compression', name: 'JPEG压缩', description: '有损压缩防御', effectiveness: 'medium' },
      { id: 'bit_depth_reduction', name: '位深度降低', description: '减少颜色位深度', effectiveness: 'low' }
    ],
    detection: [
      { id: 'statistical_test', name: '统计检测', description: '基于统计特征检测', effectiveness: 'medium' },
      { id: 'neural_detector', name: '神经网络检测', description: '深度学习检测器', effectiveness: 'high' },
      { id: 'feature_squeezing', name: '特征压缩', description: '特征空间压缩检测', effectiveness: 'medium' }
    ]
  }

  const models = [
    { id: 'yolov8s', name: 'YOLOv8s', description: '默认YOLO模型' },
    { id: 'yolov5', name: 'YOLOv5', description: '经典YOLO模型' },
    { id: 'faster_rcnn', name: 'Faster R-CNN', description: '两阶段检测模型' },
    { id: 'ssd', name: 'SSD', description: '单次检测器' }
  ]

  const datasets = [
    { id: 'Visdrone', name: 'Visdrone', description: '通用目标检测数据集' },
    { id: 'custom', name: 'Custom', description: '自定义数据集' },
    { id: 'uav', name: 'UAV Dataset', description: '无人机专用数据集' }
  ]

  const visualizationTypes = [
    { id: 'training_curve', name: '训练曲线', enabled: true },
    { id: 'defense_effectiveness', name: '防御效果', enabled: true },
    { id: 'robustness_analysis', name: '鲁棒性分析', enabled: false },
    { id: 'feature_visualization', name: '特征可视化', enabled: false }
  ]

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({ ...prev, [key]: value }))
  }

  const handleStartTraining = () => {
    setIsTraining(true)
    setTrainingProgress(0)
    
    // 模拟训练过程
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsTraining(false)
          return 100
        }
        return prev + 2
      })
    }, 200)
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">防御场景选择</h1>
          <p className="text-gray-600 mt-2">
            配置防御算法和策略选择
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            防御模板
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="h-4 w-4 mr-2" />
            开始训练
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="configuration" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">防御配置</TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">训练控制</TabsTrigger>
          <TabsTrigger value="evaluation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">效果评估</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 防御类型选择 */}
            <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">防御策略类型</CardTitle>
                <CardDescription className="text-gray-600">
                  选择防御策略和算法
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">防御类型</Label>
                  <Select value={selectedDefenseType} onValueChange={handleDefenseTypeChange}>
                    <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adversarial_training">对抗训练</SelectItem>
                      <SelectItem value="preprocessing">预处理防御</SelectItem>
                      <SelectItem value="detection">检测防御</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">目标模型</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">训练数据集</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 算法选择 */}
            <Card className="bg-white backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">防御算法</CardTitle>
                <CardDescription className="text-gray-600">
                  选择具体的防御算法和参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">算法选择</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defenseAlgorithms[selectedDefenseType]?.map((algorithm) => (
                        <SelectItem key={algorithm.id} value={algorithm.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{algorithm.name}</span>
                            <Badge variant={algorithm.effectiveness === 'high' ? 'default' : 'secondary'} 
                              className={`ml-2 ${
                                algorithm.effectiveness === 'high' 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                              {algorithm.effectiveness === 'high' ? '高效果' : '中等效果'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">对抗样本比例</Label>
                    <Slider
                      value={[parameters.adversarial_ratio]}
                      onValueChange={(value) => handleParameterChange('adversarial_ratio', value[0])}
                      max={1.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.1</span>
                      <span>{parameters.adversarial_ratio.toFixed(1)}</span>
                      <span>1.0</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">学习率</Label>
                    <Slider
                      value={[parameters.learning_rate]}
                      onValueChange={(value) => handleParameterChange('learning_rate', value[0])}
                      max={0.01}
                      min={0.0001}
                      step={0.0001}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.0001</span>
                      <span>{parameters.learning_rate.toFixed(4)}</span>
                      <span>0.0100</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">训练轮数</Label>
                    <Slider
                      value={[parameters.epochs]}
                      onValueChange={(value) => handleParameterChange('epochs', value[0])}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1</span>
                      <span>{parameters.epochs}</span>
                      <span>50</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">防御强度</Label>
                    <Slider
                      value={[parameters.defense_strength]}
                      onValueChange={(value) => handleParameterChange('defense_strength', value[0])}
                      max={1.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.1</span>
                      <span>{parameters.defense_strength.toFixed(1)}</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-yellow-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">训练控制</CardTitle>
              <CardDescription className="text-gray-600">
                控制防御模型训练过程
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleStartTraining}
                  disabled={isTraining}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isTraining ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      暂停训练
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      开始训练
                    </>
                  )}
                </Button>
                
                <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置
                </Button>
                
                <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  导出模型
                </Button>
              </div>

              {isTraining && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>训练进度</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">防御效果评估</CardTitle>
              <CardDescription className="text-gray-600">
                评估防御策略的效果和性能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">92%</div>
                  <div className="text-sm text-gray-700">清洁准确率</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">78%</div>
                  <div className="text-sm text-gray-700">鲁棒准确率</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-gray-700">综合评级</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

