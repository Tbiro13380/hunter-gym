import { useState, useRef, useEffect } from 'react'
import { useAICoach } from '../hooks/useAICoach'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'
import type { ChatMessage } from '../lib/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Análise completa', text: 'Faça uma análise completa do meu progresso recente. Identifique o que está travado, o que está evoluindo bem, e me dê 3 sugestões práticas e específicas para os próximos 2 treinos.' },
  { icon: '💪', label: 'Próxima progressão', text: 'Quais exercícios estou pronto para progredir de carga? Qual deveria ser minha próxima tentativa?' },
  { icon: '⚖️', label: 'Desequilíbrios', text: 'Existe algum desequilíbrio muscular nos meus treinos? Estou negligenciando algum grupo?' },
  { icon: '🔄', label: 'Periodização', text: 'Como devo estruturar minha periodização para os próximos 4 semanas com base no meu histórico?' },
  { icon: '😴', label: 'Recuperação', text: 'Estou treinando na frequência certa? Preciso descansar mais ou posso adicionar mais volume?' },
  { icon: '🎯', label: 'Próximo rank', text: 'O que preciso fazer para subir de rank? Quais métricas estão me impedindo?' },
]

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content && message.role === 'assistant'

  return (
    <div className={`flex gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center flex-shrink-0 self-end mb-1 shadow-[0_0_12px_rgba(124,58,237,0.4)]">
          <span className="text-sm">🤖</span>
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#7c3aed] text-white rounded-tr-none'
              : 'bg-[#12121a] border border-[#2a2a3a] text-[#f1f5f9] rounded-tl-none'
          }`}
        >
          {isEmpty ? (
            /* Typing indicator */
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#64748b] animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          ) : (
            <MarkdownText text={message.content} />
          )}
        </div>
        <span className="text-[10px] text-[#64748b]">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  )
}

// Very minimal markdown renderer (bold, bullet lists)
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g)
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part
        )

        // Bullet list
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          const content = line.replace(/^[\s\-•]+/, '')
          const contentParts = content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part
          )
          return (
            <div key={i} className="flex gap-2">
              <span className="text-[#7c3aed] flex-shrink-0 mt-0.5">•</span>
              <span>{contentParts}</span>
            </div>
          )
        }

        // Numbered list
        if (/^\d+\./.test(line.trim())) {
          const match = line.match(/^(\d+)\.\s(.*)/)
          if (match) {
            const numParts = match[2].split(/\*\*(.*?)\*\*/g).map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part
            )
            return (
              <div key={i} className="flex gap-2">
                <span className="text-[#a855f7] font-bold flex-shrink-0 font-mono-timer">{match[1]}.</span>
                <span>{numParts}</span>
              </div>
            )
          }
        }

        return <p key={i}>{rendered}</p>
      })}
    </div>
  )
}

// ── Coach indisponível (Supabase / sessão) ─────────────────────────────────

