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
import {
  Sword,
  Zap,
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
  CheckCircle
} from 'lucide-react'

export default function AttackScenarios() {
  const [selectedScenario, setSelectedScenario] = useState('adversarial')
  const [selectedModel, setSelectedModel] = useState('yolov5')
  const [selectedDataset, setSelectedDataset] = useState('coco')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('pgd')
  const [parameters, setParameters] = useState({
    epsilon: 0.03,
    alpha: 0.01,
    iterations: 10,
    brightness: 0.5,
    contrast: 1.0,
    noise_level: 0.1
  })
  const [isRunning, setIsRunning] = useState(false)

  const attackAlgorithms = {
    adversarial: [
      { id: 'pgd', name: 'PGD', description: '投影梯度下降攻击', difficulty: 'high' },
      { id: 'fgsm', name: 'FGSM', description: '快速梯度符号方法', difficulty: 'medium' },
      { id: 'cw', name: 'C&W', description: 'Carlini & Wagner攻击', difficulty: 'high' },
      { id: 'deepfool', name: 'DeepFool', description: '最小扰动攻击', difficulty: 'medium' },
      { id: 'advpatch', name: 'AdvPatch', description: '对抗补丁攻击', difficulty: 'high' },
      { id: 'dpatch', name: 'DPatch', description: '数字补丁攻击', difficulty: 'medium' }
    ],
    optical: [
      { id: 'brightness', name: '亮度干扰', description: '调整图像亮度', difficulty: 'low' },
      { id: 'gaussian', name: '高斯噪声', description: '添加高斯噪声', difficulty: 'low' },
      { id: 'contrast', name: '对比度调整', description: '修改图像对比度', difficulty: 'low' },
      { id: 'distortion', name: '图像扭曲', description: '几何变换扭曲', difficulty: 'medium' },
      { id: 'scene_change', name: '场景跃变', description: '快速场景切换', difficulty: 'high' }
    ]
  }

  const models = [
    { id: 'yolov5', name: 'YOLOv5', description: '实时目标检测模型' },
    { id: 'yolov10', name: 'YOLOv10', description: '最新版本YOLO模型' },
    { id: 'faster_rcnn', name: 'Faster R-CNN', description: '两阶段检测模型' },
    { id: 'ssd', name: 'SSD', description: '单次检测器' }
  ]

  const datasets = [
    { id: 'coco', name: 'COCO', description: '通用目标检测数据集' },
    { id: 'custom', name: 'Custom', description: '自定义数据集' },
    { id: 'uav', name: 'UAV Dataset', description: '无人机专用数据集' }
  ]

  const visualizationTypes = [
    { id: 'original', name: '初始样本', enabled: true },
    { id: 'adversarial', name: '对抗样本', enabled: true },
    { id: 'difference', name: '差异图', enabled: false },
    { id: 'heatmap', name: '热力图', enabled: false },
    { id: 'result_comparison', name: '结果对比', enabled: true }
  ]

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({ ...prev, [key]: value }))
  }

  const handleStartAttack = () => {
    setIsRunning(true)
    // 模拟攻击过程
    setTimeout(() => setIsRunning(false), 5000)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">攻击场景选择</h1>
          <p className="text-muted-foreground mt-2">
            配置和执行对抗攻击与光电干扰场景
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            导入配置
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出配置
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧配置面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 场景类型选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                场景选择
              </CardTitle>
              <CardDescription>选择攻击场景类型和目标模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="adversarial" className="flex items-center">
                    <Sword className="h-4 w-4 mr-2" />
                    对抗攻击
                  </TabsTrigger>
                  <TabsTrigger value="optical" className="flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    光电干扰
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
                  <Label htmlFor="algorithm">算法</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择算法" />
                    </SelectTrigger>
                    <SelectContent>
                      {attackAlgorithms[selectedScenario]?.map((algorithm) => (
                        <SelectItem key={algorithm.id} value={algorithm.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{algorithm.name}</div>
                              <div className="text-xs text-muted-foreground">{algorithm.description}</div>
                            </div>
                            <Badge variant={
                              algorithm.difficulty === 'high' ? 'destructive' :
                              algorithm.difficulty === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {algorithm.difficulty === 'high' ? '高难度' :
                               algorithm.difficulty === 'medium' ? '中等' : '简单'}
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

          {/* 算法参数配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                参数配置
              </CardTitle>
              <CardDescription>
                调整{selectedScenario === 'adversarial' ? '对抗攻击' : '光电干扰'}算法参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedScenario === 'adversarial' && (
                <>
                  <div className="space-y-2">
                    <Label>扰动预算 (ε): {parameters.epsilon}</Label>
                    <Slider
                      value={[parameters.epsilon]}
                      onValueChange={(value) => handleParameterChange('epsilon', value[0])}
                      max={0.1}
                      min={0.001}
                      step={0.001}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      控制对抗扰动的最大幅度
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>学习率 (α): {parameters.alpha}</Label>
                    <Slider
                      value={[parameters.alpha]}
                      onValueChange={(value) => handleParameterChange('alpha', value[0])}
                      max={0.05}
                      min={0.001}
                      step={0.001}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      每次迭代的步长大小
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>迭代次数: {parameters.iterations}</Label>
                    <Slider
                      value={[parameters.iterations]}
                      onValueChange={(value) => handleParameterChange('iterations', value[0])}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      攻击算法的迭代次数
                    </p>
                  </div>
                </>
              )}

              {selectedScenario === 'optical' && (
                <>
                  <div className="space-y-2">
                    <Label>亮度调整: {parameters.brightness}</Label>
                    <Slider
                      value={[parameters.brightness]}
                      onValueChange={(value) => handleParameterChange('brightness', value[0])}
                      max={2.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      调整图像整体亮度
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>对比度: {parameters.contrast}</Label>
                    <Slider
                      value={[parameters.contrast]}
                      onValueChange={(value) => handleParameterChange('contrast', value[0])}
                      max={3.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      调整图像对比度
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>噪声强度: {parameters.noise_level}</Label>
                    <Slider
                      value={[parameters.noise_level]}
                      onValueChange={(value) => handleParameterChange('noise_level', value[0])}
                      max={0.5}
                      min={0.01}
                      step={0.01}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      高斯噪声的标准差
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
                      <Label className="text-sm">随机种子</Label>
                      <p className="text-xs text-muted-foreground">确保结果可重现</p>
                    </div>
                    <Input type="number" placeholder="42" className="w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">批处理大小</Label>
                      <p className="text-xs text-muted-foreground">同时处理的样本数</p>
                    </div>
                    <Input type="number" placeholder="32" className="w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 可视化配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                可视化配置
              </CardTitle>
              <CardDescription>选择要显示的可视化内容</CardDescription>
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
              
              <div className="space-y-2">
                <Label>样本数量</Label>
                <Input type="number" placeholder="10" className="w-full" />
                <p className="text-xs text-muted-foreground">
                  要处理和显示的样本数量
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧控制面板 */}
        <div className="space-y-6">
          {/* 执行控制 */}
          <Card>
            <CardHeader>
              <CardTitle>执行控制</CardTitle>
              <CardDescription>启动和控制攻击过程</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleStartAttack}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    执行中...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    开始攻击
                  </>
                )}
              </Button>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>进度</span>
                    <span>60%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-3/5 transition-all duration-300"></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    正在生成对抗样本...
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" disabled={!isRunning}>
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
          <Card>
            <CardHeader>
              <CardTitle>配置摘要</CardTitle>
              <CardDescription>当前选择的配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">场景类型</span>
                <Badge variant="outline">
                  {selectedScenario === 'adversarial' ? '对抗攻击' : '光电干扰'}
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
                <span className="text-sm text-muted-foreground">攻击算法</span>
                <span className="text-sm font-medium">
                  {attackAlgorithms[selectedScenario]?.find(a => a.id === selectedAlgorithm)?.name}
                </span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <span className="text-sm font-medium">关键参数</span>
                {selectedScenario === 'adversarial' ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>扰动预算</span>
                      <span>{parameters.epsilon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>学习率</span>
                      <span>{parameters.alpha}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>迭代次数</span>
                      <span>{parameters.iterations}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>亮度</span>
                      <span>{parameters.brightness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>对比度</span>
                      <span>{parameters.contrast}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>噪声强度</span>
                      <span>{parameters.noise_level}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 日志输出 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                执行日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>配置验证完成</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>模型加载成功</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>数据集准备就绪</span>
                </div>
                {isRunning && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                      <span>开始生成对抗样本...</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                      <span>处理样本 6/10</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

