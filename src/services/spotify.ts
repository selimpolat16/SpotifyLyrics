import SpotifyWebApi from 'spotify-web-api-node'

let spotifyApi: SpotifyWebApi | null = null

export function initializeSpotify(accessToken: string) {
  spotifyApi = new SpotifyWebApi({
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  })
  spotifyApi.setAccessToken(accessToken)
}

function ensureSpotifyApi(): SpotifyWebApi {
  if (!spotifyApi?.getAccessToken()) {
    throw new Error('No token provided')
  }
  return spotifyApi
}

export async function getPlaybackState() {
  try {
    const api = ensureSpotifyApi()
    const response = await api.getMyCurrentPlaybackState()
    return response.body
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Playback state error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Playback state hatası: ${errorMessage}`)
  }
}

export async function play(options?: { uris?: string[] }) {
  try {
    const api = ensureSpotifyApi()
    await api.play(options)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Playback control error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Playback control hatası: ${errorMessage}`)
  }
}

export async function pause() {
  try {
    const api = ensureSpotifyApi()
    await api.pause()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Playback control error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Playback control hatası: ${errorMessage}`)
  }
}

export async function seek(positionMs: number) {
  try {
    const api = ensureSpotifyApi()
    await api.seek(positionMs)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Seek error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Seek hatası: ${errorMessage}`)
  }
}

export async function getAudioFeatures(trackId: string) {
  console.log('Audio features isteği başlatıldı:', { trackId })
  
  try {
    if (!trackId) {
      throw new Error('Track ID gerekli')
    }

    const api = ensureSpotifyApi()
    if (!api.getAccessToken()) {
      throw new Error('Access token bulunamadı')
    }

    console.log('Spotify API hazır, istek gönderiliyor...')

    const response = await api.getAudioFeaturesForTrack(trackId)
    
    // API yanıtını detaylı logla
    console.log('API yanıtı:', {
      statusCode: response?.statusCode,
      hasBody: !!response?.body,
      headers: response?.headers,
      body: response?.body
    })

    if (!response?.body) {
      throw new Error('API yanıtı boş')
    }

    return response.body
  } catch (error: any) {
    // Hata detaylarını topla
    const errorInfo = {
      name: error?.name || 'Unknown Error',
      message: error?.message || 'Bilinmeyen hata',
      statusCode: error?.statusCode,
      stack: error?.stack,
      headers: error?.headers,
      requestUrl: `https://api.spotify.com/v1/audio-features/${trackId}`,
      accessToken: !!spotifyApi?.getAccessToken(),
      errorBody: error?.body
    }

    // Hata detaylarını logla
    console.error('[spotify] Audio features error:', errorInfo)

    // Özel hata mesajlar
    if (errorInfo.statusCode === 401) {
      throw new Error('Oturum süresi doldu, lütfen yeniden giriş yapın')
    } else if (errorInfo.statusCode === 403) {
      throw new Error('Bu özelliğe erişim izniniz yok')
    } else if (errorInfo.statusCode === 429) {
      throw new Error('Çok fazla istek gönderildi, lütfen biraz bekleyin')
    } else if (!navigator.onLine) {
      throw new Error('İnternet bağlantısı yok')
    }

    // Genel hata mesajı
    throw new Error(`Spotify API hatası: ${errorInfo.message}`)
  }
}

export async function getCurrentTrack() {
  try {
    const playbackState = await getPlaybackState()
    return playbackState
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Get current track error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Get current track hatası: ${errorMessage}`)
  }
}

export async function previous() {
  try {
    const api = ensureSpotifyApi()
    await api.skipToPrevious()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Previous track error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Previous track hatası: ${errorMessage}`)
  }
}

export async function next() {
  try {
    const api = ensureSpotifyApi()
    await api.skipToNext()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Next track error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Next track hatası: ${errorMessage}`)
  }
}

export async function setVolume(volumePercent: number) {
  try {
    const api = ensureSpotifyApi()
    await api.setVolume(volumePercent)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Set volume error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Set volume hatası: ${errorMessage}`)
  }
}

export async function setShuffle(state: boolean) {
  try {
    const api = ensureSpotifyApi()
    await api.setShuffle(state)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Set shuffle error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Set shuffle hatası: ${errorMessage}`)
  }
}

export async function setRepeat(state: 'off' | 'track' | 'context') {
  try {
    const api = ensureSpotifyApi()
    await api.setRepeat(state)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Set repeat error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Set repeat hatası: ${errorMessage}`)
  }
}

export async function getCurrentUserProfile() {
  try {
    const api = ensureSpotifyApi()
    const response = await api.getMe()
    return response.body
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[spotify] Get user profile error:', {
      error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Get user profile hatası: ${errorMessage}`)
  }
} 