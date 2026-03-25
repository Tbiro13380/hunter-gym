import { useState, useMemo, useEffect } from 'react'
import { useGroupStore } from '../store/groupStore'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useAuthStore } from '../store/authStore'
import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'
import {
  fetchGroupById,
  createGroupRemote,
  joinGroupRemote,
  insertFeedEventRemote,
  upsertDungeonRemote,
  updateFeedEventRemote,
} from '../services/groupCloud'
import { RANK_COLORS } from '../lib/gamificationLogic'
import { getSessionVolume } from '../lib/progressionLogic'
import type { GroupMember, Dungeon, FeedEvent, Group as GroupType, UserProfile, Session } from '../lib/types'
import RankingRow from '../components/social/RankingRow'
import FeedItem from '../components/social/FeedItem'
import DungeonCard from '../components/gamification/DungeonCard'
import CreateDungeonModal from '../components/social/CreateDungeonModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

// ── Tabs ───────────────────────────────────────────────────────────────────

type Tab = 'feed' | 'ranking' | 'dungeons'

// ── Mock feed events for empty state ──────────────────────────────────────

function buildSelfMember(
  profile: UserProfile,
  sessions: Session[]
): GroupMember {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const thisWeek = sessions.filter((s: Session) => new Date(s.date) >= weekStart)
  const weeklyVolume = thisWeek.reduce((sum: number, s: Session) => sum + getSessionVolume(s), 0)

  return {
    userId: profile.id,
    name: profile.name,
    rank: profile.rank,
    activeTitle: profile.activeTitle,
    streakDays: profile.streakDays,
    weeklyVolume,
    weeklyDays: thisWeek.length,
  }
}

// ── No Group View ─────────────────────────────────────────────────────────

