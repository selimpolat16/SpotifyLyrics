'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/components/AuthProvider'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import spotifyApi, { setAccessToken } from '@/services/spotify'

export function useSpotify() {
  const { user } = useAuthContext()
  const [accessToken, setSpotifyAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadSpotifyTokens = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const data = userDoc.data()

        if (data?.spotifyAccessToken) {
          setSpotifyAccessToken(data.spotifyAccessToken)
          setAccessToken(data.spotifyAccessToken)
          setRefreshToken(data.spotifyRefreshToken)
          setExpiresAt(data.spotifyTokenExpiresAt)
        }
      } catch (error) {
        console.error('Error loading Spotify tokens:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSpotifyTokens()
  }, [user])

  const saveTokens = async (accessToken: string, refreshToken: string, expiresIn: number) => {
    if (!user) return

    const expiresAt = Date.now() + expiresIn * 1000

    try {
      await setDoc(doc(db, 'users', user.uid), {
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        spotifyTokenExpiresAt: expiresAt,
      }, { merge: true })

      setSpotifyAccessToken(accessToken)
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      setExpiresAt(expiresAt)
    } catch (error) {
      console.error('Error saving Spotify tokens:', error)
      throw error
    }
  }

  const login = () => {
    const scope = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-recently-played',
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      scope,
      redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
      state: user?.uid || 'anonymous',
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    loading,
    login,
    saveTokens,
  }
} 