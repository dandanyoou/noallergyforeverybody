import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBarcode, type BarcodeResult } from '@/lib/api'
import { useLang } from '@/lib/LangContext'
import { BrowserMultiFormatReader } from '@zxing/browser'
import SplashStylePage from '@/components/SplashStylePage'

export default function BarcodePage() {
  const { t } = useLang()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BarcodeResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanPhase, setScanPhase] = useState<'searching' | 'found' | ''>('')
  const [foundCode, setFoundCode] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const searchingRef = useRef(false)

  const doSearch = useCallback(async (barcode: string) => {
    if (searchingRef.current) return
    const trimmed = barcode.trim()
    if (!trimmed) return
    searchingRef.current = true
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await getBarcode(trimmed)
      setResult(data)
    } catch (e: any) {
      setError(e.message || t('translate.error'))
    } finally {
      setLoading(false)
      searchingRef.current = false
    }
  }, [t])

  function stopScan() {
    setScanning(false)
    setScanPhase('')
    setFoundCode('')
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  function startScan() {
    setScanning(true)
    setScanPhase('searching')
    setFoundCode('')
    setError('')
    setResult(null)
  }

  useEffect(() => {
    if (!scanning || !videoRef.current) return

    const reader = new BrowserMultiFormatReader()
    reader.decodeFromVideoDevice(undefined, videoRef.current, (res) => {
      if (res && scanPhase === 'searching') {
        const text = res.getText()
        setFoundCode(text)
        setCode(text)
        setScanPhase('found')
        setTimeout(() => {
          stopScan()
          doSearch(text)
        }, 1500)
      }
    }).then((controls) => {
      controlsRef.current = controls
    }).catch(() => {
      setError(t('scan.camera_denied'))
      setScanning(false)
      setScanPhase('')
    })

    return () => { stopScan() }
  }, [scanning, scanPhase, t, doSearch])

  return (
    <SplashStylePage>
      <div className="relative z-10 p-5 flex flex-col max-w-lg mx-auto w-full gap-6">
        {/* 헤더 섹션 */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 text-center"
        >
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            {t('barcode.title')} 🔍
          </h2>
          <p style={{ fontSize: 13, color: '#666', fontWeight: 600, marginTop: 4 }}>
            {t('barcode.desc')}
          </p>
        </motion.div>

        {/* 메인 스캐너 카드 */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 28,
            padding: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}
        >
          <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="relative rounded-[20px] overflow-hidden bg-black aspect-[4/3]"
              >
                <video ref={videoRef} className="w-full h-full object-cover" />

                {scanPhase === 'searching' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-64 h-40 border-2 border-white/50 rounded-2xl relative overflow-hidden">
                      <motion.div 
                        className="absolute left-0 right-0 h-1 bg-[#FFDE32]"
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{ boxShadow: '0 0 15px #FFDE32' }}
                      />
                    </div>
                    <div className="mt-4 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full">
                       <p className="text-white text-sm font-bold animate-pulse">✨ {t('scan.scanning')}</p>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[#FFDE32]/20 backdrop-blur-sm flex flex-col items-center justify-center"
                  >
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl"
                    >
                      <svg className="w-10 h-10 text-[#FFB800]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    <div className="mt-4 bg-white px-6 py-2 rounded-2xl shadow-lg text-center">
                      <p style={{ fontWeight: 900, color: '#1A1A1A' }}>{t('scan.success')}</p>
                      <p style={{ fontSize: 12, color: '#888' }}>{foundCode}</p>
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={stopScan}
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-all"
                >
                  {t('scan.cancel')}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="idle"
                onClick={startScan}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full aspect-[4/3] rounded-[20px] bg-[#F9F9F9] border-2 border-dashed border-[#DDD] flex flex-col items-center justify-center gap-3 transition-colors hover:border-[#FFDE32] group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <svg className="w-8 h-8 text-[#CCC] group-hover:text-[#FFDE32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#AAA' }} className="group-hover:text-[#FFB800]">
                  {t('scan.tap')}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.section>

        {/* 입력 섹션 */}
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder={t('barcode.placeholder')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch(code)}
            style={{
              flex: 1, padding: '16px', borderRadius: 18, border: '2px solid white',
              background: 'white', fontSize: 15, fontWeight: 700, outline: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
            }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => doSearch(code)}
            disabled={loading || !code.trim()}
            style={{
              padding: '0 24px', borderRadius: 18, border: 'none',
              background: loading || !code.trim() ? '#EEE' : '#1A1A1A',
              color: loading || !code.trim() ? '#AAA' : '#FFDE32',
              fontWeight: 900, fontSize: 15, cursor: 'pointer'
            }}
          >
            {loading ? '...' : t('barcode.search')}
          </motion.button>
        </div>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ fontSize: 13, color: '#FF3E3E', background: '#FFF5F5', padding: '12px 16px', borderRadius: 14, fontWeight: 600 }}
            >
              ⚠️ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* 결과 카드 */}
        <AnimatePresence>
          {result && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'white', borderRadius: 28, padding: '24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: 20
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', lineHeight: 1.3 }}>
                    {result.product_name || t('barcode.title')}
                  </h3>
                  <p style={{ fontSize: 11, color: '#BBB', fontWeight: 600, marginTop: 4 }}>
                    BARCODE: {result.barcode}
                  </p>
                </div>
                <div style={{ fontSize: 28 }}>📦</div>
              </div>

              {result.allergens.length > 0 ? (
                <div style={{ background: '#FFF0F0', border: '1px solid #FFDada', borderRadius: 20, padding: '16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: '#FF3E3E', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>🚨</span> {t('barcode.allergens_found')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.allergens.map((a) => (
                      <span key={a} style={{
                        padding: '6px 14px', background: '#FF3E3E', color: 'white',
                        fontSize: 13, fontWeight: 800, borderRadius: 12, boxShadow: '0 4px 10px rgba(255,62,62,0.2)'
                      }}>{a}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#F0FFF4', border: '1px solid #D1FAE5', borderRadius: 20, padding: '16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: '#B8860B', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✅</span> {t('barcode.no_allergens')}
                  </p>
                </div>
              )}

              {result.ingredients_text && (
                <div className="pt-2">
                  <p style={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A', marginBottom: 6 }}>
                    {t('barcode.ingredients')}
                  </p>
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, fontWeight: 500 }}>
                    {result.ingredients_text}
                  </p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </SplashStylePage>
  )
}