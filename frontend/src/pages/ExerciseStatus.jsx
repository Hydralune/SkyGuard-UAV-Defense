import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  Shield,
  Sword,
  Users,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react'

export default function ExerciseStatus() {
  const [exerciseStatus, setExerciseStatus] = useState('running') // running, paused, completed

  const activeExercises = [
    {
      id: 1,
      name: '对抗攻击演练 - PGD',
      team: '团队Alpha',
      status: 'running',
      progress: 75,
      startTime: '14:30',
      estimatedEnd: '15:45',
      attackType: 'PGD',
      model: 'YOLOv5',
      dataset: 'COCO'
    },
    {
      id: 2,
      name: '光电干扰测试',
      team: '团队Beta',
      status: 'paused',
      progress: 45,
      startTime: '14:15',
      estimatedEnd: '16:00',
      attackType: '亮度干扰',
      model: 'YOLOv10',
      dataset: 'COCO'
    },
    {
      id: 3,
      name: '防御算法验证',
      team: '团队Gamma',
      status: 'completed',
      progress: 100,
      startTime: '13:00',
      estimatedEnd: '14:30',
      attackType: 'FGM防御',
      model: 'YOLOv5',
      dataset: 'Custom'
    }
  ]

  const systemMetrics = {
    cpuUsage: 68,
    memoryUsage: 72,
    gpuUsage: 85,
    networkLoad: 45,
    activeConnections: 24,
    queuedTasks: 8
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">演练态势</h1>
          <p className="text-gray-600 mt-2">
            实时监控攻防演练进度和系统状态
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <RotateCcw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Activity className="h-4 w-4 mr-2" />
            实时监控
          </Button>
        </div>
      </div>

      {/* 系统状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">活跃演练</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">进行中</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">参与团队</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">在线团队</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">系统负载</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Zap className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics.cpuUsage}%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">CPU使用率</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">队列任务</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics.queuedTasks}</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">等待中</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exercises" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="exercises" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">演练状态</TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">团队状态</TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">系统监控</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-4">
          <div className="space-y-4">
            {activeExercises.map((exercise) => (
              <Card key={exercise.id} className="bg-white backdrop-blur-sm border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">{exercise.name}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {exercise.team} • {exercise.attackType} • {exercise.model}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        exercise.status === 'running' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : exercise.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }>
                        {exercise.status === 'running' ? '进行中' :
                         exercise.status === 'paused' ? '暂停' : '已完成'}
                      </Badge>
                      <div className="flex space-x-1">
                        {exercise.status === 'running' && (
                          <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        {exercise.status === 'paused' && (
                          <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>进度</span>
                      <span>{exercise.progress}%</span>
                    </div>
                    <Progress value={exercise.progress} className="w-full" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">开始时间</span>
                      <div className="font-medium text-gray-900">{exercise.startTime}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">预计结束</span>
                      <div className="font-medium text-gray-900">{exercise.estimatedEnd}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">团队协作状态</CardTitle>
              <CardDescription className="text-gray-600">
                各团队的协作状态和活动情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: '团队Alpha', status: 'active', members: 5, tasks: 3, lastActivity: '2分钟前' },
                  { name: '团队Beta', status: 'active', members: 4, tasks: 2, lastActivity: '5分钟前' },
                  { name: '团队Gamma', status: 'idle', members: 6, tasks: 1, lastActivity: '15分钟前' },
                  { name: '团队Delta', status: 'active', members: 3, tasks: 4, lastActivity: '1分钟前' }
                ].map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        team.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-600">
                          {team.members}人 • {team.tasks}个任务
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{team.lastActivity}</div>
                      <Badge className={
                        team.status === 'active' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }>
                        {team.status === 'active' ? '活跃' : '空闲'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">系统资源使用</CardTitle>
                <CardDescription className="text-gray-600">
                  实时系统资源监控
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>CPU使用率</span>
                    <span>{systemMetrics.cpuUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.cpuUsage} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>内存使用率</span>
                    <span>{systemMetrics.memoryUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.memoryUsage} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>GPU使用率</span>
                    <span>{systemMetrics.gpuUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.gpuUsage} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>网络负载</span>
                    <span>{systemMetrics.networkLoad}%</span>
                  </div>
                  <Progress value={systemMetrics.networkLoad} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white backdrop-blur-sm border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">连接状态</CardTitle>
                <CardDescription className="text-gray-600">
                  网络连接和活动状态
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">活跃连接</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {systemMetrics.activeConnections}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">队列任务</span>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {systemMetrics.queuedTasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">系统状态</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      正常
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

