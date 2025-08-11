import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  const navigate = useNavigate()
  const PERSIST_KEY = 'defense_scenarios_state_v1'
  const hasRestoredRef = useRef(false)

  const [selectedDefenseType, setSelectedDefenseType] = useState('adversarial_training')
  const [selectedModel, setSelectedModel] = useState('yolov8s')
  const [selectedDataset, setSelectedDataset] = useState('Visdrone')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('pgd_training')
  const [parameters, setParameters] = useState({
    // 通用训练参数
    adversarial_ratio: 0.5,
    learning_rate: 0.001,
    epochs: 10,
    batch_size: 32,
    regularization: 0.01,
    // 对抗训练细节
    max_grad_steps: 3,
    eps: 8 / 255,
    alpha: 2 / 255,
    steps: 10,
    freelb_batch_size: 32,
    freelb_steps: 8,
    // 预处理防御评估参数
    num_images: 10,
    conf_threshold: 0.25,
    iou_threshold: 0.5,
    // 检测型防御评估参数
    detection_threshold: 0.8,
    // 具体预处理防御参数
    ksize: 5,
    sigma: 0,
    quality: 85,
    bits: 5,
    // UI展示参数
    defense_strength: 0.7,
    // GenAF专属参数 (from code 2)
    genaf_seed: 100,
    genaf_gpu: '0',
    genaf_dataset: 'stl10',
    genaf_batch_size: 256,
    genaf_epochs: 50,
    genaf_save: false,
    genaf_pre_dataset: 'cifar10',
    genaf_victim: 'deepclusterv2',
  })
  const [attackPreset, setAttackPreset] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [taskId, setTaskId] = useState(null)
  const [celeryTaskId, setCeleryTaskId] = useState(null)
  const [taskStatus, setTaskStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [logMessages, setLogMessages] = useState([])

  const handleDefenseTypeChange = (value) => {
    setSelectedDefenseType(value)
    const defaultAlg = defenseAlgorithms[value]?.[0]?.id
    if (defaultAlg) setSelectedAlgorithm(defaultAlg)
  }

  // 前后端命名映射
  const backendModelMap = {
    yolov8s: 'yolov8s-visdrone',
    yolov5: 'yolov5-visdrone',
    faster_rcnn: 'faster_rcnn-visdrone',
    ssd: 'ssd-visdrone'
  }
  const backendDatasetMap = { Visdrone: 'VisDrone' }

  const defenseAlgorithms = {
    adversarial_training: [
      { id: 'pgd_training', name: 'PGD Training', description: '基于PGD的对抗训练', effectiveness: 'high' },
      { id: 'fgm', name: 'FGM', description: '快速梯度方法训练', effectiveness: 'medium' },
      { id: 'freeadv', name: 'FreeAT', description: '免费对抗训练', effectiveness: 'medium' },
      { id: 'yopo', name: 'YOPO', description: '只传播一次对抗训练', effectiveness: 'high' },
      { id: 'freelb', name: 'FreeLB', description: '自由大批量对抗训练', effectiveness: 'high' },
      { id: 'genaf', name: 'GenAF', description: '基于遗传算法的自适应对抗训练（Gen-AF）', effectiveness: 'high' }
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

  // 从本地缓存恢复攻击预设（由攻击页面“发送到防御”设置）
  useEffect(() => {
    try {
      const raw = localStorage.getItem('defense_attack_prefill_v1')
      if (raw) {
        const preset = JSON.parse(raw)
        setAttackPreset(preset)
        // 可选：根据预设调整模型/数据集默认值
        if (preset?.params?.model_name) {
          const mapped = Object.keys(backendModelMap).find(k => backendModelMap[k] === preset.params.model_name)
          if (mapped) setSelectedModel(mapped)
        }
        if (preset?.params?.dataset_name) {
          const mapped = Object.keys(backendDatasetMap).find(k => backendDatasetMap[k] === preset.params.dataset_name)
          if (mapped) setSelectedDataset(mapped)
        }
      }
    } catch (_) {}
  }, [])

  // 恢复与持久化
  useEffect(() => {
    if (hasRestoredRef.current) return
    try {
      const raw = localStorage.getItem(PERSIST_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.selectedDefenseType) setSelectedDefenseType(saved.selectedDefenseType)
        if (saved.selectedModel) setSelectedModel(saved.selectedModel)
        if (saved.selectedDataset) setSelectedDataset(saved.selectedDataset)
        if (saved.selectedAlgorithm) setSelectedAlgorithm(saved.selectedAlgorithm)
        if (saved.parameters) setParameters(prev => ({ ...prev, ...saved.parameters }))
        if (typeof saved.isRunning === 'boolean') setIsRunning(saved.isRunning)
        if (saved.taskId) setTaskId(saved.taskId)
        if (saved.celeryTaskId) setCeleryTaskId(saved.celeryTaskId)
        if (typeof saved.progress === 'number') setProgress(saved.progress)
        if (saved.taskStatus) setTaskStatus(saved.taskStatus)
        if (Array.isArray(saved.logMessages)) setLogMessages(saved.logMessages)
      }
    } catch (_) {}
    hasRestoredRef.current = true
  }, [])

  useEffect(() => {
    const stateToSave = {
      selectedDefenseType,
      selectedModel,
      selectedDataset,
      selectedAlgorithm,
      parameters,
      isRunning,
      taskId,
      celeryTaskId,
      taskStatus,
      progress,
      logMessages: (logMessages || []).slice(0, 100),
    }
    try { localStorage.setItem(PERSIST_KEY, JSON.stringify(stateToSave)) } catch (_) {}
  }, [selectedDefenseType, selectedModel, selectedDataset, selectedAlgorithm, parameters, isRunning, taskId, celeryTaskId, taskStatus, progress, logMessages])

  // 日志
  const addLogMessage = (message, type = 'info') => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setLogMessages(prev => ([{ id: uniqueId, message, type, timestamp: new Date().toLocaleTimeString() }, ...prev]).slice(0, 100))
  }

  // 轮询任务状态（通用，用celeryTaskId）
  useEffect(() => {
    let intervalId
    if (celeryTaskId && isRunning) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/task/${celeryTaskId}`)
          if (!response.ok) throw new Error(`获取任务状态失败: ${response.status}`)
          const data = await response.json()
          setTaskStatus(data)
          if (data.progress) setProgress(data.progress)
          else if (data.percent) setProgress(data.percent)

          if (data.message && data.message !== '任务进行中' && data.message !== '任务完成') {
            addLogMessage(data.message)
          }

          if (data.state === 'SUCCESS' || data.status === 'completed') {
            setIsRunning(false)
            clearInterval(intervalId)
            addLogMessage('任务完成', 'success')
            setTimeout(() => {
              const visPageUrl = `${window.location.origin}/visualization?task_id=${taskId}`
              addLogMessage(`请在<a href="${visPageUrl}" target="_blank" class="text-blue-500 hover:underline">可视化页面</a>查看完整结果`, 'info')
            }, 500)
          } else if (data.state === 'FAILURE' || data.status === 'failed') {
            setIsRunning(false)
            clearInterval(intervalId)
            const errorMsg = data.error || data.message || '未知错误'
            addLogMessage(`任务失败: ${errorMsg}`, 'error')
          }
        } catch (error) {
          console.error('获取任务状态失败:', error)
        }
      }, 2000)
    }
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [celeryTaskId, isRunning])

  // 启动防御任务（根据类型分流）
  const handleStart = async () => {
    try {
      setIsRunning(true)
      setTaskId(null)
      setCeleryTaskId(null)
      setTaskStatus(null)
      setProgress(0)
      setTrainingProgress(0)
      setLogMessages([])

      addLogMessage('准备开始防御任务...')

      if (selectedDefenseType === 'adversarial_training') {
        if (selectedAlgorithm === 'genaf') {
            addLogMessage('GenAF 防御暂未实现后端，敬请期待', 'error');
            setIsRunning(false);
            return;
        }
        // 对抗训练
        const mapAlg = {
          pgd_training: 'pgd',
          fgm: 'fgm',
          freeadv: 'freeat',
          yopo: 'yopo',
          freelb: 'freelb',
        }
        const params = new URLSearchParams({
          defense_type: mapAlg[selectedAlgorithm] || 'pgd',
          base_model: 'yolov8s.pt',
          data_yaml: 'backend/datasets/VisDrone_Dataset/visdrone.yaml',
          epochs: `${parameters.epochs}`,
          imgsz: '640',
          batch: `${parameters.batch_size}`,
          device: '0',
          eps: `${parameters.eps}`,
          alpha: `${parameters.alpha}`,
          steps: `${parameters.steps}`,
          attack_ratio: `${parameters.adversarial_ratio}`,
        })

        const response = await fetch(`/api/defense/train?${params.toString()}`, { method: 'POST' })
        if (!response.ok) throw new Error(`API返回错误: ${response.status}`)
        const data = await response.json()
        setTaskId(data.task_id)
        setCeleryTaskId(data.celery_task_id)
        addLogMessage(`训练任务已提交，任务ID: ${data.task_id}`)
        addLogMessage(`Celery任务ID: ${data.celery_task_id}`)
      } else if (selectedDefenseType === 'preprocessing') {
        // 输入预处理类防御评估
        const mapPre = {
          gaussian_blur: 'gaussian_blur',
          median_filter: 'median_blur',
          jpeg_compression: 'jpeg_compression',
          bit_depth_reduction: 'bit_depth_reduction',
        }
        const defenseType = mapPre[selectedAlgorithm] || 'gaussian_blur'
        const params = new URLSearchParams({
          defense_type: defenseType,
          model_name: backendModelMap[selectedModel] || selectedModel || 'yolov8s-visdrone',
          dataset_name: backendDatasetMap[selectedDataset] || selectedDataset || 'VisDrone',
          num_images: `${parameters.num_images}`,
          conf_threshold: `${parameters.conf_threshold}`,
          iou_threshold: `${parameters.iou_threshold}`,
          // 指定攻击：若有预设则使用预设参数，否则不带攻击，由后端回退到“干净→防御”评估
          ...(attackPreset?.params?.attack_name ? { attack_name: attackPreset.params.attack_name } : {}),
          ...(attackPreset?.params?.eps ? { eps: attackPreset.params.eps } : {}),
          ...(attackPreset?.params?.alpha ? { alpha: attackPreset.params.alpha } : {}),
          ...(attackPreset?.params?.steps ? { steps: attackPreset.params.steps } : {}),
        })
        // 具体算法参数
        if (defenseType === 'gaussian_blur') {
          params.append('ksize', `${parameters.ksize}`)
          params.append('sigma', `${parameters.sigma}`)
        } else if (defenseType === 'median_blur') {
          params.append('ksize', `${parameters.ksize}`)
        } else if (defenseType === 'jpeg_compression') {
          params.append('quality', `${parameters.quality}`)
        } else if (defenseType === 'bit_depth_reduction') {
          params.append('bits', `${parameters.bits}`)
        }

        const response = await fetch(`/api/defense/run?${params.toString()}`, { method: 'POST' })
        if (!response.ok) throw new Error(`API返回错误: ${response.status}`)
        const data = await response.json()
        setTaskId(data.task_id)
        setCeleryTaskId(data.celery_task_id)
        addLogMessage(`评估任务已提交，任务ID: ${data.task_id}`)
        addLogMessage(`Celery任务ID: ${data.celery_task_id}`)
      } else if (selectedDefenseType === 'detection') {
        // 检测型：统计检测与特征压缩（映射至位深降低）
        if (selectedAlgorithm === 'feature_squeezing') {
          const params = new URLSearchParams({
              defense_type: 'bit_depth_reduction', // 映射
              model_name: backendModelMap[selectedModel] || selectedModel || 'yolov8s-visdrone',
              dataset_name: backendDatasetMap[selectedDataset] || selectedDataset || 'VisDrone',
              num_images: `${parameters.num_images}`,
              conf_threshold: `${parameters.conf_threshold}`,
              iou_threshold: `${parameters.iou_threshold}`,
              bits: `${parameters.bits}`,
          })
          const response = await fetch(`/api/defense/run?${params.toString()}`, { method: 'POST' })
          if (!response.ok) throw new Error(`API返回错误: ${response.status}`)
          const data = await response.json()
          setTaskId(data.task_id)
          setCeleryTaskId(data.celery_task_id)
          addLogMessage(`检测类（特征压缩）任务已提交，任务ID: ${data.task_id}`)
        } else if (selectedAlgorithm === 'statistical_test') {
          // 统计检测：调用新后端 /api/defense/detect
          const params = new URLSearchParams({
            detector_type: 'statistical',
            model_name: backendModelMap[selectedModel] || selectedModel || 'yolov8s-visdrone',
            dataset_name: backendDatasetMap[selectedDataset] || selectedDataset || 'VisDrone',
            num_images: `${parameters.num_images}`,
            conf_threshold: `${parameters.conf_threshold}`,
            iou_threshold: `${parameters.iou_threshold}`,
            threshold: `${parameters.detection_threshold}`,
          })
          // 关联攻击预设（可选）
          if (attackPreset?.params?.attack_name) params.append('attack_name', attackPreset.params.attack_name)
          if (attackPreset?.params?.eps) params.append('eps', attackPreset.params.eps)
          if (attackPreset?.params?.alpha) params.append('alpha_attack', attackPreset.params.alpha)
          if (attackPreset?.params?.steps) params.append('steps', attackPreset.params.steps)

          const response = await fetch(`/api/defense/detect?${params.toString()}`, { method: 'POST' })
          if (!response.ok) throw new Error(`API返回错误: ${response.status}`)
          const data = await response.json()
          setTaskId(data.task_id)
          setCeleryTaskId(data.celery_task_id)
          addLogMessage(`检测类（统计检测）任务已提交，任务ID: ${data.task_id}`)
        } else {
          addLogMessage('该检测型防御暂未实现后端，敬请期待', 'error')
          setIsRunning(false)
        }
      }

      // 显示成功提示
      const alertElement = document.createElement('div')
      alertElement.innerHTML = `
        <div class="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-lg" role="alert">
          <strong class="font-bold">防御任务已提交</strong>
          <span class="block sm:inline">正在执行...</span>
          <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      `
      document.body.appendChild(alertElement.firstElementChild)
      setTimeout(() => { if (alertElement.firstElementChild?.parentElement) alertElement.firstElementChild.remove() }, 4000)
    } catch (error) {
      console.error('启动防御失败:', error)
      setIsRunning(false)
      const alertElement = document.createElement('div')
      alertElement.innerHTML = `
        <div class="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-lg" role="alert">
          <strong class="font-bold">启动防御失败</strong>
          <span class="block sm:inline">${error.message}</span>
           <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      `
      document.body.appendChild(alertElement.firstElementChild)
      setTimeout(() => { if (alertElement.firstElementChild?.parentElement) alertElement.firstElementChild.remove() }, 5000)
    }
  }
  const handleStartTraining = () => handleStart()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-6">
      <div className="lg:col-span-2 xl:col-span-3 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">防御场景选择</h1>
            <p className="text-muted-foreground">配置和训练对抗防御算法，提升模型鲁棒性</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> 导入模型</Button>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" /> 导出模型</Button>
          </div>
        </header>

        {/* MODIFICATION START: Changed from grid layout to vertical stack */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2" /> 防御策略选择
            </CardTitle>
            <CardDescription>选择防御类型和目标模型</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={selectedDefenseType} onValueChange={handleDefenseTypeChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="adversarial_training" className="flex items-center">
                  <Brain className="h-4 w-4 mr-2" /> 对抗训练
                </TabsTrigger>
                <TabsTrigger value="preprocessing" className="flex items-center">
                  <Zap className="h-4 w-4 mr-2" /> 预处理防御
                </TabsTrigger>
                <TabsTrigger value="detection" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" /> 检测防御
                </TabsTrigger>
              </TabsList>
            </Tabs>

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
          </CardContent>
        </Card>
        
        <Card className="card-hover border-blue-200">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    攻击预设
                    <Badge variant={attackPreset ? 'default' : 'secondary'}>
                        {attackPreset ? '已关联' : '未关联'}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    将当前攻击配置作为防御评估的输入，便于“攻击→防御”联动
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {attackPreset ? (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">攻击类型</span>
                            <Badge variant="secondary">{attackPreset?.scenario === 'optical' ? '光电干扰' : '对抗攻击'}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">攻击算法</span>
                            <span className="font-medium">{(attackPreset?.attack_name || '').toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">模型/数据集</span>
                            <span className="font-medium">{attackPreset?.params?.model_name || '-'} / {attackPreset?.params?.dataset_name || '-'}</span>
                        </div>
                      {/* 关键参数速览 */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['eps','alpha','steps','patch_size','confidence','lr','initial_const','brightness_factor','noise_std','contrast_factor','distortion_type','severity','max_iter','overshoot'].map(k => (
                          (attackPreset?.params?.[k] !== undefined) && (
                            <div key={`preset-${k}`} className="flex justify-between border rounded p-2 bg-slate-50">
                              <span className="text-muted-foreground">{k}</span>
                              <span className="font-medium ml-2">{String(attackPreset.params[k])}</span>
                            </div>
                          )
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="default" onClick={() => navigate('/attack-scenarios')}>
                          前往攻击页面修改
                        </Button>
                        <Button variant="outline" onClick={() => { try { localStorage.removeItem('defense_attack_prefill_v1') } catch {} setAttackPreset(null) }}>
                          清除预设
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground h-24">
                        当前未关联攻击预设。可前往攻击场景选择攻击算法与参数，并点击“发送到防御”进行联动评估。
                      </div>
                      <div>
                        <Button variant="default" onClick={() => navigate('/attack-scenarios')}>
                          前往攻击场景
                        </Button>
                      </div>
                    </>
                  )}
            </CardContent>
        </Card>
        {/* MODIFICATION END */}

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" /> 防御参数配置
            </CardTitle>
            <CardDescription>
              调整{selectedDefenseType === 'adversarial_training' ? '对抗训练' : selectedDefenseType === 'preprocessing' ? '预处理防御' : '检测防御'}参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedDefenseType === 'adversarial_training' && (
              <>
                {selectedAlgorithm === 'genaf' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                          <Label>随机种子</Label>
                          <Input type="number" value={parameters.genaf_seed} onChange={(e) => handleParameterChange('genaf_seed', parseInt(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-2">
                          <Label>GPU编号</Label>
                          <Input value={parameters.genaf_gpu} onChange={(e) => handleParameterChange('genaf_gpu', e.target.value)} className="w-full" />
                      </div>
                      <div className="space-y-2">
                          <Label>数据集</Label>
                          <Select value={parameters.genaf_dataset} onValueChange={v => handleParameterChange('genaf_dataset', v)}>
                              <SelectTrigger><SelectValue placeholder="选择数据集" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="cifar10">CIFAR-10</SelectItem>
                                  <SelectItem value="stl10">STL-10</SelectItem>
                                  <SelectItem value="gtsrb">GTSRB</SelectItem>
                                  <SelectItem value="imagenet">ImageNet</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>批次大小</Label>
                          <Input type="number" value={parameters.genaf_batch_size} onChange={(e) => handleParameterChange('genaf_batch_size', parseInt(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-2">
                          <Label>训练轮数</Label>
                          <Input type="number" value={parameters.genaf_epochs} onChange={(e) => handleParameterChange('genaf_epochs', parseInt(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-2">
                          <Label>保存最优模型</Label>
                          <Select value={parameters.genaf_save ? 'true' : 'false'} onValueChange={v => handleParameterChange('genaf_save', v === 'true')}>
                              <SelectTrigger><SelectValue placeholder="是否保存" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="true">是</SelectItem>
                                  <SelectItem value="false">否</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>预训练数据集</Label>
                          <Select value={parameters.genaf_pre_dataset} onValueChange={v => handleParameterChange('genaf_pre_dataset', v)}>
                              <SelectTrigger><SelectValue placeholder="选择预训练集" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="cifar10">CIFAR-10</SelectItem>
                                  <SelectItem value="imagenet">ImageNet</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label>编码器类型</Label>
                          <Select value={parameters.genaf_victim} onValueChange={v => handleParameterChange('genaf_victim', v)}>
                              <SelectTrigger><SelectValue placeholder="选择编码器" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="simclr">SimCLR</SelectItem>
                                  <SelectItem value="byol">BYOL</SelectItem>
                                  <SelectItem value="dino">DINO</SelectItem>
                                  <SelectItem value="mocov3">MoCoV3</SelectItem>
                                  <SelectItem value="mocov2plus">MoCoV2+</SelectItem>
                                  <SelectItem value="nnclr">NNCLR</SelectItem>
                                  <SelectItem value="ressl">ReSSL</SelectItem>
                                  <SelectItem value="swav">SwAV</SelectItem>
                                  <SelectItem value="vibcreg">VIBCREG</SelectItem>
                                  <SelectItem value="wmse">WMSE</SelectItem>
                                  <SelectItem value="deepclusterv2">DeepClusterV2</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                        <Label>对抗样本比例: {parameters.adversarial_ratio}</Label>
                        <Slider value={[parameters.adversarial_ratio]} onValueChange={(value) => handleParameterChange('adversarial_ratio', value[0])} max={1.0} min={0.1} step={0.1} className="w-full" />
                        <p className="text-xs text-muted-foreground">训练数据中对抗样本的比例</p>
                    </div>
                    <div className="space-y-2">
                        <Label>学习率: {parameters.learning_rate}</Label>
                        <Slider value={[parameters.learning_rate]} onValueChange={(value) => handleParameterChange('learning_rate', value[0])} max={0.01} min={0.0001} step={0.0001} className="w-full" />
                        <p className="text-xs text-muted-foreground">模型训练的学习率</p>
                    </div>
                    <div className="space-y-2">
                        <Label>训练轮数: {parameters.epochs}</Label>
                        <Slider value={[parameters.epochs]} onValueChange={(value) => handleParameterChange('epochs', value[0])} max={100} min={1} step={1} className="w-full" />
                        <p className="text-xs text-muted-foreground">完整的训练轮数</p>
                    </div>
                    <div className="space-y-2">
                        <Label>批处理大小: {parameters.batch_size}</Label>
                        <Slider value={[parameters.batch_size]} onValueChange={(value) => handleParameterChange('batch_size', value[0])} max={128} min={8} step={8} className="w-full" />
                        <p className="text-xs text-muted-foreground">每个批次的样本数量</p>
                    </div>

                    {(selectedAlgorithm === 'pgd_training' || selectedAlgorithm === 'yopo' || selectedAlgorithm === 'freelb' || selectedAlgorithm === 'fgm' || selectedAlgorithm === 'freeadv') && (
                        <>
                            <div className="space-y-2">
                                <Label>扰动预算 (ε): {(parameters.eps * 255).toFixed(1)}/255</Label>
                                <Slider value={[parameters.eps * 255]} onValueChange={(value) => handleParameterChange('eps', value[0] / 255)} max={16} min={1} step={0.5} className="w-full" />
                                <p className="text-xs text-muted-foreground">对抗扰动的最大幅度</p>
                            </div>
                            <div className="space-y-2">
                                <Label>单步扰动 (α): {(parameters.alpha * 255).toFixed(1)}/255</Label>
                                <Slider value={[parameters.alpha * 255]} onValueChange={(value) => handleParameterChange('alpha', value[0] / 255)} max={8} min={0.5} step={0.1} className="w-full" />
                                <p className="text-xs text-muted-foreground">每次迭代的扰动步长</p>
                            </div>
                            <div className="space-y-2">
                                <Label>攻击步数: {parameters.steps}</Label>
                                <Slider value={[parameters.steps]} onValueChange={(value) => handleParameterChange('steps', value[0])} max={20} min={5} step={1} className="w-full" />
                                <p className="text-xs text-muted-foreground">生成对抗样本的总步数</p>
                            </div>
                        </>
                    )}
                    
                    {selectedAlgorithm === 'yopo' && (
                        <div className="space-y-2">
                            <Label>最大梯度传播步数: {parameters.max_grad_steps}</Label>
                            <Slider value={[parameters.max_grad_steps]} onValueChange={(value) => handleParameterChange('max_grad_steps', value[0])} max={10} min={1} step={1} className="w-full" />
                            <p className="text-xs text-muted-foreground">YOPO算法中限制梯度传播的最大步数</p>
                        </div>
                    )}

                    {selectedAlgorithm === 'freelb' && (
                        <>
                            <div className="space-y-2">
                                <Label>大批量大小: {parameters.freelb_batch_size}</Label>
                                <Slider value={[parameters.freelb_batch_size]} onValueChange={(value) => handleParameterChange('freelb_batch_size', value[0])} max={128} min={16} step={16} className="w-full" />
                                <p className="text-xs text-muted-foreground">FreeLB算法使用的大批量大小</p>
                            </div>
                            <div className="space-y-2">
                                <Label>对抗训练步数: {parameters.freelb_steps}</Label>
                                <Slider value={[parameters.freelb_steps]} onValueChange={(value) => handleParameterChange('freelb_steps', value[0])} max={15} min={5} step={1} className="w-full" />
                                <p className="text-xs text-muted-foreground">FreeLB算法中对抗训练的步数</p>
                            </div>
                        </>
                    )}
                  </div>
                )}
              </>
            )}

            {selectedDefenseType === 'preprocessing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label>评估图片数: {parameters.num_images}</Label>
                  <Slider value={[parameters.num_images]} onValueChange={(value) => handleParameterChange('num_images', value[0])} max={100} min={1} step={1} className="w-full" />
                  <p className="text-xs text-muted-foreground">用于评估防御效果的图片数量</p>
                </div>
                 {(selectedAlgorithm === 'gaussian_blur' || selectedAlgorithm === 'median_filter') && (
                  <div className="space-y-2">
                    <Label>滤波器大小: {parameters.ksize}</Label>
                    <Slider value={[parameters.ksize]} onValueChange={(value) => handleParameterChange('ksize', value[0])} max={15} min={3} step={2} className="w-full" />
                    <p className="text-xs text-muted-foreground">滤波器的核大小 (奇数)</p>
                  </div>
                 )}
                 {selectedAlgorithm === 'jpeg_compression' && (
                  <div className="space-y-2">
                    <Label>压缩质量: {parameters.quality}</Label>
                    <Slider value={[parameters.quality]} onValueChange={(value) => handleParameterChange('quality', value[0])} max={100} min={10} step={5} className="w-full" />
                    <p className="text-xs text-muted-foreground">JPEG压缩质量 (1-100)</p>
                  </div>
                 )}
                 {selectedAlgorithm === 'bit_depth_reduction' && (
                    <div className="space-y-2">
                      <Label>目标位深度: {parameters.bits}</Label>
                      <Slider value={[parameters.bits]} onValueChange={(value) => handleParameterChange('bits', value[0])} max={7} min={1} step={1} className="w-full" />
                      <p className="text-xs text-muted-foreground">将颜色深度减少到指定位数</p>
                    </div>
                 )}
              </div>
            )}

            {selectedDefenseType === 'detection' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label>检测阈值: {parameters.detection_threshold}</Label>
                  <Slider value={[parameters.detection_threshold]} onValueChange={(value) => handleParameterChange('detection_threshold', value[0])} max={1.0} min={0.1} step={0.05} className="w-full" />
                  <p className="text-xs text-muted-foreground">对抗样本检测的置信度阈值</p>
                </div>

                <div className="space-y-2">
                  <Label>评估图片数: {parameters.num_images}</Label>
                  <Slider value={[parameters.num_images]} onValueChange={(value) => handleParameterChange('num_images', value[0])} max={100} min={1} step={1} className="w-full" />
                  <p className="text-xs text-muted-foreground">用于评估检测效果的图片数量</p>
                </div>
              </div>
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
      </div>

      <div className="lg:col-span-1 xl:col-span-1 space-y-6">
        <Card className="card-hover">
            <CardHeader>
                <CardTitle>执行控制</CardTitle>
                <CardDescription>启动和控制防御任务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={handleStart} disabled={isRunning} className="w-full">
                    {isRunning ? (
                        <><Pause className="h-4 w-4 mr-2" /> 执行中...</>
                    ) : (
                        <><Play className="h-4 w-4 mr-2" /> 开始执行</>
                    )}
                </Button>
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>任务进度</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground">
                    {taskStatus?.status || '正在执行防御任务...'}
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
        <Card className="card-hover">
            <CardHeader>
                <CardTitle>配置摘要</CardTitle>
                <CardDescription>当前选择的防御配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">防御类型</span>
                    <Badge variant="outline">
                        {selectedDefenseType === 'adversarial_training' ? '对抗训练' : selectedDefenseType === 'preprocessing' ? '预处理防御' : '检测防御'}
                    </Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">目标模型</span>
                    <span className="font-medium">{models.find(m => m.id === selectedModel)?.name}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">数据集</span>
                    <span className="font-medium">{datasets.find(d => d.id === selectedDataset)?.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">防御算法</span>
                    <span className="font-medium">{defenseAlgorithms[selectedDefenseType]?.find(a => a.id === selectedAlgorithm)?.name}</span>
                </div>
              {/* 新增：若有关联攻击预设，则在配置摘要中同步显示 */}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">攻击算法</span>
                <span className="text-sm font-medium">
                  {attackPreset ? (attackPreset.attack_name || '').toUpperCase() : '未关联'}
                </span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <span className="text-sm font-medium">关键参数</span>
                {selectedDefenseType === 'adversarial_training' ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">对抗样本比例</span><span>{parameters.adversarial_ratio}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">学习率</span><span>{parameters.learning_rate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">训练轮数</span><span>{parameters.epochs}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">批处理大小</span><span>{parameters.batch_size}</span></div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">防御强度</span><span>{parameters.defense_strength}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">正则化系数</span><span>{parameters.regularization}</span></div>
                  </div>
                )}
              </div>
            </CardContent>
        </Card>
        <Card className="card-hover">
            <CardHeader>
                <CardTitle className="flex items-center"><FileText className="h-4 w-4 mr-2" /> 运行日志</CardTitle>
            </CardHeader>
            <CardContent className="h-48 overflow-y-auto space-y-2 text-xs font-mono">
                {logMessages.length > 0 ? (
                    logMessages.map(log => (
                        <div key={log.id} className="flex items-start">
                            <span className="mr-2 pt-0.5">
                                {log.type === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                {log.type === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                {log.type === 'info' && <AlertTriangle className="h-3 w-3 text-blue-500" />}
                            </span>
                            <span className="text-muted-foreground mr-2">[{log.timestamp}]</span>
                            <span className="flex-1" dangerouslySetInnerHTML={{ __html: log.message }}></span>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center text-muted-foreground">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        <span>准备就绪, 等待任务启动...</span>
                    </div>
                )}
            </CardContent>
        </Card>
        <Card className="card-hover">
            <CardHeader>
                <CardTitle>模型性能</CardTitle>
                <CardDescription>当前模型的防御效果</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm"><label>清洁准确率</label><span>92.5%</span></div>
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
  )
}
