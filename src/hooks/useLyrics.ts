import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import type { LyricLine } from '@/types/lyrics'
import {
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
} from '@/store/slices/lyricsSlice'
import * as lyricsService from '@/services/lyrics'

export function useLyrics() {
  const dispatch = useDispatch()
  const {
    present: lyrics,
    past,
    future,
    lastSaved,
    isDirty,
  } = useSelector((state: RootState) => state.lyrics)

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          dispatch(redo())
        } else {
          dispatch(undo())
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])

  const handleSetLyrics = useCallback((lyrics: LyricLine[]) => {
    dispatch(setLyrics(lyrics))
  }, [dispatch])

  const handleUpdateLyrics = useCallback((lyrics: LyricLine[]) => {
    dispatch(updateLyrics(lyrics))
  }, [dispatch])

  const handleAddLine = useCallback((line: LyricLine) => {
    dispatch(addLine(line))
  }, [dispatch])

  const handleUpdateLine = useCallback((index: number, line: LyricLine) => {
    dispatch(updateLine({ index, line }))
  }, [dispatch])

  const handleRemoveLine = useCallback((index: number) => {
    dispatch(removeLine(index))
  }, [dispatch])

  const handleReorderLines = useCallback((fromIndex: number, toIndex: number) => {
    dispatch(reorderLines({ fromIndex, toIndex }))
  }, [dispatch])

  const handleBulkAddLines = useCallback((lines: LyricLine[]) => {
    dispatch(bulkAddLines(lines))
  }, [dispatch])

  const handleUndo = useCallback(() => {
    dispatch(undo())
  }, [dispatch])

  const handleRedo = useCallback(() => {
    dispatch(redo())
  }, [dispatch])

  const handleMarkAsChanged = useCallback(() => {
    dispatch(markAsChanged())
  }, [dispatch])

  const handleMarkAsSaved = useCallback(() => {
    dispatch(markAsSaved())
  }, [dispatch])

  const canUndo = past.length > 0
  const canRedo = future.length > 0
  const hasUnsavedChanges = isDirty

  return {
    lyrics,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    setLyrics: handleSetLyrics,
    updateLyrics: handleUpdateLyrics,
    addLine: handleAddLine,
    updateLine: handleUpdateLine,
    removeLine: handleRemoveLine,
    reorderLines: handleReorderLines,
    bulkAddLines: handleBulkAddLines,
    undo: handleUndo,
    redo: handleRedo,
    markAsChanged: handleMarkAsChanged,
    markAsSaved: handleMarkAsSaved,
  }
} 