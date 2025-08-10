import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment, Lightformer, RoundedBox } from '@react-three/drei'

/**
 * LensGlassCard
 * - 不依赖任何 .glb 模型；通过内置几何体 + MeshTransmissionMaterial 实现清晰玻璃与透镜边缘感
 * - variant: 'lens' | 'bar' | 'cube'
 */
export default function LensGlassCard({
  className = '',
  title,
  description,
  footer,
  height = 320,
  variant = 'lens',
  // 玻璃参数（可根据需求调整）
  ior = 1.15,
  thickness = 4,
  chromaticAberration = 0.08,
  anisotropy = 0.02,
  roughness = 0.05,
  color = '#ffffff',
  children,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-white/6 backdrop-blur-sm text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.55)] lens-ring ${className}`}
      style={{ minHeight: height }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
          <color attach="background" args={[0x000000]} />
          <Suspense fallback={null}>
            <Environment resolution={64}>
              {/* 简单的程序化环境，避免外部 HDR 依赖 */}
              <group>
                <Lightformer intensity={2} rotation={[0, Math.PI / 2, 0]} position={[5, 0, 0]} scale={[10, 10, 1]} />
                <Lightformer intensity={1.2} rotation={[0, -Math.PI / 4, 0]} position={[-5, 3, 2]} scale={[6, 6, 1]} />
                <Lightformer intensity={1.0} rotation={[0, 0, 0]} position={[0, -4, 2]} scale={[10, 2, 1]} />
              </group>
            </Environment>

            <group>
              {variant === 'lens' && (
                <mesh scale={2.1}>
                  <icosahedronGeometry args={[1, 6]} />
                  <MeshTransmissionMaterial
                    samples={8}
                    resolution={256}
                    roughness={roughness}
                    thickness={thickness}
                    anisotropy={anisotropy}
                    chromaticAberration={chromaticAberration}
                    ior={ior}
                    color={color}
                  />
                </mesh>
              )}

              {variant === 'bar' && (
                <RoundedBox args={[5.5, 1.6, 0.6]} radius={0.45} smoothness={8}>
                  <MeshTransmissionMaterial
                    samples={8}
                    resolution={256}
                    roughness={roughness}
                    thickness={thickness}
                    anisotropy={anisotropy}
                    chromaticAberration={chromaticAberration}
                    ior={ior}
                    color={color}
                  />
                </RoundedBox>
              )}

              {variant === 'cube' && (
                <RoundedBox args={[2.8, 2.8, 2.8]} radius={0.35} smoothness={8}>
                  <MeshTransmissionMaterial
                    samples={8}
                    resolution={256}
                    roughness={roughness}
                    thickness={thickness}
                    anisotropy={anisotropy}
                    chromaticAberration={chromaticAberration}
                    ior={ior}
                    color={color}
                  />
                </RoundedBox>
              )}
            </group>
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 p-6 md:p-8">
        {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
        {description && <p className="text-sm text-zinc-100/85 mb-3">{description}</p>}
        {children}
      </div>
      {footer && <div className="relative z-10 p-6 border-t border-white/10">{footer}</div>}
    </div>
  )
}


