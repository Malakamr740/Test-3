import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  role?: string
}

interface AuthContextType {
  session: any
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: 'Authentication is unavailable.' }),
  signOut: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      setProfile(null)
      setLoading(false)
      return
    }

    let active = true

    const loadProfile = async (user: any) => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      setProfile({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: data?.role || user.app_metadata?.role,
      })
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      setSession(session)
      if (session?.user) await loadProfile(session.user)
      if (active) setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setLoading(true)
        void loadProfile(session.user).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password?: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Authentication is not configured. Contact your administrator.' }
    if (!password) return { error: 'A password is required.' }

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()
    const role = String(profile?.role || authData.user.app_metadata?.role || '').trim().toLowerCase()
    if (role !== 'admin' && role !== 'teacher') {
      await supabase.auth.signOut()
      return { error: 'This account is not authorized for the teacher/admin workspace.' }
    }

    return { error: null }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
