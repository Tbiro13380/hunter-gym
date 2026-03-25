import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useUserStore } from './store/userStore'
import BottomNav from './components/ui/BottomNav'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import WorkoutSetup from './pages/WorkoutSetup'
import WorkoutActive from './pages/WorkoutActive'
import History from './pages/History'
import Profile from './pages/Profile'
import Group from './pages/Group'
import Missions from './pages/Missions'
import AICoach from './pages/AICoach'
import PageWrapper from './components/ui/PageWrapper'

const FULLSCREEN_ROUTES = ['/treino/ativo', '/coach']

function AppShell() {
  const location = useLocation()
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => location.pathname.startsWith(r))

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a0a0f] max-w-lg mx-auto relative">
      <main className={`flex-1 overflow-y-auto ${isFullscreen ? '' : 'pb-20'}`}>
        <Routes location={location}>
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/treino" element={<PageWrapper><WorkoutSetup /></PageWrapper>} />
          <Route path="/treino/ativo" element={<WorkoutActive />} />
          <Route path="/historico" element={<PageWrapper><History /></PageWrapper>} />
          <Route path="/missoes" element={<PageWrapper><Missions /></PageWrapper>} />
          <Route path="/grupo" element={<PageWrapper><Group /></PageWrapper>} />
          <Route path="/coach" element={<AICoach />} />
          <Route path="/perfil" element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isFullscreen && <BottomNav />}
    </div>
  )
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isOnboarded = useUserStore((s) => s.isOnboarded)

  // User is ready when authenticated AND has a game profile
  const isReady = isAuthenticated && isOnboarded

  return (
    <BrowserRouter>
      {isReady ? <AppShell /> : <AuthPage />}
    </BrowserRouter>
  )
}
