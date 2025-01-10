'use client'

import { useState, useEffect, useRef } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import * as spotifyApi from '@/services/spotify'
import * as lyricsService from '@/services/lyrics'
import { motion, AnimatePresence } from 'framer-motion'
import type { LyricLine } from '@/types/lyrics'
import { FastAverageColor } from 'fast-average-color'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { TextPlugin } from 'gsap/dist/TextPlugin'

// GSAP pluginlerini kaydet
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin)
}

// Framer Motion animasyon stilleri
const animationStyles = {
  fade: {
    initial: { opacity: 0 },
    animate: (isCurrentLine: boolean) => ({ 
      opacity: isCurrentLine ? 1 : 0.5
    }),
    transition: { 
      duration: 0.2
    }
  },
  slide: {
    initial: { opacity: 0, x: -10 },
    animate: (isCurrentLine: boolean) => ({ 
      opacity: isCurrentLine ? 1 : 0.5,
      x: 0
    }),
    transition: { 
      duration: 0.2
    }
  },
  pop: {
    initial: { opacity: 0 },
    animate: (isCurrentLine: boolean) => ({ 
      opacity: isCurrentLine ? 1 : 0.5
    }),
    transition: { 
      duration: 0.2
    }
  }
}

// GSAP ease değerleri
const gsapEase = {
  smooth: "power2.out"
}

// Font seçenekleri
const fontOptions = [
  { name: 'Default', value: 'font-sans' },
  { name: 'Serif', value: 'font-serif' },
  { name: 'Mono', value: 'font-mono' },
  { name: 'Cursive', value: 'font-dancing' },
]

// Şarkı özelliklerine göre stil seçimi
const getStylesFromTrackInfo = (trackName: string, artistName: string) => {
  const text = (trackName + ' ' + artistName).toLowerCase()
  
  // Dans/parti şarkıları için
  const danceKeywords = ['dance', 'party', 'club', 'disco', 'remix', 'dj']
  const energeticKeywords = ['rock', 'metal', 'punk', 'power', 'fast', 'beat']
  const happyKeywords = ['happy', 'joy', 'love', 'fun', 'smile', 'good']
  const sadKeywords = ['sad', 'alone', 'cry', 'tears', 'pain', 'heart']
  const instrumentalKeywords = ['instrumental', 'classic', 'piano', 'acoustic', 'ambient']

  // Dans veya enerjik şarkılar için pop animasyonu
  if (danceKeywords.some(keyword => text.includes(keyword)) || 
      energeticKeywords.some(keyword => text.includes(keyword))) {
    return {
      animation: 'pop' as const,
      font: fontOptions[0]
    }
  }

  // Mutlu şarkılar için cursive font ve slide animasyonu
  if (happyKeywords.some(keyword => text.includes(keyword))) {
    return {
      animation: 'slide' as const,
      font: fontOptions[3] // Cursive font
    }
  }

  // Hüzünlü şarkılar için serif font
  if (sadKeywords.some(keyword => text.includes(keyword))) {
    return {
      animation: 'fade' as const,
      font: fontOptions[1] // Serif font
    }
  }

  // Enstrümantal şarkılar için mono font
  if (instrumentalKeywords.some(keyword => text.includes(keyword))) {
    return {
      animation: 'fade' as const,
      font: fontOptions[2] // Mono font
    }
  }

  // Varsayılan stiller
  return {
    animation: 'fade' as const,
    font: fontOptions[0]
  }
}

