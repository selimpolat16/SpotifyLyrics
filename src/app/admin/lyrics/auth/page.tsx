'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSpotify } from '@/hooks/useSpotify'

export default function SpotifyAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { saveTokens } = useSpotify()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const expiresIn = searchParams.get('expires_in')

        if (!accessToken || !refreshToken || !expiresIn) {
          throw new Error('Missing auth parameters')
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