function NoGroupView({
  onCreateGroup,
  onJoinGroup,
}: {
  onCreateGroup: (name: string) => void | Promise<void>
  onJoinGroup: (code: string) => Promise<string | null>
}) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!groupName.trim()) { setError('Nome do grupo obrigatório'); return }
    await onCreateGroup(groupName.trim())
  }

  async function handleJoin() {
    if (!inviteCode.trim()) { setError('Código obrigatório'); return }
    const result = await onJoinGroup(inviteCode.trim().toUpperCase())
    if (!result) setError('Código inválido. Verifique e tente novamente.')
  }

  return (
    <div className="flex flex-col min-h-full flex-1">
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-display text-2xl font-bold text-white tracking-wide">Grupo</h1>
        <p className="text-[#64748b] text-sm mt-1">Treine junto com seus parceiros</p>
      </div>

      {mode === 'choose' && (
        <div className="px-4 flex flex-col gap-4 mt-4">
          {/* Info card */}
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-5">
            <div className="text-center mb-5">
              <span className="text-5xl block mb-3">⚔️</span>
              <h2 className="font-display text-lg font-bold text-white">Sem grupo ainda</h2>
              <p className="text-[#64748b] text-sm mt-2 leading-relaxed">
                Entre em um grupo para competir no ranking semanal, participar de dungeons coletivas
                e ver o feed de conquistas dos seus parceiros.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode('create')}
                className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3.5 rounded-xl transition-all font-display tracking-wider hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95"
              >
                Criar Novo Grupo
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full bg-[#1a1a26] hover:bg-[#2a2a3a] text-white border border-[#2a2a3a] hover:border-[#7c3aed]/40 font-semibold py-3.5 rounded-xl transition-all"
              >
                Entrar com Código
              </button>
            </div>
          </div>

          {/* Feature highlights */}
          {[
            { icon: '📊', title: 'Ranking semanal', desc: 'Compete por dias treinados e volume' },
            { icon: '🏰', title: 'Dungeons coletivas', desc: 'Desafios em grupo com recompensas' },
            { icon: '🔥', title: 'Feed de conquistas', desc: 'Veja PRs, rank ups e streaks do grupo' },
          ].map((f) => (
            <div key={f.icon} className="flex items-center gap-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl p-3">
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{f.title}</p>
                <p className="text-[#64748b] text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'create' && (
        <div className="px-4 mt-4">
          <button onClick={() => { setMode('choose'); setError('') }} className="flex items-center gap-2 text-[#64748b] hover:text-white text-sm mb-4 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold text-white">Criar Grupo</h2>
            <Input
              label="Nome do grupo"
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setError('') }}
              placeholder="Ex: Guerreiros do Norte"
              error={error}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            />
            <Button variant="primary" fullWidth onClick={handleCreate}>Criar Grupo</Button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="px-4 mt-4">
          <button onClick={() => { setMode('choose'); setError('') }} className="flex items-center gap-2 text-[#64748b] hover:text-white text-sm mb-4 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold text-white">Entrar com Código</h2>
            <p className="text-[#64748b] text-sm -mt-2">Peça o código de convite ao administrador do grupo</p>
            <Input
              label="Código de convite"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="Ex: ABC123"
              maxLength={8}
              error={error}
              autoFocus
              className="tracking-widest font-mono-timer uppercase text-center text-lg"
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin() }}
            />
            <Button variant="primary" fullWidth onClick={handleJoin}>Entrar no Grupo</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Group View ─────────────────────────────────────────────────────────────

function GroupView({
  group,
  profile,
  sessions,
}: {
  group: GroupType
  profile: UserProfile
  sessions: Session[]
}) {
  const [tab, setTab] = useState<Tab>('feed')
  const [dungeonModalOpen, setDungeonModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const { addFeedEvent, addDungeon, completeDungeon, addReaction, setGroup } = useGroupStore()
  const accountId = useAuthStore((s) => s.session?.accountId)

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase || !group.id || !accountId) return
    const client = supabase

    const refresh = async () => {
      const g = await fetchGroupById(group.id, accountId)
      if (g) setGroup(g)
    }

    const channel = client
      .channel(`guild:${group.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_feed_events', filter: `group_id=eq.${group.id}` },
        () => { void refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_dungeons', filter: `group_id=eq.${group.id}` },
        () => { void refresh() }
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [group.id, accountId, setGroup])

  // Build member list with self merged in with live stats
  const members: GroupMember[] = useMemo(() => {
    const selfMember = buildSelfMember(profile, sessions)
    const others = group.members.filter((m: GroupMember) => m.userId !== profile.id)
    return [selfMember, ...others].sort((a: GroupMember, b: GroupMember) => {
      if (b.weeklyDays !== a.weeklyDays) return b.weeklyDays - a.weeklyDays
      return b.weeklyVolume - a.weeklyVolume
    })
  }, [group.members, profile, sessions])

  const sortedFeed = useMemo(
    () => [...group.feed].sort((a: FeedEvent, b: FeedEvent) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [group.feed]
  )

  const activeDungeons = useMemo(
    () => group.dungeons.filter((d: Dungeon) => new Date(d.deadlineAt) > new Date()),
    [group.dungeons]
  )
  const expiredDungeons = useMemo(
    () => group.dungeons.filter((d: Dungeon) => new Date(d.deadlineAt) <= new Date()),
    [group.dungeons]
  )

  function handleCopyCode() {
    navigator.clipboard.writeText(group.inviteCode).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function handleCreateDungeon(dungeon: Dungeon) {
    addDungeon(dungeon)
    if (SUPABASE_ENABLED) {
      await upsertDungeonRemote(group.id, dungeon)
    }

    const feedEvent: FeedEvent = {
      id: crypto.randomUUID(),
      userId: profile.id,
      userName: profile.name,
      type: 'dungeon_cleared',
      payload: { dungeon: dungeon.name, action: 'created' },
      createdAt: new Date().toISOString(),
      reactions: [],
    }
    addFeedEvent(feedEvent)
    if (SUPABASE_ENABLED) {
      await insertFeedEventRemote(group.id, feedEvent)
    }
  }

  async function handleCompleteDungeon(dungeonId: string) {
    completeDungeon(dungeonId, profile.id)
    const after = useGroupStore.getState().group
    const d = after?.dungeons.find((x) => x.id === dungeonId)
    if (SUPABASE_ENABLED && after && d) {
      await upsertDungeonRemote(after.id, d)
    }

    const dungeon = group.dungeons.find((x) => x.id === dungeonId)

    const feedEvent: FeedEvent = {
      id: crypto.randomUUID(),
      userId: profile.id,
      userName: profile.name,
      type: 'dungeon_cleared',
      payload: { dungeon: dungeon?.name ?? 'Dungeon' },
      createdAt: new Date().toISOString(),
      reactions: [],
    }
    addFeedEvent(feedEvent)
    if (SUPABASE_ENABLED) {
      await insertFeedEventRemote(group.id, feedEvent)
    }
  }

  function handleReact(eventId: string, emoji: string) {
    addReaction(eventId, profile.id, emoji)
    const ev = useGroupStore.getState().group?.feed.find((e) => e.id === eventId)
    if (SUPABASE_ENABLED && ev) {
      void updateFeedEventRemote(eventId, ev)
    }
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'feed', label: 'Feed', icon: '⚡' },
    { id: 'ranking', label: 'Ranking', icon: '📊' },
    { id: 'dungeons', label: 'Dungeons', icon: '🏰' },
  ]

  return (
    <div className="flex flex-col min-h-full flex-1">
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${RANK_COLORS[profile.rank]}12 0%, transparent 70%)` }}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium">Grupo</p>
            <h1 className="font-display text-xl font-bold text-white tracking-wide truncate">
              {group.name}
            </h1>
          </div>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#1a1a26] border border-[#2a2a3a] hover:border-[#7c3aed]/40 text-[#64748b] hover:text-[#a855f7] text-xs font-medium px-3 py-2 rounded-xl transition-all flex-shrink-0 ml-3"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Convidar
          </button>
        </div>
        <p className="text-[#64748b] text-xs">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-[#12121a] border border-[#2a2a3a] rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                tab === t.id
                  ? 'bg-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 pb-6">

        {/* ── FEED ── */}
        {tab === 'feed' && (
          <div className="flex flex-col gap-3">
            {sortedFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-3">📭</span>
                <p className="text-[#64748b] text-sm font-medium">Feed vazio</p>
                <p className="text-[#2a2a3a] text-xs mt-1">
                  Complete treinos para gerar eventos no feed
                </p>
              </div>
            ) : (
              sortedFeed.map((event) => (
                <FeedItem
                  key={event.id}
                  event={event}
                  currentUserId={profile.id}
                  onReact={(eventId, emoji) => handleReact(eventId, emoji)}
                />
              ))
            )}
          </div>
        )}

        {/* ── RANKING ── */}
        {tab === 'ranking' && (
          <div className="flex flex-col gap-2">
            {/* Reset indicator */}
            <div className="flex items-center justify-between text-xs text-[#64748b] mb-2 px-1">
              <span>Esta semana</span>
              <span>Ordenado por dias → volume</span>
            </div>

            {members.map((member, i) => (
              <RankingRow
                key={member.userId}
                member={member}
                position={i + 1}
                isCurrentUser={member.userId === profile.id}
              />
            ))}

            {members.length <= 1 && (
              <div className="mt-4 bg-[#12121a] border border-dashed border-[#2a2a3a] rounded-2xl p-5 text-center">
                <p className="text-[#64748b] text-sm">Só você no grupo por enquanto</p>
                <p className="text-[#2a2a3a] text-xs mt-1">
                  Convide parceiros para competir no ranking
                </p>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="mt-3 text-xs text-[#7c3aed] hover:text-[#a855f7] font-medium transition-colors"
                >
                  Copiar código de convite →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── DUNGEONS ── */}
        {tab === 'dungeons' && (
          <div className="flex flex-col gap-4">
            {/* Create dungeon CTA */}
            <button
              onClick={() => setDungeonModalOpen(true)}
              className="w-full flex items-center gap-3 bg-[#7c3aed]/10 hover:bg-[#7c3aed]/15 border border-[#7c3aed]/30 hover:border-[#7c3aed]/50 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#a855f7]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[#a855f7] font-semibold text-sm">Criar nova Dungeon</p>
                <p className="text-[#64748b] text-xs">Desafie o grupo com um objetivo coletivo</p>
              </div>
            </button>

            {/* Active dungeons */}
            {activeDungeons.length > 0 && (
              <div>
                <p className="text-xs text-[#64748b] uppercase tracking-wider font-medium mb-3">
                  Ativas ({activeDungeons.length})
                </p>
                <div className="flex flex-col gap-3">
                  {activeDungeons.map((dungeon: Dungeon) => (
                    <DungeonCard
                      key={dungeon.id}
                      dungeon={dungeon}
                      currentUserId={profile.id}
                      onComplete={handleCompleteDungeon}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expired dungeons */}
            {expiredDungeons.length > 0 && (
              <div>
                <p className="text-xs text-[#64748b] uppercase tracking-wider font-medium mb-3">
                  Concluídas / Expiradas
                </p>
                <div className="flex flex-col gap-3 opacity-50">
                  {expiredDungeons.map((dungeon: Dungeon) => (
                    <DungeonCard
                      key={dungeon.id}
                      dungeon={dungeon}
                      currentUserId={profile.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeDungeons.length === 0 && expiredDungeons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-3">🏰</span>
                <p className="text-[#64748b] text-sm font-medium">Nenhuma dungeon ainda</p>
                <p className="text-[#2a2a3a] text-xs mt-1">Crie o primeiro desafio coletivo do grupo</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create dungeon modal */}
      <CreateDungeonModal
        open={dungeonModalOpen}
        onClose={() => setDungeonModalOpen(false)}
        onSave={handleCreateDungeon}
        createdBy={profile.id}
        creatorName={profile.name}
      />

      {/* Invite code modal */}
      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Convidar Membros" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-[#64748b] text-sm">
            Compartilhe este código com seus parceiros para que entrem no grupo.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3 text-center">
              <span className="font-mono-timer text-2xl font-bold tracking-[0.3em] text-white">
                {group.inviteCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                codeCopied
                  ? 'bg-[#22c55e]/20 border-[#22c55e]/40 text-[#22c55e]'
                  : 'bg-[#1a1a26] border-[#2a2a3a] text-[#64748b] hover:text-white hover:border-[#7c3aed]/40'
              }`}
            >
              {codeCopied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-[#64748b] text-xs text-center">
            Peça para seus parceiros acessarem a aba Grupo e inserir este código
          </p>
          <Button variant="secondary" fullWidth onClick={() => setInviteModalOpen(false)}>
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Group() {
  const { group, createGroup, joinGroup, setGroup } = useGroupStore()
  const profile = useUserStore((s) => s.profile)
  const { sessions } = useWorkoutStore()
  const session = useAuthStore((s) => s.session)

  if (!profile) return null

  async function handleCreateGroup(name: string) {
    if (SUPABASE_ENABLED && session) {
      const gid = await createGroupRemote(name)
      if (gid) {
        const g = await fetchGroupById(gid, session.accountId)
        if (g) setGroup(g)
      }
      return
    }
    createGroup(name, profile!.id, profile!.name)
  }

  async function handleJoinGroup(code: string): Promise<string | null> {
    if (SUPABASE_ENABLED && session) {
      const gid = await joinGroupRemote(code)
      if (gid) {
        const g = await fetchGroupById(gid, session.accountId)
        if (g) setGroup(g)
        return gid
      }
      return null
    }
    const g = joinGroup(code)
    return g ? g.id : null
  }

  if (!group) {
    return (
      <NoGroupView
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
      />
    )
  }

  return <GroupView group={group} profile={profile} sessions={sessions} />
}
