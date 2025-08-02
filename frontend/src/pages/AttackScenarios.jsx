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
  const [selectedModel, setSelectedModel] = useState('yolov8s')
  const [selectedDataset, setSelectedDataset] = useState('Visdrone')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('pgd')
  const [parameters, setParameters] = useState({
    epsilon: 0.03,
    alpha: 0.01,
    iterations: 10,
    patch_size: 30, // 为DPatch添加新参数
    brightness_factor: 1.5, // 为亮度攻击添加新参数
    noise_std: 0.1, // 为高斯噪声攻击添加新参数
    contrast_factor: 1.5, // 为对比度攻击添加新参数
    distortion_factor: 0.3, // 为图像扭曲攻击添加新参数
    distortion_type: 'radial', // 为图像扭曲攻击添加新参数
    change_intensity: 0.8, // 为场景跃变攻击添加新参数
    change_type: 'brightness', // 为场景跃变攻击添加新参数
    num_changes: 3, // 为场景跃变攻击添加新参数
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
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                场景选择
              </CardTitle>
              <CardDescription>选择攻击场景类型和目标模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={selectedScenario} onValueChange={handleScenarioChange}>
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
          <Card className="card-hover">
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

                  {/* DPatch特定参数 */}
                  {selectedAlgorithm === 'dpatch' && (
                    <div className="space-y-2">
                      <Label>贴片大小: {parameters.patch_size}</Label>
                      <Slider
                        value={[parameters.patch_size]}
                        onValueChange={(value) => handleParameterChange('patch_size', value[0])}
                        max={100}
                        min={10}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        DPatch攻击中使用的贴片大小（像素）
                      </p>
                    </div>
                  )}
                </>
              )}

              {selectedScenario === 'optical' && (
                <>
                  {/* 亮度攻击特定参数 */}
                  {selectedAlgorithm === 'brightness' && (
                    <div className="space-y-2">
                      <Label>亮度因子: {parameters.brightness_factor}</Label>
                      <Slider
                        value={[parameters.brightness_factor]}
                        onValueChange={(value) => handleParameterChange('brightness_factor', value[0])}
                        max={3.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        亮度调整因子（1.0=不变，&gt;1.0=增亮，&lt;1.0=变暗）
                      </p>
                    </div>
                  )}

                  {/* 高斯噪声攻击特定参数 */}
                  {selectedAlgorithm === 'gaussian' && (
                    <div className="space-y-2">
                      <Label>噪声标准差: {parameters.noise_std}</Label>
                      <Slider
                        value={[parameters.noise_std]}
                        onValueChange={(value) => handleParameterChange('noise_std', value[0])}
                        max={0.5}
                        min={0.01}
                        step={0.01}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        高斯噪声的标准差（0=无噪声，数值越大噪声越强）
                      </p>
                    </div>
                  )}

                  {/* 对比度攻击特定参数 */}
                  {selectedAlgorithm === 'contrast' && (
                    <div className="space-y-2">
                      <Label>对比度因子: {parameters.contrast_factor}</Label>
                      <Slider
                        value={[parameters.contrast_factor]}
                        onValueChange={(value) => handleParameterChange('contrast_factor', value[0])}
                        max={3.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        对比度调整因子（1.0=不变，&gt;1.0=增加对比度，&lt;1.0=降低对比度）
                      </p>
                    </div>
                  )}

                  {/* 图像扭曲攻击特定参数 */}
                  {selectedAlgorithm === 'distortion' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>扭曲强度: {parameters.distortion_factor}</Label>
                        <Slider
                          value={[parameters.distortion_factor]}
                          onValueChange={(value) => handleParameterChange('distortion_factor', value[0])}
                          max={1.0}
                          min={0.1}
                          step={0.05}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          扭曲强度因子（数值越大，扭曲越明显）
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>扭曲类型</Label>
                        <Select 
                          value={parameters.distortion_type} 
                          onValueChange={(value) => handleParameterChange('distortion_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择扭曲类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="radial">径向扭曲（桶形/枕形）</SelectItem>
                            <SelectItem value="wave">波浪扭曲</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          不同的扭曲类型会产生不同的视觉效果
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 场景跃变攻击特定参数 */}
                  {selectedAlgorithm === 'scene_change' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>变化强度: {parameters.change_intensity}</Label>
                        <Slider
                          value={[parameters.change_intensity]}
                          onValueChange={(value) => handleParameterChange('change_intensity', value[0])}
                          max={2.0}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          场景变化强度因子（数值越大，变化越明显）
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>变化类型</Label>
                        <Select 
                          value={parameters.change_type} 
                          onValueChange={(value) => handleParameterChange('change_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择变化类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="brightness">亮度突变</SelectItem>
                            <SelectItem value="contrast">对比度突变</SelectItem>
                            <SelectItem value="color">颜色突变</SelectItem>
                            <SelectItem value="mixed">混合变化</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          不同的变化类型会产生不同的视觉效果
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>变化次数: {parameters.num_changes}</Label>
                        <Slider
                          value={[parameters.num_changes]}
                          onValueChange={(value) => handleParameterChange('num_changes', value[0])}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          在图像上产生的变化区域数量
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 通用光电干扰参数 */}
                  {selectedAlgorithm !== 'brightness' && selectedAlgorithm !== 'gaussian' && selectedAlgorithm !== 'contrast' && selectedAlgorithm !== 'distortion' && selectedAlgorithm !== 'scene_change' && (
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
          <Card className="card-hover">
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
          <Card className="card-hover">
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
          <Card className="card-hover">
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
                    {/* 在摘要中显示贴片大小 */}
                    {selectedAlgorithm === 'dpatch' && (
                      <div className="flex justify-between">
                        <span>贴片大小</span>
                        <span>{parameters.patch_size}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    {/* 亮度攻击特定参数显示 */}
                    {selectedAlgorithm === 'brightness' && (
                      <div className="flex justify-between">
                        <span>亮度因子</span>
                        <span>{parameters.brightness_factor}</span>
                      </div>
                    )}
                    
                    {/* 高斯噪声攻击特定参数显示 */}
                    {selectedAlgorithm === 'gaussian' && (
                      <div className="flex justify-between">
                        <span>噪声标准差</span>
                        <span>{parameters.noise_std}</span>
                      </div>
                    )}
                    
                    {/* 对比度攻击特定参数显示 */}
                    {selectedAlgorithm === 'contrast' && (
                      <div className="flex justify-between">
                        <span>对比度因子</span>
                        <span>{parameters.contrast_factor}</span>
                      </div>
                    )}
                    
                    {/* 图像扭曲攻击特定参数显示 */}
                    {selectedAlgorithm === 'distortion' && (
                      <>
                        <div className="flex justify-between">
                          <span>扭曲强度</span>
                          <span>{parameters.distortion_factor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>扭曲类型</span>
                          <span>{parameters.distortion_type === 'radial' ? '径向' : '波浪'}</span>
                        </div>
                      </>
                    )}
                    
                    {/* 场景跃变攻击特定参数显示 */}
                    {selectedAlgorithm === 'scene_change' && (
                      <>
                        <div className="flex justify-between">
                          <span>变化强度</span>
                          <span>{parameters.change_intensity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>变化类型</span>
                          <span>
                            {parameters.change_type === 'brightness' ? '亮度突变' :
                             parameters.change_type === 'contrast' ? '对比度突变' :
                             parameters.change_type === 'color' ? '颜色突变' : '混合变化'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>变化次数</span>
                          <span>{parameters.num_changes}</span>
                        </div>
                      </>
                    )}
                    
                    {/* 其他光电干扰参数显示 */}
                    {selectedAlgorithm !== 'brightness' && selectedAlgorithm !== 'gaussian' && selectedAlgorithm !== 'contrast' && selectedAlgorithm !== 'distortion' && selectedAlgorithm !== 'scene_change' && (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 日志输出 */}
          <Card className="card-hover">
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

