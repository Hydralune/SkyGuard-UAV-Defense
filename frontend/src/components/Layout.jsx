import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import ThemeToggle from './ThemeToggle'
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

// 引入 canvas-nest
import CanvasNest from 'canvas-nest.js'

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
    <div className={cn("pb-12 dark:border-none dark:shadow-none", className)}>
      <div className="space-y-4 py-4">
        <div className="px-6 py-2">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">SkyGuard</h2>
              <p className="text-xs text-muted-foreground">低空无人智能体攻防演练系统</p>
            </div>
          </div>
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                    : ""
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 text-primary/70 group-hover:text-primary",
                  location.pathname === item.href ? "text-primary" : ""
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

  useEffect(() => {
    let cn = null
    function createNest() {
      const isDark = document.documentElement.classList.contains('dark')
      cn = new CanvasNest(document.body, {
        // color: isDark ? '255,255,255' : '51,153,255',
        color: '51,153,255',
        opacity: isDark ? 1.0 : 0.8,
        zIndex: 0,
        count: 35,
      })
    }
    createNest()
    // 监听主题切换
    const observer = new MutationObserver(() => {
      if (cn) cn.destroy()
      createNest()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      cn && cn.destroy()
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
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
        <SheetContent side="left" className="w-72 p-0 dark:border-none dark:border-r-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>导航菜单</SheetTitle>
            <SheetDescription>
              SkyGuard 低空无人智能体攻防演练系统
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <Sidebar />
          </ScrollArea>
          {/* 移动端侧边栏底部主题切换按钮 */}
          <div className="p-4 border-t">
            <ThemeToggle variant="sidebar" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-card shadow-lg dark:border-none dark:border-r-0">
          <ScrollArea className="flex-1">
            <Sidebar />
          </ScrollArea>
          {/* 主题切换按钮 */}
          <div className="p-4 border-t">
            <ThemeToggle variant="sidebar" />
          </div>
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