// Client-side only component
const LyricsComponent = () => {
  const { accessToken, refreshAccessToken } = useSpotify()
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.TrackObjectFull | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentLine, setCurrentLine] = useState<LyricLine | null>(null)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('rgb(0, 0, 0)')
  const [showZoomedCover, setShowZoomedCover] = useState(false)
  const [selectedFont, setSelectedFont] = useState(fontOptions[0])
  const [selectedAnimation, setSelectedAnimation] = useState<keyof typeof animationStyles>('fade')
  const lyricsRef = useRef<HTMLDivElement>(null)
  const [fac, setFac] = useState<FastAverageColor | null>(null)

  // GSAP animasyonları için ref'ler
  const headerRef = useRef<HTMLDivElement>(null)
  const albumImageRef = useRef<HTMLImageElement>(null)
  const noLyricsRef = useRef<HTMLDivElement>(null)

  // Client-side mount kontrolü
  useEffect(() => {
    setIsMounted(true)
    const facInstance = new FastAverageColor()
    setFac(facInstance)
    return () => {
      facInstance.destroy()
      setIsMounted(false)
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
      } catch (error) {
        // Hata mesajını güvenli bir şekilde kontrol et
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
        
        // Token süresi dolduysa yenilemeyi dene
        if (errorMessage.includes('The access token expired')) {
          try {
            await refreshAccessToken()
          } catch (refreshError) {
            setError('Oturum süresi doldu. Lütfen sayfayı yenileyin.')
          }
        } else if (errorMessage.includes('No token provided')) {
          // Token henüz hazır değil, sessizce geç
          return
        } else {
          console.error('Playback state hatası:', {
            error,
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          })
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
        setLyrics([])
      }
    } catch (error) {
      setLyrics([])
    } finally {
      setIsLoading(false)
    }
  }

  // Mevcut zamanı takip et ve uygun lyrics satırını bul
  useEffect(() => {
    if (!lyrics.length) return

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

    const currentLine = findCurrentLine(lyrics, progress)
    if (currentLine && currentLine !== findCurrentLine(lyrics, progress - 1000)) {
      setCurrentLine(currentLine)

      // Otomatik kaydırma - sadece büyük zaman farklarında yap
      if (lyricsRef.current) {
        const lineElement = document.getElementById(`line-${currentLine.time}`)
        if (lineElement) {
          lineElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }
    }
  }, [progress, lyrics])

  // Şarkı değiştiğinde stilleri güncelle
  useEffect(() => {
    if (!currentTrack) return

    const styles = getStylesFromTrackInfo(
      currentTrack.name,
      currentTrack.artists.map(a => a.name).join(' ')
    )
    
    console.log('Stiller hesaplandı:', {
      trackName: currentTrack.name,
      artists: currentTrack.artists.map(a => a.name).join(', '),
      styles
    })

    setSelectedAnimation(styles.animation)
    setSelectedFont(styles.font)
  }, [currentTrack?.id, currentTrack?.name])

  // Albüm kapağından renk çıkar - sadece client-side'da çalışsın ve memoize et
  const albumImageUrl = currentTrack?.album.images[0]?.url
  useEffect(() => {
    if (!isMounted || !fac || !albumImageUrl) {
      console.log('Renk hesaplama başlatılamadı:', { isMounted, hasFac: !!fac, albumImageUrl })
      setBackgroundColor('rgb(0, 0, 0)')
      return
    }

    let isCurrentRequest = true

    const getColor = async () => {
      console.log('Renk hesaplama başlatıldı:', { albumImageUrl })
      
      try {
        // Proxy kullanmadan doğrudan resmi yükle
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        // Resmi yükle
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Resim yüklenemedi'))
          img.src = albumImageUrl
        })

        if (!isCurrentRequest) {
          console.log('İstek iptal edildi')
          return
        }

        // Renk hesapla
        const color = await fac.getColorAsync(img, {
          algorithm: 'dominant',
          defaultColor: [0, 0, 0, 255],
          crossOrigin: 'anonymous'
        })

        if (!isCurrentRequest) {
          console.log('İstek iptal edildi')
          return
        }

        // Rengi daha yumuşak hale getir
        const [r, g, b] = color.value
        setBackgroundColor(`rgba(${r}, ${g}, ${b}, 0.2)`)
        console.log('Arka plan rengi güncellendi:', { r, g, b })
      } catch (error) {
        console.error('Renk hesaplama hatası:', {
          error,
          message: error instanceof Error ? error.message : 'Bilinmeyen hata',
          albumImageUrl
        })

        if (isCurrentRequest) {
          setBackgroundColor('rgb(0, 0, 0)')
        }
      }
    }

    getColor()

    return () => {
      console.log('Renk hesaplama temizleniyor')
      isCurrentRequest = false
    }
  }, [albumImageUrl, fac, isMounted])

  // Tıklama işleyicisi
  const handleSeek = async (time: number) => {
    if (!accessToken) return

    try {
      await spotifyApi.seek(time)
    } catch (error) {
      console.error('Şarkı konumu değiştirilirken hata oluştu:', error)
    }
  }

  // GSAP animasyonlarını başlat
  useEffect(() => {
    if (!isMounted) return

    // Header animasyonu
    if (headerRef.current && albumImageRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.3,
          ease: gsapEase.smooth
        }
      )

      gsap.fromTo(albumImageRef.current,
        { scale: 0.9, opacity: 0 },
        { 
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: gsapEase.smooth
        }
      )
    }

    // Sözler yoksa animasyon
    if (noLyricsRef.current) {
      gsap.fromTo(noLyricsRef.current,
        { y: 20, opacity: 0 },
        { 
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: gsapEase.smooth
        }
      )
    }

  }, [isMounted, currentTrack?.id])

  // Şarkı değiştiğinde renk geçişi animasyonu
  useEffect(() => {
    if (!isMounted || !backgroundColor) return

    document.body.style.background = `linear-gradient(to bottom, ${backgroundColor}, rgba(0, 0, 0, 0.95))`

  }, [isMounted, backgroundColor])

  // Loading state for initial render
  if (!isMounted) {
    return null // Return null initially to prevent hydration mismatch
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center h-screen text-white/60 transition-colors duration-1000 ease-in-out"
        style={{ 
          background: `linear-gradient(to bottom, ${backgroundColor}, rgba(0, 0, 0, 0.95))`,
        }}
      >
        {error}
      </div>
    )
  }

  if (!lyrics.length) {
    return (
      <div 
        className="flex items-center justify-center h-screen text-white transition-colors duration-1000 ease-in-out"
        style={{ 
          background: `linear-gradient(to bottom, ${backgroundColor}, rgba(0, 0, 0, 0.95))`,
        }}
      >
        {currentTrack && (
          <div ref={noLyricsRef} className="text-center max-w-lg mx-auto p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                src={currentTrack.album.images[0]?.url}
                alt={currentTrack.name}
                className="w-64 h-64 rounded-lg shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowZoomedCover(true)}
              />
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{currentTrack.name}</h2>
                <p className="text-white/60">{currentTrack.artists.map(a => a.name).join(', ')}</p>
                <div className="backdrop-blur-lg bg-black/20 p-4 rounded-lg mt-4">
                  <p className="text-lg">Şarkı bulunamadı</p>
                  <p className="text-sm text-white/60 mt-2">Bu şarkı için henüz sözler eklenmemiş</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ 
        background: `linear-gradient(to bottom, ${backgroundColor}, rgba(0, 0, 0, 0.95))`
      }}
    >
      {/* Şarkı Bilgisi */}
      {currentTrack && (
        <div 
          className="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-lg border-b border-white/10 p-4 z-10"
        >
          <div className="container mx-auto flex items-center space-x-4">
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-16 h-16 rounded-lg shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowZoomedCover(true)}
            />
            <div>
              <h2 className="font-semibold text-white">
                {currentTrack.name}
              </h2>
              <p className="text-white/60">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sözler */}
      <div 
        className="fixed inset-0 top-24 bottom-0 overflow-y-auto scrollbar-hide"
      >
        <div 
          ref={lyricsRef}
          className="container mx-auto px-4 py-4"
        >
          <div className={`max-w-2xl mx-auto space-y-8 ${selectedFont.value}`}>
            {lyrics.map((line) => {
              const isCurrentLine = currentLine?.time === line.time
              
              return (
                <div
                  key={line.time}
                  id={`line-${line.time}`}
                  onClick={() => handleSeek(line.time)}
                  className={`text-center text-2xl transition-opacity duration-200 rounded-lg p-2 cursor-pointer hover:bg-white/5 ${
                    isCurrentLine
                      ? 'text-white font-semibold opacity-100'
                      : 'text-white/50 opacity-50'
                  }`}
                >
                  {line.text}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Client-side only export with loading state
const Lyrics = dynamic(() => Promise.resolve(LyricsComponent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black/90">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DB954]"></div>
    </div>
  )
})

export default Lyrics 