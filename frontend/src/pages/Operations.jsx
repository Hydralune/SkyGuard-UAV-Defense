import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiGet, API_ENDPOINTS } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
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
  Line
} from 'recharts'
import {
  Settings,
  Activity,
  HardDrive,
  Cpu,
  Network,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Monitor,
  FileText,
  RefreshCw,
  Power,
  Pause,
  Play
} from 'lucide-react'

export default function Operations() {
  const [systemStatus, setSystemStatus] = useState('running')

  // 实时系统负载（与 Dashboard 一致的接口）
  const [sysLoad, setSysLoad] = useState(null)
  const [perfHistory, setPerfHistory] = useState([]) // {time, cpu, memory, gpu}
  const [sysError, setSysError] = useState(null)

  const fmtBytes = (n) => {
    if (!n && n !== 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let val = n
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
    return `${val.toFixed(1)} ${units[i]}`
  }

  const fetchSystemLoad = async () => {
    try {
      const res = await apiGet(API_ENDPOINTS.SYSTEM_LOAD)
      const data = await res.json()
      setSysLoad(data)
      // 推入历史
      const now = new Date()
      const time = now.toTimeString().slice(0, 5)
      const point = {
        time,
        cpu: typeof data.cpu_percent === 'number' ? data.cpu_percent : null,
        memory: typeof data?.memory?.percent === 'number' ? data.memory.percent : null,
        gpu: typeof data?.gpu?.percent === 'number' ? data.gpu.percent : null
      }
      setPerfHistory((prev) => {
        const next = [...prev, point]
        // 限制 36 个点（约 3 分钟如果 5s 轮询）
        return next.slice(Math.max(0, next.length - 36))
      })
    } catch (e) {
      setSysError(`系统监控获取失败: ${e.message}`)
    }
  }

  useEffect(() => {
    fetchSystemLoad()
    const t = setInterval(fetchSystemLoad, 5000)
    return () => clearInterval(t)
  }, [])

  const activeTasks = [
    { id: 1, name: 'PGD攻击演练', team: '团队Alpha', progress: 75, status: 'running', priority: 'high' },
    { id: 2, name: '光电干扰测试', team: '团队Beta', progress: 45, status: 'paused', priority: 'medium' },
    { id: 3, name: '模型训练任务', team: '系统', progress: 90, status: 'running', priority: 'low' },
    { id: 4, name: '数据预处理', team: '团队Gamma', progress: 30, status: 'queued', priority: 'medium' }
  ]

  const [systemLogs, setSystemLogs] = useState([])

  const fetchSystemLogs = async () => {
    try {
      const res = await apiGet(API_ENDPOINTS.SYSTEM_LOGS, { limit: 50 })
      const data = await res.json()
      setSystemLogs(Array.isArray(data) ? data.map(l => ({
        time: typeof l.timestamp === 'number' ? new Date(l.timestamp * 1000).toLocaleTimeString() : l.timestamp,
        level: l.severity || 'info',
        message: l.message || '',
        source: l.type || 'system'
      })) : [])
    } catch (_) {}
  }

  useEffect(() => {
    fetchSystemLogs()
    const t = setInterval(fetchSystemLogs, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">运维管理</h1>
          <p className="text-muted-foreground mt-2">
            系统监控、任务管理、资源调度和日志管理
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            系统设置
          </Button>
        </div>
      </div>

      {/* 系统状态警报 */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          GPU使用率较高(85%)，建议优化任务调度。存储空间充足，网络状态正常。
        </AlertDescription>
      </Alert>

      {/* 系统概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU使用率</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sysLoad?.cpu_percent ?? '—'}%</div>
            <Progress value={sysLoad?.cpu_percent ?? 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              CPU 核心：{sysLoad?.cpu_count ?? '—'} · 平均负载：{Array.isArray(sysLoad?.load_avg) ? sysLoad.load_avg.map(x => x.toFixed?.(2)).join(', ') : '—'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sysLoad?.memory?.percent ?? '—'}%</div>
            <Progress value={sysLoad?.memory?.percent ?? 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {fmtBytes(sysLoad?.memory?.used)} / {fmtBytes(sysLoad?.memory?.total)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPU使用率</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{sysLoad?.gpu?.percent ?? '—'}%</div>
            <Progress value={sysLoad?.gpu?.percent ?? 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {sysLoad?.gpu?.model || 'GPU'} {sysLoad?.gpu?.memory ? `· ${sysLoad.gpu.memory}` : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储使用率</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sysLoad?.disk?.percent ?? '—'}%</div>
            <Progress value={sysLoad?.disk?.percent ?? 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {fmtBytes(sysLoad?.disk?.available)} / {fmtBytes(sysLoad?.disk?.total)} 可用
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">网络负载</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeof sysLoad?.network?.usage === 'number' ? sysLoad.network.usage : '—'}%</div>
            <Progress value={typeof sysLoad?.network?.usage === 'number' ? sysLoad.network.usage : 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {sysLoad?.network?.bandwidth || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细管理 */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">任务监控</TabsTrigger>
          <TabsTrigger value="scheduling">资源调度</TabsTrigger>
          <TabsTrigger value="logs">日志管理</TabsTrigger>
          <TabsTrigger value="system">系统管理</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>系统性能趋势</CardTitle>
                <CardDescription>实时系统资源使用情况（最近采样）</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={perfHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" interval={4} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU(%)" dot={false} />
                    <Line type="monotone" dataKey="memory" stroke="#22c55e" strokeWidth={2} name="内存(%)" dot={false} />
                    {perfHistory.some(d => typeof d.gpu === 'number') && (
                      <Line type="monotone" dataKey="gpu" stroke="#f59e0b" strokeWidth={2} name="GPU(%)" dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                {sysError && (
                  <p className="text-xs text-red-500 mt-2">{sysError}</p>
                )}
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle>活跃任务</CardTitle>
                <CardDescription>当前正在执行和排队的任务</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'running' ? 'bg-green-500 animate-pulse' :
                          task.status === 'paused' ? 'bg-yellow-500' :
                          task.status === 'queued' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        <div>
                          <h4 className="font-medium">{task.name}</h4>
                          <p className="text-sm text-muted-foreground">{task.team}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={
                          task.priority === 'high' ? 'destructive' :
                          task.priority === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {task.priority === 'high' ? '高优先级' :
                           task.priority === 'medium' ? '中优先级' :
                           '低优先级'}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">{task.progress}%</div>
                          <Progress value={task.progress} className="w-16" />
                        </div>
                        <div className="flex space-x-1">
                          {task.status === 'running' && (
                            <Button variant="outline" size="sm">
                              <Pause className="h-3 w-3" />
                            </Button>
                          )}
                          {task.status === 'paused' && (
                            <Button variant="outline" size="sm">
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>资源分配策略</CardTitle>
              <CardDescription>配置系统资源的自动分配规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">自动负载均衡</h4>
                  <p className="text-sm text-muted-foreground">根据任务优先级自动分配资源</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">GPU优先分配</h4>
                  <p className="text-sm text-muted-foreground">优先为高优先级任务分配GPU</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">内存预留</h4>
                  <p className="text-sm text-muted-foreground">为系统保留20%内存</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">任务队列管理</h4>
                  <p className="text-sm text-muted-foreground">智能排队和优先级调整</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>资源使用统计</CardTitle>
              <CardDescription>各类任务的资源消耗分析</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: '攻击演练', cpu: 65, memory: 70, gpu: 85 },
                  { name: '防御测试', cpu: 45, memory: 55, gpu: 60 },
                  { name: '模型训练', cpu: 80, memory: 85, gpu: 95 },
                  { name: '数据处理', cpu: 55, memory: 75, gpu: 40 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cpu" fill="#3b82f6" name="CPU" />
                  <Bar dataKey="memory" fill="#22c55e" name="内存" />
                  <Bar dataKey="gpu" fill="#f59e0b" name="GPU" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>系统日志</CardTitle>
                  <CardDescription>实时系统活动和事件记录</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-3 w-3 mr-1" />
                    导出日志
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    刷新
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {systemLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      log.level === 'success' ? 'bg-green-500' :
                      log.level === 'warning' ? 'bg-yellow-500' :
                      log.level === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{log.message}</span>
                        <span className="text-muted-foreground text-xs">{log.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {log.level}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{log.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>系统控制</CardTitle>
                <CardDescription>系统服务和组件管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">演练引擎</h4>
                      <p className="text-sm text-muted-foreground">运行中</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Pause className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">资源调度器</h4>
                      <p className="text-sm text-muted-foreground">运行中</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Pause className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <h4 className="font-medium">监控服务</h4>
                      <p className="text-sm text-muted-foreground">高负载</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle>系统配置</CardTitle>
                <CardDescription>核心系统参数设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">最大并发任务数</h4>
                  <div className="flex items-center space-x-2">
                    <input type="range" min="1" max="10" defaultValue="5" className="flex-1" />
                    <span className="text-sm font-medium">5</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">GPU内存限制 (%)</h4>
                  <div className="flex items-center space-x-2">
                    <input type="range" min="50" max="95" defaultValue="90" className="flex-1" />
                    <span className="text-sm font-medium">90%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">日志保留天数</h4>
                  <div className="flex items-center space-x-2">
                    <input type="range" min="7" max="90" defaultValue="30" className="flex-1" />
                    <span className="text-sm font-medium">30天</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button>保存配置</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

