'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSpotify } from '@/hooks/useSpotify'
import dynamicImport from 'next/dynamic'
import Player from '@/components/Player'

// Route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const Lyrics = dynamicImport(() => import('@/components/Lyrics'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black/90">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DB954]"></div>
    </div>
  )
})

export default function Home() {
  const { accessToken, refreshToken, isLoading: spotifyLoading, login: spotifyLogin, saveTokens } = useSpotify()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !searchParams) return

    try {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const expiresIn = searchParams.get('expires_in')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        console.error('Spotify auth error:', errorParam)
        setError('Spotify girişi başarısız oldu')
        return
      }

      if (accessToken && refreshToken && expiresIn) {
        saveTokens(accessToken, refreshToken, parseInt(expiresIn))
        setError(null)
      }

      setIsReady(true)
    } catch (err) {
      console.error('Error processing auth params:', err)
      setError('Bir hata oluştu')
    }
  }, [searchParams, saveTokens])

  if (!isReady || spotifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1DB954]"></div>
      </div>
    )
  }

  if (!accessToken || !refreshToken) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white mb-8">Spotify Lyrics</h1>
            <p className="text-gray-400 mb-8">
              Spotify'da çalan şarkıların sözlerini gerçek zamanlı görüntüleyin
            </p>
            {error && (
              <p className="text-red-500 mb-4">{error}</p>
            )}
            <button
              onClick={() => spotifyLogin(false)}
              className="px-8 py-3 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/90 font-semibold text-lg"
            >
              Spotify ile Bağlan
            </button>
          </div>
        </div>
        <Player onTrackChange={() => {}} />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-black">
        <Lyrics />
      </main>
      <Player onTrackChange={() => {}} />
    </>
  )
}
