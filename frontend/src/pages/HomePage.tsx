import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { predictImage } from '@/lib/api'
import { useLang } from '@/lib/LangContext'
import { motion } from 'framer-motion'
import RotatingHeroEmoji from '@/components/RotatingHeroEmoji'

const ALLERGY_KEYS = [
  '계란', '우유', '밀', '대두', '땅콩', '견과류',
  '생선', '갑각류', '조개류', '쇠고기', '돼지고기', '닭고기', '토마토',
]

const FOOD_EMOJIS = [
  '🍕', '🍔', '🌮', '🍜', '🍣', '🍱', '🥘', '🍛', '🍤',
  '🍙', '🥞', '🍩', '🧁', '🍦', '🍎', '🥑', '🫐', '🧆', '🥟',
]

interface FlyingEmoji {
  id: number
  emoji: string
  x: number
  dx: number
  duration: number
  rotation: number
  size: number
}

let emojiId = 0

export default function HomePage() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [allergies, setAllergies] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emojis, setEmojis] = useState<FlyingEmoji[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function spawnEmoji() {
    const newEmoji: FlyingEmoji = {
      id: emojiId++,
      emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
      x: Math.random() * 85,
      dx: (Math.random() - 0.5) * 120,
      duration: 3 + Math.random() * 2,
      rotation: (Math.random() - 0.5) * 360,
      size: 16 + Math.random() * 14,
    }
    setEmojis((prev) => [...prev, newEmoji])
    setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id))
    }, newEmoji.duration * 1000 + 300)
  }

  useEffect(() => {
    setTimeout(spawnEmoji, 400)
    setTimeout(spawnEmoji, 900)
    setTimeout(spawnEmoji, 1300)
    intervalRef.current = setInterval(spawnEmoji, 1800)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function handleFile(f: File | undefined) {
    if (!f) return
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function toggleAllergy(a: string) {
    setAllergies((prev) => {
      const next = new Set(prev)
      next.has(a) ? next.delete(a) : next.add(a)
      try { localStorage.setItem('user-allergies', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const result = await predictImage(file, [...allergies].join(','), lang)
      navigate('/result', { state: { result, preview } })
    } catch (e: any) {
      setError(e.message || t('translate.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFBEE',
        fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 날아다니는 이모지 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {emojis.map((e) => (
          <motion.span
            key={e.id}
            style={{
              position: 'absolute',
              bottom: '80px',
              left: `${e.x}%`,
              fontSize: `${e.size}px`,
              zIndex: 0,
            }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: -1200, x: e.dx, rotate: e.rotation, opacity: 1 }}
            transition={{ duration: e.duration, ease: 'linear' }}
          >
            {e.emoji}
          </motion.span>
        ))}
      </div>

      {/* 노란 헤더 물결 */}
      <div
        style={{
          position: 'relative',
          background: '#FFDE32',
          borderRadius: '0 0 55% 55% / 0 0 70px 70px',
          padding: '20px 20px 32px',
          marginBottom: 8,
          zIndex: 1,
        }}
      >
        <RotatingHeroEmoji top={14} right={20} fontSize={28} />
        <motion.div
          style={{ position: 'absolute', top: 18, left: '50%', marginLeft: -12, fontSize: 18, zIndex: 1 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        >
          ⭐
        </motion.div>

        {/* 로고 + 타이틀 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14 }}
            style={{
              width: 56,
              height: 56,
              background: 'white',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255,180,0,0.3)',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <motion.span
              style={{ fontSize: 28, lineHeight: 1 }}
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🛡️
            </motion.span>
            <div
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                background: '#FF3E3E',
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                fontSize: 7,
                fontWeight: 900,
                color: 'white',
              }}
            >
              AI
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', lineHeight: 1.2, margin: 0 }}>
              {t('splash.headline')}
            </h1>
            <p style={{ fontSize: 12, color: '#888', fontWeight: 600, margin: '2px 0 0' }}>
              {t('splash.ai_badge')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ padding: '8px 16px 32px', position: 'relative', zIndex: 1 }}>

        {/* 이미지 업로드 */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => fileRef.current?.click()}
          style={{
            position: 'relative',
            border: '2.5px dashed #E0E0E0',
            borderRadius: 24,
            overflow: 'hidden',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '4/3',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            marginBottom: 16,
          }}
        >
          {preview ? (
            <motion.img
              src={preview}
              alt="food"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 48, marginBottom: 12 }}
              >
                📷
              </motion.div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#555', margin: '0 0 4px' }}>
                {t('home.upload')}
              </p>
              <p style={{ fontSize: 12, color: '#BBB', margin: 0, fontWeight: 500 }}>
                {t('home.supported')}
              </p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </motion.section>

        {/* 알레르기 선택 */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '14px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <motion.span
                style={{ fontSize: 18 }}
                animate={{ rotate: [-8, 8, -8] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                ⚠️
              </motion.span>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>
                {t('home.allergies')}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALLERGY_KEYS.map((a) => {
                const isSelected = allergies.has(a)
                return (
                  <motion.button
                    key={a}
                    onClick={() => toggleAllergy(a)}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      border: `2px solid ${isSelected ? '#FF3E3E' : '#EFEFEF'}`,
                      background: isSelected ? '#FF3E3E' : '#F8F8F8',
                      color: isSelected ? 'white' : '#666',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t(`allergen.${a}`)}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.section>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 13,
              color: '#FF3E3E',
              background: '#FFF0F0',
              borderRadius: 14,
              padding: '10px 14px',
              border: '1.5px solid #FFD0D0',
              marginBottom: 14,
            }}
          >
            {error}
          </motion.p>
        )}

        {/* 분석 버튼 */}
        <motion.button
          onClick={handleAnalyze}
          disabled={!file || loading}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={file && !loading ? { scale: 1.03 } : {}}
          whileTap={file && !loading ? { scale: 0.96 } : {}}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 18,
            fontSize: 16,
            fontWeight: 900,
            border: 'none',
            cursor: file && !loading ? 'pointer' : 'not-allowed',
            background: file && !loading
              ? 'linear-gradient(135deg, #FFDE32 0%, #FFB800 100%)'
              : '#F0F0F0',
            color: file && !loading ? '#1A1A1A' : '#CCC',
            boxShadow: file && !loading ? '0 6px 20px rgba(255,180,0,0.4)' : 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <svg style={{ width: 22, height: 22, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              {t('home.analyzing')}
            </>
          ) : (
            <>🔍 {t('home.analyze')}</>
          )}
        </motion.button>
      </div>
    </div>
  )
}