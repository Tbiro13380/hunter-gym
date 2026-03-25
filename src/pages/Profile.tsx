import { useState, useMemo } from 'react'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useAuthStore } from '../store/authStore'
import {
  ALL_TITLES,
  RANK_ORDER,
  RANK_COLORS,
  RANK_XP_THRESHOLDS,
  getXPProgress,
} from '../lib/gamificationLogic'
import {
  getTotalVolume,
  getExercisePR,
} from '../lib/progressionLogic'
import type { HunterRank } from '../lib/types'
import RankBadge from '../components/gamification/RankBadge'
import StatBars from '../components/gamification/StatBars'
import TitleBadge from '../components/gamification/TitleBadge'
import Modal from '../components/ui/Modal'
import { SUPABASE_ENABLED } from '../lib/supabaseClient'
import { isPushSupported, savePushSubscription, removePushSubscriptions } from '../lib/pushNotifications'

// ── Helpers ────────────────────────────────────────────────────────────────

const RANK_DESCRIPTIONS: Record<HunterRank, string> = {
  E: 'O início de toda jornada. O caçador desperta.',
  D: 'Forças recrutadas. A consistência começa a forjar o guerreiro.',
  C: 'Progressão real. O caçador domina a técnica.',
  B: 'Meses de batalha. A carga cresce, a mente endurece.',
  A: 'Recordes quebrados. Veterano das masmorras.',
  S: 'O topo da hierarquia. Métricas lendárias em todos os atributos.',
  National: 'Além dos limites. Status concedido apenas aos melhores.',
  Monarch: 'O absoluto. O Shadow Monarch não tem rival.',
}

