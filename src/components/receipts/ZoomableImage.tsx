import { useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'

interface ZoomableImageProps {
  src: string
  alt?: string
  className?: string
}

export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)

  const clampScale = (s: number) => Math.min(5, Math.max(1, s))

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    setScale((s) => {
      const next = clampScale(s - e.deltaY * 0.0015)
      if (next === 1) setPos({ x: 0, y: 0 })
      return next
    })
  }

  const handlePointerDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      dragging.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      pinchStart.current = { dist, scale }
    }
  }

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const next = clampScale(pinchStart.current.scale * (dist / pinchStart.current.dist))
      setScale(next)
    } else if (pointers.current.size === 1 && dragging.current && scale > 1) {
      const dx = e.clientX - dragging.current.startX
      const dy = e.clientY - dragging.current.startY
      setPos({ x: dragging.current.origX + dx, y: dragging.current.origY + dy })
    }
  }

  const handlePointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 0) dragging.current = null
  }

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1)
      setPos({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative touch-none select-none overflow-hidden ${className ?? ''}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-contain transition-transform duration-75"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, cursor: scale > 1 ? 'grab' : 'zoom-in' }}
      />
    </div>
  )
}
