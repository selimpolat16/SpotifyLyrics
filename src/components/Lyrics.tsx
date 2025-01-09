'use client'

import { useEffect, useState, useRef } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import * as spotifyApi from '@/services/spotify'
import * as lyricsService from '@/services/lyrics'
import type { LyricLine } from '@/types/lyrics'
import { motion, AnimatePresence } from 'framer-motion'

export default function Lyrics() {
  const { accessToken } = useSpotify()
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.TrackObjectFull | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentLine, setCurrentLine] = useState<LyricLine | null>(null)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lyricsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accessToken) return

    const fetchCurrentTrack = async () => {
      try {
        const track = await spotifyApi.getCurrentTrack()
        if (track && track.item && 'album' in track.item) {
          setCurrentTrack(track.item as SpotifyApi.TrackObjectFull)
          setProgress(track.progress_ms || 0)

          // Şarkı değiştiyse sözleri yükle
          if (currentTrack?.id !== track.item.id) {
            await loadLyrics(track.item as SpotifyApi.TrackObjectFull)
          }
        }
      } catch (error) {
        console.error('Error fetching current track:', error)
        setError('Şarkı bilgileri alınamadı')
      }
    }

    fetchCurrentTrack()
    const interval = setInterval(fetchCurrentTrack, 1000)

    return () => clearInterval(interval)
  }, [accessToken, currentTrack?.id])

  // Şarkı sözlerini yükle
  const loadLyrics = async (track: SpotifyApi.TrackObjectFull) => {
    setIsLoading(true)
    setError(null)

    try {
      // Önce track ID ile ara
      let songLyrics = await lyricsService.getLyricsByTrackId(track.id)

      // Bulunamazsa şarkı adı ve sanatçı ile ara
      if (!songLyrics) {
        songLyrics = await lyricsService.getLyricsByArtistAndTitle(
          track.artists[0].name,
          track.name
        )
      }

      if (songLyrics) {
        setLyrics(songLyrics.lyrics)
      } else {
        setError('Şarkı sözleri bulunamadı')
        setLyrics([])
      }
    } catch (error) {
      console.error('Error loading lyrics:', error)
      setError('Şarkı sözleri yüklenirken bir hata oluştu')
      setLyrics([])
    } finally {
      setIsLoading(false)
    }
  }

  // Mevcut zamanı takip et ve uygun lyrics satırını bul
  useEffect(() => {
    if (!lyrics.length) return

    const currentLine = lyricsService.findCurrentLyricLine(lyrics, progress)
    setCurrentLine(currentLine)

    // Otomatik kaydırma
    if (currentLine && lyricsRef.current) {
      const lineElement = document.getElementById(`line-${currentLine.time}`)
      if (lineElement) {
        lineElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [progress, lyrics])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {error}
      </div>
    )
  }

  if (!lyrics.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Bu şarkı için sözler mevcut değil
      </div>
    )
  }

  return (
    <div 
      ref={lyricsRef}
      className="h-full overflow-y-auto px-4 py-8 space-y-6 scrollbar-hide"
    >
      <AnimatePresence mode="wait">
        {lyrics.map((line) => (
          <motion.div
            key={line.time}
            id={`line-${line.time}`}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: currentLine?.time === line.time ? 1 : 0.5,
              scale: currentLine?.time === line.time ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
            className={`text-center text-lg transition-all ${
              currentLine?.time === line.time
                ? 'text-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            {line.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 