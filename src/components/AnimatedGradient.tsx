"use client"

import dynamic from "next/dynamic"
import type { CSSProperties } from "react"

const ShaderGradientCanvas = dynamic(
  () => import("@shadergradient/react").then(mod => mod.ShaderGradientCanvas),
  { ssr: false },
)

const ShaderGradient = dynamic(
  () => import("@shadergradient/react").then(mod => mod.ShaderGradient),
  { ssr: false },
)

const canvasStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: -1,
  pointerEvents: "none",
}

export default function AnimatedGradient() {
  return (
    <ShaderGradientCanvas
      style={canvasStyle}
      pixelDensity={1}
      pointerEvents="none"
      fov={45}
    >
      <ShaderGradient
        animate="on"
        type="waterPlane"
        wireframe={false}
        shader="defaults"
        uTime={8}
        uSpeed={0.3}
        uStrength={3}
        uDensity={1.5}
        uFrequency={0}
        uAmplitude={0}
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={0}
        rotationY={130}
        rotationZ={70}
        color1="#606080"
        color2="#155bad"
        color3="#212121"
        reflection={0.1}
        cAzimuthAngle={180}
        cPolarAngle={80}
        cDistance={2.8}
        cameraZoom={9.1}
        lightType="env"
        brightness={1.2}
        envPreset="city"
        grain="on"
        toggleAxis={false}
        zoomOut={false}
        hoverState=""
        enableTransition={false}
      />
    </ShaderGradientCanvas>
  )
}
