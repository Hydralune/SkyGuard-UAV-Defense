import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Users,
  UserPlus,
  Settings,
  Crown,
  Shield,
  Sword,
  Trophy,
  Clock,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2
} from 'lucide-react'

export default function TeamManagement() {
  const [teams, setTeams] = useState([
    {
      id: 1,
      name: '团队Alpha',
      leader: '张三',
      members: 5,
      status: 'active',
      score: 88.5,
      exercises: 12,
      speciality: 'attack',
      created: '2025-01-15'
    },
    {
      id: 2,
      name: '团队Beta',
      leader: '李四',
      members: 4,
      status: 'active',
      score: 81.5,
      exercises: 8,
      speciality: 'defense',
      created: '2025-02-01'
    },
    {
      id: 3,
      name: '团队Gamma',
      leader: '王五',
      members: 6,
      status: 'inactive',
      score: 90,
      exercises: 15,
      speciality: 'comprehensive',
      created: '2024-12-10'
    }
  ])

  const teamMembers = {
    1: [
      { id: 1, name: '张三', role: 'leader', email: 'zhangsan@example.com', phone: '138****1234', avatar: '/avatars/01.png' },
      { id: 2, name: '赵六', role: 'member', email: 'zhaoliu@example.com', phone: '139****5678', avatar: '/avatars/02.png' },
      { id: 3, name: '钱七', role: 'member', email: 'qianqi@example.com', phone: '137****9012', avatar: '/avatars/03.png' },
      { id: 4, name: '孙八', role: 'member', email: 'sunba@example.com', phone: '136****3456', avatar: '/avatars/04.png' },
      { id: 5, name: '周九', role: 'member', email: 'zhoujiu@example.com', phone: '135****7890', avatar: '/avatars/05.png' }
    ]
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">组队管理</h1>
          <p className="text-muted-foreground mt-2">
            管理演练团队，分配角色和权限
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                创建团队
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新团队</DialogTitle>
                <DialogDescription>
                  填写团队信息创建新的演练团队
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamName">团队名称</Label>
                  <Input id="teamName" placeholder="输入团队名称" />
                </div>
                <div>
                  <Label htmlFor="teamLeader">团队负责人</Label>
                  <Input id="teamLeader" placeholder="输入负责人姓名" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">取消</Button>
                  <Button>创建</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 团队统计 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总团队数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">
              {teams.filter(t => t.status === 'active').length} 个活跃
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总成员数</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.reduce((sum, team) => sum + team.members, 0)}</div>
            <p className="text-xs text-muted-foreground">
              平均 {Math.round(teams.reduce((sum, team) => sum + team.members, 0) / teams.length)} 人/团队
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均得分</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teams.reduce((sum, team) => sum + team.score, 0) / teams.length * 10) / 10}
            </div>
            <p className="text-xs text-muted-foreground">
              最高: {Math.max(...teams.map(t => t.score))}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总演练次数</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.reduce((sum, team) => sum + team.exercises, 0)}</div>
            <p className="text-xs text-muted-foreground">
              本月新增 +15
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 团队管理 */}
      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">团队列表</TabsTrigger>
          <TabsTrigger value="members">成员管理</TabsTrigger>
          <TabsTrigger value="permissions">权限设置</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                    </div>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status === 'active' ? '活跃' : '非活跃'}
                    </Badge>
                  </div>
                  <CardDescription>
                    负责人: {team.leader} • {team.members} 名成员
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">专长领域</span>
                    <div className="flex items-center space-x-1">
                      {team.speciality === 'attack' && <Sword className="h-3 w-3 text-red-500" />}
                      {team.speciality === 'defense' && <Shield className="h-3 w-3 text-green-500" />}
                      {team.speciality === 'comprehensive' && <Trophy className="h-3 w-3 text-blue-500" />}
                      <span className="text-sm">
                        {team.speciality === 'attack' ? '攻击' :
                         team.speciality === 'defense' ? '防御' : '综合'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">团队得分</span>
                    <span className="font-bold text-lg">{team.score}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">演练次数</span>
                    <span className="font-medium">{team.exercises}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">创建时间</span>
                    <span className="text-sm">{team.created}</span>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      设置
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>团队Alpha 成员管理</CardTitle>
              <CardDescription>管理团队成员信息和角色分配</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers[1]?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          {member.role === 'leader' && (
                            <Badge variant="default">
                              <Crown className="h-3 w-3 mr-1" />
                              队长
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      {member.role !== 'leader' && (
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  添加成员
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>权限设置</CardTitle>
              <CardDescription>配置不同角色的系统访问权限</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">队长权限</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      '创建和管理演练',
                      '邀请和移除成员',
                      '查看所有报告',
                      '修改团队设置',
                      '分配成员角色',
                      '访问系统管理'
                    ].map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">成员权限</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      '参与演练',
                      '查看个人报告',
                      '提交演练结果',
                      '查看团队统计',
                      '使用可视化工具',
                      '下载个人数据'
                    ].map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button>保存权限设置</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

