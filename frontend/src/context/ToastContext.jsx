/* Toast notifications — one provider, one useToast() hook. */
import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext(null)

const TONES = {
  success: { icon: 'check_circle', cls: 'bg-primary text-on-primary' },
  error: { icon: 'error', cls: 'bg-error text-on-error' },
  info: { icon: 'info', cls: 'bg-inverse-surface text-inverse-on-surface' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, tone = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((list) => [...list, { id, message, tone }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-space-sm px-margin">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const tone = TONES[t.tone] || TONES.info
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                onClick={() => dismiss(t.id)}
                className={`pointer-events-auto flex max-w-md cursor-pointer items-start gap-space-sm rounded-xl px-space-md py-space-sm shadow-e3 ${tone.cls}`}
              >
                <span className="material-symbols-outlined fill text-lg">{tone.icon}</span>
                <span className="text-label-lg">{t.message}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.toast
}
