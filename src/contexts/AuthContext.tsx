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

const defaultProfile: UserProfile = {
  id: 'demo-admin-id',
  email: 'admin@mathplatform.edu',
  full_name: 'Lead Mathematics Instructor',
  role: 'Admin',
}

const AuthContext = createContext<AuthContextType>({
  session: { user: { email: defaultProfile.email } },
  profile: defaultProfile,
  loading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>({ user: { email: defaultProfile.email } })
  const [profile, setProfile] = useState<UserProfile | null>(defaultProfile)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession({ user: { email: defaultProfile.email } })
      setProfile(defaultProfile)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setProfile({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'Admin',
        })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setProfile({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'Admin',
        })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password?: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      if (password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        return { error: null }
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) return { error: error.message }
        return { error: null }
      }
    } else {
      setProfile({
        id: 'demo-admin-id',
        email,
        full_name: email.split('@')[0],
        role: 'Admin',
      })
      setSession({ user: { email } })
      return { error: null }
    }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
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
