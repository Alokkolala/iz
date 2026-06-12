import { supabase } from './supabase'

// ---- profile ----------------------------------------------------------

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfileName(userId: string, name: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ name: name || null })
    .eq('id', userId)
  if (error) throw error
}

// ---- analyses ---------------------------------------------------------

export interface SavedAnalysis {
  id: string
  user_id: string
  sight_guess: string | null
  payload: Record<string, unknown>
  created_at: string
}

export async function saveAnalysis(userId: string, sightGuess: string, payload: unknown) {
  const { data, error } = await supabase
    .from('analyses')
    .insert({ user_id: userId, sight_guess: sightGuess, payload })
    .select()
    .single()
  if (error) throw error
  return data as SavedAnalysis
}

export async function listAnalyses(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, user_id, sight_guess, payload, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as SavedAnalysis[]
}

export async function deleteAnalysis(id: string) {
  const { error } = await supabase.from('analyses').delete().eq('id', id)
  if (error) throw error
}

// ---- crew invites -----------------------------------------------------

export interface CrewInvite {
  id: string
  inviter_id: string
  invitee_email: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export async function sendInvite(inviteeEmail: string) {
  const email = inviteeEmail.trim().toLowerCase()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('not signed in')
  const { data, error } = await supabase
    .from('crew_invites')
    .insert({ inviter_id: user.id, invitee_email: email })
    .select()
    .single()
  if (error) throw error
  return data as CrewInvite
}

export async function listOutgoingInvites(userId: string) {
  const { data, error } = await supabase
    .from('crew_invites')
    .select('*')
    .eq('inviter_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CrewInvite[]
}

export async function listIncomingInvites(email: string) {
  const { data, error } = await supabase
    .from('crew_invites')
    .select('*')
    .ilike('invitee_email', email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CrewInvite[]
}

export async function respondInvite(id: string, status: 'accepted' | 'declined') {
  const { error } = await supabase
    .from('crew_invites')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

// ---- voice chat history -----------------------------------------------

export interface ChatRow {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  text: string
  action: unknown
  suggestions: unknown
  created_at: string
}

export async function listChatMessages(userId: string, limit = 60): Promise<ChatRow[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, user_id, role, text, action, suggestions, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as ChatRow[]).reverse()
}

export async function saveChatMessage(
  userId: string,
  role: 'user' | 'assistant',
  text: string,
  action: unknown = null,
  suggestions: unknown = null,
) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, role, text, action, suggestions })
  if (error) throw error
}

export async function clearChatHistory(userId: string) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}

// ---- account deletion (server-side) -----------------------------------

export async function deleteAccount() {
  const session = (await supabase.auth.getSession()).data.session
  if (!session) throw new Error('not signed in')
  const res = await fetch('/api/delete-account', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `delete failed (${res.status})`)
  }
  await supabase.auth.signOut()
}
