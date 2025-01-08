import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface PlayerState {
  isPlaying: boolean
  currentTrack: SpotifyApi.TrackObjectFull | null
  currentLyrics: string[] | null
  progress: number
  volume: number
  isShuffled: boolean
  repeatMode: 'off' | 'track' | 'context'
  queue: SpotifyApi.TrackObjectFull[]
}

const initialState: PlayerState = {
  isPlaying: false,
  currentTrack: null,
  currentLyrics: null,
  progress: 0,
  volume: 1,
  isShuffled: false,
  repeatMode: 'off',
  queue: [],
}

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload
    },
    setCurrentTrack: (state, action: PayloadAction<SpotifyApi.TrackObjectFull | null>) => {
      state.currentTrack = action.payload
    },
    setCurrentLyrics: (state, action: PayloadAction<string[] | null>) => {
      state.currentLyrics = action.payload
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload
    },
    setIsShuffled: (state, action: PayloadAction<boolean>) => {
      state.isShuffled = action.payload
    },
    setRepeatMode: (state, action: PayloadAction<'off' | 'track' | 'context'>) => {
      state.repeatMode = action.payload
    },
    setQueue: (state, action: PayloadAction<SpotifyApi.TrackObjectFull[]>) => {
      state.queue = action.payload
    },
  },
})

export const {
  setIsPlaying,
  setCurrentTrack,
  setCurrentLyrics,
  setProgress,
  setVolume,
  setIsShuffled,
  setRepeatMode,
  setQueue,
} = playerSlice.actions

export default playerSlice.reducer 