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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">防御场景选择</h1>
          <p className="text-muted-foreground mt-2">
            配置和训练对抗防御算法，提升模型鲁棒性
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            导入模型
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出模型
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧配置面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 防御类型选择 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2" />
                防御策略选择
              </CardTitle>
              <CardDescription>选择防御类型和目标模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <Tabs value={selectedDefenseType} onValueChange={handleDefenseTypeChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="adversarial_training" className="flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    对抗训练
                  </TabsTrigger>
                  <TabsTrigger value="preprocessing" className="flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    预处理防御
                  </TabsTrigger>
                  <TabsTrigger value="detection" className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    检测防御
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="model">模型</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dataset">数据集</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择数据集" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          <div>
                            <div className="font-medium">{dataset.name}</div>
                            <div className="text-xs text-muted-foreground">{dataset.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="algorithm">防御算法</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择算法" />
                    </SelectTrigger>
                    <SelectContent>
                      {defenseAlgorithms[selectedDefenseType]?.map((algorithm) => (
                        <SelectItem key={algorithm.id} value={algorithm.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{algorithm.name}</div>
                              <div className="text-xs text-muted-foreground">{algorithm.description}</div>
                            </div>
                            <Badge variant={
                              algorithm.effectiveness === 'high' ? 'default' :
                              algorithm.effectiveness === 'medium' ? 'secondary' :
                              'outline'
                            }>
                              {algorithm.effectiveness === 'high' ? '高效' :
                               algorithm.effectiveness === 'medium' ? '中等' : '基础'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 防御参数配置 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                防御参数配置
              </CardTitle>
              <CardDescription>
                调整{selectedDefenseType === 'adversarial_training' ? '对抗训练' : 
                     selectedDefenseType === 'preprocessing' ? '预处理防御' : '检测防御'}参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedDefenseType === 'adversarial_training' && (
                <>
                  <div className="space-y-2">
                    <Label>对抗样本比例: {parameters.adversarial_ratio}</Label>
                    <Slider
                      value={[parameters.adversarial_ratio]}
                      onValueChange={(value) => handleParameterChange('adversarial_ratio', value[0])}
                      max={1.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      训练数据中对抗样本的比例
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>学习率: {parameters.learning_rate}</Label>
                    <Slider
                      value={[parameters.learning_rate]}
                      onValueChange={(value) => handleParameterChange('learning_rate', value[0])}
                      max={0.01}
                      min={0.0001}
                      step={0.0001}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      模型训练的学习率
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>训练轮数: {parameters.epochs}</Label>
                    <Slider
                      value={[parameters.epochs]}
                      onValueChange={(value) => handleParameterChange('epochs', value[0])}
                      max={100}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      完整的训练轮数
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>批处理大小: {parameters.batch_size}</Label>
                    <Slider
                      value={[parameters.batch_size]}
                      onValueChange={(value) => handleParameterChange('batch_size', value[0])}
                      max={128}
                      min={8}
                      step={8}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      每个批次的样本数量
                    </p>
                  </div>
                </>
              )}

              {selectedDefenseType === 'preprocessing' && (
                <>
                  <div className="space-y-2">
                    <Label>防御强度: {parameters.defense_strength}</Label>
                    <Slider
                      value={[parameters.defense_strength]}
                      onValueChange={(value) => handleParameterChange('defense_strength', value[0])}
                      max={1.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      预处理防御的强度级别
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>滤波器大小: 5</Label>
                    <Slider
                      defaultValue={[5]}
                      max={15}
                      min={3}
                      step={2}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      滤波器的核大小
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>压缩质量: 85</Label>
                    <Slider
                      defaultValue={[85]}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      JPEG压缩质量
                    </p>
                  </div>
                </>
              )}

              {selectedDefenseType === 'detection' && (
                <>
                  <div className="space-y-2">
                    <Label>检测阈值: 0.8</Label>
                    <Slider
                      defaultValue={[0.8]}
                      max={1.0}
                      min={0.1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      对抗样本检测的置信度阈值
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>特征维度: 512</Label>
                    <Slider
                      defaultValue={[512]}
                      max={2048}
                      min={128}
                      step={128}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      特征提取的维度大小
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">高级选项</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">正则化系数</Label>
                      <p className="text-xs text-muted-foreground">L2正则化强度</p>
                    </div>
                    <Input 
                      type="number" 
                      value={parameters.regularization}
                      onChange={(e) => handleParameterChange('regularization', parseFloat(e.target.value))}
                      className="w-24" 
                      step="0.001"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">早停轮数</Label>
                      <p className="text-xs text-muted-foreground">验证集无改善停止</p>
                    </div>
                    <Input type="number" placeholder="10" className="w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 可视化配置 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                可视化配置
              </CardTitle>
              <CardDescription>选择要显示的训练和评估可视化</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {visualizationTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">{type.name}</Label>
                    </div>
                    <Switch defaultChecked={type.enabled} />
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>验证集比例</Label>
                  <Input type="number" placeholder="0.2" className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    用于验证的数据比例
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>评估频率</Label>
                  <Input type="number" placeholder="5" className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    每N个epoch评估一次
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧控制面板 */}
        <div className="space-y-6">
          {/* 训练控制 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>训练控制</CardTitle>
              <CardDescription>启动和控制防御模型训练</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleStartTraining}
                disabled={isTraining}
                className="w-full"
                size="lg"
              >
                {isTraining ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    训练中...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    开始训练
                  </>
                )}
              </Button>

              {isTraining && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>训练进度</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} />
                  <p className="text-xs text-muted-foreground">
                    Epoch {Math.floor(trainingProgress / 10)}/10 - 正在训练防御模型...
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" disabled={!isTraining}>
                  <Pause className="h-3 w-3 mr-1" />
                  暂停
                </Button>
                <Button variant="outline" className="flex-1">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 当前配置摘要 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>配置摘要</CardTitle>
              <CardDescription>当前选择的防御配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">防御类型</span>
                <Badge variant="outline">
                  {selectedDefenseType === 'adversarial_training' ? '对抗训练' :
                   selectedDefenseType === 'preprocessing' ? '预处理防御' : '检测防御'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">目标模型</span>
                <span className="text-sm font-medium">
                  {models.find(m => m.id === selectedModel)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">数据集</span>
                <span className="text-sm font-medium">
                  {datasets.find(d => d.id === selectedDataset)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">防御算法</span>
                <span className="text-sm font-medium">
                  {defenseAlgorithms[selectedDefenseType]?.find(a => a.id === selectedAlgorithm)?.name}
                </span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <span className="text-sm font-medium">关键参数</span>
                {selectedDefenseType === 'adversarial_training' ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>对抗样本比例</span>
                      <span>{parameters.adversarial_ratio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>学习率</span>
                      <span>{parameters.learning_rate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>训练轮数</span>
                      <span>{parameters.epochs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>批处理大小</span>
                      <span>{parameters.batch_size}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>防御强度</span>
                      <span>{parameters.defense_strength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>正则化系数</span>
                      <span>{parameters.regularization}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 训练日志 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                训练日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>模型架构验证完成</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>数据集加载成功</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>防御参数配置完成</span>
                </div>
                {isTraining && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                      <span>Epoch {Math.floor(trainingProgress / 10)}/10</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                      <span>Loss: 0.{Math.floor(Math.random() * 1000)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                      <span>Accuracy: {85 + Math.floor(trainingProgress / 10)}%</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 模型性能 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>模型性能</CardTitle>
              <CardDescription>当前模型的防御效果</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>清洁准确率</span>
                  <span className="font-medium">92.5%</span>
                </div>
                <Progress value={92.5} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>对抗鲁棒性</span>
                  <span className="font-medium">78.3%</span>
                </div>
                <Progress value={78.3} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>检测准确率</span>
                  <span className="font-medium">85.7%</span>
                </div>
                <Progress value={85.7} />
              </div>
              
              <Separator />
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">A+</div>
                <p className="text-sm text-muted-foreground">综合防御等级</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

