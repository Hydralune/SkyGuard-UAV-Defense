import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  Sword,
  ShieldCheck,
  Target,
  Zap,
  Eye,
  Activity,
  Users,
  BarChart3,
  Cpu,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown
} from 'lucide-react'

export default function Dashboard() {
  const [taskId, setTaskId] = useState(null)
  const [taskStatus, setTaskStatus] = useState(null) // 'PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'
  const [results, setResults] = useState({
    beforeImageUrl: null,
    afterImageUrl: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 开始基础演练
  const startBasicDrill = async () => {
    try {
      setLoading(true)
      setError(null)
      setTaskStatus('PENDING')
      
      const response = await fetch('http://localhost:8000/api/start-basic-drill', {
        method: 'POST',
      })
      
      const data = await response.json()
      setTaskId(data.task_id)
      
      // 开始轮询任务状态
      pollTaskStatus(data.task_id)
    } catch (err) {
      setError('启动演练失败: ' + err.message)
      setLoading(false)
      setTaskStatus('ERROR')
    }
  }

  // 轮询任务状态
  const pollTaskStatus = async (id) => {
    // 设置轮询间隔
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/get-result/${id}`)
        const data = await response.json()
        
        setTaskStatus(data.status)
        
        if (data.status === 'COMPLETED') {
          // 任务完成，停止轮询
          clearInterval(interval)
          setLoading(false)
          
          // 设置结果图片
          setResults({
            beforeImageUrl: `http://localhost:8000${data.before_image_url}`,
            afterImageUrl: `http://localhost:8000${data.after_image_url}`
          })
        } else if (data.status === 'ERROR') {
          // 任务出错，停止轮询
          clearInterval(interval)
          setLoading(false)
          setError('任务执行过程中出现错误')
        }
      } catch (err) {
        clearInterval(interval)
        setLoading(false)
        setError('获取任务状态失败: ' + err.message)
        setTaskStatus('ERROR')
      }
    }, 3000) // 每3秒轮询一次
    
    // 清理函数，组件卸载时取消轮询
    return () => clearInterval(interval)
  }

  // 状态显示文本
  const getStatusText = () => {
    switch(taskStatus) {
      case 'PENDING': return '任务等待中...'
      case 'PROCESSING': return '正在执行演练...'
      case 'COMPLETED': return '演练完成'
      case 'ERROR': return '演练失败'
      default: return null
    }
  }

  // 状态图标
  const getStatusIcon = () => {
    switch(taskStatus) {
      case 'PENDING': 
      case 'PROCESSING': 
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'COMPLETED': 
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ERROR': 
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: 
        return null
    }
  }

  // 系统负载与日志
  const [sysLoad, setSysLoad] = useState(null)
  const [sysLogs, setSysLogs] = useState([])
  const [sysError, setSysError] = useState(null)
  const [logsExpanded, setLogsExpanded] = useState(false)

  const fetchSystemLoad = async () => {
    try {
      const res = await fetch('/system/load')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      setSysLoad(data)
    } catch (e) {
      setSysError(`系统负载获取失败: ${e.message}`)
    }
  }

  const fetchSystemLogs = async () => {
    try {
      const res = await fetch('/system/logs?limit=20')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      setSysLogs(Array.isArray(data) ? data : [])
    } catch (e) {
      setSysError(`系统日志获取失败: ${e.message}`)
    }
  }

  useEffect(() => {
    fetchSystemLoad()
    fetchSystemLogs()
    const t1 = setInterval(fetchSystemLoad, 5000)
    const t2 = setInterval(fetchSystemLogs, 5000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const fmtBytes = (n) => {
    if (!n && n !== 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let val = n
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
    return `${val.toFixed(1)} ${units[i]}`
  }

  const fmtTime = (ts) => {
    try { return new Date((typeof ts === 'number' ? ts * 1000 : ts)).toLocaleTimeString() } catch { return '' }
  }

  // 迷你折线图（无需外部依赖）
  const Sparkline = ({ data, color = '#3b82f6' }) => {
    if (!Array.isArray(data) || data.length === 0) return null
    const width = 120
    const height = 36
    const max = Math.max(...data)
    const min = Math.min(...data)
    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((v - min) / (max - min || 1)) * height
        return `${x},${y}`
      })
      .join(' ')
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </svg>
    )
  }

  // 顶部统计卡片的模拟趋势数据（近7天）
  const trendMock = {
    drills: [2, 2, 3, 3, 4, 3, 3],
    teams: [9, 10, 10, 11, 11, 12, 12],
    success: [82.1, 84.2, 84.8, 85.7, 86.1, 86.9, 87.5]
  }

  const latestDrills = trendMock.drills[trendMock.drills.length - 1]
  const prevDrills = trendMock.drills[trendMock.drills.length - 2] || latestDrills
  const deltaDrills = latestDrills - prevDrills

  const latestTeams = trendMock.teams[trendMock.teams.length - 1]
  const weekTeamsBase = trendMock.teams[0]
  const deltaTeamsWeek = latestTeams - weekTeamsBase

  const latestSuccess = trendMock.success[trendMock.success.length - 1]
  const prevSuccess = trendMock.success[trendMock.success.length - 2] || latestSuccess
  const deltaSuccess = latestSuccess - prevSuccess

  // 系统负载卡片折叠
  const [loadExpanded, setLoadExpanded] = useState(false)
  // 左侧三张卡片折叠
  const [drillsExpanded, setDrillsExpanded] = useState(false)
  const [teamsExpanded, setTeamsExpanded] = useState(false)
  const [successExpanded, setSuccessExpanded] = useState(false)

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">低空无人智能体智能对抗攻防演练系统</h1>
          <p className="text-muted-foreground mt-2">
            基于人工智能的无人机攻防对抗演练平台，提供全方位的安全评估和训练
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={startBasicDrill} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            开始演练
          </Button>
          <Button variant="outline">查看报告</Button>
        </div>
      </div>

      {/* 演练状态和结果 */}
      {taskId && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>演练状态</CardTitle>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className={`text-sm ${taskStatus === 'COMPLETED' ? 'text-green-500' : 
                                          taskStatus === 'ERROR' ? 'text-red-500' : 
                                          'text-blue-500'}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
            <CardDescription>
              任务ID: {taskId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {taskStatus === 'COMPLETED' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">攻击前</h3>
                  <img 
                    src={results.beforeImageUrl} 
                    alt="攻击前图像" 
                    className="w-full rounded-md border"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">攻击后</h3>
                  <img 
                    src={results.afterImageUrl} 
                    alt="攻击后图像" 
                    className="w-full rounded-md border"
                  />
                </div>
              </div>
            )}
            
            {(taskStatus === 'PENDING' || taskStatus === 'PROCESSING') && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-muted-foreground">正在处理图像对抗攻击，请稍候...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 系统状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover bg-blue-50 border-blue-200 text-blue-900 min-h-[128px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃演练</CardTitle>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded p-1 hover:bg-blue-100/60"
              onClick={() => setDrillsExpanded(v => !v)}
              aria-label="切换活跃演练详情"
              title={drillsExpanded ? '收起' : '展开'}
            >
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${drillsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{latestDrills}</div>
                <p className="text-xs text-muted-foreground">
                  {deltaDrills >= 0 ? `+${Math.round(deltaDrills)}` : Math.round(deltaDrills)} 较昨日
                </p>
              </div>
              <Sparkline data={trendMock.drills} color="#2563eb" />
            </div>
            {drillsExpanded && (
              <div className="mt-2 text-xs space-y-1">
                <div>今日新增演练：{deltaDrills >= 0 ? `+${Math.round(deltaDrills)}` : Math.round(deltaDrills)}，失败：0</div>
                <div>峰值并发：4 场 · 平均时长：12 分钟</div>
                <div className="text-[11px] text-blue-700/80">说明：活跃演练统计用于衡量系统当前训练强度与资源占用趋势。</div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="card-hover bg-green-50 border-green-200 text-green-900 min-h-[128px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">参与团队</CardTitle>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded p-1 hover:bg-green-100/60"
              onClick={() => setTeamsExpanded(v => !v)}
              aria-label="切换参与团队详情"
              title={teamsExpanded ? '收起' : '展开'}
            >
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${teamsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{latestTeams}</div>
                <p className="text-xs text-muted-foreground">
                  {deltaTeamsWeek >= 0 ? `+${deltaTeamsWeek}` : deltaTeamsWeek} 较上周
                </p>
              </div>
              <Sparkline data={trendMock.teams} color="#16a34a" />
            </div>
            {teamsExpanded && (
              <div className="mt-2 text-xs space-y-1">
                <div>本周新增团队：{deltaTeamsWeek >= 0 ? `+${deltaTeamsWeek}` : deltaTeamsWeek} · 活跃成员：36</div>
                <div>平均响应时延：120 ms · 完成率：93%</div>
                <div className="text-[11px] text-green-700/80">说明：团队数据用于衡量协作参与度与平台粘性。</div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="card-hover bg-yellow-50 border-yellow-200 text-yellow-900 min-h-[128px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded p-1 hover:bg-yellow-100/60"
              onClick={() => setSuccessExpanded(v => !v)}
              aria-label="切换成功率详情"
              title={successExpanded ? '收起' : '展开'}
            >
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${successExpanded ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold">{latestSuccess.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {(deltaSuccess >= 0 ? `+${deltaSuccess.toFixed(1)}` : deltaSuccess.toFixed(1))}% 较昨日
                </p>
              </div>
              <Sparkline data={trendMock.success} color="#ca8a04" />
            </div>
            {successExpanded && (
              <div className="mt-2 text-xs space-y-1">
                <div>过去24小时提升：{(deltaSuccess >= 0 ? `+${deltaSuccess.toFixed(1)}` : deltaSuccess.toFixed(1))}% · 样本量：1.2k</div>
                <div>评估标准：mAP@0.5 · 统计口径：已完成任务</div>
                <div className="text-[11px] text-yellow-700/80">说明：成功率反映模型在对抗条件下的整体稳定性与鲁棒性。</div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="card-hover bg-red-50 border-red-200 text-red-900 min-h-[128px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统负载</CardTitle>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded p-1 hover:bg-red-100/60"
              onClick={() => setLoadExpanded(v => !v)}
              aria-label="切换系统负载详情"
              title={loadExpanded ? '收起' : '展开'}
            >
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${loadExpanded ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sysLoad?.cpu_percent ?? '—'}%</div>
            <Progress value={sysLoad?.cpu_percent ?? 0} className="mt-2" />
            {loadExpanded && (
              <div className="mt-2 text-xs space-y-1">
                <div>内存：{fmtBytes(sysLoad?.memory?.used)} / {fmtBytes(sysLoad?.memory?.total)}（{sysLoad?.memory?.percent ?? '—'}%）</div>
                <div>磁盘：{fmtBytes(sysLoad?.disk?.used)} / {fmtBytes(sysLoad?.disk?.total)}（{sysLoad?.disk?.percent ?? '—'}%）</div>
                <div>平均负载：{Array.isArray(sysLoad?.load_avg) ? sysLoad.load_avg.map(x => x.toFixed?.(2)).join(', ') : '—'}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 主要功能模块 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">系统概览</TabsTrigger>
          <TabsTrigger value="principles">攻防原理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/attack-scenarios">
              <Card className="card-hover bg-red-50 border-red-200 text-red-900 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Sword className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">攻击场景选择</CardTitle>
                  </div>
                  <CardDescription>
                    配置对抗攻击和光电干扰场景
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">对抗攻击</span>
                      <Badge variant="secondary">PGD, FGSM, C&W</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">光电干扰</span>
                      <Badge variant="secondary">亮度, 噪声, 扭曲</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/defense-scenarios">
              <Card className="card-hover bg-green-50 border-green-200 text-green-900 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">防御场景选择</CardTitle>
                  </div>
                  <CardDescription>
                    选择和配置防御算法策略
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">对抗训练</span>
                      <Badge variant="secondary">PGDtraining</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">鲁棒性增强</span>
                      <Badge variant="secondary">FGM, YOPO</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/visualization">
              <Card className="card-hover bg-blue-50 border-blue-200 text-blue-900 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">攻防过程可视化</CardTitle>
                  </div>
                  <CardDescription>
                    实时监控攻防过程和结果
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">样本对比</span>
                      <Badge variant="outline">实时</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">结果分析</span>
                      <Badge variant="outline">可视化</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="principles" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>攻防对抗原理</CardTitle>
              <CardDescription>
                深入了解无人机智能系统的攻防对抗机制和原理
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Target className="h-5 w-5 mr-2 text-red-500" />
                    攻击原理
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-medium">对抗攻击</h4>
                      <p className="text-sm text-muted-foreground">
                        通过在输入数据中添加精心设计的扰动，欺骗AI模型产生错误判断
                      </p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-medium">光电干扰</h4>
                      <p className="text-sm text-muted-foreground">
                        利用环境因素如光照、噪声等影响传感器数据质量
                      </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium">场景跃变</h4>
                      <p className="text-sm text-muted-foreground">
                        通过快速改变环境条件测试系统适应性
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-500" />
                    防御原理
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium">对抗训练</h4>
                      <p className="text-sm text-muted-foreground">
                        在训练过程中引入对抗样本，提高模型鲁棒性
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">特征去噪</h4>
                      <p className="text-sm text-muted-foreground">
                        通过预处理和特征工程减少噪声影响
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium">集成防御</h4>
                      <p className="text-sm text-muted-foreground">
                        结合多种防御策略构建多层防护体系
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 系统日志（可折叠） */}
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>系统日志</CardTitle>
            <CardDescription>全局攻防任务的状态变化与错误汇总</CardDescription>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded p-1 hover:bg-muted/60"
            onClick={() => setLogsExpanded(v => !v)}
            aria-label="切换日志展开"
            title={logsExpanded ? '收起' : '展开'}
          >
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${logsExpanded ? 'rotate-180' : ''}`} />
          </button>
        </CardHeader>
        <CardContent className={`${logsExpanded ? 'max-h-[520px]' : 'max-h-[260px]'} overflow-auto`}>
          {sysError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{sysError}</AlertDescription>
            </Alert>
          )}
          {(() => {
            const previewCount = 6
            const logs = Array.isArray(sysLogs) ? (logsExpanded ? sysLogs : sysLogs.slice(0, previewCount)) : []
            return (
              <div className="space-y-3">
                {logs.map((log, idx) => (
              <div key={`sys-log-${idx}`} className="flex items-start space-x-4">
                <div className={`w-2 h-2 rounded-full mt-2 ${log.severity === 'error' ? 'bg-red-500' : log.severity === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      [{log.type}] {log.message}
                    </div>
                    <div className="text-xs text-muted-foreground">{fmtTime(log.timestamp)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {log.task_id && (<span className="mr-3">task: {log.task_id}</span>)}
                    {log.meta?.attack_name && (<span className="mr-3">attack: {log.meta.attack_name}</span>)}
                    {log.meta?.defense_type && (<span className="mr-3">defense: {log.meta.defense_type}</span>)}
                    {log.meta?.model_name && (<span className="mr-3">model: {log.meta.model_name}</span>)}
                    {log.meta?.dataset_name && (<span className="mr-3">data: {log.meta.dataset_name}</span>)}
                    {typeof log.meta?.percent === 'number' && (<span className="mr-3">{log.meta.percent}%</span>)}
                  </div>
                </div>
                <Badge variant={log.severity === 'error' ? 'destructive' : log.severity === 'success' ? 'default' : 'secondary'}>
                  {log.severity}
                </Badge>
              </div>
                ))}
                {(!sysLogs || sysLogs.length === 0) && (
                  <div className="text-sm text-muted-foreground">暂无日志</div>
                )}
                {Array.isArray(sysLogs) && sysLogs.length > previewCount && !logsExpanded && (
                  <div className="text-xs text-muted-foreground pt-1">已显示最近 {previewCount} 条，点击右上角展开查看全部…</div>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}

