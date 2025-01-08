import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  lyricsVisible: boolean
  visualizerType: 'wave' | 'bars' | 'circle'
  visualizerColor: string
}

const initialState: UIState = {
  theme: 'dark',
  sidebarOpen: true,
  lyricsVisible: true,
  visualizerType: 'wave',
  visualizerColor: '#1DB954', // Spotify yeşili
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    toggleLyrics: (state) => {
      state.lyricsVisible = !state.lyricsVisible
    },
    setVisualizerType: (state, action: PayloadAction<'wave' | 'bars' | 'circle'>) => {
      state.visualizerType = action.payload
    },
    setVisualizerColor: (state, action: PayloadAction<string>) => {
      state.visualizerColor = action.payload
    },
  },
})

export const {
  setTheme,
  toggleSidebar,
  toggleLyrics,
  setVisualizerType,
  setVisualizerColor,
} = uiSlice.actions

export default uiSlice.reducer 