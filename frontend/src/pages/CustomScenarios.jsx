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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">自定义场景</h1>
          <p className="text-muted-foreground mt-2">
            创建和管理自定义攻防演练场景
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            导入场景
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出场景
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧场景创建 */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">基础配置</TabsTrigger>
              <TabsTrigger value="attacks">攻击配置</TabsTrigger>
              <TabsTrigger value="defenses">防御配置</TabsTrigger>
              <TabsTrigger value="schedule">执行调度</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>场景基础信息</CardTitle>
                  <CardDescription>设置场景的基本属性和描述</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scenarioName">场景名称</Label>
                    <Input
                      id="scenarioName"
                      value={currentScenario.name}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="输入场景名称"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scenarioDescription">场景描述</Label>
                    <Textarea
                      id="scenarioDescription"
                      value={currentScenario.description}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="描述场景的目的和特点"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scenarioType">场景类型</Label>
                    <Select
                      value={currentScenario.type}
                      onValueChange={(value) => setCurrentScenario(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hybrid">复合场景</SelectItem>
                        <SelectItem value="adversarial">对抗攻击场景</SelectItem>
                        <SelectItem value="environmental">环境干扰场景</SelectItem>
                        <SelectItem value="defense">防御测试场景</SelectItem>
                        <SelectItem value="benchmark">基准测试场景</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>难度等级</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">简单</SelectItem>
                          <SelectItem value="medium">中等</SelectItem>
                          <SelectItem value="hard">困难</SelectItem>
                          <SelectItem value="expert">专家</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>预计时长</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15分钟</SelectItem>
                          <SelectItem value="30">30分钟</SelectItem>
                          <SelectItem value="60">1小时</SelectItem>
                          <SelectItem value="120">2小时</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attacks" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>攻击方法配置</CardTitle>
                  <CardDescription>选择和配置攻击算法</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">可用攻击方法</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {availableAttacks.map((attack) => (
                        <div key={attack.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{attack.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {attack.category === 'adversarial' ? '对抗' : '光电'}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={currentScenario.attacks.includes(attack.id) ? "default" : "outline"}
                            onClick={() => currentScenario.attacks.includes(attack.id) 
                              ? handleRemoveAttack(attack.id) 
                              : handleAddAttack(attack.id)
                            }
                          >
                            {currentScenario.attacks.includes(attack.id) ? '移除' : '添加'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentScenario.attacks.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-base font-medium">已选择的攻击方法</Label>
                        <div className="space-y-3">
                          {currentScenario.attacks.map((attackId) => {
                            const attack = availableAttacks.find(a => a.id === attackId)
                            return (
                              <div key={attackId} className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{attack?.name}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveAttack(attackId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2 text-sm">
                                  <div>
                                    <Label>强度</Label>
                                    <Input type="number" placeholder="0.03" />
                                  </div>
                                  <div>
                                    <Label>权重</Label>
                                    <Input type="number" placeholder="1.0" />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="defenses" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>防御方法配置</CardTitle>
                  <CardDescription>选择和配置防御策略</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">可用防御方法</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {availableDefenses.map((defense) => (
                        <div key={defense.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{defense.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {defense.category === 'adversarial_training' ? '训练' : 
                               defense.category === 'preprocessing' ? '预处理' : '检测'}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={currentScenario.defenses.includes(defense.id) ? "default" : "outline"}
                            onClick={() => currentScenario.defenses.includes(defense.id) 
                              ? handleRemoveDefense(defense.id) 
                              : handleAddDefense(defense.id)
                            }
                          >
                            {currentScenario.defenses.includes(defense.id) ? '移除' : '添加'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentScenario.defenses.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-base font-medium">已选择的防御方法</Label>
                        <div className="space-y-3">
                          {currentScenario.defenses.map((defenseId) => {
                            const defense = availableDefenses.find(d => d.id === defenseId)
                            return (
                              <div key={defenseId} className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{defense?.name}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveDefense(defenseId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2 text-sm">
                                  <div>
                                    <Label>强度</Label>
                                    <Input type="number" placeholder="0.8" />
                                  </div>
                                  <div>
                                    <Label>优先级</Label>
                                    <Select defaultValue="medium">
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">低</SelectItem>
                                        <SelectItem value="medium">中</SelectItem>
                                        <SelectItem value="high">高</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>执行调度配置</CardTitle>
                  <CardDescription>设置攻防序列的执行顺序和时间</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">启用调度</Label>
                      <p className="text-sm text-muted-foreground">按预定顺序执行攻防操作</p>
                    </div>
                    <Switch
                      checked={currentScenario.schedule.enabled}
                      onCheckedChange={(checked) => 
                        setCurrentScenario(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, enabled: checked }
                        }))
                      }
                    />
                  </div>

                  {currentScenario.schedule.enabled && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>执行模式</Label>
                          <Select
                            value={currentScenario.schedule.timing}
                            onValueChange={(value) => 
                              setCurrentScenario(prev => ({
                                ...prev,
                                schedule: { ...prev.schedule, timing: value }
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sequential">顺序执行</SelectItem>
                              <SelectItem value="parallel">并行执行</SelectItem>
                              <SelectItem value="random">随机执行</SelectItem>
                              <SelectItem value="adaptive">自适应执行</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>执行间隔 (秒)</Label>
                          <Input type="number" placeholder="30" />
                        </div>

                        <div className="space-y-2">
                          <Label>重复次数</Label>
                          <Input type="number" placeholder="1" />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2">
            <Button onClick={handleSaveScenario} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              保存场景
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              预览
            </Button>
          </div>
        </div>

        {/* 右侧场景列表 */}
        <div className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>已保存的场景</CardTitle>
              <CardDescription>管理和使用自定义场景</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-xs text-muted-foreground">{scenario.description}</p>
                      </div>
                      <Badge variant={scenario.status === 'active' ? 'default' : 'secondary'}>
                        {scenario.status === 'active' ? '活跃' : '草稿'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
                      <span>{scenario.attacks.length} 攻击</span>
                      <span>•</span>
                      <span>{scenario.defenses.length} 防御</span>
                      <span>•</span>
                      <span>{scenario.created}</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Play className="h-3 w-3 mr-1" />
                        运行
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>场景模板</CardTitle>
              <CardDescription>使用预定义的场景模板</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: '基础对抗测试', attacks: 2, defenses: 1 },
                  { name: '环境鲁棒性测试', attacks: 3, defenses: 2 },
                  { name: '综合防御评估', attacks: 4, defenses: 3 }
                ].map((template, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {template.attacks} 攻击 • {template.defenses} 防御
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="h-3 w-3 mr-1" />
                      使用模板
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>场景统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">总场景数</span>
                <span className="font-medium">{scenarios.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">活跃场景</span>
                <span className="font-medium">{scenarios.filter(s => s.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">草稿场景</span>
                <span className="font-medium">{scenarios.filter(s => s.status === 'draft').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

