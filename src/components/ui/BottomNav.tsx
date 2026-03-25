import { NavLink } from 'react-router-dom'

type NavItem = {
  to: string
  label: string
  icon: string  // SVG path
}

const ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'HOME',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to: '/treino',
    label: 'TRAINING',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    to: '/missoes',
    label: 'MISSIONS',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  },
  {
    to: '/grupo',
    label: 'GUILD',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    to: '/perfil',
    label: 'PROFILE',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
]

export default function BottomNav() {
  return (
    <nav
      className="app-shell fixed bottom-0 left-0 right-0 z-50 w-full"
      style={{ background: '#131318', borderTop: '1px solid #4a4455' }}
    >
      <div className="flex items-stretch justify-around h-16 safe-bottom">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 px-2 flex-1 transition-all duration-150 ${
                isActive ? 'text-[#7c3aed]' : 'text-[#958da1] hover:text-[#e4e1e9] opacity-70 hover:opacity-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Top border indicator (active) */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5"
                    style={{ width: '60%', background: '#7c3aed', boxShadow: '0 0 8px #7c3aed' }}
                  />
                )}

                <svg
                  viewBox="0 0 24 24"
                  fill={isActive ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={isActive ? 0 : 1.8}
                  className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}
                  style={isActive ? { filter: 'drop-shadow(0 0 6px #7c3aed)' } : undefined}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>

                <span
                  className="font-mono-timer tracking-wider leading-none"
                  style={{ fontSize: '8px' }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
