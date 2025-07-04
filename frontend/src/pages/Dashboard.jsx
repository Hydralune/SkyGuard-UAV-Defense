import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from 'react-router-dom'
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
  Clock
} from 'lucide-react'

export default function Dashboard() {
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
          <Button>开始演练</Button>
          <Button variant="outline">查看报告</Button>
        </div>
      </div>

      {/* 系统状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃演练</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +2 较昨日
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">参与团队</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 较上周
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">
              +5.2% 较上月
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统负载</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <Progress value={68} className="mt-2" />
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
              <Card className="card-hover cursor-pointer">
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
              <Card className="card-hover cursor-pointer">
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
              <Card className="card-hover cursor-pointer">
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

      {/* 最近活动 */}
      <Card>
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

