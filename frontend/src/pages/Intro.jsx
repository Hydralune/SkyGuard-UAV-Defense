import { Link } from 'react-router-dom'
import {
  Shield,
  Sword,
  ShieldCheck,
  Eye,
  Activity,
  FileText,
  Cpu,
  CircuitBoard,
  Boxes,
  Cloud,
  Rocket,
  ArrowRight,
  BarChart3,
  Layers,
  GitBranch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Iridescence from '@/components/ui/Iridescence'
import './intro.css'
import LensGlassCard from '@/components/ui/LensGlassCard'

function SectionTitle({ title, subtitle }) {
  return (
    <div className="max-w-4xl mx-auto text-center mb-12">
      <h2 className="title-glow-soft text-3xl md:text-4xl font-bold tracking-tight text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="title-glow-soft mt-3 text-base md:text-lg text-white font-semibold">{subtitle}</p>
      )}
    </div>
  )
}

export default function Intro() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Iridescence 背景（透明玻璃感） */}
      <div className="absolute inset-0" aria-hidden="true">
        <Iridescence color={[1, 1, 1]} mouseReact={true} amplitude={0.1} speed={1.0} opacity={0.4} />
        <div className="absolute inset-0 bg-dim-overlay" />
      </div>

      <div className="relative">
        {/* Hero 区域 */}
        <section className="relative px-4 md:px-8 pt-16 md:pt-20 pb-10 md:pb-16 z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="title-glow mt-6 text-4xl md:text-6xl font-extrabold leading-tight text-white">
              SkyGuard UAV Defense
            </h1>
            <p className="mt-5 text-white font-semibold text-base md:text-lg">
              面向低空无人机威胁的智能防御系统，以目标检测与对抗学习为核心，提供“攻击—防御—评估—可视化—训练”一体化能力。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/attack-scenarios">
                <Button size="lg" className="rounded-full bg-white text-zinc-900 hover:bg-white/90 border-0 shadow-sm transition-colors">
                  立即体验攻击场景
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/defense-scenarios">
                <Button size="lg" className="rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/30 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-colors">
                  查看防御评估
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
              {[
                { icon: Shield, label: 'YOLOv8 目标检测' },
                { icon: Sword, label: 'PGD/FGSM/CW_L2 等攻击' },
                { icon: ShieldCheck, label: '多策略防御与恢复' },
                { icon: Eye, label: '全过程可视化与指标' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/30',
                    'shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:scale-[1.03]',
                    'transition transform duration-300',
                    'relative overflow-hidden px-3 py-2'
                  )}
                >
                  <item.icon className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm text-white">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 亮点与价值 */}
        <section className="relative px-4 md:px-8 py-10 md:py-14 z-10">
          <SectionTitle
            title={
              <>
                系统亮点
                <span className="ml-2 no-text-shadow text-cyan-300">与应用价值</span>
              </>
            }
            subtitle="围绕真实场景的鲁棒性安全挑战，强调可落地性与可解释性"
          />
          <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Activity,
                title: '端到端评测闭环',
                desc: '从攻击生成、防御策略到效果评估与可视化，全流程一体化，指标体系可扩展。',
              },
              {
                icon: Cpu,
                title: '模型与工程并重',
                desc: '基于 YOLOv8 与对抗训练的鲁棒优化，同时工程上采用 FastAPI + Celery 支撑大任务并发。',
              },
              {
                icon: Eye,
                title: '可解释与可视化',
                desc: '提供原始/对抗/防御前后效果对比、类别脆弱性与恢复度量、置信度变化等洞察。',
              },
              {
                icon: CircuitBoard,
                title: '多模态场景拓展',
                desc: '支持环境扰动与补丁攻击，兼容仿真平台（AirSim）进行复杂情景复现。',
              },
              {
                icon: Boxes,
                title: '任务结果规范化',
                desc: '统一结果目录结构与元数据，便于复现实验、对比研究与学术呈现。',
              },
              {
                icon: Cloud,
                title: '易部署与演示',
                desc: 'Docker Compose 一键启动，本地开发体验流畅，适合线下/线上路演。',
              },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl p-5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:scale-[1.03] transition transform duration-300 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <f.icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="text-base font-semibold">{f.title}</h3>
                </div>
                <p className="mt-2 text-sm text-white/90">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 系统架构 */}
        <section className="relative px-4 md:px-8 py-10 md:py-14 z-10">
          <SectionTitle
            title={
              <>
                系统架构
                <span className="ml-2 no-text-shadow text-cyan-300">与技术栈</span>
              </>
            }
            subtitle="前后端解耦 + 异步任务队列 + 统一结果接口，兼容 GPU 加速"
          />
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl p-5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:scale-[1.03] transition transform duration-300 relative overflow-hidden">
              <h3 className="font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-cyan-300" /> 架构分层</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                <li>前端：React + Vite + TailwindCSS，页面路由与可视化呈现</li>
                <li>后端：FastAPI 提供 REST/WebSocket，Celery + Redis 承载异步/长任务</li>
                <li>算法：YOLOv8 检测、Torchattacks 攻击、防御与评估工具集</li>
                <li>部署：Docker Compose 一键编排，生产静态站点由 Nginx 托管</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl p-5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:scale-[1.03] transition transform duration-300 relative overflow-hidden">
              <h3 className="font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4 text-cyan-300" /> 技术要点</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                <li>统一的结果目录：evaluation/adversarial/defense/scenario</li>
                <li>指标聚合：检测保留率、恢复率、置信度变化、时延等</li>
                <li>可扩展接口：攻击/防御/指标以模块化方式注册和枚举</li>
                <li>进度追踪：WebSocket 实时推送 + 文件持久化 progress.json</li>
              </ul>
            </div>
          </div>

          <div className="mx-auto max-w-6xl mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Sword, title: '攻击能力', items: ['PGD / FGSM / CW_L2', 'DPatch / AdvPatch', '亮度/噪声/对比度等环境扰动'] },
              { icon: ShieldCheck, title: '防御能力', items: ['高斯/中值滤波', 'JPEG 压缩', '位深度降低', '对抗训练 PGD/FGM/YOPO/FREE*'] },
              { icon: BarChart3, title: '评估与可视化', items: ['类脆弱性/恢复度', '置信度分布变化', '时延与效率', '图像结果对比'] },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl p-5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:scale-[1.03] transition transform duration-300 relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <b.icon className="h-5 w-5 text-cyan-300" />
                  <h4 className="font-semibold">{b.title}</h4>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-white/90 list-disc list-inside">
                  {b.items.map((it, idx) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 典型流程 */}
        <section className="relative px-4 md:px-8 py-10 md:py-14 z-10">
          <SectionTitle
            title="典型使用流程"
            subtitle="从任务创建到结果洞察，一键贯通"
          />
          <ol className="mx-auto max-w-5xl grid gap-4 md:grid-cols-4 text-sm">
            {[
              { icon: Rocket, title: '创建任务', desc: '在“攻击/防御/自定义场景”中配置参数并提交。' },
              { icon: Activity, title: '异步执行', desc: 'Celery Worker 执行，进度实时推送至前端。' },
              { icon: Eye, title: '结果呈现', desc: '统一可视化接口获取对比图、指标图与中间过程。' },
              { icon: FileText, title: '报告输出', desc: '按任务/场景导出数据与报告，便于路演与评审展示。' },
            ].map((step, i) => (
              <li key={i} className="rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl p-5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:scale-[1.03] transition transform duration-300 relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <step.icon className="h-5 w-5 text-cyan-300" />
                  <h4 className="font-semibold">{step.title}</h4>
                </div>
                <p className="mt-2 text-white/90">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 应用与成果 */}
        <section className="relative px-4 md:px-8 py-10 md:py-14 z-10">
          <SectionTitle
            title="应用场景与潜在成果"
            subtitle="面向低空治理、园区安防、赛事保障与科研竞赛展示"
          />
          <div className="mx-auto max-w-6xl grid gap-4 md:grid-cols-3">
            {[
              { title: '低空治理', desc: '面向城市低空通道，对黑飞/扰飞进行风险评估与处置策略仿真。' },
              { title: '园区安防', desc: '在工业/电力/机场等敏感区域，构建攻防演练体系，提升感知鲁棒性。' },
              { title: '赛事与科研', desc: '提供可复现实验与完整报告链路。' },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl p-5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:scale-[1.03] transition transform duration-300 relative overflow-hidden">
                <h4 className="font-semibold">{card.title}</h4>
                <p className="mt-2 text-sm text-white/90">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 行动区 */}
        <section className="relative px-4 md:px-8 py-12 md:py-16 z-10">
            <div className="mx-auto max-w-5xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-8 text-center text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
            <h3 className="title-glow-soft text-2xl md:text-3xl font-bold">准备好开始演示了吗？</h3>
            <p className="mt-3 text-white/90">从攻击或防御场景入手，或在自定义场景中编排完整流程。</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/attack-scenarios">
                <Button size="lg" className="rounded-full bg-white text-zinc-900 hover:bg-white/90 border-0 shadow-sm transition-colors">
                  进入攻击场景
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/custom-scenarios">
                <Button size="lg" className="rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/30 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-colors">
                  编排自定义场景
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {}
        <div id="intro-effects-anchor" className="h-0" />
      </div>
    </div>
  )
}


