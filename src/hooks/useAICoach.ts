import { useState, useCallback } from 'react'
import type { ChatMessage } from '../lib/types'
import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { getSessionVolume } from '../lib/progressionLogic'

function buildContextMessage(
  profile: ReturnType<typeof useUserStore.getState>['profile'],
  sessions: ReturnType<typeof useWorkoutStore.getState>['sessions']
): string {
  if (!profile) return ''

  const last10 = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  const sessionsSummary = last10.map((s) => {
    const vol = getSessionVolume(s)
    const entries = s.entries.map((e) => {
      const maxWeight = Math.max(...e.sets.map((st) => st.weight), 0)
      const totalReps = e.sets.reduce((sum, st) => sum + st.reps, 0)
      return `  - ${e.exerciseName}: ${e.sets.length} séries, max ${maxWeight}kg, ${totalReps} reps totais`
    }).join('\n')
    return `[${new Date(s.date).toLocaleDateString('pt-BR')}] ${s.templateName} | ${Math.round(s.durationSeconds / 60)}min | Volume: ${Math.round(vol)}kg\n${entries}`
  }).join('\n\n')

  return `DADOS DO CAÇADOR:
Nome: ${profile.name}
Rank: ${profile.rank}
XP: ${profile.xp}
Streak: ${profile.streakDays} dias
Total de treinos: ${profile.totalSessions}
Stats: STR=${profile.stats.STR} END=${profile.stats.END} AGI=${profile.stats.AGI} VIT=${profile.stats.VIT} INT=${profile.stats.INT}

ÚLTIMOS 10 TREINOS:
${sessionsSummary || 'Nenhum treino registrado ainda.'}`
}

export function useAICoach() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(
    async (userText: string) => {
      const profile = useUserStore.getState().profile
      const { sessions } = useWorkoutStore.getState()

      const priorForApi = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userText,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])

      try {
        if (!SUPABASE_ENABLED || !supabase) {
          throw new Error(
            'Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env e faça deploy da função shadow-coach.'
          )
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          throw new Error(
            'O Shadow Coach exige login com conta Supabase (e-mail/Google). Contas só locais não têm sessão para chamar o servidor.'
          )
        }

        const contextText = buildContextMessage(profile, sessions)

        const { data, error } = await supabase.functions.invoke('shadow-coach', {
          body: {
            contextText: contextText || null,
            priorMessages: priorForApi,
            userMessage: userText,
          },
        })

        if (error) {
          throw new Error(error.message || 'Erro ao chamar shadow-coach')
        }

        const content =
          data && typeof data === 'object' && 'content' in data && typeof (data as { content: unknown }).content === 'string'
            ? (data as { content: string }).content
            : ''

        if (!content) {
          const errMsg =
            data && typeof data === 'object' && 'error' in data
              ? String((data as { error: unknown }).error)
              : 'Resposta vazia do servidor.'
          throw new Error(errMsg)
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content } : m))
        )
      } catch (err) {
        const errorText =
          err instanceof Error
            ? `Erro: ${err.message}`
            : 'Erro desconhecido ao contatar o Shadow Coach.'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: errorText } : m
          )
        )
      } finally {
        setLoading(false)
      }
    },
    [messages]
  )

  const analyzeProgress = useCallback(() => {
    sendMessage(
      'Faça uma análise completa do meu progresso recente. Identifique o que está travado, o que está evoluindo bem, e me dê 3 sugestões práticas e específicas para os próximos 2 treinos.'
    )
  }, [sendMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    loading,
    sendMessage,
    analyzeProgress,
    clearMessages,
  }
}
