import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  // 'sheet' = bottom sheet on all screen sizes (default for mobile-first)
  // 'center' = always centered dialog
  variant?: 'sheet' | 'center'
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'sheet',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLElement | null>(null)

  // Lock body scroll (iOS-compatible via position fixed trick)
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const body = document.body
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflowY = 'scroll'

    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      body.style.overflowY = ''
      window.scrollTo(0, scrollY)
    }
  }, [open])

  // Auto-focus first input when opening
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), button:not([disabled])'
      )
      if (el) {
        firstFocusRef.current = el
        // Don't auto-focus on mobile to prevent keyboard from jumping
        if (window.innerWidth >= 640) el.focus()
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [open])

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )
  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  if (!open) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size]

  const isSheet = variant === 'sheet'

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      className={`
        fixed inset-0 z-[60] flex justify-center
        ${isSheet ? 'items-end' : 'items-center px-4'}
      `}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden="true"
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          relative w-full ${sizeClass} bg-[#12121a]
          border border-[#2a2a3a]
          flex flex-col
          ${isSheet
            ? 'rounded-t-3xl max-h-[92dvh]'
            : 'rounded-2xl mx-4 max-h-[90dvh]'
          }
        `}
        style={{
          animation: isSheet ? 'slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)' : 'zoomIn 0.2s ease-out',
          paddingBottom: isSheet ? 'max(1.25rem, env(safe-area-inset-bottom))' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (sheet only) */}
        {isSheet && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-[#2a2a3a]" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-3 pb-0 flex-shrink-0">
            <h2 className="font-display text-base font-semibold text-white tracking-wide">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[#64748b] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#2a2a3a] -mr-1"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
