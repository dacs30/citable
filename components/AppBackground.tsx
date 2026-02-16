"use client"

import dynamic from "next/dynamic"

// Dynamically import PixelBlast — it uses browser APIs (WebGL, ResizeObserver)
// and should never run on the server
const PixelBlast = dynamic(() => import("./PixelBlast"), { ssr: false })

export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <PixelBlast
        variant="circle"
        color="#6366f1"
        pixelSize={3}
        patternScale={2.5}
        patternDensity={0.9}
        speed={0.3}
        edgeFade={0.6}
        pixelSizeJitter={0.4}
        enableRipples={false}
        transparent={true}
      />
    </div>
  )
}
