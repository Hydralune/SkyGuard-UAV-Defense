import { useState } from 'react'
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
  FileText
} from 'lucide-react'

export default function CustomScenarios() {
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
    { id: 'cw', name: 'C&W攻击', category: 'adversarial' },
    { id: 'brightness', name: '亮度干扰', category: 'optical' },
    { id: 'gaussian', name: '高斯噪声', category: 'optical' },
    { id: 'contrast', name: '对比度调整', category: 'optical' }
  ]

  const availableDefenses = [
    { id: 'pgd_training', name: 'PGD训练', category: 'adversarial_training' },
    { id: 'fgm', name: 'FGM训练', category: 'adversarial_training' },
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

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">自定义场景</h1>
          <p className="text-gray-600 mt-2">
            创建和管理自定义攻防场景
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            导入场景
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            新建场景
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="scenarios" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">场景列表</TabsTrigger>
          <TabsTrigger value="editor" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">场景编辑器</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">模板库</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="bg-white backdrop-blur-sm border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900">{scenario.name}</CardTitle>
                    <Badge className={
                      scenario.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }>
                      {scenario.status === 'active' ? '活跃' : '草稿'}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-600">
                    {scenario.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">场景类型</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        {scenario.type === 'hybrid' ? '复合场景' : '环境测试'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">创建时间</span>
                      <span className="text-sm text-gray-600">{scenario.created}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                        <Eye className="h-3 w-3 mr-1" />
                        查看
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                        <Play className="h-3 w-3 mr-1" />
                        执行
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">场景基本信息</CardTitle>
                <CardDescription className="text-gray-600">
                  配置场景的基本信息和描述
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">场景名称</Label>
                  <Input 
                    placeholder="输入场景名称" 
                    className="bg-white border-gray-200 hover:border-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">场景描述</Label>
                  <Textarea 
                    placeholder="描述场景的目的和特点" 
                    className="bg-white border-gray-200 hover:border-gray-300"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">场景类型</Label>
                  <Select>
                    <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300">
                      <SelectValue placeholder="选择场景类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">复合场景</SelectItem>
                      <SelectItem value="environmental">环境测试</SelectItem>
                      <SelectItem value="adversarial">对抗测试</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-gray-900">攻击配置</CardTitle>
                <CardDescription className="text-gray-600">
                  选择要包含的攻击算法和参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">攻击算法</Label>
                  <div className="space-y-2">
                    {['PGD', 'FGSM', 'C&W', 'AdvPatch', 'DPatch'].map((attack) => (
                      <div key={attack} className="flex items-center space-x-2">
                        <Switch id={attack} />
                        <Label htmlFor={attack} className="text-sm text-gray-700">{attack}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">环境干扰</Label>
                  <div className="space-y-2">
                    {['亮度干扰', '高斯噪声', '对比度调整', '图像扭曲', '场景跃变'].map((interference) => (
                      <div key={interference} className="flex items-center space-x-2">
                        <Switch id={interference} />
                        <Label htmlFor={interference} className="text-sm text-gray-700">{interference}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white backdrop-blur-sm border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">执行调度</CardTitle>
              <CardDescription className="text-gray-600">
                配置场景的执行顺序和时机
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="schedule-enabled" />
                <Label htmlFor="schedule-enabled" className="text-sm font-medium text-gray-700">启用调度</Label>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">执行模式</Label>
                <Select>
                  <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300">
                    <SelectValue placeholder="选择执行模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">顺序执行</SelectItem>
                    <SelectItem value="parallel">并行执行</SelectItem>
                    <SelectItem value="conditional">条件执行</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">执行间隔</span>
                <Input 
                  type="number" 
                  placeholder="30" 
                  className="w-20 bg-white border-gray-200 hover:border-gray-300"
                />
                <span className="text-sm text-gray-600">秒</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: '基础对抗测试', description: '包含PGD和FGSM的基础对抗攻击测试', type: 'adversarial' },
              { name: '环境干扰测试', description: '多种环境干扰的综合测试场景', type: 'environmental' },
              { name: '复合攻击场景', description: '对抗攻击与环境干扰的复合测试', type: 'hybrid' },
              { name: '鲁棒性评估', description: '全面的模型鲁棒性评估场景', type: 'evaluation' },
              { name: '性能基准测试', description: '系统性能基准测试场景', type: 'benchmark' },
              { name: '自定义模板', description: '用户自定义的测试模板', type: 'custom' }
            ].map((template, index) => (
              <Card key={index} className="bg-white backdrop-blur-sm border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">{template.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {template.type === 'adversarial' ? '对抗测试' :
                       template.type === 'environmental' ? '环境测试' :
                       template.type === 'hybrid' ? '复合场景' :
                       template.type === 'evaluation' ? '评估场景' :
                       template.type === 'benchmark' ? '基准测试' : '自定义'}
                    </Badge>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                      <Copy className="h-3 w-3 mr-1" />
                      使用模板
                    </Button>
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

