'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSpotify } from '@/hooks/useSpotify'
import Lyrics from '@/components/Lyrics'

export default function Home() {
  const { accessToken, refreshToken, isLoading: spotifyLoading, login: spotifyLogin, saveTokens } = useSpotify()
  const searchParams = useSearchParams()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Token'ları URL'den yakala
  useEffect(() => {
    if (!isMounted) return

    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const expiresIn = searchParams.get('expires_in')
    const error = searchParams.get('error')

    if (error) {
      console.error('Spotify auth error:', error)
      return
    }

    if (accessToken && refreshToken && expiresIn) {
      saveTokens(accessToken, refreshToken, parseInt(expiresIn))
    }
  }, [searchParams, saveTokens, isMounted])

  if (!isMounted || spotifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1DB954]"></div>
      </div>
    )
  }

  if (!accessToken || !refreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white mb-8">Spotify Lyrics</h1>
          <p className="text-gray-400 mb-8">
            Spotify'da çalan şarkıların sözlerini gerçek zamanlı görüntüleyin
          </p>
          <button
            onClick={() => spotifyLogin(false)}
            className="px-8 py-3 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/90 font-semibold text-lg"
          >
            Spotify ile Bağlan
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto p-4">
        <Lyrics />
      </div>
    </main>
  )
}
