import React from 'react'
import FluidGlass from '@/components/ui/FluidGlass'

export default function FluidGlassCard({
  className = '',
  title,
  description,
  footer,
  glassMode = 'lens',
  lensProps = { scale: 0.25, ior: 1.15, thickness: 5, chromaticAberration: 0.1, anisotropy: 0.01 },
  barProps,
  cubeProps,
  height = 360,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm text-white ${className}`}
      style={{ minHeight: height }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <FluidGlass mode={glassMode} lensProps={lensProps} barProps={barProps} cubeProps={cubeProps} />
      </div>
      <div className="relative z-10 p-6 md:p-8">
        {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
        {description && <p className="text-sm text-zinc-100/80">{description}</p>}
      </div>
      {footer && <div className="relative z-10 p-6 border-t border-white/10">{footer}</div>}
    </div>
  )
}


