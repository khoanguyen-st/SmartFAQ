import { useState, useEffect, useRef } from 'react'

export const useDraggable = (initialRight: number = 20, initialBottom: number = 20) => {
  // Initial position calculation
  const [position, setPosition] = useState(() => ({
    x: window.innerWidth - 80 - initialRight, 
    y: window.innerHeight - 80 - initialBottom,
  }))

  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const handleStart = (clientX: number, clientY: number) => {
    offset.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    }
    setIsDragging(true)
    isDraggingRef.current = true
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return
    
    // Calculate new position
    let newX = clientX - offset.current.x
    let newY = clientY - offset.current.y
    
    // Constrain to window bounds
    const maxX = window.innerWidth - 72 // button width
    const maxY = window.innerHeight - 72 // button height

    newX = Math.min(Math.max(0, newX), maxX)
    newY = Math.min(Math.max(0, newY), maxY)

    setPosition({ x: newX, y: newY })
  }

  const handleEnd = () => {
    if (!isDraggingRef.current) return
    setIsDragging(false)
    isDraggingRef.current = false
    
    // Snap to edge logic
    const screenWidth = window.innerWidth
    const buttonCenterX = position.x + 36 
    
    // Snap to left or right
    let finalX = position.x
    if (buttonCenterX < screenWidth / 2) {
      finalX = 20 // Left margin
    } else {
      finalX = screenWidth - 90 // Right margin
    }
    
    setPosition(prev => ({ ...prev, x: finalX }))
  }

  // Event Listeners
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent text selection
    handleStart(e.clientX, e.clientY)
  }
  
  const onTouchStart = (e: React.TouchEvent) => {
     const touch = e.touches[0]
     handleStart(touch.clientX, touch.clientY)
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onMouseUp = () => handleEnd()
    const onTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        handleMove(touch.clientX, touch.clientY)
    }
    const onTouchEnd = () => handleEnd()

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', onTouchEnd)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [isDragging, position])

  return { position, isDragging, dragHandlers: { onMouseDown, onTouchStart } }
}