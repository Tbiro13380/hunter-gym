/**
 * Edge Function (Deno) — enviar Web Push com web-push + VAPID.
 * Deploy: supabase functions deploy send-web-push --no-verify-jwt
 * Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (e opcionalmente SERVICE_ROLE para chamar do cron)
 *
 * Body JSON: { userId?: string } — se omitido, requer auth JWT ou lógica própria.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { userId } = await req.json().catch(() => ({}))
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('user_id', userId)

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Integração web-push: instale via npm bundle ou use fetch para um worker dedicado.
    // Placeholder: registre subscriptions; o envio real requer a biblioteca web-push no Deno.
    return new Response(
      JSON.stringify({
        ok: true,
        message:
          'Configure web-push no Deno (import map) ou chame um backend Node. Subscriptions encontradas: ' +
          subs.length,
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
