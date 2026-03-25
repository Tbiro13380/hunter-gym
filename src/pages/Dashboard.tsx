import { useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useGamificationStore } from '../store/gamificationStore'
import { useGamification } from '../hooks/useGamification'
import { ALL_TITLES, RANK_COLORS } from '../lib/gamificationLogic'
import { getSessionVolume } from '../lib/progressionLogic'
import RankBadge from '../components/gamification/RankBadge'
import XPBar from '../components/gamification/XPBar'
import StatBars from '../components/gamification/StatBars'
import MissionCard from '../components/gamification/MissionCard'
import DungeonCard from '../components/gamification/DungeonCard'
import FeedItem from '../components/social/FeedItem'
import { useGroupStore as useGroup } from '../store/groupStore'

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getNextWorkoutLabel(sessions: { templateId: string; date: string }[], templates: { id: string; label: string; name: string }[]): { label: string; name: string } | null {
  if (templates.length === 0) return null
  if (sessions.length === 0) return { label: templates[0].label, name: templates[0].name }

  // Find the last used template and suggest the next one in rotation
  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const lastTemplateId = sorted[0].templateId
  const lastIdx = templates.findIndex((t) => t.id === lastTemplateId)
  const nextIdx = (lastIdx + 1) % templates.length
  return { label: templates[nextIdx].label, name: templates[nextIdx].name }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="font-bold text-xl font-mono-timer" style={{ color }}>{value}</p>
    </div>
  )
}

