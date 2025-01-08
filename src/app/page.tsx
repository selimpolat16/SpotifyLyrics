'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { useAuthContext } from '@/components/AuthProvider'
import { useSpotify } from '@/hooks/useSpotify'
import Player from '@/components/Player'

export default function Home() {
  const { user, signInWithGoogle } = useAuthContext()
  const { login, saveTokens, accessToken } = useSpotify()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const expiresIn = searchParams.get('expires_in')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      console.error('Spotify auth error:', error)
      return
    }

    if (accessToken && refreshToken && expiresIn && state) {
      saveTokens(accessToken, refreshToken, parseInt(expiresIn))
    }
  }, [searchParams, saveTokens])

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-6rem)] p-8">
        <h1 className="text-4xl font-bold mb-8">
          Spotify Real-Time Lyrics
        </h1>

        {!user ? (
          <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
            <button
              onClick={signInWithGoogle}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-lg"
            >
              Google ile Giriş Yap
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {!accessToken ? (
              <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
                <button
                  onClick={login}
                  className="bg-[#1DB954] text-white px-6 py-3 rounded-md text-lg hover:bg-[#1DB954]/90"
                >
                  Spotify ile Bağlan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Şarkı kartları buraya gelecek */}
                <div className="bg-card rounded-lg p-4 hover:bg-card/80 transition-colors">
                  <div className="aspect-square bg-muted rounded-md mb-4" />
                  <h3 className="font-semibold mb-1">Şarkı Adı</h3>
                  <p className="text-muted-foreground">Sanatçı</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {accessToken && <Player />}
    </MainLayout>
  )
}
