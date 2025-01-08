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

export const getCurrentPlayback = async () => {
  const response = await spotifyApi.getMyCurrentPlaybackState()
  return response.body
}

export const getCurrentTrack = async () => {
  const response = await spotifyApi.getMyCurrentPlayingTrack()
  return response.body
}

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

export const seek = async (position: number) => {
  await spotifyApi.seek(position)
}

export const setVolume = async (volume: number) => {
  await spotifyApi.setVolume(volume)
}

export const setShuffle = async (state: boolean) => {
  await spotifyApi.setShuffle(state)
}

export const setRepeat = async (state: 'off' | 'track' | 'context') => {
  await spotifyApi.setRepeat(state)
}

export const getQueue = async () => {
  const playback = await getCurrentPlayback()
  return playback?.item ? [playback.item] : []
}

export default spotifyApi 