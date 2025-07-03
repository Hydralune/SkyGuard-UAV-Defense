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
    <div className="space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">演练态势</h1>
          <p className="text-muted-foreground mt-2">
            实时监控攻防演练进度和系统状态
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button size="sm">
            <Activity className="h-4 w-4 mr-2" />
            实时监控
          </Button>
        </div>
      </div>

      {/* 系统状态警报 */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          系统负载较高，GPU使用率达到85%。建议优化任务调度或增加计算资源。
        </AlertDescription>
      </Alert>

      {/* 总体状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃演练</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2个进行中，1个已完成
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">参与团队</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Alpha, Beta, Gamma
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均进度</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <Progress value={73} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统负载</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">
              CPU: 68% | GPU: 85%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细演练状态 */}
      <Tabs defaultValue="exercises" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exercises">演练详情</TabsTrigger>
          <TabsTrigger value="system">系统监控</TabsTrigger>
          <TabsTrigger value="logs">实时日志</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-4">
          <div className="space-y-4">
            {activeExercises.map((exercise) => (
              <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        exercise.status === 'running' ? 'bg-green-500 animate-pulse' :
                        exercise.status === 'paused' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        <CardDescription>
                          {exercise.team} • {exercise.model} • {exercise.dataset}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        exercise.status === 'running' ? 'default' :
                        exercise.status === 'paused' ? 'secondary' :
                        'outline'
                      }>
                        {exercise.status === 'running' ? '进行中' :
                         exercise.status === 'paused' ? '暂停' : '已完成'}
                      </Badge>
                      {exercise.status === 'running' && (
                        <Button variant="outline" size="sm">
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {exercise.status === 'paused' && (
                        <Button variant="outline" size="sm">
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>进度</span>
                      <span>{exercise.progress}%</span>
                    </div>
                    <Progress value={exercise.progress} />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">开始时间</span>
                        <p className="font-medium">{exercise.startTime}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">预计结束</span>
                        <p className="font-medium">{exercise.estimatedEnd}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">攻击类型</span>
                        <p className="font-medium">{exercise.attackType}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">状态</span>
                        <div className="flex items-center space-x-1">
                          {exercise.status === 'running' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {exercise.status === 'paused' && <Pause className="h-3 w-3 text-yellow-500" />}
                          {exercise.status === 'completed' && <CheckCircle className="h-3 w-3 text-gray-500" />}
                          <span className="font-medium">
                            {exercise.status === 'running' ? '正常' :
                             exercise.status === 'paused' ? '暂停' : '完成'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CPU 使用率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>当前使用率</span>
                    <span className="font-bold">{systemMetrics.cpuUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.cpuUsage} />
                  <p className="text-xs text-muted-foreground">
                    8核心 @ 3.2GHz
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">内存使用率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>当前使用率</span>
                    <span className="font-bold">{systemMetrics.memoryUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.memoryUsage} />
                  <p className="text-xs text-muted-foreground">
                    32GB DDR4
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GPU 使用率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>当前使用率</span>
                    <span className="font-bold text-orange-500">{systemMetrics.gpuUsage}%</span>
                  </div>
                  <Progress value={systemMetrics.gpuUsage} />
                  <p className="text-xs text-muted-foreground">
                    NVIDIA RTX 4090
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">网络负载</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>当前负载</span>
                    <span className="font-bold">{systemMetrics.networkLoad}%</span>
                  </div>
                  <Progress value={systemMetrics.networkLoad} />
                  <p className="text-xs text-muted-foreground">
                    10Gbps 以太网
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">活跃连接</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">{systemMetrics.activeConnections}</div>
                  <p className="text-sm text-muted-foreground">个连接</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">队列任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">{systemMetrics.queuedTasks}</div>
                  <p className="text-sm text-muted-foreground">个任务</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>实时系统日志</CardTitle>
              <CardDescription>最新的系统活动和事件记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">团队Alpha PGD攻击演练进度更新</span>
                      <span className="text-muted-foreground">15:32:45</span>
                    </div>
                    <p className="text-muted-foreground">当前进度: 75% | 预计剩余时间: 13分钟</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">GPU使用率警告</span>
                      <span className="text-muted-foreground">15:31:20</span>
                    </div>
                    <p className="text-muted-foreground">GPU使用率达到85%，建议优化任务分配</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">团队Beta暂停光电干扰测试</span>
                      <span className="text-muted-foreground">15:30:15</span>
                    </div>
                    <p className="text-muted-foreground">用户手动暂停，当前进度: 45%</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">团队Gamma防御算法验证完成</span>
                      <span className="text-muted-foreground">15:28:30</span>
                    </div>
                    <p className="text-muted-foreground">FGM防御算法测试成功完成，准确率: 92.5%</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">系统资源调度优化</span>
                      <span className="text-muted-foreground">15:25:10</span>
                    </div>
                    <p className="text-muted-foreground">自动调整任务优先级，优化GPU资源分配</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

