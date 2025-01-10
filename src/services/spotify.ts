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
    console.error('[spotify] Playback state error:', error)
    throw error
  }
}

export async function play(options?: { uris?: string[] }) {
  try {
    const api = ensureSpotifyApi()
    await api.play(options)
  } catch (error) {
    console.error('[spotify] Playback control error:', error)
    throw error
  }
}

export async function pause() {
  try {
    const api = ensureSpotifyApi()
    await api.pause()
  } catch (error) {
    console.error('[spotify] Playback control error:', error)
    throw error
  }
} 