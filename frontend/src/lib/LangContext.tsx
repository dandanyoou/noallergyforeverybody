import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { t as translate, type LangCode } from './i18n'

interface LangContextType {
  lang: LangCode
  setLang: (lang: LangCode) => void
  /** Splash hover preview: when set, `t()` uses this language until cleared */
  previewLang: LangCode | null
  setPreviewLang: (lang: LangCode | null) => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextType>(null!)

const STORAGE_KEY = 'allergy-scan-lang'

function getSavedLang(): LangCode | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved as LangCode
  } catch {}
  return null
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => getSavedLang() ?? 'en')
  const [previewLang, setPreviewLang] = useState<LangCode | null>(null)

  const setLang = useCallback((code: LangCode) => {
    setLangState(code)
    setPreviewLang(null)
    try { localStorage.setItem(STORAGE_KEY, code) } catch {}
  }, [])

  const effectiveLang = previewLang ?? lang
  const t = useCallback((key: string) => translate(key, effectiveLang), [effectiveLang])

  return (
    <LangContext.Provider value={{ lang, setLang, previewLang, setPreviewLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

export function hasSelectedLang(): boolean {
  return getSavedLang() !== null
}
