import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
})

export const setAccessToken = (token: string) => {
  spotifyApi.setAccessToken(token)
}

export const getCurrentUserProfile = async () => {
  const response = await spotifyApi.getMe()
  return response.body
}

export const getPlaybackState = async () => {
  const response = await spotifyApi.getMyCurrentPlaybackState()
  return response.body
}

export const getCurrentTrack = async () => {
  const response = await spotifyApi.getMyCurrentPlayingTrack()
  return response.body
}

// Playback control functions
export const play = async () => {
  await spotifyApi.play()
}

export const pause = async () => {
  await spotifyApi.pause()
}

export const next = async () => {
  await spotifyApi.skipToNext()
}

export const previous = async () => {
  await spotifyApi.skipToPrevious()
}

export const seek = async (positionMs: number) => {
  await spotifyApi.seek(positionMs)
}

export const setVolume = async (volumePercent: number) => {
  await spotifyApi.setVolume(volumePercent)
}

export const setShuffle = async (state: boolean) => {
  await spotifyApi.setShuffle(state)
}

export const setRepeat = async (state: 'track' | 'context' | 'off') => {
  await spotifyApi.setRepeat(state)
}

export default spotifyApi 