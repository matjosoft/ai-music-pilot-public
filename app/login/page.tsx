'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Initialize subscription for new/existing user
        try {
          await fetch('/api/auth/initialize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Failed to initialize subscription:', error)
        }

        router.push('/create')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="w-full max-w-md p-8 bg-dark-card rounded-2xl shadow-2xl border border-neon-purple/30">
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-br from-neon-purple via-neon-magenta to-neon-cyan p-4 rounded-full shadow-neon-purple mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">Welcome Back</h1>
          <p className="text-gray-400">Sign in to AI Music Pilot</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#B794F6',
                  brandAccent: '#EC4899',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#1a1a24',
                  defaultButtonBackgroundHover: '#252533',
                  defaultButtonBorder: '#444',
                  defaultButtonText: 'white',
                  dividerBackground: '#444',
                  inputBackground: '#1a1a24',
                  inputBorder: '#444',
                  inputBorderHover: '#B794F6',
                  inputBorderFocus: '#B794F6',
                  inputText: 'white',
                  inputPlaceholder: '#999',
                },
              },
            },
          }}
          providers={['google']}
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined}
        />
      </div>
    </div>
  )
}
