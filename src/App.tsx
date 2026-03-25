import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useUserStore } from './store/userStore'
import SupabaseAuthProvider from './components/SupabaseAuthProvider'
import BottomNav from './components/ui/BottomNav'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import WorkoutSetup from './pages/WorkoutSetup'
import WorkoutActive from './pages/WorkoutActive'
import History from './pages/History'
import Profile from './pages/Profile'
import Group from './pages/Group'
import Missions from './pages/Missions'
import AICoach from './pages/AICoach'
import GlobalLeaderboard from './pages/GlobalLeaderboard'
import PageWrapper from './components/ui/PageWrapper'
import { useCloudSync } from './hooks/useCloudSync'
import { useStreakDungeonReminders } from './hooks/useStreakDungeonReminders'

const FULLSCREEN_ROUTES = ['/treino/ativo', '/coach']

function AppShell() {
  useCloudSync()
  useStreakDungeonReminders()
  const location = useLocation()
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => location.pathname.startsWith(r))

  return (
    <div className="app-shell flex min-h-[100dvh] flex-col bg-[#0a0a0f] relative">
      <main
        className={`flex flex-1 flex-col min-h-0 overflow-y-auto energy-grid ${isFullscreen ? '' : 'pb-20'}`}
      >
        <Routes location={location}>
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/treino" element={<PageWrapper><WorkoutSetup /></PageWrapper>} />
          <Route path="/treino/ativo" element={<WorkoutActive />} />
          <Route path="/historico" element={<PageWrapper><History /></PageWrapper>} />
          <Route path="/missoes" element={<PageWrapper><Missions /></PageWrapper>} />
          <Route path="/grupo" element={<PageWrapper><Group /></PageWrapper>} />
          <Route path="/ranking-global" element={<PageWrapper><GlobalLeaderboard /></PageWrapper>} />
          <Route path="/coach" element={<AICoach />} />
          <Route path="/perfil" element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isFullscreen && <BottomNav />}
    </div>
  )
}

function AuthGate() {
  const authReady = useAuthStore((s) => s.authReady)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isOnboarded = useUserStore((s) => s.isOnboarded)

  if (!authReady) {
    return (
      <div className="app-shell min-h-[100dvh] bg-[#0a0a0f] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#64748b]">Carregando…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  if (!isOnboarded) {
    return <Onboarding />
  }

  return <AppShell />
}

export default function App() {
  return (
    <BrowserRouter>
      <SupabaseAuthProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<AuthGate />} />
        </Routes>
      </SupabaseAuthProvider>
    </BrowserRouter>
  )
}