function SectionHeader({ title, to, linkLabel = 'Ver tudo' }: { title: string; to?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wider">{title}</h2>
      {to && (
        <Link to={to} className="text-[#7c3aed] text-xs font-medium hover:text-[#a855f7] transition-colors">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const profile = useUserStore((s) => s.profile)
  const { templates, sessions, startSession, activeSession } = useWorkoutStore()
  const { missions } = useGamificationStore()
  const { group, addReaction } = useGroup()
  const { refreshMissions } = useGamification()

  // Init missions on first load
  useEffect(() => {
    if (missions.length === 0) refreshMissions()
  }, [missions.length, refreshMissions])

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const thisWeek = sessions.filter((s) => new Date(s.date) >= weekStart)
    const vol = thisWeek.reduce((sum, s) => sum + getSessionVolume(s), 0)
    return { days: thisWeek.length, volume: vol }
  }, [sessions])

  // Next workout suggestion
  const nextWorkout = useMemo(
    () => getNextWorkoutLabel(sessions, templates),
    [sessions, templates]
  )

  // Active missions (first 3, not completed)
  const activeMissions = useMemo(
    () => missions.filter((m) => !m.completed).slice(0, 3),
    [missions]
  )

  // Active dungeons from group
  const activeDungeons = useMemo(() => {
    if (!group) return []
    return group.dungeons.filter((d) => new Date(d.deadlineAt) > new Date()).slice(0, 1)
  }, [group])

  // Feed items (last 3)
  const feedItems = useMemo(() => {
    if (!group) return []
    return [...group.feed]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [group])

  if (!profile) return null

  const activeTitleData = ALL_TITLES.find((t) => t.id === profile.activeTitle)
  const rankColor = RANK_COLORS[profile.rank]

  function handleStartWorkout() {
    if (activeSession) {
      navigate('/treino/ativo')
      return
    }
    if (templates.length === 0) {
      navigate('/treino')
      return
    }
    // Find the next template to use
    if (nextWorkout) {
      const tmpl = templates.find(
        (t) => t.label === nextWorkout.label && t.name === nextWorkout.name
      ) ?? templates[0]
      if (tmpl.exercises.length === 0) {
        navigate('/treino')
        return
      }
      startSession(tmpl)
      navigate('/treino/ativo')
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-4">
      {/* ── HEADER SECTION ── */}
      <div
        className="relative px-4 pt-10 pb-6 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${rankColor}12 0%, transparent 60%)`,
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: rankColor }}
        />

        {/* Profile row */}
        <div className="flex items-start gap-4 relative">
          {/* Rank badge */}
          <RankBadge rank={profile.rank} size="lg" glow pulse />

          {/* Name + title + streak */}
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[#64748b] text-xs font-medium">{getGreeting()},</p>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide leading-tight truncate">
              {profile.name}
            </h1>
            {activeTitleData && (
              <p className="text-[#f59e0b] text-xs font-medium mt-0.5 font-display">
                ✦ {activeTitleData.label}
              </p>
            )}
          </div>

          {/* Streak badge */}
          <div className="flex flex-col items-center bg-[#1a1a26] border border-[#2a2a3a] rounded-2xl px-3 py-2 flex-shrink-0">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-white text-base font-mono-timer leading-tight">
              {profile.streakDays}
            </span>
            <span className="text-[10px] text-[#64748b]">streak</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <XPBar xp={profile.xp} rank={profile.rank} />
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Treinos"
            value={String(profile.totalSessions)}
            icon="⚔️"
            color="#a855f7"
          />
          <StatCard
            label="Esta semana"
            value={`${weeklyStats.days}d`}
            icon="📅"
            color="#06b6d4"
          />
          <StatCard
            label="Volume / sem"
            value={`${(weeklyStats.volume / 1000).toFixed(1)}t`}
            icon="📊"
            color="#22c55e"
          />
        </div>
      </div>

      {/* ── STATS BARS ── */}
      <div className="px-4 mb-5">
        <StatBars stats={profile.stats} animate />
      </div>

      {/* ── NEXT WORKOUT CTA ── */}
      <div className="px-4 mb-5">
        {activeSession ? (
          <button
            onClick={() => navigate('/treino/ativo')}
            className="w-full bg-[#22c55e]/10 border border-[#22c55e]/40 rounded-2xl p-4 flex items-center gap-4 hover:bg-[#22c55e]/15 transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg animate-pulse">⚡</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#22c55e] text-xs font-medium uppercase tracking-wider">Em andamento</p>
              <p className="text-white font-semibold text-base">{activeSession.templateName}</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#22c55e]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : nextWorkout ? (
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium">Próximo treino</p>
                <p className="text-white font-display font-bold text-lg mt-0.5">
                  {nextWorkout.label} — {nextWorkout.name}
                </p>
              </div>
              <Link to="/treino" className="text-[#64748b] hover:text-[#a855f7] transition-colors p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
            </div>
            <button
              onClick={handleStartWorkout}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3.5 rounded-xl transition-all font-display tracking-wider hover:shadow-[0_0_24px_rgba(124,58,237,0.45)] active:scale-95 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M8 5v14l11-7z" />
              </svg>
              INICIAR TREINO
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/treino')}
            className="w-full bg-[#12121a] border border-dashed border-[#2a2a3a] hover:border-[#7c3aed]/50 rounded-2xl p-4 text-[#64748b] hover:text-[#a855f7] transition-all text-sm font-medium"
          >
            + Configurar meu primeiro split
          </button>
        )}
      </div>

      {/* ── ACTIVE MISSIONS ── */}
      {activeMissions.length > 0 && (
        <div className="px-4 mb-5">
          <SectionHeader title="Missões Ativas" to="/missoes" />
          <div className="flex flex-col gap-2">
            {activeMissions.map((m) => (
              <MissionCard key={m.id} mission={m} compact />
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIVE DUNGEON ── */}
      {activeDungeons.length > 0 && (
        <div className="px-4 mb-5">
          <SectionHeader title="Dungeon Ativa" to="/grupo" />
          {activeDungeons.map((d) => (
            <DungeonCard
              key={d.id}
              dungeon={d}
              currentUserId={profile.id}
              compact
            />
          ))}
        </div>
      )}

      {/* ── GROUP FEED ── */}
      {feedItems.length > 0 && (
        <div className="px-4 mb-5">
          <SectionHeader title="Feed do Grupo" to="/grupo" />
          <div className="flex flex-col gap-3">
            {feedItems.map((event) => (
              <FeedItem
                key={event.id}
                event={event}
                currentUserId={profile.id}
                onReact={(eventId, emoji) => addReaction(eventId, profile.id, emoji)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE (no sessions yet) ── */}
      {sessions.length === 0 && (
        <div className="px-4 mb-5">
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⚔️</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Bem-vindo ao Hunter Gym!</p>
                <p className="text-[#64748b] text-xs mt-1 leading-relaxed">
                  Você está na fase de despertar. Complete seu primeiro treino para ganhar XP,
                  subir de rank e desbloquear o título <span className="text-[#f59e0b]">Awakened</span>.
                </p>
                <div className="flex gap-2 mt-3">
                  <Link
                    to="/treino"
                    className="text-xs font-semibold bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3 py-1.5 rounded-lg transition-all active:scale-95"
                  >
                    Começar agora
                  </Link>
                  <Link
                    to="/missoes"
                    className="text-xs font-semibold bg-[#1a1a26] text-[#64748b] hover:text-white px-3 py-1.5 rounded-lg transition-all border border-[#2a2a3a]"
                  >
                    Ver missões
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK LINKS (secondary nav) ── */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <QuickLink to="/historico" icon="📈" label="Histórico" sub="Ver progresso" />
          <QuickLink to="/coach" icon="🤖" label="Shadow Coach" sub="IA personalizada" accent />
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  to,
  icon,
  label,
  sub,
  accent = false,
}: {
  to: string
  icon: string
  label: string
  sub: string
  accent?: boolean
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl p-4 border transition-all hover:scale-[1.02] active:scale-[0.98] ${
        accent
          ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30 hover:bg-[#7c3aed]/15 hover:border-[#7c3aed]/50'
          : 'bg-[#12121a] border-[#2a2a3a] hover:border-[#2a2a3a]'
      }`}
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className={`font-semibold text-sm ${accent ? 'text-[#a855f7]' : 'text-white'}`}>{label}</p>
        <p className="text-[#64748b] text-xs truncate">{sub}</p>
      </div>
    </Link>
  )
}