const MAIN_EXERCISES = [
  { id: 'ex-bench', name: 'Supino Reto' },
  { id: 'ex-squat', name: 'Agachamento' },
  { id: 'ex-rdl', name: 'Levantamento Terra Romeno' },
  { id: 'ex-ohp', name: 'Desenvolvimento' },
  { id: 'ex-pullup', name: 'Barra Fixa' },
]

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RankRoadmap({ currentRank }: { currentRank: HunterRank }) {
  const currentIdx = RANK_ORDER.indexOf(currentRank)

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
      <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium mb-4">
        Caminho dos Ranks
      </p>
      <div className="flex items-center gap-1">
        {RANK_ORDER.map((rank, idx) => {
          const color = RANK_COLORS[rank]
          const isPast = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture = idx > currentIdx
          const isMonarch = rank === 'Monarch'

          return (
            <div key={rank} className="flex items-center flex-1 min-w-0">
              {/* Connector line before */}
              {idx > 0 && (
                <div
                  className="h-0.5 flex-1"
                  style={{
                    background: isPast || isCurrent
                      ? `linear-gradient(90deg, ${RANK_COLORS[RANK_ORDER[idx - 1]]}, ${color})`
                      : '#1a1a26',
                  }}
                />
              )}

              {/* Rank node */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-[11px] border transition-all ${
                    isCurrent ? 'ring-2 ring-offset-1 ring-offset-[#12121a]' : ''
                  }`}
                  style={{
                    color: isFuture ? '#2a2a3a' : color,
                    borderColor: isFuture ? '#2a2a3a' : `${color}60`,
                    background: isFuture
                      ? '#0a0a0f'
                      : isMonarch && !isFuture
                      ? 'linear-gradient(135deg, #3b0764, #7c3aed)'
                      : `${color}15`,
                  boxShadow: isCurrent ? `0 0 10px ${color}60, 0 0 0 2px ${color}40` : undefined,
                  }}
                >
                  {rank === 'National' ? 'N' : rank === 'Monarch' ? 'M' : rank}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current rank description */}
      <div className="mt-4 px-3 py-2.5 bg-[#1a1a26] rounded-xl border border-[#2a2a3a]">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-bold text-sm" style={{ color: RANK_COLORS[currentRank] }}>
            Rank {currentRank}
          </span>
          <span className="text-[10px] text-[#64748b] bg-[#2a2a3a] px-1.5 py-0.5 rounded">
            {RANK_XP_THRESHOLDS[currentRank].toLocaleString('pt-BR')} XP
          </span>
        </div>
        <p className="text-[#64748b] text-xs leading-relaxed">{RANK_DESCRIPTIONS[currentRank]}</p>
      </div>
    </div>
  )
}

function StatHighlights({
  totalSessions,
  totalVolumeKg,
  totalDurationSeconds,
  streakDays,
  xp,
}: {
  totalSessions: number
  totalVolumeKg: number
  totalDurationSeconds: number
  streakDays: number
  xp: number
}) {
  const items = [
    { icon: '⚔️', label: 'Treinos totais', value: String(totalSessions), color: 'text-[#a855f7]' },
    { icon: '📊', label: 'Volume total', value: `${(totalVolumeKg / 1000).toFixed(1)}t`, color: 'text-[#06b6d4]' },
    { icon: '⏱️', label: 'Tempo total', value: formatDuration(totalDurationSeconds), color: 'text-[#22c55e]' },
    { icon: '🔥', label: 'Streak atual', value: `${streakDays}d`, color: 'text-[#f59e0b]' },
    { icon: '⚡', label: 'XP total', value: xp.toLocaleString('pt-BR'), color: 'text-[#a855f7]' },
  ]

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
      <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium mb-3">
        Estatísticas gerais
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 bg-[#1a1a26] rounded-xl px-3 py-2.5">
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            <div className="min-w-0">
              <p className={`font-bold text-base font-mono-timer ${item.color}`}>{item.value}</p>
              <p className="text-[#64748b] text-[10px] truncate">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PRSection({ sessions }: { sessions: import('../lib/types').Session[] }) {
  const prs = useMemo(() => {
    return MAIN_EXERCISES.map((ex) => ({
      ...ex,
      pr: getExercisePR(ex.id, sessions),
    })).filter((ex) => ex.pr > 0)
  }, [sessions])

  if (prs.length === 0) return null

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
      <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium mb-3">
        Recordes pessoais
      </p>
      <div className="flex flex-col gap-2">
        {prs.map((ex) => (
          <div key={ex.id} className="flex items-center gap-3">
            <span className="text-[#f59e0b] text-sm flex-shrink-0">🏆</span>
            <span className="text-[#f1f5f9] text-sm flex-1 truncate">{ex.name}</span>
            <span className="text-[#f59e0b] font-bold text-sm font-mono-timer flex-shrink-0">
              {ex.pr}kg
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Profile() {
  const { profile, setActiveTitle } = useUserStore()
  const { sessions } = useWorkoutStore()
  const [titlePickerOpen, setTitlePickerOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [newName, setNewName] = useState(profile?.name ?? '')

  const { percentage } = profile ? getXPProgress(profile.xp) : { percentage: 0 }

  const totalVolumeKg = useMemo(() => getTotalVolume(sessions), [sessions])
  const totalDurationSeconds = useMemo(
    () => sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    [sessions]
  )

  if (!profile) return null

  const activeTitleData = ALL_TITLES.find((t) => t.id === profile.activeTitle)
  const rankColor = RANK_COLORS[profile.rank]

  function handleSelectTitle(titleId: string) {
    setActiveTitle(titleId)
    setTitlePickerOpen(false)
  }

  const updateAccountName = useAuthStore((s) => s.updateAccountName)

  async function handleSaveName() {
    const trimmed = newName.trim()
    if (trimmed.length < 2) return
    await updateAccountName(trimmed)
    useUserStore.getState().updateProfile({ name: trimmed })
    setEditNameOpen(false)
  }

  return (
    <div className="flex flex-col min-h-full flex-1 pb-6">
      {/* ── HERO SECTION ── */}
      <div
        className="relative px-4 pt-10 pb-8 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${rankColor}18 0%, transparent 70%)`,
        }}
      >
        {/* Decorative blur */}
        <div
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: rankColor }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: rankColor }}
        />

        {/* Avatar + info */}
        <div className="relative flex flex-col items-center text-center">
          {/* Big rank badge */}
          <div className="relative mb-4">
            <RankBadge rank={profile.rank} size="xl" glow pulse />
            {/* XP ring */}
            <svg
              viewBox="0 0 120 120"
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            >
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a26" strokeWidth="4" />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={rankColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Name */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">
              {profile.name}
            </h1>
            <button
              onClick={() => { setNewName(profile.name); setEditNameOpen(true) }}
              className="p-1 rounded-lg text-[#64748b] hover:text-white transition-colors"
              aria-label="Editar nome"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          {/* Rank label */}
          <p className="font-display font-semibold text-sm" style={{ color: rankColor }}>
            Rank {profile.rank}
          </p>

          {/* Active title */}
          <button
            onClick={() => setTitlePickerOpen(true)}
            className="mt-2 flex items-center gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-3 py-1.5 rounded-full text-xs font-display font-semibold hover:bg-[#f59e0b]/20 transition-all"
          >
            <span>👑</span>
            <span>{activeTitleData?.label ?? 'Sem título'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 opacity-60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Streak pill */}
          <div className="mt-3 flex items-center gap-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-full px-4 py-1.5">
            <span>🔥</span>
            <span className="text-white text-sm font-bold font-mono-timer">{profile.streakDays}</span>
            <span className="text-[#64748b] text-xs">dias de streak</span>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* ── STAT BARS ── */}
        <StatBars stats={profile.stats} animate />

        {/* ── RANK ROADMAP ── */}
        <RankRoadmap currentRank={profile.rank} />

        {/* ── STAT HIGHLIGHTS ── */}
        <StatHighlights
          totalSessions={profile.totalSessions}
          totalVolumeKg={totalVolumeKg}
          totalDurationSeconds={totalDurationSeconds}
          streakDays={profile.streakDays}
          xp={profile.xp}
        />

        {/* ── PR RECORDS ── */}
        <PRSection sessions={sessions} />

        {/* ── TITLES GRID ── */}
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium">
              Títulos ({profile.titles.length}/{ALL_TITLES.length})
            </p>
            {profile.titles.length > 0 && (
              <button
                onClick={() => setTitlePickerOpen(true)}
                className="text-xs text-[#7c3aed] hover:text-[#a855f7] transition-colors font-medium"
              >
                Trocar título
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ALL_TITLES.map((title) => (
              <TitleBadge
                key={title.id}
                titleId={title.id}
                unlocked={profile.titles.includes(title.id)}
                active={profile.activeTitle === title.id}
                onSelect={handleSelectTitle}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* ── CONTA ── */}
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
          <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium mb-3">Conta</p>
          <AccountSection />
        </div>
      </div>

      {/* ── TITLE PICKER MODAL ── */}
      <Modal
        open={titlePickerOpen}
        onClose={() => setTitlePickerOpen(false)}
        title="Escolher Título"
        size="sm"
      >
        {profile.titles.length === 0 ? (
          <p className="text-[#64748b] text-sm text-center py-4">
            Nenhum título desbloqueado ainda.<br />Complete missões e treinos para ganhar títulos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {ALL_TITLES.filter((t) => profile.titles.includes(t.id)).map((title) => (
              <button
                key={title.id}
                onClick={() => handleSelectTitle(title.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  profile.activeTitle === title.id
                    ? 'border-[#f59e0b]/60 bg-[#f59e0b]/10'
                    : 'border-[#2a2a3a] bg-[#1a1a26] hover:border-[#7c3aed]/40'
                }`}
              >
                <span className="text-2xl">{profile.activeTitle === title.id ? '👑' : '🏅'}</span>
                <span className={`font-display text-xs font-semibold text-center leading-tight ${
                  profile.activeTitle === title.id ? 'text-[#f59e0b]' : 'text-white'
                }`}>
                  {title.label}
                </span>
                <span className="text-[9px] text-[#64748b] text-center leading-tight">
                  {title.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* ── EDIT NAME MODAL ── */}
      <Modal
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        title="Alterar Nome"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={32}
            className="w-full bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7c3aed] transition-colors"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName() }}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setEditNameOpen(false)}
              className="flex-1 bg-[#1a1a26] hover:bg-[#2a2a3a] text-white border border-[#2a2a3a] text-sm font-medium py-2.5 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveName}
              disabled={newName.trim().length < 2}
              className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Account section with logout + reset ───────────────────────────────────

function AccountSection() {
  const [confirmReset, setConfirmReset] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    await logout()
  }

  function handleReset() {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Email info */}
      {session?.email && (
        <div className="flex items-center gap-2 bg-[#1a1a26] rounded-xl px-3 py-2.5">
          <span className="text-[#64748b] text-sm">✉️</span>
          <span className="text-[#64748b] text-xs truncate flex-1">{session.email}</span>
        </div>
      )}

      {SUPABASE_ENABLED && session && isPushSupported() && (
        <button
          type="button"
          disabled={pushBusy}
          onClick={async () => {
            if (!session) return
            setPushBusy(true)
            try {
              await savePushSubscription(session.accountId)
            } finally {
              setPushBusy(false)
            }
          }}
          className="w-full flex items-center justify-center gap-2 bg-[#1a1a26] hover:bg-[#2a2a3a] border border-[#2a2a3a] text-[#94a3b8] text-xs font-medium py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {pushBusy ? 'Ativando…' : 'Ativar lembretes push (streak/dungeons)'}
        </button>
      )}

      {SUPABASE_ENABLED && session && isPushSupported() && (
        <button
          type="button"
          onClick={() => session && removePushSubscriptions(session.accountId)}
          className="w-full text-[10px] text-[#64748b] hover:text-[#94a3b8] py-1"
        >
          Remover inscrição push
        </button>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-[#1a1a26] hover:bg-[#2a2a3a] border border-[#2a2a3a] text-[#f1f5f9] text-sm font-medium py-2.5 rounded-xl transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sair da conta
      </button>

      {/* Reset */}
      {!confirmReset ? (
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full bg-[#ef4444]/10 hover:bg-[#ef4444]/15 border border-[#ef4444]/20 text-[#ef4444] text-xs font-medium py-2.5 rounded-xl transition-all"
        >
          Resetar todos os dados do jogo
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[#ef4444] text-xs font-medium">
            ⚠️ Isso apagará todo o progresso, treinos e dados permanentemente.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmReset(false)}
              className="flex-1 bg-[#1a1a26] border border-[#2a2a3a] text-[#64748b] text-xs font-medium py-2 rounded-lg transition-all hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] text-xs font-semibold py-2 rounded-lg transition-all hover:bg-[#ef4444]/30"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
