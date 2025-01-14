'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import * as spotifyApi from '@/services/spotify'

export function useSpotify() {
  const [accessToken, setAccessToken] = useLocalStorage<string | null>('spotify_access_token', null)
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('spotify_refresh_token', null)
  const [expiresAt, setExpiresAt] = useLocalStorage<number | null>('spotify_expires_at', null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Token değiştiğinde Spotify API'yi initialize et
  useEffect(() => {
    if (accessToken) {
      spotifyApi.initializeSpotify(accessToken)
    }
  }, [accessToken])

  const login = useCallback((isAdmin = false) => {
    if (!isMounted) return

    const scope = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
      'app-remote-control',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-email',
      'user-read-private',
      'user-library-read',
      'user-library-modify',
      'user-top-read',
      'user-read-recently-played',
      'user-follow-read',
      'user-follow-modify'
    ].join(' ')

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const redirectUri = isAdmin 
      ? process.env.NEXT_PUBLIC_SPOTIFY_ADMIN_REDIRECT_URI 
      : process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI

    if (!clientId || !redirectUri) {
      console.error('[useSpotify] Missing configuration:', { hasClientId: !!clientId, hasRedirectUri: !!redirectUri })
      return
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope,
      show_dialog: 'true'
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }, [isMounted])

  const saveTokens = useCallback(async (accessToken: string, refreshToken: string, expiresIn: number) => {
    const expiresAt = Date.now() + expiresIn * 1000
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)
    setExpiresAt(expiresAt)
  }, [setAccessToken, setRefreshToken, setExpiresAt])

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()
      await saveTokens(data.accessToken, data.refreshToken || refreshToken, data.expiresIn)
    } catch (error) {
      console.error('[useSpotify] Token refresh failed:', error)
      setAccessToken(null)
      setRefreshToken(null)
      setExpiresAt(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [refreshToken, saveTokens, setAccessToken, setRefreshToken, setExpiresAt])

  // Token'ın süresini kontrol et
  useEffect(() => {
    if (!accessToken || !expiresAt) return

    const timeUntilExpire = expiresAt - Date.now()
    if (timeUntilExpire <= 0) {
      refreshAccessToken()
    } else {
      // Token süresinin dolmasına 5 dakika kala yenile
      const timeout = setTimeout(() => {
        refreshAccessToken()
      }, timeUntilExpire - 5 * 60 * 1000)

      return () => clearTimeout(timeout)
    }
  }, [accessToken, expiresAt, refreshAccessToken])

  return {
    accessToken: isMounted ? accessToken : null,
    refreshToken: isMounted ? refreshToken : null,
    expiresAt: isMounted ? expiresAt : null,
    isLoading,
    login,
    saveTokens,
    refreshAccessToken,
  }
} 