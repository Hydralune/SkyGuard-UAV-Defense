import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Settings,
  Plus,
  Save,
  Upload,
  Download,
  Edit,
  Trash2,
  Copy,
  Play,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  ChevronDown
} from 'lucide-react'

export default function CustomScenarios() {
  const navigate = useNavigate()
  const PERSIST_KEY = 'custom_scenarios_v1'
  const hasRestoredRef = useRef(false)
  const [isRunning, setIsRunning] = useState(false)
  const [runTaskId, setRunTaskId] = useState(null)
  const [runProgress, setRunProgress] = useState(0)
  const [runStatusText, setRunStatusText] = useState('')
  const [runLogs, setRunLogs] = useState([])
  const [editingId, setEditingId] = useState(null)
  const importInputRef = useRef(null)
  const [sysLogs, setSysLogs] = useState([])
  const [sysLogsError, setSysLogsError] = useState(null)
  const [sysLogsExpanded, setSysLogsExpanded] = useState(false)
  const [showRunLogs, setShowRunLogs] = useState(false)
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: '复合攻击场景A',
      description: 'PGD攻击 + 光照干扰的复合场景',
      type: 'hybrid',
      attacks: ['pgd', 'brightness'],
      defenses: ['pgd_training'],
      created: '2025-07-01',
      status: 'active'
    },
    {
      id: 2,
      name: '极端环境测试',
      description: '多种环境干扰的综合测试',
      type: 'environmental',
      attacks: ['gaussian', 'contrast', 'distortion'],
      defenses: ['preprocessing'],
      created: '2025-06-28',
      status: 'draft'
    }
  ])

  const [currentScenario, setCurrentScenario] = useState({
    name: '',
    description: '',
    type: 'hybrid',
    attacks: [],
    defenses: [],
    parameters: {},
    schedule: {
      enabled: false,
      sequence: [],
      timing: 'sequential'
    }
  })

  const availableAttacks = [
    { id: 'pgd', name: 'PGD攻击', category: 'adversarial' },
    { id: 'fgsm', name: 'FGSM攻击', category: 'adversarial' },
    { id: 'cw_l2', name: 'C&W攻击', category: 'adversarial' },
    { id: 'deepfool', name: 'DeepFool', category: 'adversarial' },
    { id: 'dpatch', name: 'DPatch', category: 'adversarial' },
    { id: 'advpatch', name: 'AdvPatch', category: 'adversarial' },
    { id: 'brightness', name: '亮度干扰', category: 'optical' },
    { id: 'gaussian', name: '高斯噪声', category: 'optical' },
    { id: 'contrast', name: '对比度调整', category: 'optical' },
    { id: 'distortion', name: '图像扭曲', category: 'optical' },
    { id: 'scene_transition', name: '场景跃变', category: 'optical' }
  ]

  const availableDefenses = [
    { id: 'pgd_training', name: 'PGD训练', category: 'adversarial_training' },
    { id: 'fgm', name: 'FGM训练', category: 'adversarial_training' },
    { id: 'freeadv', name: 'FreeAT训练', category: 'adversarial_training' },
    { id: 'yopo', name: 'YOPO训练', category: 'adversarial_training' },
    { id: 'freelb', name: 'FreeLB训练', category: 'adversarial_training' },
    { id: 'preprocessing', name: '预处理防御', category: 'preprocessing' },
    { id: 'detection', name: '检测防御', category: 'detection' }
  ]

  const handleAddAttack = (attackId) => {
    if (!currentScenario.attacks.includes(attackId)) {
      setCurrentScenario(prev => ({
        ...prev,
        attacks: [...prev.attacks, attackId]
      }))
    }
  }

  const handleRemoveAttack = (attackId) => {
    setCurrentScenario(prev => ({
      ...prev,
      attacks: prev.attacks.filter(id => id !== attackId)
    }))
  }

  const handleAddDefense = (defenseId) => {
    if (!currentScenario.defenses.includes(defenseId)) {
      setCurrentScenario(prev => ({
        ...prev,
        defenses: [...prev.defenses, defenseId]
      }))
    }
  }

  const handleRemoveDefense = (defenseId) => {
    setCurrentScenario(prev => ({
      ...prev,
      defenses: prev.defenses.filter(id => id !== defenseId)
    }))
  }

  const handleSaveScenario = () => {
    const newScenario = {
      ...currentScenario,
      id: scenarios.length + 1,
      created: new Date().toISOString().split('T')[0],
      status: 'draft'
    }
    setScenarios(prev => [...prev, newScenario])
    setCurrentScenario({
      name: '',
      description: '',
      type: 'hybrid',
      attacks: [],
      defenses: [],
      parameters: {},
      schedule: { enabled: false, sequence: [], timing: 'sequential' }
    })
  }

  // 本地持久化（加载）
  useEffect(() => {
    if (hasRestoredRef.current) return
    try {
      const raw = localStorage.getItem(PERSIST_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (Array.isArray(saved)) setScenarios(saved)
      }
    } catch {}
    hasRestoredRef.current = true
  }, [])

  // 本地持久化（保存）
  useEffect(() => {
    try { localStorage.setItem(PERSIST_KEY, JSON.stringify(scenarios)) } catch {}
  }, [scenarios])

  // 设置通用/逐攻击参数
  const setParam = (key, value) => {
    setCurrentScenario(prev => ({
      ...prev,
      parameters: { ...(prev.parameters || {}), [key]: value }
    }))
  }
  const setAttackParam = (attackId, key, value) => {
    setCurrentScenario(prev => ({
      ...prev,
      parameters: {
        ...(prev.parameters || {}),
        attack_params: {
          ...((prev.parameters || {}).attack_params || {}),
          [attackId]: {
            ...(((prev.parameters || {}).attack_params || {})[attackId] || {}),
            [key]: value
          }
        }
      }
    }))
  }

  // 后端映射与参数构建
  const backendModelMap = {
    yolov8s: 'yolov8s-visdrone',
    yolov5: 'yolov5-visdrone',
    yolov10: 'yolov10-visdrone',
    faster_rcnn: 'faster_rcnn-visdrone',
    ssd: 'ssd-visdrone'
  }
  const backendDatasetMap = { Visdrone: 'VisDrone', VisDrone: 'VisDrone' }

  const buildScenarioPayload = (scenario) => {
    const p = scenario?.parameters || {}
    const payload = {
      name: scenario?.name || '自定义场景',
      description: scenario?.description || '',
      type: scenario?.type || 'hybrid',
      attacks: Array.isArray(scenario?.attacks) ? scenario.attacks : [],
      defenses: Array.isArray(scenario?.defenses) ? scenario.defenses : [],
      parameters: {
        model_name: backendModelMap[p.model] || p.model_name || 'yolov8s-visdrone',
        dataset_name: backendDatasetMap[p.dataset] || p.dataset_name || 'VisDrone',
        num_images: Number.isFinite(p.num_images) ? p.num_images : 10,
        conf_threshold: typeof p.conf_threshold === 'number' ? p.conf_threshold : 0.25,
        iou_threshold: typeof p.iou_threshold === 'number' ? p.iou_threshold : 0.5,
        eps: p.eps || '8/255',
        alpha: p.alpha || '2/255',
        steps: typeof p.steps === 'number' ? p.steps : 10,
        // 预处理防御可选参数
        defense_type: p.defense_type || 'gaussian_blur',
        ksize: p.ksize,
        sigma: p.sigma,
        quality: p.quality,
        bits: p.bits,
        // 检测型防御可选参数
        threshold: p.threshold,
        alpha_stats: p.alpha_stats,
        hf_ratio: p.hf_ratio,
        // 若需要串联攻击
        attack_name: p.attack_name,
      },
      schedule: scenario?.schedule || { enabled: false, sequence: [], timing: 'sequential' }
    }
    return payload
  }

  // 运行场景并在完成后跳转到可视化
  const runScenario = async (scenario) => {
    try {
      const body = buildScenarioPayload(scenario)
      setIsRunning(true)
      setRunProgress(0)
      setRunStatusText('正在启动任务…')
      const res = await fetch('/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      const taskId = data.task_id
      setRunTaskId(taskId)
      setRunStatusText('任务已启动，正在执行…')

      // 轮询场景进度，待完成后再跳转到可视化
      let cancelled = false
      const poll = async () => {
        if (cancelled) return
        try {
          const r = await fetch(`/scenarios/${taskId}`)
          if (r.ok) {
            const j = await r.json()
            if (typeof j.percent === 'number') setRunProgress(j.percent)
            if (typeof j.message === 'string') setRunStatusText(j.message)
            if (j.status === 'completed') {
              setRunProgress(100)
              setRunStatusText('场景执行完成，正在跳转可视化…')
              navigate(`/visualization?task_id=${taskId}`)
              return
            }
            if (j.status === 'failed') {
              setRunStatusText(j.message || '场景执行失败')
              setIsRunning(false)
              return
            }
          }
        } catch {}
        setTimeout(poll, 2000)
      }
      poll()

      // 返回一个取消函数（在组件卸载时终止轮询）
      return () => { cancelled = true }
    } catch (e) {
      console.error('运行场景失败:', e)
      setRunStatusText(`运行失败：${e.message || e}`)
      setIsRunning(false)
    }
  }

  // 供“已保存的场景”列表按钮使用的包装函数
  const startScenarioRun = (scenario) => runScenario(scenario)

  // 系统日志轮询（常驻卡片使用）
  useEffect(() => {
    let timer
    const tick = async () => {
      try {
        const r = await fetch('/system/logs?limit=50')
        if (!r.ok) throw new Error(`${r.status}`)
        const j = await r.json()
        setSysLogs(Array.isArray(j) ? j : [])
        setSysLogsError(null)
      } catch (e) {
        setSysLogsError(e.message)
      }
      timer = setTimeout(tick, 5000)
    }
    tick()
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">自定义场景</h1>
          <p className="text-muted-foreground mt-2">
            创建和管理自定义攻防演练场景
          </p>
        </div>
        <div className="flex space-x-2">
          <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={async (e)=>{
            try {
              const file = e.target.files?.[0]
              if (!file) return
              const text = await file.text()
              const arr = JSON.parse(text)
              if (Array.isArray(arr)) setScenarios(arr)
            } catch {}
            if (importInputRef.current) importInputRef.current.value = ''
          }} />
          <Button variant="outline" onClick={()=>importInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            导入场景
          </Button>
          <Button variant="outline" onClick={()=>{
            try {
              const blob = new Blob([JSON.stringify(scenarios,null,2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'scenarios.json'
              a.click()
              URL.revokeObjectURL(url)
            } catch {}
          }}>
            <Download className="h-4 w-4 mr-2" />
            导出场景
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧场景创建 */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">基础配置</TabsTrigger>
              <TabsTrigger value="attacks">攻击配置</TabsTrigger>
              <TabsTrigger value="defenses">防御配置</TabsTrigger>
              <TabsTrigger value="schedule">执行调度</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>场景基础信息</CardTitle>
                  <CardDescription>设置场景的基本属性和描述</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scenarioName">场景名称</Label>
                    <Input
                      id="scenarioName"
                      value={currentScenario.name}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="输入场景名称"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scenarioDescription">场景描述</Label>
                    <Textarea
                      id="scenarioDescription"
                      value={currentScenario.description}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="描述场景的目的和特点"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scenarioType">场景类型</Label>
                    <Select
                      value={currentScenario.type}
                      onValueChange={(value) => setCurrentScenario(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hybrid">复合场景</SelectItem>
                        <SelectItem value="adversarial">对抗攻击场景</SelectItem>
                        <SelectItem value="environmental">环境干扰场景</SelectItem>
                        <SelectItem value="defense">防御测试场景</SelectItem>
                        <SelectItem value="benchmark">基准测试场景</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>难度等级</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">简单</SelectItem>
                          <SelectItem value="medium">中等</SelectItem>
                          <SelectItem value="hard">困难</SelectItem>
                          <SelectItem value="expert">专家</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>预计时长</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15分钟</SelectItem>
                          <SelectItem value="30">30分钟</SelectItem>
                          <SelectItem value="60">1小时</SelectItem>
                          <SelectItem value="120">2小时</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 评估选项 */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">评估选项</Label>
                    <div className="space-y-2">
                      <Label>评估图像数量</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={(currentScenario.parameters?.num_images ?? 10)}
                          onChange={(e) => setParam('num_images', parseInt(e.target.value) || 10)}
                          className="w-full"
                          min="1"
                          disabled={(currentScenario.parameters?.num_images ?? 10) === -1}
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="use-all-images"
                            checked={(currentScenario.parameters?.num_images ?? 10) === -1}
                            onCheckedChange={(checked) => setParam('num_images', checked ? -1 : 10)}
                          />
                          <Label htmlFor="use-all-images" className="text-sm">使用全部图像</Label>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">评估图像数量，-1 表示全部</p>
                    </div>

                    {/* 置信度与IoU 阈值 */}
                    <div className="space-y-2">
                      <Label>置信度阈值: {typeof currentScenario.parameters?.conf_threshold === 'number' ? currentScenario.parameters.conf_threshold : 0.25}</Label>
                      <input
                        type="range"
                        min={0.0}
                        max={1.0}
                        step={0.01}
                        value={typeof currentScenario.parameters?.conf_threshold === 'number' ? currentScenario.parameters.conf_threshold : 0.25}
                        onChange={(e) => setParam('conf_threshold', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">检测置信度阈值</p>
                    </div>
                    <div className="space-y-2">
                      <Label>IoU阈值: {typeof currentScenario.parameters?.iou_threshold === 'number' ? currentScenario.parameters.iou_threshold : 0.5}</Label>
                      <input
                        type="range"
                        min={0.1}
                        max={1.0}
                        step={0.01}
                        value={typeof currentScenario.parameters?.iou_threshold === 'number' ? currentScenario.parameters.iou_threshold : 0.5}
                        onChange={(e) => setParam('iou_threshold', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">检测重叠框 IoU 阈值</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attacks" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>攻击方法配置</CardTitle>
                  <CardDescription>选择和配置攻击算法</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">可用攻击方法</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {availableAttacks.map((attack) => (
                        <div key={attack.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{attack.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {attack.category === 'adversarial' ? '对抗' : '光电'}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={currentScenario.attacks.includes(attack.id) ? "default" : "outline"}
                            onClick={() => currentScenario.attacks.includes(attack.id) 
                              ? handleRemoveAttack(attack.id) 
                              : handleAddAttack(attack.id)
                            }
                          >
                            {currentScenario.attacks.includes(attack.id) ? '移除' : '添加'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentScenario.attacks.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-base font-medium">已选择的攻击方法</Label>
                        <div className="space-y-3">
                          {currentScenario.attacks.map((attackId) => {
                            const attack = availableAttacks.find(a => a.id === attackId)
                            return (
                              <div key={attackId} className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{attack?.name}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveAttack(attackId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 text-sm">
                                  {attackId === 'pgd' && (
                                    <>
                                      <div>
                                        <Label>扰动预算 (ε)</Label>
                                        <Input type="text" placeholder="8/255" onChange={(e)=>setAttackParam('pgd','eps',e.target.value)} />
                                      </div>
                                      <div>
                                        <Label>单步扰动 (α)</Label>
                                        <Input type="text" placeholder="2/255" onChange={(e)=>setAttackParam('pgd','alpha',e.target.value)} />
                                      </div>
                                      <div>
                                        <Label>迭代步数</Label>
                                        <Input type="number" placeholder="10" onChange={(e)=>setAttackParam('pgd','steps',parseInt(e.target.value)||10)} />
                                      </div>
                                    </>
                                  )}
                                  {attackId === 'fgsm' && (
                                    <div>
                                      <Label>扰动预算 (ε)</Label>
                                      <Input type="text" placeholder="8/255" onChange={(e)=>setAttackParam('fgsm','eps',e.target.value)} />
                                    </div>
                                  )}
                                  {attackId === 'cw_l2' && (
                                    <>
                                      <div>
                                        <Label>置信度</Label>
                                        <Input type="number" placeholder="0" onChange={(e)=>setAttackParam('cw_l2','confidence',parseFloat(e.target.value)||0)} />
                                      </div>
                                      <div>
                                        <Label>学习率</Label>
                                        <Input type="number" placeholder="0.01" step="0.001" onChange={(e)=>setAttackParam('cw_l2','lr',parseFloat(e.target.value)||0.01)} />
                                      </div>
                                      <div>
                                        <Label>初始常数c</Label>
                                        <Input type="number" placeholder="0.1" step="0.01" onChange={(e)=>setAttackParam('cw_l2','initial_const',parseFloat(e.target.value)||0.1)} />
                                      </div>
                                      <div>
                                        <Label>优化步数</Label>
                                        <Input type="number" placeholder="10" onChange={(e)=>setAttackParam('cw_l2','steps',parseInt(e.target.value)||10)} />
                                      </div>
                                    </>
                                  )}
                                  {attackId === 'dpatch' && (
                                    <>
                                      <div>
                                        <Label>补丁大小</Label>
                                        <Input type="number" placeholder="30" onChange={(e)=>setAttackParam('dpatch','patch_size',parseInt(e.target.value)||30)} />
                                      </div>
                                      <div>
                                        <Label>优化步数</Label>
                                        <Input type="number" placeholder="10" onChange={(e)=>setAttackParam('dpatch','steps',parseInt(e.target.value)||10)} />
                                      </div>
                                    </>
                                  )}
                                  {attackId === 'deepfool' && (
                                    <>
                                      <div>
                                        <Label>最大迭代</Label>
                                        <Input type="number" placeholder="50" onChange={(e)=>setAttackParam('deepfool','max_iter',parseInt(e.target.value)||50)} />
                                      </div>
                                      <div>
                                        <Label>越界程度</Label>
                                        <Input type="number" placeholder="0.02" step="0.01" onChange={(e)=>setAttackParam('deepfool','overshoot',parseFloat(e.target.value)||0.02)} />
                                      </div>
                                    </>
                                  )}
                                  {attackId === 'advpatch' && (
                                    <>
                                      <div>
                                        <Label>补丁大小(比例)</Label>
                                        <Input type="number" placeholder="0.1" step="0.01" onChange={(e)=>setAttackParam('advpatch','patch_size',parseFloat(e.target.value)||0.1)} />
                                      </div>
                                      <div>
                                        <Label>学习率</Label>
                                        <Input type="number" placeholder="0.1" step="0.01" onChange={(e)=>setAttackParam('advpatch','learning_rate',parseFloat(e.target.value)||0.1)} />
                                      </div>
                                      <div>
                                        <Label>最大迭代</Label>
                                        <Input type="number" placeholder="100" onChange={(e)=>setAttackParam('advpatch','max_iter',parseInt(e.target.value)||100)} />
                                      </div>
                                      <div>
                                        <Label>随机位置</Label>
                                        <Select onValueChange={(v)=>setAttackParam('advpatch','random_locations',v==='true')}>
                                          <SelectTrigger><SelectValue placeholder="true/false" /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="true">是</SelectItem>
                                            <SelectItem value="false">否</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>补丁数量</Label>
                                        <Input type="number" placeholder="1" onChange={(e)=>setAttackParam('advpatch','num_patches',parseInt(e.target.value)||1)} />
                                      </div>
                                    </>
                                  )}
                                  {attackId === 'brightness' && (
                                    <div>
                                      <Label>亮度因子</Label>
                                      <Input type="number" placeholder="1.5" step="0.1" onChange={(e)=>setAttackParam('brightness','brightness_factor',parseFloat(e.target.value)||1.5)} />
                                    </div>
                                  )}
                                  {attackId === 'gaussian' && (
                                    <div>
                                      <Label>噪声标准差</Label>
                                      <Input type="number" placeholder="0.1" step="0.01" onChange={(e)=>setAttackParam('gaussian','noise_std',parseFloat(e.target.value)||0.1)} />
                                    </div>
                                  )}
                                  {attackId === 'contrast' && (
                                    <div>
                                      <Label>对比度因子</Label>
                                      <Input type="number" placeholder="1.5" step="0.1" onChange={(e)=>setAttackParam('contrast','contrast_factor',parseFloat(e.target.value)||1.5)} />
                                    </div>
                                  )}
                                  {attackId === 'distortion' && (
                                    <>
                                      <div>
                                        <Label>扭曲类型</Label>
                                        <Select onValueChange={(v)=>setAttackParam('distortion','distortion_type',v)}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="elastic">elastic</SelectItem>
                                            <SelectItem value="wave">wave</SelectItem>
                                            <SelectItem value="swirl">swirl</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>严重程度</Label>
                                        <Input type="number" placeholder="0.5" step="0.05" onChange={(e)=>setAttackParam('distortion','severity',parseFloat(e.target.value)||0.5)} />
                                      </div>
                                    </>
                                  )}
                                  {attackId === 'scene_transition' && (
                                    <>
                                  <div>
                                        <Label>跃变类型</Label>
                                        <Select onValueChange={(v)=>setAttackParam('scene_transition','transition_type',v)}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="weather">weather</SelectItem>
                                            <SelectItem value="lighting">lighting</SelectItem>
                                            <SelectItem value="blur">blur</SelectItem>
                                          </SelectContent>
                                        </Select>
                                  </div>
                                  <div>
                                        <Label>严重程度</Label>
                                        <Input type="number" placeholder="0.5" step="0.05" onChange={(e)=>setAttackParam('scene_transition','severity',parseFloat(e.target.value)||0.5)} />
                                  </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="defenses" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>防御方法配置</CardTitle>
                  <CardDescription>选择和配置防御策略</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">可用防御方法</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {availableDefenses.map((defense) => (
                        <div key={defense.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{defense.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {defense.category === 'adversarial_training' ? '训练' : 
                               defense.category === 'preprocessing' ? '预处理' : '检测'}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={currentScenario.defenses.includes(defense.id) ? "default" : "outline"}
                            onClick={() => currentScenario.defenses.includes(defense.id) 
                              ? handleRemoveDefense(defense.id) 
                              : handleAddDefense(defense.id)
                            }
                          >
                            {currentScenario.defenses.includes(defense.id) ? '移除' : '添加'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentScenario.defenses.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-base font-medium">已选择的防御方法</Label>
                        <div className="space-y-3">
                          {currentScenario.defenses.map((defenseId) => {
                            const defense = availableDefenses.find(d => d.id === defenseId)
                            return (
                              <div key={defenseId} className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{defense?.name}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveDefense(defenseId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2 text-sm">
                                  {/* 预处理、防御、训练参数面板（简版） */}
                                  {defenseId === 'preprocessing' && (
                                    <>
                                  <div>
                                        <Label>防御类型</Label>
                                        <Select onValueChange={(v)=>setParam('defense_type',v)}>
                                          <SelectTrigger><SelectValue placeholder="gaussian_blur" /></SelectTrigger>
                                      <SelectContent>
                                            <SelectItem value="gaussian_blur">gaussian_blur</SelectItem>
                                            <SelectItem value="median_blur">median_blur</SelectItem>
                                            <SelectItem value="jpeg_compression">jpeg_compression</SelectItem>
                                            <SelectItem value="bit_depth_reduction">bit_depth_reduction</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                      <div>
                                        <Label>ksize</Label>
                                        <Input type="number" placeholder="5" onChange={(e)=>setParam('ksize',parseInt(e.target.value)||5)} />
                                      </div>
                                      <div>
                                        <Label>sigma</Label>
                                        <Input type="number" placeholder="0" step="0.1" onChange={(e)=>setParam('sigma',parseFloat(e.target.value)||0)} />
                                      </div>
                                      <div>
                                        <Label>quality</Label>
                                        <Input type="number" placeholder="85" onChange={(e)=>setParam('quality',parseInt(e.target.value)||85)} />
                                      </div>
                                      <div>
                                        <Label>bits</Label>
                                        <Input type="number" placeholder="5" onChange={(e)=>setParam('bits',parseInt(e.target.value)||5)} />
                                      </div>
                                    </>
                                  )}
                                  {defenseId === 'detection' && (
                                    <>
                                      <div>
                                        <Label>检测阈值</Label>
                                        <Input type="number" placeholder="0.35" step="0.01" onChange={(e)=>setParam('threshold',parseFloat(e.target.value)||0.35)} />
                                      </div>
                                      <div>
                                        <Label>显著性参数 alpha</Label>
                                        <Input type="number" placeholder="0.6" step="0.01" onChange={(e)=>setParam('alpha_stats',parseFloat(e.target.value)||0.6)} />
                                      </div>
                                      <div>
                                        <Label>高频比例 hf_ratio</Label>
                                        <Input type="number" placeholder="0.1" step="0.01" onChange={(e)=>setParam('hf_ratio',parseFloat(e.target.value)||0.1)} />
                                      </div>
                                    </>
                                  )}
                                  {['pgd_training','fgm','freeadv','yopo','freelb'].includes(defenseId) && (
                                    <>
                                      <div>
                                        <Label>epochs</Label>
                                        <Input type="number" placeholder="30" onChange={(e)=>setParam('epochs',parseInt(e.target.value)||30)} />
                                      </div>
                                      <div>
                                        <Label>batch</Label>
                                        <Input type="number" placeholder="16" onChange={(e)=>setParam('batch',parseInt(e.target.value)||16)} />
                                      </div>
                                      <div>
                                        <Label>eps</Label>
                                        <Input type="text" placeholder="8/255" onChange={(e)=>setParam('eps',e.target.value)} />
                                      </div>
                                      <div>
                                        <Label>alpha</Label>
                                        <Input type="text" placeholder="2/255" onChange={(e)=>setParam('alpha',e.target.value)} />
                                      </div>
                                      <div>
                                        <Label>steps</Label>
                                        <Input type="number" placeholder="10" onChange={(e)=>setParam('steps',parseInt(e.target.value)||10)} />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>执行调度配置</CardTitle>
                  <CardDescription>设置攻防序列的执行顺序和时间</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">启用调度</Label>
                      <p className="text-sm text-muted-foreground">按预定顺序执行攻防操作</p>
                    </div>
                    <Switch
                      checked={currentScenario.schedule.enabled}
                      onCheckedChange={(checked) => 
                        setCurrentScenario(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, enabled: checked }
                        }))
                      }
                    />
                  </div>

                  {currentScenario.schedule.enabled && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>执行模式</Label>
                          <Select
                            value={currentScenario.schedule.timing}
                            onValueChange={(value) => 
                              setCurrentScenario(prev => ({
                                ...prev,
                                schedule: { ...prev.schedule, timing: value }
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sequential">顺序执行</SelectItem>
                              <SelectItem value="parallel">并行执行</SelectItem>
                              <SelectItem value="random">随机执行</SelectItem>
                              <SelectItem value="adaptive">自适应执行</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>执行间隔 (秒)</Label>
                          <Input type="number" placeholder="30" />
                        </div>

                        <div className="space-y-2">
                          <Label>重复次数</Label>
                          <Input type="number" placeholder="1" />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2">
            <Button onClick={handleSaveScenario} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              保存场景
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              预览
            </Button>
          </div>

          {/* 按需固定在第一栏下方的两张卡片：系统执行日志 + 运行状态（上下堆叠，拉宽） */}
          <div className="space-y-6 mt-2">
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>系统执行日志</CardTitle>
                  <CardDescription>来自 /system/logs 的全局攻防任务日志</CardDescription>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded p-1 hover:bg-muted/60"
                  onClick={() => setSysLogsExpanded(v => !v)}
                  aria-label="切换日志展开"
                  title={sysLogsExpanded ? '收起' : '展开'}
                >
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${sysLogsExpanded ? 'rotate-180' : ''}`} />
                </button>
              </CardHeader>
              <CardContent className={`${sysLogsExpanded ? 'max-h-[520px]' : 'max-h-[260px]'} overflow-auto no-scrollbar`}>
                {sysLogsError && (
                  <div className="text-xs text-red-600 mb-2 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" /> {sysLogsError}
                  </div>
                )}
                {(() => {
                  const previewCount = 6
                  const logs = Array.isArray(sysLogs) ? (sysLogsExpanded ? sysLogs : sysLogs.slice(0, previewCount)) : []
                  return (
                    <div className="space-y-2 text-xs">
                      {logs.map((log, idx) => (
                        <div key={`syslog-embed-${idx}`} className="flex items-start justify-between border rounded p-2">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${log.severity==='error'?'bg-red-500':log.severity==='success'?'bg-green-500':'bg-blue-500'}`}></span>
                              <span className="font-medium">[{log.type}] {log.message}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {log.task_id ? `task:${log.task_id} ` : ''}
                              {log.meta?.attack_name ? `attack:${log.meta.attack_name} ` : ''}
                              {log.meta?.defense_type ? `defense:${log.meta.defense_type} ` : ''}
                              {log.meta?.model_name ? `model:${log.meta.model_name} ` : ''}
                              {log.meta?.dataset_name ? `data:${log.meta.dataset_name} ` : ''}
                              {typeof log.meta?.percent==='number' ? `${log.meta.percent}%` : ''}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400">{new Date((typeof log.timestamp==='number'? log.timestamp*1000 : log.timestamp)).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {Array.isArray(sysLogs) && sysLogs.length > previewCount && !sysLogsExpanded && (
                        <div className="text-xs text-muted-foreground pt-1">已显示最近 {previewCount} 条，点击右上角展开查看全部…</div>
                      )}
                      {(!sysLogs || sysLogs.length===0) && (
                        <div className="text-xs text-muted-foreground">暂无日志</div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>运行状态</CardTitle>
                  <CardDescription>实时查看场景执行进度</CardDescription>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded p-1 hover:bg-muted/60"
                  onClick={() => setShowRunLogs(v => !v)}
                  aria-label="切换运行日志展开"
                  title={showRunLogs ? '收起' : '展开'}
                >
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showRunLogs ? 'rotate-180' : ''}`} />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">{runTaskId ? `任务: ${runTaskId}` : '尚未运行'}</div>
                <Progress value={runProgress} />
                <div className="text-xs text-muted-foreground">{runStatusText}</div>
                <div className={`${showRunLogs ? 'max-h-[360px] overflow-auto no-scrollbar' : ''}`}>
                  {(() => {
                    const previewCount = 6
                    const logs = Array.isArray(runLogs) ? (showRunLogs ? runLogs : runLogs.slice(0, previewCount)) : []
                    return (
                      <div className="space-y-1 text-xs">
                        {logs.map((l) => (
                          <div key={`runlog-embed-${l.id}`} className="flex items-center justify-between">
                            <span className={l.type==='error'?'text-red-600':l.type==='success'?'text-green-600':'text-gray-700'}>{l.message}</span>
                            <span className="text-[10px] text-gray-400">{l.time}</span>
                          </div>
                        ))}
                        {Array.isArray(runLogs) && runLogs.length > previewCount && !showRunLogs && (
                          <div className="text-[11px] text-muted-foreground pt-1">已显示最近 {previewCount} 条，点击右上角展开查看全部…</div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 右侧场景列表 */}
        <div className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>已保存的场景</CardTitle>
              <CardDescription>管理和使用自定义场景</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-xs text-muted-foreground">{scenario.description}</p>
                      </div>
                      <Badge variant={scenario.status === 'active' ? 'default' : 'secondary'}>
                        {scenario.status === 'active' ? '活跃' : '草稿'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
                      <span>{scenario.attacks.length} 攻击</span>
                      <span>•</span>
                      <span>{scenario.defenses.length} 防御</span>
                      <span>•</span>
                      <span>{scenario.created}</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => startScenarioRun({
                        name: scenario.name,
                        description: scenario.description,
                        type: scenario.type,
                        attacks: scenario.attacks,
                        defenses: scenario.defenses,
                        parameters: scenario.parameters,
                        schedule: currentScenario.schedule
                      })}>
                        <Play className="h-3 w-3 mr-1" />
                        运行
                      </Button>
                      <Button size="sm" variant="outline" onClick={()=>editScenario(scenario)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={()=>copyScenario(scenario)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={()=>deleteScenario(scenario.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>场景模板</CardTitle>
              <CardDescription>使用预定义的场景模板</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: '基础对抗测试', attacks: 2, defenses: 1 },
                  { name: '环境鲁棒性测试', attacks: 3, defenses: 2 },
                  { name: '综合防御评估', attacks: 4, defenses: 3 }
                ].map((template, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {template.attacks} 攻击 • {template.defenses} 防御
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="h-3 w-3 mr-1" />
                      使用模板
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>场景统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">总场景数</span>
                <span className="font-medium">{scenarios.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">活跃场景</span>
                <span className="font-medium">{scenarios.filter(s => s.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">草稿场景</span>
                <span className="font-medium">{scenarios.filter(s => s.status === 'draft').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

