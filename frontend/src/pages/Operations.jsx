import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  const systemMetrics = {
    cpu: { usage: 68, cores: 8, frequency: '3.2GHz' },
    memory: { usage: 72, total: '32GB', available: '8.96GB' },
    gpu: { usage: 85, model: 'RTX 4090', memory: '24GB' },
    storage: { usage: 45, total: '2TB', available: '1.1TB' },
    network: { usage: 35, bandwidth: '10Gbps', latency: '2ms' }
  }

  const performanceData = [
    { time: '00:00', cpu: 45, memory: 60, gpu: 70 },
    { time: '04:00', cpu: 52, memory: 65, gpu: 75 },
    { time: '08:00', cpu: 68, memory: 72, gpu: 85 },
    { time: '12:00', cpu: 75, memory: 78, gpu: 90 },
    { time: '16:00', cpu: 70, memory: 75, gpu: 88 },
    { time: '20:00', cpu: 65, memory: 70, gpu: 80 }
  ]

  const activeTasks = [
    { id: 1, name: 'PGD攻击演练', team: '团队Alpha', progress: 75, status: 'running', priority: 'high' },
    { id: 2, name: '光电干扰测试', team: '团队Beta', progress: 45, status: 'paused', priority: 'medium' },
    { id: 3, name: '模型训练任务', team: '系统', progress: 90, status: 'running', priority: 'low' },
    { id: 4, name: '数据预处理', team: '团队Gamma', progress: 30, status: 'queued', priority: 'medium' }
  ]

  const systemLogs = [
    { time: '15:32:45', level: 'info', message: '团队Alpha PGD攻击演练进度更新: 75%', source: 'exercise-engine' },
    { time: '15:31:20', level: 'warning', message: 'GPU使用率达到85%，建议优化任务分配', source: 'resource-monitor' },
    { time: '15:30:15', level: 'info', message: '团队Beta暂停光电干扰测试', source: 'task-manager' },
    { time: '15:28:30', level: 'success', message: '团队Gamma防御算法验证完成', source: 'exercise-engine' },
    { time: '15:25:10', level: 'info', message: '系统资源调度优化完成', source: 'scheduler' }
  ]

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
            <div className="text-2xl font-bold">{systemMetrics.cpu.usage}%</div>
            <Progress value={systemMetrics.cpu.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.cpu.cores}核心 @ {systemMetrics.cpu.frequency}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.memory.usage}%</div>
            <Progress value={systemMetrics.memory.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.memory.available} / {systemMetrics.memory.total}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPU使用率</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{systemMetrics.gpu.usage}%</div>
            <Progress value={systemMetrics.gpu.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.gpu.model}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储使用率</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.storage.usage}%</div>
            <Progress value={systemMetrics.storage.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.storage.available} / {systemMetrics.storage.total}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">网络负载</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.network.usage}%</div>
            <Progress value={systemMetrics.network.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.network.bandwidth}
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
                <CardDescription>过去24小时的系统资源使用情况</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU" />
                    <Line type="monotone" dataKey="memory" stroke="#22c55e" strokeWidth={2} name="内存" />
                    <Line type="monotone" dataKey="gpu" stroke="#f59e0b" strokeWidth={2} name="GPU" />
                  </LineChart>
                </ResponsiveContainer>
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

