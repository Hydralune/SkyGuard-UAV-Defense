import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  Shield,
  Sword,
  ShieldCheck,
  Settings,
  BarChart3,
  Users,
  Activity,
  FileText,
  Eye,
  Menu,
  Zap,
  Target
} from 'lucide-react'

const navigation = [
  {
    name: '系统概览',
    href: '/',
    icon: Shield,
    description: '攻防原理介绍和系统概览'
  },
  {
    name: '攻击场景',
    href: '/attack-scenarios',
    icon: Sword,
    description: '对抗攻击和光电干扰场景'
  },
  {
    name: '防御场景',
    href: '/defense-scenarios',
    icon: ShieldCheck,
    description: '防御算法和策略选择'
  },
  {
    name: '自定义场景',
    href: '/custom-scenarios',
    icon: Settings,
    description: '自定义攻防场景配置'
  },
  {
    name: '过程可视化',
    href: '/visualization',
    icon: Eye,
    description: '攻防过程实时可视化'
  },
  {
    name: '演练态势',
    href: '/exercise-status',
    icon: Activity,
    description: '演练态势监控'
  },
  {
    name: '评分报告',
    href: '/reports',
    icon: FileText,
    description: '结果分析和评分报告'
  },
  {
    name: '组队管理',
    href: '/team-management',
    icon: Users,
    description: '团队协作和管理'
  },
  {
    name: '运维管理',
    href: '/operations',
    icon: BarChart3,
    description: '系统运维和监控'
  }
]

function Sidebar({ className }) {
  const location = useLocation()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-6 py-2">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold">SkyGuard</h2>
              <p className="text-xs text-muted-foreground">低空无人智能体攻防演练系统</p>
            </div>
          </div>
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5", 
                  location.pathname === item.href ? "text-blue-600" : ""
                )} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="fixed top-4 left-4 z-40 md:hidden"
            size="icon"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>导航菜单</SheetTitle>
            <SheetDescription>
              SkyGuard 低空无人智能体攻防演练系统
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <Sidebar />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-white shadow-lg">
          <ScrollArea className="flex-1">
            <Sidebar />
          </ScrollArea>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72">
        <main className="flex-1">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

