import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
})

let refreshToken: string | null = null

export const setAccessToken = (token: string) => {
  spotifyApi.setAccessToken(token)
}

export const setRefreshToken = (token: string) => {
  refreshToken = token
  spotifyApi.setRefreshToken(token)
}

export const refreshAccessToken = async () => {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    // Call our API route to refresh the token
    const response = await fetch('/api/spotify/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.details || data.error || 'Failed to refresh token'
      console.error('Token refresh failed:', errorMessage)
      throw new Error(errorMessage)
    }

    if (!data.access_token || !data.expires_in) {
      console.error('Invalid response data:', data)
      throw new Error('Invalid response from Spotify')
    }

    const { access_token, expires_in } = data
    
    // Update the main API instance with the new access token
    spotifyApi.setAccessToken(access_token)
    return { accessToken: access_token, expiresIn: expires_in }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw error
  }
}

// Wrapper function to handle token refresh
const withTokenRefresh = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall()
  } catch (error: any) {
    // Check for various token expiration error patterns
    const isTokenExpired = 
      error?.body?.error?.message === 'The access token expired' ||
      error?.body?.error?.status === 401 ||
      error?.statusCode === 401

    if (isTokenExpired) {
      try {
        await refreshAccessToken()
        return await apiCall()
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        throw refreshError
      }
    }
    throw error
  }
}

export const getCurrentUserProfile = async () => {
  return withTokenRefresh(async () => {
    const response = await spotifyApi.getMe()
    return response.body
  })
}

export const getPlaybackState = async () => {
  return withTokenRefresh(async () => {
    const response = await spotifyApi.getMyCurrentPlaybackState()
    return response.body
  })
}

export const getCurrentTrack = async () => {
  return withTokenRefresh(async () => {
    const response = await spotifyApi.getMyCurrentPlayingTrack()
    return response.body
  })
}

// Playback control functions
export const play = async () => {
  return withTokenRefresh(async () => {
    await spotifyApi.play()
  })
}

export const pause = async () => {
  return withTokenRefresh(async () => {
    await spotifyApi.pause()
  })
}

export const next = async () => {
  return withTokenRefresh(async () => {
    await spotifyApi.skipToNext()
  })
}

export const previous = async () => {
  return withTokenRefresh(async () => {
    await spotifyApi.skipToPrevious()
  })
}

export const seek = async (positionMs: number) => {
  return withTokenRefresh(async () => {
    await spotifyApi.seek(positionMs)
  })
}

export const setVolume = async (volumePercent: number) => {
  return withTokenRefresh(async () => {
    await spotifyApi.setVolume(volumePercent)
  })
}

export const setShuffle = async (state: boolean) => {
  return withTokenRefresh(async () => {
    await spotifyApi.setShuffle(state)
  })
}

export const setRepeat = async (state: 'track' | 'context' | 'off') => {
  return withTokenRefresh(async () => {
    await spotifyApi.setRepeat(state)
  })
}

export default spotifyApi 