import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  contentClassName?: string
}

interface FloatingEmoji {
  id: number
  emoji: string
  x: number
  dx: number
  duration: number
  rotation: number
  size: number
}

const FOOD_EMOJIS = [
  '🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍱', '🥘', '🍛', '🍤',
  '🍙', '🥞', '🍩', '🧁', '🍦', '🍎', '🥑', '🫐', '🧆', '🥟',
]

let emojiId = 0

export default function SplashStylePage({ children, contentClassName = '' }: Props) {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function spawnEmoji() {
      const newEmoji: FloatingEmoji = {
        id: emojiId++,
        emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
        x: Math.random() * 85,
        dx: (Math.random() - 0.5) * 120,
        duration: 2.8 + Math.random() * 2,
        rotation: (Math.random() - 0.5) * 360,
        size: 14 + Math.random() * 12,
      }
      setEmojis((prev) => [...prev, newEmoji])
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id))
      }, newEmoji.duration * 1000 + 300)
    }

    setTimeout(spawnEmoji, 400)
    setTimeout(spawnEmoji, 900)
    setTimeout(spawnEmoji, 1300)
    intervalRef.current = setInterval(spawnEmoji, 2200)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div
      className="relative min-h-full"
      style={{
        background: '#FFFBEE',
        fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', -apple-system, sans-serif",
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {emojis.map((e) => (
          <motion.span
            key={e.id}
            style={{
              position: 'absolute',
              bottom: '80px',
              left: `${e.x}%`,
              fontSize: `${e.size}px`,
            }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: -1200, x: e.dx, rotate: e.rotation, opacity: 1 }}
            transition={{ duration: e.duration, ease: 'linear' }}
          >
            {e.emoji}
          </motion.span>
        ))}
      </div>

      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '150px',
          background: '#FFDE32',
          borderRadius: '0 0 55% 55% / 0 0 60px 60px',
          zIndex: 0,
        }}
      />

      <motion.div
        className="absolute"
        style={{ top: 14, right: 20, fontSize: 28, zIndex: 1 }}
        animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        🍔
      </motion.div>
      <motion.div
        className="absolute"
        style={{ top: 50, left: 16, fontSize: 22, zIndex: 1 }}
        animate={{ y: [0, -6, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        🥗
      </motion.div>

      <div className={`relative z-10 ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}
