import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slices/uiSlice'
import lyricsReducer from './slices/lyricsSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    lyrics: lyricsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 