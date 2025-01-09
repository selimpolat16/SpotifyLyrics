import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
})

let refreshToken: string | null = null
let accessToken: string | null = null

export const setAccessToken = (token: string) => {
  accessToken = token
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
    setAccessToken(data.accessToken)
    return data
  } catch (error) {
    console.error('Error refreshing token:', error)
    throw error
  }
}

// Aktif cihazı kontrol et
export const getActiveDevice = async () => {
  try {
    const devices = await spotifyApi.getMyDevices()
    const activeDevice = devices.body.devices.find(device => device.is_active)
    return activeDevice || null
  } catch (error) {
    console.error('Error getting devices:', error)
    return null
  }
}

// API çağrılarını token yenileme ile sarmalayan yardımcı fonksiyon
const withTokenRefresh = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    // Token yoksa yenile
    if (!accessToken) {
      const { accessToken: newToken } = await refreshAccessToken()
      setAccessToken(newToken)
    }
    return await apiCall()
  } catch (error) {
    if (error instanceof Error && error.message.includes('The access token expired')) {
      // Token'ı yenile ve tekrar dene
      const { accessToken: newToken } = await refreshAccessToken()
      setAccessToken(newToken)
      return apiCall()
    }
    throw error
  }
}

export const play = async (options?: { uris?: string[] }) => {
  return withTokenRefresh(async () => {
    try {
      // Önce mevcut cihazları al
      const devices = await spotifyApi.getMyDevices()
      console.log('Mevcut cihazlar:', devices.body.devices)

      // Aktif cihazı bul
      let activeDevice = devices.body.devices.find(device => device.is_active)
      
      // Aktif cihaz yoksa ilk cihazı seç ve aktifleştir
      if (!activeDevice && devices.body.devices.length > 0) {
        activeDevice = devices.body.devices[0]
        await spotifyApi.transferMyPlayback([activeDevice.id])
        // Cihaz değişiminin tamamlanmasını bekle
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!activeDevice) {
        throw new Error('NO_ACTIVE_DEVICE')
      }

      // Önce mevcut çalma durumunu kontrol et
      const playbackState = await spotifyApi.getMyCurrentPlaybackState()
      
      // Şarkıyı çal
      if (options?.uris) {
        // Eğer farklı bir şarkı çalınacaksa
        if (!playbackState.body?.item || playbackState.body.item.uri !== options.uris[0]) {
          await spotifyApi.play({
            device_id: activeDevice.id,
            uris: options.uris,
            position_ms: 0
          })
        } else {
          // Aynı şarkıysa sadece başa sar ve oynat
          await spotifyApi.seek(0, { device_id: activeDevice.id })
          if (!playbackState.body.is_playing) {
            await spotifyApi.play({ device_id: activeDevice.id })
          }
        }
      } else {
        // Sadece oynat/devam et
        await spotifyApi.play({ device_id: activeDevice.id })
      }
    } catch (error: any) {
      console.error('Play error:', {
        message: error.message,
        statusCode: error.statusCode,
        body: error.body
      })
      throw error
    }
  })
}

export const pause = async () => {
  return withTokenRefresh(async () => {
    const activeDevice = await getActiveDevice()
    if (!activeDevice) {
      throw new Error('NO_ACTIVE_DEVICE')
    }
    await spotifyApi.pause({ device_id: activeDevice.id })
  })
}

export const seek = async (positionMs: number) => {
  return withTokenRefresh(async () => {
    const activeDevice = await getActiveDevice()
    if (!activeDevice) {
      throw new Error('NO_ACTIVE_DEVICE')
    }
    await spotifyApi.seek(positionMs, { device_id: activeDevice.id })
  })
}

export async function getPlaybackState(): Promise<SpotifyApi.CurrentPlaybackResponse | null> {
  try {
    const response = await spotifyApi.getMyCurrentPlaybackState()
    return response.body || null
  } catch (error) {
    console.error('Playback state error:', error)
    return null
  }
}

export default spotifyApi 