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
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">运维管理</h1>
          <p className="text-gray-600 mt-2">
            系统运维和监控管理
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Settings className="h-4 w-4 mr-2" />
            系统设置
          </Button>
        </div>
      </div>

      {/* 系统状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">系统状态</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">运行正常</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">所有服务在线</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">CPU使用率</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics.cpu.usage}%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">{systemMetrics.cpu.cores}核心</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">内存使用</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics.memory.usage}%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">{systemMetrics.memory.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">GPU使用率</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics.gpu.usage}%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">{systemMetrics.gpu.model}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">存储使用</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Server className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics.storage.usage}%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">{systemMetrics.storage.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">性能监控</TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">任务管理</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">日志管理</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">系统性能趋势</CardTitle>
                <CardDescription className="text-gray-600">
                  过去24小时的系统性能变化
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #dbeafe',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU" />
                    <Line type="monotone" dataKey="memory" stroke="#22c55e" strokeWidth={2} name="内存" />
                    <Line type="monotone" dataKey="gpu" stroke="#8b5cf6" strokeWidth={2} name="GPU" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">资源使用详情</CardTitle>
                <CardDescription className="text-gray-600">
                  各组件资源使用情况
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>CPU使用率</span>
                    <span>{systemMetrics.cpu.usage}%</span>
                  </div>
                  <Progress value={systemMetrics.cpu.usage} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>内存使用率</span>
                    <span>{systemMetrics.memory.usage}%</span>
                  </div>
                  <Progress value={systemMetrics.memory.usage} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>GPU使用率</span>
                    <span>{systemMetrics.gpu.usage}%</span>
                  </div>
                  <Progress value={systemMetrics.gpu.usage} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>存储使用率</span>
                    <span>{systemMetrics.storage.usage}%</span>
                  </div>
                  <Progress value={systemMetrics.storage.usage} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-yellow-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">任务管理</CardTitle>
              <CardDescription className="text-gray-600">
                系统任务状态和调度管理
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">运行中任务</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">3个</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-700">等待中任务</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">2个</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">错误任务</span>
                </div>
                <Badge className="bg-red-100 text-red-800 border-red-200">0个</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">系统日志</CardTitle>
              <CardDescription className="text-gray-600">
                实时系统日志和错误信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-gray-700">系统启动完成 - 2025-01-03 10:30:15</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-gray-700">GPU驱动加载成功 - 2025-01-03 10:30:18</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-gray-700">模型服务启动完成 - 2025-01-03 10:30:25</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-gray-700">数据库连接正常 - 2025-01-03 10:30:30</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-gray-700">Web服务启动完成 - 2025-01-03 10:30:35</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

