'use client'

import { useState, useEffect, useRef } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import * as spotifyApi from '@/services/spotify'
import * as lyricsService from '@/services/lyrics'
import { motion, AnimatePresence } from 'framer-motion'
import type { LyricLine } from '@/types/lyrics'

export default function Lyrics() {
  const { accessToken, refreshAccessToken } = useSpotify()
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.TrackObjectFull | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentLine, setCurrentLine] = useState<LyricLine | null>(null)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const lyricsRef = useRef<HTMLDivElement>(null)

  // Client-side mount kontrolü
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Spotify API'yi initialize et
  useEffect(() => {
    if (accessToken && isMounted) {
      spotifyApi.initializeSpotify(accessToken)
    }
  }, [accessToken, isMounted])

  // Şu anki şarkıyı ve ilerlemeyi takip et
  useEffect(() => {
    if (!accessToken) return

    const fetchCurrentTrack = async () => {
      try {
        const state = await spotifyApi.getPlaybackState()
        if (state && state.item && 'album' in state.item) {
          const track = state.item as SpotifyApi.TrackObjectFull
          setProgress(state.progress_ms || 0)

          // Şarkı değiştiyse sözleri yükle
          if (currentTrack?.id !== track.id) {
            setCurrentTrack(track)
            await loadLyrics(track)
          }
        }
      } catch (error: any) {
        // Token süresi dolduysa yenilemeyi dene
        if (error.message?.includes('The access token expired')) {
          try {
            await refreshAccessToken()
          } catch (refreshError) {
            setError('Oturum süresi doldu. Lütfen sayfayı yenileyin.')
          }
        } else {
          setError('Şarkı bilgileri alınamadı')
        }
      }
    }

    fetchCurrentTrack()
    const interval = setInterval(fetchCurrentTrack, 1000)
    return () => clearInterval(interval)
  }, [accessToken, currentTrack?.id, refreshAccessToken])

  // Şarkı sözlerini yükle
  const loadLyrics = async (track: SpotifyApi.TrackObjectFull) => {
    setIsLoading(true)
    setError(null)

    try {
      const songLyrics = await lyricsService.getLyricsByTrackId(track.id)
      if (songLyrics) {
        setLyrics(songLyrics.lyrics)
      } else {
        setError('Bu şarkı için sözler mevcut değil')
        setLyrics([])
      }
    } catch (error) {
      setError('Şarkı sözleri yüklenirken bir hata oluştu')
      setLyrics([])
    } finally {
      setIsLoading(false)
    }
  }

  // Mevcut zamanı takip et ve uygun lyrics satırını bul
  useEffect(() => {
    if (!lyrics.length) return

    const currentLine = findCurrentLine(lyrics, progress)
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

  // Şu anki zamanla eşleşen satırı bul
  const findCurrentLine = (lyrics: LyricLine[], currentTime: number): LyricLine | null => {
    if (!lyrics.length) return null

    // İkili arama ile şu anki zamana en yakın lyrics satırını bul
    let left = 0
    let right = lyrics.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const line = lyrics[mid]

      if (line.time === currentTime) {
        return line
      }

      if (line.time < currentTime) {
        // Sonraki satır varsa ve sonraki satırın zamanı current time'dan büyükse
        // bu satır şu anki satırdır
        if (mid === lyrics.length - 1 || lyrics[mid + 1].time > currentTime) {
          return line
        }
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    // Eğer hiçbir satır bulunamazsa, ilk satırdan önceyiz demektir
    return lyrics[0]
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

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
    <div className="relative min-h-screen">
      {/* Şarkı Bilgisi */}
      {currentTrack && (
        <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4">
          <div className="container mx-auto flex items-center space-x-4">
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-16 h-16 rounded-md"
            />
            <div>
              <h2 className="font-semibold text-white">{currentTrack.name}</h2>
              <p className="text-gray-400">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sözler */}
      <div 
        ref={lyricsRef}
        className="container mx-auto pt-28 pb-8 px-4 h-full overflow-y-auto space-y-6 scrollbar-hide"
      >
        <AnimatePresence>
          {lyrics.map((line) => (
            <motion.div
              key={line.time}
              id={`line-${line.time}`}
              initial={{ opacity: 0.5 }}
              animate={{ 
                opacity: currentLine?.time === line.time ? 1 : 0.5
              }}
              transition={{ duration: 0.5 }}
              className={`text-center text-2xl transition-all ${
                currentLine?.time === line.time
                  ? 'text-white font-semibold scale-105'
                  : 'text-gray-500'
              }`}
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
} 