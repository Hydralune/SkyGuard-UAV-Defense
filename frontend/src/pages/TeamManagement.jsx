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
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-blue-25 to-white min-h-screen p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">组队管理</h1>
          <p className="text-gray-600 mt-2">
            管理演练团队，分配角色和权限
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  <Label htmlFor="teamName" className="text-sm font-medium text-gray-700">团队名称</Label>
                  <Input 
                    id="teamName" 
                    placeholder="输入团队名称" 
                    className="bg-white border-gray-200 hover:border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="teamLeader" className="text-sm font-medium text-gray-700">团队队长</Label>
                  <Input 
                    id="teamLeader" 
                    placeholder="输入队长姓名" 
                    className="bg-white border-gray-200 hover:border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="teamSpeciality" className="text-sm font-medium text-gray-700">专长领域</Label>
                  <select 
                    id="teamSpeciality" 
                    className="w-full p-2 border border-gray-200 rounded-md bg-white hover:border-gray-300"
                  >
                    <option value="attack">攻击专长</option>
                    <option value="defense">防御专长</option>
                    <option value="comprehensive">综合能力</option>
                  </select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 团队统计概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">总团队数</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">活跃团队</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">总成员数</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teams.reduce((sum, team) => sum + team.members, 0)}</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">参与成员</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">平均得分</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(teams.reduce((sum, team) => sum + team.score, 0) / teams.length).toFixed(1)}
            </div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">综合评分</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">总演练数</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teams.reduce((sum, team) => sum + team.exercises, 0)}</div>
            <div className="inline-flex items-center space-x-1 mt-1 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-700">完成演练</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200">
          <TabsTrigger value="teams" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">团队列表</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">成员管理</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">角色权限</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="bg-white backdrop-blur-sm border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900">{team.name}</CardTitle>
                    <Badge className={
                      team.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }>
                      {team.status === 'active' ? '活跃' : '非活跃'}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-600">
                    队长: {team.leader} • 成员: {team.members}人
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">专长领域</span>
                      <Badge variant="secondary" className={
                        team.speciality === 'attack' ? 'bg-red-100 text-red-800 border-red-200' :
                        team.speciality === 'defense' ? 'bg-green-100 text-green-800 border-green-200' :
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }>
                        {team.speciality === 'attack' ? '攻击专长' :
                         team.speciality === 'defense' ? '防御专长' : '综合能力'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">平均得分</span>
                      <span className="text-lg font-bold text-gray-900">{team.score}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">演练次数</span>
                      <span className="text-sm text-gray-600">{team.exercises}次</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                        <Settings className="h-3 w-3 mr-1" />
                        设置
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">团队成员管理</CardTitle>
              <CardDescription className="text-gray-600">
                管理团队成员信息和权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers[1]?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        member.role === 'leader' 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }>
                        {member.role === 'leader' ? '队长' : '成员'}
                      </Badge>
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card className="bg-white backdrop-blur-sm border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900">角色权限管理</CardTitle>
              <CardDescription className="text-gray-600">
                配置不同角色的权限和功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { role: '队长', permissions: ['团队管理', '演练配置', '结果查看', '成员管理'], color: 'yellow' },
                  { role: '副队长', permissions: ['演练配置', '结果查看', '成员管理'], color: 'blue' },
                  { role: '成员', permissions: ['演练参与', '结果查看'], color: 'gray' },
                  { role: '观察员', permissions: ['结果查看'], color: 'purple' }
                ].map((roleInfo, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Crown className={`h-4 w-4 text-${roleInfo.color}-600`} />
                        <span className="font-medium text-gray-900">{roleInfo.role}</span>
                      </div>
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roleInfo.permissions.map((permission, permIndex) => (
                        <Badge key={permIndex} variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

