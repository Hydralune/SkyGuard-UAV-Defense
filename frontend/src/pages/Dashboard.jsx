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
  RefreshCw,
  Play
} from 'lucide-react'
import { Label } from '@/components/ui/label'

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

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">系统概览</h1>
          <p className="text-gray-600 mt-2">
            攻防原理介绍和系统状态监控
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Zap className="h-4 w-4 mr-2" />
            快速演练
          </Button>
        </div>
      </div>

      {/* 系统状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-2xl font-bold text-gray-900">68%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">8核心 3.2GHz</span>
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
            <div className="text-2xl font-bold text-gray-900">72%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">32GB 总内存</span>
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
            <div className="text-2xl font-bold text-gray-900">85%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">RTX 4090 24GB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速演练区域 */}
      <Card className="bg-white backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900">快速演练</CardTitle>
          <CardDescription className="text-gray-600">
            一键启动基础攻防演练，快速验证系统功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={startBasicDrill}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  演练中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始演练
                </>
              )}
            </Button>
            
            {taskStatus && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  taskStatus === 'COMPLETED' ? 'bg-green-500' :
                  taskStatus === 'PROCESSING' ? 'bg-yellow-500' :
                  taskStatus === 'ERROR' ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                <span className="text-sm text-gray-600">{getStatusText()}</span>
              </div>
            )}
          </div>

          {results.beforeImageUrl && results.afterImageUrl && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">原始图像</Label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img src={results.beforeImageUrl} alt="原始图像" className="w-full h-48 object-cover" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">攻击结果</Label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img src={results.afterImageUrl} alt="攻击结果" className="w-full h-48 object-cover" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 功能模块导航 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">功能概览</TabsTrigger>
          <TabsTrigger value="status" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">系统状态</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">性能监控</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/attack-scenarios">
              <Card className="card-hover bg-white border-red-200 hover:border-red-300 text-red-900 cursor-pointer transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <Sword className="h-4 w-4 text-red-600" />
                    </div>
                    <CardTitle className="text-lg">攻击场景选择</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    配置对抗攻击和光电干扰场景
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">对抗攻击</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">PGD, FGSM, C&W</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">光电干扰</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">亮度, 噪声, 扭曲</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/defense-scenarios">
              <Card className="card-hover bg-white border-green-200 hover:border-green-300 text-green-900 cursor-pointer transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">防御场景选择</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    配置防御算法和策略
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">对抗训练</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">PGD Training</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">预处理防御</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">滤波, 压缩</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/visualization">
              <Card className="card-hover bg-white border-blue-200 hover:border-blue-300 text-blue-900 cursor-pointer transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">过程可视化</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    攻防过程实时可视化
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">样本对比</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">实时分析</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">差异分析</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">热力图</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/exercise-status">
              <Card className="card-hover bg-white border-yellow-200 hover:border-yellow-300 text-yellow-900 cursor-pointer transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-yellow-600" />
                    </div>
                    <CardTitle className="text-lg">演练态势</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    演练态势监控
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">实时监控</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">状态跟踪</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">性能指标</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">多维度</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/reports">
              <Card className="card-hover bg-white border-purple-200 hover:border-purple-300 text-purple-900 cursor-pointer transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">评分报告</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    结果分析和评分报告
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">数据分析</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">详细报告</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">性能评估</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">多维度</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/team-management">
              <Card className="card-hover bg-white border-indigo-200 hover:border-indigo-300 text-indigo-900 cursor-pointer transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <CardTitle className="text-lg">组队管理</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    团队协作和管理
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">团队协作</span>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">多人协作</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">权限管理</span>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">角色控制</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
              <CardDescription>
                实时监控系统各项关键指标和状态
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Cpu className="h-5 w-5 mr-2 text-blue-500" />
                    系统负载
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">CPU</h4>
                      <p className="text-sm text-muted-foreground">
                        68% 使用率
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium">内存</h4>
                      <p className="text-sm text-muted-foreground">
                        72% 使用率
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium">GPU</h4>
                      <p className="text-sm text-muted-foreground">
                        85% 使用率
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Network className="h-5 w-5 mr-2 text-indigo-500" />
                    网络连接
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-medium">状态</h4>
                      <p className="text-sm text-muted-foreground">
                        正常
                      </p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-medium">延迟</h4>
                      <p className="text-sm text-muted-foreground">
                        10ms
                      </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium">带宽</h4>
                      <p className="text-sm text-muted-foreground">
                        100Mbps
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>性能监控</CardTitle>
              <CardDescription>
                详细监控系统各项性能指标和历史数据
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                    性能指标
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium">响应时间</h4>
                      <p className="text-sm text-muted-foreground">
                        平均 50ms
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">吞吐量</h4>
                      <p className="text-sm text-muted-foreground">
                        每秒 1000 请求
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium">错误率</h4>
                      <p className="text-sm text-muted-foreground">
                        0.1%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-500" />
                    历史数据
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-gray-500 pl-4">
                      <h4 className="font-medium">24小时</h4>
                      <p className="text-sm text-muted-foreground">
                        平均响应: 60ms
                      </p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-medium">7天</h4>
                      <p className="text-sm text-muted-foreground">
                        吞吐量: 8000 请求
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">30天</h4>
                      <p className="text-sm text-muted-foreground">
                        错误率: 0.05%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 最近活动 */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
          <CardDescription>系统最新的演练活动和状态更新</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">团队Alpha完成PGD攻击演练</p>
                <p className="text-xs text-muted-foreground">2分钟前</p>
              </div>
              <Badge variant="outline">成功</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">新的防御算法FreeLP已部署</p>
                <p className="text-xs text-muted-foreground">15分钟前</p>
              </div>
              <Badge variant="secondary">更新</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">系统维护计划已安排</p>
                <p className="text-xs text-muted-foreground">1小时前</p>
              </div>
              <Badge variant="outline">计划中</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