function CoachUnavailableWarning() {
  return (
    <div className="mx-4 my-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-[#f59e0b] text-sm font-semibold mb-1">Shadow Coach indisponível nesta sessão</p>
          <p className="text-[#64748b] text-xs leading-relaxed">
            O coach roda numa Edge Function do Supabase com a chave OpenAI no servidor (não no app). É preciso{' '}
            <strong className="text-[#94a3b8]">Supabase configurado</strong> e{' '}
            <strong className="text-[#94a3b8]">login com conta Supabase</strong> (e-mail ou Google). Contas só
            locais não enviam JWT para a função.
          </p>
          <p className="text-[#64748b] text-[10px] mt-2">
            Deploy: <code className="bg-[#1a1a26] px-1 rounded">supabase secrets set OPENAI_API_KEY=...</code>{' '}
            e <code className="bg-[#1a1a26] px-1 rounded">supabase functions deploy shadow-coach</code>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Welcome card ───────────────────────────────────────────────────────────

function WelcomeCard({ onAnalyze, loading }: { onAnalyze: () => void; loading: boolean }) {
  return (
    <div className="mx-4 mt-2 bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/10 border border-[#7c3aed]/30 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(124,58,237,0.4)]">
          <span className="text-lg">🤖</span>
        </div>
        <div>
          <h3 className="text-white font-display font-bold text-base">Shadow Coach</h3>
          <p className="text-[#64748b] text-xs mt-0.5">Powered by GPT-4o mini</p>
        </div>
      </div>
      <p className="text-[#f1f5f9] text-sm leading-relaxed mb-4">
        Sou seu coach de musculação personalizado. Analiso seu histórico de treinos, identifico stalls,
        desequilíbrios e te dou orientações baseadas em dados reais — sem conselhos genéricos.
      </p>
      <button
        onClick={onAnalyze}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all font-display tracking-wider hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analisando...
          </>
        ) : (
          <>
            <span>⚡</span>
            ANALISAR MEU PROGRESSO
          </>
        )}
      </button>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AICoach() {
  const { messages, loading, sendMessage, analyzeProgress, clearMessages } = useAICoach()
  const profile = useUserStore((s) => s.profile)
  const { sessions } = useWorkoutStore()
  const [input, setInput] = useState('')
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const [canUseCoach, setCanUseCoach] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) {
      setCanUseCoach(false)
      return
    }
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setCanUseCoach(!!session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setCanUseCoach(!!session)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setShowQuickPrompts(false)
    sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleQuickPrompt(text: string) {
    setShowQuickPrompts(false)
    sendMessage(text)
  }

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-6 pb-4 border-b border-[#2a2a3a] bg-[#0a0a0f]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.4)]">
              <span className="text-base">🤖</span>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white tracking-wide">Shadow Coach</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[10px] text-[#64748b]">
                  {canUseCoach ? 'Online · GPT-4o mini' : 'Login Supabase necessário'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-[#64748b]">contexto</p>
                <p className="text-xs text-[#a855f7] font-medium">{sessions.length} treinos</p>
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-2 rounded-lg text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                aria-label="Limpar conversa"
                title="Limpar conversa"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* API key warning */}
        {!canUseCoach && <CoachUnavailableWarning />}

        {/* Welcome / analyze CTA */}
        {messages.length === 0 && canUseCoach && (
          <>
            <WelcomeCard onAnalyze={analyzeProgress} loading={loading} />

            {/* Trainer info */}
            {profile && (
              <div className="mx-4 px-4 py-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-2">
                  Seu contexto enviado ao coach
                </p>
                <div className="flex items-center gap-4 text-xs text-[#64748b] flex-wrap">
                  <span>👤 {profile.name}</span>
                  <span>🏅 Rank {profile.rank}</span>
                  <span>⚔️ {profile.totalSessions} treinos</span>
                  <span>🔥 {profile.streakDays}d streak</span>
                  {sessions.length > 0 && (
                    <span>📋 últimos {Math.min(sessions.length, 10)} treinos incluídos</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Chat messages */}
        <div className="px-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts overlay */}
        {showQuickPrompts && (
          <div className="mx-4 bg-[#12121a] border border-[#2a2a3a] rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#2a2a3a]">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">
                Perguntas rápidas
              </p>
            </div>
            <div className="py-1">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleQuickPrompt(p.text)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a26] transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-base flex-shrink-0">{p.icon}</span>
                  <span className="text-sm text-[#f1f5f9]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3">
        {/* Quick prompts toggle */}
        {messages.length > 0 && !showQuickPrompts && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p.label}
                onClick={() => handleQuickPrompt(p.text)}
                disabled={loading}
                className="flex items-center gap-1.5 bg-[#1a1a26] border border-[#2a2a3a] hover:border-[#7c3aed]/40 text-[#64748b] hover:text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0 disabled:opacity-50"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Quick prompts toggle button */}
          <button
            onClick={() => setShowQuickPrompts((v) => !v)}
            className={`p-2.5 rounded-xl border transition-all flex-shrink-0 self-end ${
              showQuickPrompts
                ? 'bg-[#7c3aed]/20 border-[#7c3aed]/40 text-[#a855f7]'
                : 'bg-[#1a1a26] border-[#2a2a3a] text-[#64748b] hover:text-white'
            }`}
            aria-label="Perguntas rápidas"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Text input */}
          <div className="flex-1 bg-[#1a1a26] border border-[#2a2a3a] focus-within:border-[#7c3aed] rounded-2xl transition-colors overflow-hidden">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={loading ? 'Aguardando resposta...' : 'Pergunte ao Shadow Coach...'}
              disabled={loading || !canUseCoach}
              rows={1}
              className="w-full bg-transparent text-white placeholder-[#64748b] text-sm px-4 py-3 focus:outline-none resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ scrollbarWidth: 'none' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !canUseCoach}
            className="w-10 h-10 flex items-center justify-center bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all hover:shadow-[0_0_12px_rgba(124,58,237,0.4)] active:scale-95 flex-shrink-0 self-end"
            aria-label="Enviar"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#2a2a3a] text-center mt-2">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
