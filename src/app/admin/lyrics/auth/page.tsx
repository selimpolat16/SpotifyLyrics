'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSpotify } from '@/hooks/useSpotify'

// Route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function SpotifyAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { saveTokens } = useSpotify()

  useEffect(() => {
    const handleAuth = async () => {
      if (typeof window === 'undefined') return

      try {
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const expiresIn = searchParams.get('expires_in')

        if (!accessToken || !refreshToken || !expiresIn) {
          console.error('Missing auth parameters')
          router.push('/admin/lyrics?error=missing_params')
          return
        }

        await saveTokens(accessToken, refreshToken, parseInt(expiresIn))
        router.push('/admin/lyrics')
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/admin/lyrics?error=auth_failed')
      }
    }

    handleAuth()
  }, [router, searchParams, saveTokens])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Spotify bağlantısı kuruluyor...</div>
    </div>
  )
} 