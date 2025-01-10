'use client'

import { useState, useEffect, useRef } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import * as spotifyApi from '@/services/spotify'
import * as lyricsService from '@/services/lyrics'
import { motion, AnimatePresence } from 'framer-motion'
import type { LyricLine } from '@/types/lyrics'
import { FastAverageColor } from 'fast-average-color'
import dynamic from 'next/dynamic'

// Client-side only component
const Lyrics = () => {
  const { accessToken, refreshAccessToken } = useSpotify()
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.TrackObjectFull | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentLine, setCurrentLine] = useState<LyricLine | null>(null)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('rgb(0, 0, 0)')
  const lyricsRef = useRef<HTMLDivElement>(null)
  const [fac, setFac] = useState<FastAverageColor | null>(null)

  // Client-side mount kontrolü
  useEffect(() => {
    setIsMounted(true)
    setFac(new FastAverageColor())
    return () => {
      setIsMounted(false)
      fac?.destroy()
    }
  }, [])

  // Spotify API'yi initialize et
  useEffect(() => {
    if (accessToken && isMounted) {
      spotifyApi.initializeSpotify(accessToken)
    }
  }, [accessToken, isMounted])

  // Şu anki şarkıyı ve ilerlemeyi takip et
  useEffect(() => {
    if (!accessToken || !isMounted) return

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
        } else if (error.message?.includes('No token provided')) {
          // Token henüz hazır değil, sessizce geç
          return
        } else {
          setError('Şarkı bilgileri alınamadı')
        }
      }
    }

    // İlk çağrıyı biraz geciktir
    const timeout = setTimeout(() => {
      fetchCurrentTrack()
      // Sonraki çağrılar için interval başlat
      const interval = setInterval(fetchCurrentTrack, 1000)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [accessToken, currentTrack?.id, refreshAccessToken, isMounted])

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
    if (currentLine) {
      setCurrentLine(currentLine)

      // Otomatik kaydırma - sadece büyük zaman farklarında yap
      if (lyricsRef.current) {
        const lineElement = document.getElementById(`line-${currentLine.time}`)
        if (lineElement) {
          const container = lyricsRef.current
          const elementRect = lineElement.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          
          // Eğer element görünür alanda değilse veya çok kenardaysa kaydır
          if (elementRect.top < containerRect.top + 100 || 
              elementRect.bottom > containerRect.bottom - 100) {
            lineElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }
      }
    }
  }, [progress, lyrics])

  // Şu anki zamanla eşleşen satırı bul
  const findCurrentLine = (lyrics: LyricLine[], currentTime: number): LyricLine | null => {
    if (!lyrics.length) return null

    // Şu anki zamandan küçük veya eşit olan en son satırı bul
    let currentLine = lyrics[0]
    for (const line of lyrics) {
      if (line.time <= currentTime) {
        currentLine = line
      } else {
        break
      }
    }

    return currentLine
  }

  // Albüm kapağından renk çıkar
  useEffect(() => {
    if (currentTrack?.album.images[0]?.url) {
      fac?.getColorAsync(currentTrack.album.images[0].url, {
        algorithm: 'dominant',
        defaultColor: [0, 0, 0, 255],
      })
        .then((color: { value: [number, number, number, number] }) => {
          // Ana rengi daha canlı yapmak için saturasyonu artır
          const [r, g, b] = color.value;
          const [h, s, l] = rgbToHsl(r, g, b);
          const [newR, newG, newB] = hslToRgb(h, Math.min(s * 1.2, 1), Math.min(l * 1.1, 0.8));
          
          setBackgroundColor(`rgba(${newR}, ${newG}, ${newB}, 0.3)`)
        })
        .catch(() => {
          setBackgroundColor('rgb(0, 0, 0)')
        })
    }
  }, [currentTrack])

  // RGB'den HSL'ye dönüşüm
  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }

      h /= 6;
    }

    return [h, s, l];
  }

  // HSL'den RGB'ye dönüşüm
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // Tıklama işleyicisi
  const handleSeek = async (time: number) => {
    if (!accessToken) return

    try {
      await spotifyApi.seek(time)
    } catch (error) {
      console.error('Şarkı konumu değiştirilirken hata oluştu:', error)
    }
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DB954]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white/60">
        {error}
      </div>
    )
  }

  if (!lyrics.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white/60">
        Bu şarkı için sözler mevcut değil
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 transition-colors duration-1000 ease-in-out overflow-hidden"
      style={{ 
        background: `linear-gradient(to bottom, ${backgroundColor}, rgba(0, 0, 0, 0.95))`,
      }}
    >
      {/* Şarkı Bilgisi */}
      {currentTrack && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-lg border-b border-white/10 p-4 z-10"
        >
          <div className="container mx-auto flex items-center space-x-4">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-16 h-16 rounded-lg shadow-lg"
            />
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-semibold text-white"
              >
                {currentTrack.name}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/60"
              >
                {currentTrack.artists.map(a => a.name).join(', ')}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sözler */}
      <div 
        className="fixed inset-0 top-24 bottom-0 overflow-y-auto scrollbar-hide"
      >
        <div 
          ref={lyricsRef}
          className="container mx-auto px-4 py-4"
        >
          <div className="max-w-2xl mx-auto space-y-8">
            <AnimatePresence>
              {lyrics.map((line) => {
                const isCurrentLine = currentLine?.time === line.time
                return (
                  <motion.div
                    key={line.time}
                    id={`line-${line.time}`}
                    initial={{ opacity: 0.5, y: 20 }}
                    animate={{ 
                      opacity: isCurrentLine ? 1 : 0.5,
                      y: 0,
                      scale: isCurrentLine ? 1.05 : 1
                    }}
                    transition={{ 
                      duration: 0.5,
                      scale: {
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }
                    }}
                    onClick={() => handleSeek(line.time)}
                    className={`text-center text-2xl transition-all backdrop-blur-sm rounded-lg p-2 cursor-pointer hover:bg-white/5 ${
                      isCurrentLine
                        ? 'text-white font-semibold'
                        : 'text-white/50'
                    }`}
                  >
                    {line.text}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// Client-side only export
export default dynamic(() => Promise.resolve(Lyrics), {
  ssr: false
}) 