import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LANGUAGES } from '@/lib/i18n'
import { useLang } from '@/lib/LangContext'
import type { LangCode } from '@/lib/i18n'
import RotatingHeroEmoji from '@/components/RotatingHeroEmoji'

interface Props {
  onDone: () => void
}

const FOOD_EMOJIS = [
  '🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍱', '🥘', '🍛', '🍤',
  '🍙', '🥞', '🍩', '🧁', '🍦', '🍎', '🥑', '🫐', '🧆', '🥟',
  '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏',
  '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', 
  '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', 
  '🧅', '🥜', '🫘', '🌰', '🫚', '🫛', '🍄‍🟫','🍞', '🥐', '🥖', 
  '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯',
  '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗',
  '🍿', '🧈', '🧂', '🥫', '🍝', '🍱', '🍘', '🍙', '🍚', '🍛',
  '🍜', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠',
  '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧',
  '🍫', '🍬', '🍭', '🍮', '🍯', '🫓', '🥨', '🥯', '🥞', '🧇', 
  '🧀', '🍖'
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

const FOOD_POOL = FOOD_EMOJIS.filter((e) => e !== '🥗')

export default function SplashPage({ onDone }: Props) {
  const { setLang, t, setPreviewLang } = useLang()
  const [selected, setSelected] = useState<LangCode | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [emojis, setEmojis] = useState<FlyingEmoji[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function spawnEmoji() {
    const newEmoji: FlyingEmoji = {
      id: emojiId++,
      emoji: FOOD_POOL[Math.floor(Math.random() * FOOD_POOL.length)],
      x: Math.random() * 85,
      dx: (Math.random() - 0.5) * 120,
      duration: 2.2 + Math.random() * 2,
      rotation: (Math.random() - 0.5) * 360,
      size: 16 + Math.random() * 14,
    }
    setEmojis((prev) => [...prev, newEmoji])
    // ✅ 애니메이션 끝난 뒤 300ms 여유를 두고 제거 (중간에 사라지는 현상 방지)
    setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id))
    }, newEmoji.duration * 1000 + 300)
  }

  function burstEmojis(count: number) {
    for (let i = 0; i < count; i++) {
      setTimeout(spawnEmoji, i * 80)
    }
  }

  useEffect(() => {
    setTimeout(spawnEmoji, 400)
    setTimeout(spawnEmoji, 800)
    setTimeout(spawnEmoji, 1100)
    intervalRef.current = setInterval(spawnEmoji, 500) //이모지 빈도 수 조절
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function handleSelect(code: LangCode) {
    burstEmojis(9) // 언어 선택 시 폭죽처럼 이모지 터뜨리기
    setSelected(code)
    burstEmojis(7)
  }

  function handleStart() {
    if (!selected) return
    setLang(selected)
    burstEmojis(12)
    setLeaving(true)
    setTimeout(() => onDone(), 700)
  }

  const selectedLang = LANGUAGES.find((l) => l.code === selected)

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          className="fixed inset-0 overflow-hidden"
          style={{
            background: '#FFFBEE',
            fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', -apple-system, sans-serif",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.6 }}
        >
          {/* ✅ 날아다니는 이모티콘 - zIndex: 0 으로 제일 뒤에 배치 */}
          {/* overflow-hidden 제거, zIndex 0 유지 */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
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

          {/* 상단 노란 물결 */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: '200px',
              background: '#FFDE32',
              borderRadius: '0 0 55% 55% / 0 0 70px 70px',
              zIndex: 0,
            }}
          />

          <RotatingHeroEmoji top={14} right={20} fontSize={32} />
          <motion.div
            className="absolute"
            style={{ top: 10, left: '47%', marginLeft: -16, fontSize: 40, zIndex: 1 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          >
            ⭐
          </motion.div>

          {/* 메인 콘텐츠 */}
          <div
            className="relative flex flex-col max-w-lg mx-auto w-full h-full overflow-y-auto"
            style={{ zIndex: 2, padding: '18px 18px 28px' }}
          >
            {/* 로고 */}
            <div className="flex flex-col items-center" style={{ paddingTop: 12, paddingBottom: 18 }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
              >
                <div
                  style={{
                    width: 90,
                    height: 90,
                    background: 'white',
                    borderRadius: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 28px rgba(255,180,0,0.35)',
                    marginBottom: 12,
                    position: 'relative',
                  }}
                >
                  <motion.span
                    style={{ fontSize: 46, lineHeight: 1 }}
                    animate={{ rotate: [-8, 8, -8] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🛡️
                  </motion.span>
                  <div
                    style={{
                      position: 'absolute',
                      top: -7,
                      right: -7,
                      background: '#FF3E3E',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid white',
                      fontSize: 9,
                      fontWeight: 900,
                      color: 'white',
                    }}
                  >
                    AI
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ textAlign: 'center' }}
              >
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: '#1A1A1A',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                  }}
                >
                  {t('splash.headline')}
                  <br />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>{t('splash.brand')}</span>
                </h1>
                <div
                  style={{
                    marginTop: 8,
                    display: 'inline-block',
                    background: '#1A1A1A',
                    color: '#FFDE32',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '5px 14px',
                    borderRadius: 20,
                    letterSpacing: '0.04em',
                  }}
                >
                  {t('splash.ai_badge')}
                </div>
              </motion.div>
            </div>

            {/* 언어 선택 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              style={{
                background: 'white',
                borderRadius: 24,
                padding: '16px 14px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <motion.span
                  style={{ fontSize: 20 }}
                  animate={{ rotate: [-8, 8, -8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  👋
                </motion.span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 900, color: '#1A1A1A', lineHeight: 1.2 }}>
                    {t('splash.choose_language')}
                  </p>
                  <p style={{ fontSize: 11, color: '#AAA', fontWeight: 500 }}>
                    {t('splash.lang_count')}
                  </p>
                </div>
              </div>

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}
                onMouseLeave={() => setPreviewLang(selected)}
              >
                {LANGUAGES.map((lang, i) => {
                  const isSelected = selected === lang.code
                  return (
                    <motion.button
                      key={lang.code}
                      onMouseEnter={() => setPreviewLang(lang.code as LangCode)}
                      onClick={() => handleSelect(lang.code as LangCode)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.045 }}
                      whileHover={{ scale: 1.05, rotate: -1 }}
                      whileTap={{ scale: 0.93 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: '10px 12px',
                        borderRadius: 14,
                        textAlign: 'left',
                        width: '100%',
                        background: isSelected ? '#FFFBEE' : '#F8F8F8',
                        border: `2.5px solid ${isSelected ? '#FFDE32' : '#EFEFEF'}`,
                        boxShadow: isSelected ? '0 3px 14px rgba(255,180,0,0.3)' : 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{lang.flag}</span>
                      <div>
                        <div
                          style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}
                        >
                          {lang.label}
                        </div>
                        <div style={{ fontSize: 10, color: '#BBB', fontWeight: 600 }}>
                          {lang.code.toUpperCase()}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* 시작 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
            >
              <motion.button
                onClick={handleStart}
                disabled={!selected}
                whileHover={selected ? { scale: 1.03, rotate: 0.5 } : {}}
                whileTap={selected ? { scale: 0.96 } : {}}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 18,
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                  border: 'none',
                  cursor: selected ? 'pointer' : 'not-allowed',
                  background: selected
                    ? 'linear-gradient(135deg, #FFDE32 0%, #FFB800 100%)'
                    : '#F0F0F0',
                  color: selected ? '#1A1A1A' : '#CCC',
                  boxShadow: selected ? '0 6px 20px rgba(255,180,0,0.4)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  fontFamily: 'inherit',
                }}
              >
                {selected
                  ? t('splash.start_cta')
                      .replace('{flag}', selectedLang?.flag ?? '')
                      .replace('{label}', selectedLang?.label ?? '')
                  : t('splash.pick_first')}
              </motion.button>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  color: '#CCC',
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                {t('splash.change_later')}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}