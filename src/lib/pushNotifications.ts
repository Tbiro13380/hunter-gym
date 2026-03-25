import { supabase, SUPABASE_ENABLED } from './supabaseClient'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

export async function registerHunterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch (e) {
    console.warn('[push] SW register failed', e)
    return null
  }
}

export async function savePushSubscription(userId: string): Promise<boolean> {
  if (!SUPABASE_ENABLED || !supabase || !VAPID_PUBLIC?.trim()) return false
  const reg = await registerHunterServiceWorker()
  if (!reg) return false

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource,
  })

  const json = sub.toJSON()
  await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', sub.endpoint)

  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: userId,
    endpoint: sub.endpoint,
    keys: json.keys ?? {},
  })

  if (error) {
    console.warn('[push] save subscription', error)
    return false
  }
  return true
}

export async function removePushSubscriptions(userId: string): Promise<void> {
  if (!SUPABASE_ENABLED || !supabase) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}
