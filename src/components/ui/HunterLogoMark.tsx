/**
 * Estrela 5 pontas centrada no viewBox 24×24 (substitui o sparkle Heroicons, que ficava visualmente deslocado).
 */
export default function HunterLogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 text-[#a855f7] ${className}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
