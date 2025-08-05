import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  FileText,
  Download,
  Share,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Shield,
  Sword,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('overview')
  const [timeRange, setTimeRange] = useState('week')

  // 模拟数据
  const overviewData = {
    totalExercises: 45,
    successRate: 87.5,
    averageScore: 82.3,
    participatingTeams: 12,
    improvementRate: 15.2
  }

  const performanceData = [
    { name: '团队Alpha', attack: 85, defense: 92, overall: 88.5 },
    { name: '团队Beta', attack: 78, defense: 85, overall: 81.5 },
    { name: '团队Gamma', attack: 92, defense: 88, overall: 90 },
    { name: '团队Delta', attack: 75, defense: 80, overall: 77.5 },
    { name: '团队Echo', attack: 88, defense: 85, overall: 86.5 }
  ]

  const trendData = [
    { date: '1月', attack: 75, defense: 80, overall: 77.5 },
    { date: '2月', attack: 78, defense: 82, overall: 80 },
    { date: '3月', attack: 82, defense: 85, overall: 83.5 },
    { date: '4月', attack: 85, defense: 88, overall: 86.5 },
    { date: '5月', attack: 88, defense: 90, overall: 89 },
    { date: '6月', attack: 90, defense: 92, overall: 91 }
  ]

  const algorithmData = [
    { name: 'PGD', value: 25, color: '#fca5a5' },
    { name: 'FGSM', value: 20, color: '#fdba74' },
    { name: 'C&W', value: 15, color: '#c4b5fd' },
    { name: 'AdvPatch', value: 18, color: '#67e8f9' },
    { name: 'DPatch', value: 12, color: '#6ee7b7' },
    { name: '其他', value: 10, color: '#d1d5db' }
  ]

  const radarData = [
    { subject: '攻击能力', A: 85, B: 78, fullMark: 100 },
    { subject: '防御能力', A: 92, B: 85, fullMark: 100 },
    { subject: '适应性', A: 88, B: 82, fullMark: 100 },
    { subject: '稳定性', A: 90, B: 88, fullMark: 100 },
    { subject: '创新性', A: 85, B: 75, fullMark: 100 },
    { subject: '协作能力', A: 87, B: 80, fullMark: 100 }
  ]

  const detailedReports = [
    {
      id: 1,
      title: '团队Alpha - PGD攻击演练报告',
      date: '2025-07-03',
      score: 88.5,
      status: 'completed',
      type: 'attack',
      duration: '2小时15分钟'
    },
    {
      id: 2,
      title: '团队Beta - 光电干扰防御测试',
      date: '2025-07-02',
      score: 81.5,
      status: 'completed',
      type: 'defense',
      duration: '1小时45分钟'
    },
    {
      id: 3,
      title: '团队Gamma - 综合攻防演练',
      date: '2025-07-01',
      score: 90,
      status: 'completed',
      type: 'comprehensive',
      duration: '3小时30分钟'
    }
  ]

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题和控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">评分报告</h1>
          <p className="text-gray-600 mt-2">
            攻防演练结果分析和性能评估报告
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white border-blue-200 hover:border-blue-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Share className="h-4 w-4 mr-2" />
            分享
          </Button>
        </div>
      </div>

      {/* 总体概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">总演练次数</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overviewData.totalExercises}</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-gray-700">+12 较上月</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">成功率</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overviewData.successRate}%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-gray-700">+5.2% 较上月</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">平均得分</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Award className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overviewData.averageScore}</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-gray-700">+3.1 较上月</span>
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
            <div className="text-2xl font-bold text-gray-900">{overviewData.participatingTeams}</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-gray-700">+3 较上月</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">提升率</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overviewData.improvementRate}%</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">持续改进</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细报告 */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">性能分析</TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">趋势分析</TabsTrigger>
          <TabsTrigger value="algorithms" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">算法统计</TabsTrigger>
          <TabsTrigger value="detailed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">详细报告</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white backdrop-blur-sm border-yellow-300 hover:border-yellow-400 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">团队性能对比</CardTitle>
                <CardDescription className="text-gray-600">各团队在攻击、防御和综合能力方面的表现</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #dbeafe',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="attack" fill="#fca5a5" name="攻击能力" />
                    <Bar dataKey="defense" fill="#86efac" name="防御能力" />
                    <Bar dataKey="overall" fill="#93c5fd" name="综合得分" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">能力雷达图</CardTitle>
                <CardDescription className="text-gray-600">团队Alpha vs 团队Beta 综合能力对比</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                    <Radar name="团队Alpha" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name="团队Beta" dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 排行榜 */}
          <Card className="bg-white backdrop-blur-sm border-green-300 hover:border-green-400 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">团队排行榜</CardTitle>
              <CardDescription className="text-gray-600">基于综合得分的团队排名</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData
                  .sort((a, b) => b.overall - a.overall)
                  .map((team, index) => (
                    <div key={team.name} className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-white/70 hover:bg-white/90 transition-all duration-200 shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                          'bg-gradient-to-r from-purple-400 to-purple-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-600">
                            攻击: <span className="text-red-600 font-medium">{team.attack}</span> | 防御: <span className="text-green-600 font-medium">{team.defense}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{team.overall}</div>
                        <p className="text-sm text-gray-600">综合得分</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>性能趋势分析</CardTitle>
              <CardDescription>过去6个月的整体性能变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attack" stroke="#ef4444" strokeWidth={2} name="攻击能力" />
                  <Line type="monotone" dataKey="defense" stroke="#22c55e" strokeWidth={2} name="防御能力" />
                  <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={2} name="综合得分" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">攻击能力趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">+20%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  相比6个月前提升显著
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">防御能力趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">+15%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  稳步提升，防御策略优化
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">综合得分趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">+17.5%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  整体水平持续提升
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="algorithms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>算法使用分布</CardTitle>
                <CardDescription>各种攻击算法的使用频率统计</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={algorithmData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {algorithmData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle>算法效果评估</CardTitle>
                <CardDescription>不同算法的成功率和效果对比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'PGD', success: 92, difficulty: 'high', color: '#fca5a5' },
                    { name: 'FGSM', success: 85, difficulty: 'medium', color: '#fdba74' },
                    { name: 'C&W', success: 88, difficulty: 'high', color: '#c4b5fd' },
                    { name: 'AdvPatch', success: 78, difficulty: 'medium', color: '#67e8f9' },
                    { name: 'DPatch', success: 82, difficulty: 'medium', color: '#6ee7b7' }
                  ].map((algo) => (
                    <div key={algo.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{algo.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant={algo.difficulty === 'high' ? 'destructive' : 'secondary'} 
                            className={`${
                              algo.difficulty === 'high' 
                                ? 'bg-red-100 text-red-800 border-red-200' 
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}>
                            {algo.difficulty === 'high' ? '高难度' : '中等难度'}
                          </Badge>
                          <span className="text-sm text-gray-700">{algo.success}%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${algo.success}%`, 
                              backgroundColor: algo.color 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="space-y-4">
            {detailedReports.map((report) => (
              <Card key={report.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>
                        {report.date} • 持续时间: {report.duration}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        report.type === 'attack' ? 'destructive' :
                        report.type === 'defense' ? 'default' :
                        'secondary'
                      }>
                        {report.type === 'attack' ? '攻击演练' :
                         report.type === 'defense' ? '防御测试' :
                         '综合演练'}
                      </Badge>
                      <div className="text-right">
                        <div className="text-xl font-bold">{report.score}</div>
                        <p className="text-xs text-muted-foreground">得分</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        report.score >= 90 ? 'bg-green-500' :
                        report.score >= 80 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-sm text-muted-foreground">
                        {report.score >= 90 ? '优秀' :
                         report.score >= 80 ? '良好' :
                         '需要改进'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        查看详情
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        下载
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

