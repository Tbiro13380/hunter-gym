import { useEffect, useRef } from 'react'

type PageWrapperProps = {
  children: React.ReactNode
  className?: string
}

export default function PageWrapper({ children, className = '' }: PageWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
    const t = requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.22s ease-out, transform 0.22s ease-out'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
