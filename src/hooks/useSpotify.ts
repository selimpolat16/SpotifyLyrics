'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import * as spotifyApi from '@/services/spotify'

export function useSpotify() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Firestore'dan token'ları al
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            
            // State'leri güncelle
            setAccessToken(data.spotifyAccessToken)
            setRefreshToken(data.spotifyRefreshToken)
            setExpiresAt(data.spotifyTokenExpiresAt)
            
            // Spotify servisine token'ları kaydet
            if (data.spotifyAccessToken) {
              spotifyApi.setAccessToken(data.spotifyAccessToken)
            }
            if (data.spotifyRefreshToken) {
              spotifyApi.setRefreshToken(data.spotifyRefreshToken)
            }
          }
        } catch (error) {
          console.error('Error loading Spotify tokens:', error)
        }
      } else {
        setAccessToken(null)
        setRefreshToken(null)
        setExpiresAt(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const saveTokens = async (accessToken: string, refreshToken: string, expiresIn: number) => {
    const user = auth.currentUser
    if (!user) return

    const expiresAt = Date.now() + expiresIn * 1000

    try {
      // Firestore'a kaydet
      await setDoc(doc(db, 'users', user.uid), {
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        spotifyTokenExpiresAt: expiresAt,
      }, { merge: true })

      // State'leri güncelle
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      setExpiresAt(expiresAt)

      // Spotify servisine kaydet
      spotifyApi.setAccessToken(accessToken)
      spotifyApi.setRefreshToken(refreshToken)
    } catch (error) {
      console.error('Error saving tokens:', error)
      throw error
    }
  }

  const login = () => {
    const scope = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      scope,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/spotify`,
      state: auth.currentUser?.uid || 'anonymous',
    })

    // Client tarafında olduğumuzdan emin ol
    if (typeof window !== 'undefined') {
      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
    }
  }

  return { accessToken, refreshToken, expiresAt, isLoading, login, saveTokens }
} 