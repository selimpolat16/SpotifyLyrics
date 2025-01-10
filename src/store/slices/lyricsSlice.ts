import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { LyricLine } from '@/types/lyrics'

interface LyricsState {
  present: LyricLine[]
  past: LyricLine[][]
  future: LyricLine[][]
  lastSaved: LyricLine[] | null
  isDirty: boolean
}

const initialState: LyricsState = {
  present: [],
  past: [],
  future: [],
  lastSaved: null,
  isDirty: false,
}

export const lyricsSlice = createSlice({
  name: 'lyrics',
  initialState,
  reducers: {
    setLyrics: (state, action: PayloadAction<LyricLine[]>) => {
      state.present = action.payload
      state.past = []
      state.future = []
      state.lastSaved = action.payload
      state.isDirty = false
    },
    updateLyrics: (state, action: PayloadAction<LyricLine[]>) => {
      state.past.push([...state.present])
      state.present = action.payload
      state.future = []
    },
    addLine: (state, action: PayloadAction<LyricLine>) => {
      state.past.push([...state.present])
      state.present.push(action.payload)
      state.future = []
    },
    updateLine: (state, action: PayloadAction<{ index: number, line: LyricLine }>) => {
      state.past.push([...state.present])
      state.present[action.payload.index] = action.payload.line
      state.future = []
    },
    removeLine: (state, action: PayloadAction<number>) => {
      state.past.push([...state.present])
      state.present.splice(action.payload, 1)
      state.future = []
    },
    reorderLines: (state, action: PayloadAction<{ fromIndex: number, toIndex: number }>) => {
      state.past.push([...state.present])
      const [removed] = state.present.splice(action.payload.fromIndex, 1)
      state.present.splice(action.payload.toIndex, 0, removed)
      state.future = []
    },
    bulkAddLines: (state, action: PayloadAction<LyricLine[]>) => {
      state.past.push([...state.present])
      state.present.push(...action.payload)
      state.future = []
    },
    undo: (state) => {
      if (state.past.length > 0) {
        const previous = state.past[state.past.length - 1]
        state.past.pop()
        state.future.push([...state.present])
        state.present = previous
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const next = state.future[state.future.length - 1]
        state.future.pop()
        state.past.push([...state.present])
        state.present = next
      }
    },
    markAsChanged: (state) => {
      state.isDirty = true
    },
    markAsSaved: (state) => {
      state.lastSaved = [...state.present]
      state.isDirty = false
    },
  },
})

export const {
  setLyrics,
  updateLyrics,
  addLine,
  updateLine,
  removeLine,
  reorderLines,
  bulkAddLines,
  undo,
  redo,
  markAsChanged,
  markAsSaved,
} = lyricsSlice.actions

export default lyricsSlice.reducer 