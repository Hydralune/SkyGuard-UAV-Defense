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
  const [selectedModel, setSelectedModel] = useState('yolov8s')
  const [selectedDataset, setSelectedDataset] = useState('Visdrone')
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

  // 当场景切换时，自动选择该场景的默认算法（第一个算法）
  const handleScenarioChange = (value) => {
    setSelectedScenario(value)
    const defaultAlg = attackAlgorithms[value]?.[0]?.id
    if (defaultAlg) {
      setSelectedAlgorithm(defaultAlg)
    }
  }

  const attackAlgorithms = {
    adversarial: [
      { id: 'pgd', name: 'PGD', description: '投影梯度下降攻击', difficulty: 'high' },
      { id: 'fgsm', name: 'FGSM', description: '快速梯度符号方法', difficulty: 'medium' },
      { id: 'cw', name: 'C&W', description: 'Carlini & Wagner攻击', difficulty: 'high' },
      { id: 'deepfool', name: 'DeepFool', description: '最小扰动攻击', difficulty: 'medium' },
      { id: 'advpatch', name: 'AdvPatch', description: '对抗补丁攻击', difficulty: 'high' },
      { id: 'dpatch', name: 'DPatch', description: '数字补丁攻击', difficulty: 'medium' },
      { id: 'selfmade', name: '自定义攻击算法', description: '从文件导入', difficulty: 'high' },
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
    { id: 'yolov8s', name: 'YOLOv8s', description: '实时目标检测模型' },
    { id: 'yolov10', name: 'YOLOv10', description: '最新版本YOLO模型' },
    { id: 'faster_rcnn', name: 'Faster R-CNN', description: '两阶段检测模型' },
    { id: 'ssd', name: 'SSD', description: '单次检测器' }
  ]

  const datasets = [
    { id: 'Visdrone', name: 'Visdrone', description: '通用目标检测数据集' },
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
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">攻击场景选择</h1>
          <p className="text-gray-600 mt-2">
            配置和执行对抗攻击与光电干扰场景
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            配置模板
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="h-4 w-4 mr-2" />
            开始攻击
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="configuration" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">场景配置</TabsTrigger>
          <TabsTrigger value="execution" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">执行控制</TabsTrigger>
          <TabsTrigger value="visualization" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">可视化设置</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 场景类型选择 */}
            <Card className="bg-white backdrop-blur-sm border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">攻击场景类型</CardTitle>
                <CardDescription className="text-gray-600">
                  选择对抗攻击或光电干扰场景
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">场景类型</Label>
                  <Select value={selectedScenario} onValueChange={handleScenarioChange}>
                    <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adversarial">对抗攻击</SelectItem>
                      <SelectItem value="optical">光电干扰</SelectItem>
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
                  <Label className="text-sm font-medium text-gray-700">数据集</Label>
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
                <CardTitle className="text-gray-900">攻击算法</CardTitle>
                <CardDescription className="text-gray-600">
                  选择具体的攻击算法和参数
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
                      {attackAlgorithms[selectedScenario]?.map((algorithm) => (
                        <SelectItem key={algorithm.id} value={algorithm.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{algorithm.name}</span>
                            <Badge variant={algorithm.difficulty === 'high' ? 'destructive' : 'secondary'} 
                              className={`ml-2 ${
                                algorithm.difficulty === 'high' 
                                  ? 'bg-red-100 text-red-800 border-red-200' 
                                  : 'bg-green-100 text-green-800 border-green-200'
                              }`}>
                              {algorithm.difficulty === 'high' ? '高难度' : '中等难度'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedScenario === 'adversarial' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">扰动预算 (ε)</Label>
                      <Slider
                        value={[parameters.epsilon]}
                        onValueChange={(value) => handleParameterChange('epsilon', value[0])}
                        max={0.1}
                        min={0.01}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.01</span>
                        <span>{parameters.epsilon.toFixed(2)}</span>
                        <span>0.10</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">学习率 (α)</Label>
                      <Slider
                        value={[parameters.alpha]}
                        onValueChange={(value) => handleParameterChange('alpha', value[0])}
                        max={0.05}
                        min={0.001}
                        step={0.001}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.001</span>
                        <span>{parameters.alpha.toFixed(3)}</span>
                        <span>0.050</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">迭代次数</Label>
                      <Slider
                        value={[parameters.iterations]}
                        onValueChange={(value) => handleParameterChange('iterations', value[0])}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1</span>
                        <span>{parameters.iterations}</span>
                        <span>50</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedScenario === 'optical' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">亮度调整</Label>
                      <Slider
                        value={[parameters.brightness]}
                        onValueChange={(value) => handleParameterChange('brightness', value[0])}
                        max={2.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.1</span>
                        <span>{parameters.brightness.toFixed(1)}</span>
                        <span>2.0</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">对比度调整</Label>
                      <Slider
                        value={[parameters.contrast]}
                        onValueChange={(value) => handleParameterChange('contrast', value[0])}
                        max={3.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.1</span>
                        <span>{parameters.contrast.toFixed(1)}</span>
                        <span>3.0</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">噪声强度</Label>
                      <Slider
                        value={[parameters.noise_level]}
                        onValueChange={(value) => handleParameterChange('noise_level', value[0])}
                        max={0.5}
                        min={0.01}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.01</span>
                        <span>{parameters.noise_level.toFixed(2)}</span>
                        <span>0.50</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">执行控制</CardTitle>
              <CardDescription className="text-gray-600">
                控制攻击执行过程和状态
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleStartAttack}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      暂停攻击
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      开始攻击
                    </>
                  )}
                </Button>
                
                <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置
                </Button>
                
                <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  导出结果
                </Button>
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>攻击进度</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">可视化配置</CardTitle>
              <CardDescription className="text-gray-600">
                配置攻击过程的可视化选项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {visualizationTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Switch
                      id={type.id}
                      checked={type.enabled}
                      onCheckedChange={(checked) => {
                        // 这里应该更新可视化类型的状态
                      }}
                    />
                    <Label htmlFor={type.id} className="text-sm font-medium text-gray-700">
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

