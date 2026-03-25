/**
 * Shadow Coach — chama OpenAI no servidor (OPENAI_API_KEY só em secrets).
 * Deploy: supabase secrets set OPENAI_API_KEY=sk-... && supabase functions deploy shadow-coach
 */
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um coach de musculação especialista em progressão de cargas e periodização. Seu nome é Shadow Coach. Analise os dados de treino do usuário e responda em português brasileiro de forma direta, objetiva e motivadora — com o tom de um mentor exigente mas justo, como um personagem de Solo Leveling. Foque em: exercícios travados há mais de 2 semanas, progressão consistente, desequilíbrios musculares e sugestões práticas de periodização. Nunca seja genérico.`

type PriorMsg = { role: 'user' | 'assistant'; content: string }

type Body = {
  contextText?: string | null
  priorMessages?: PriorMsg[]
  userMessage?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY não configurada no projeto (secrets).' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const userMessage = typeof body.userMessage === 'string' ? body.userMessage.trim() : ''
  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'userMessage é obrigatório' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const priorMessages = Array.isArray(body.priorMessages)
    ? body.priorMessages.filter(
        (m): m is PriorMsg =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
    : []

  const contextText =
    typeof body.contextText === 'string' && body.contextText.trim() ? body.contextText.trim() : null

  const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ]

  if (contextText) {
    openaiMessages.push(
      { role: 'user', content: `Contexto do usuário:\n${contextText}` },
      { role: 'assistant', content: 'Entendido. Analisei seus dados. Como posso ajudar?' }
    )
  }

  for (const m of priorMessages) {
    openaiMessages.push({ role: m.role, content: m.content })
  }
  openaiMessages.push({ role: 'user', content: userMessage })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 800,
        temperature: 0.85,
      }),
    })

    const raw = await res.text()
    if (!res.ok) {
      console.error('OpenAI error', res.status, raw)
      return new Response(JSON.stringify({ error: `OpenAI: ${res.status}` }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const data = JSON.parse(raw) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content ?? ''
    return new Response(JSON.stringify({ content }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
