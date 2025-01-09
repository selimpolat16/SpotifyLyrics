'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import * as spotifyApi from '@/services/spotify'
import * as lyricsService from '@/services/lyrics'
import { Search, Plus, Save, Trash, LogOut, Play, Pause, Clock } from 'lucide-react'
import type { SongLyrics, LyricLine } from '@/types/lyrics'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function LyricsAdmin() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const { accessToken, refreshToken, isLoading: spotifyLoading, login: spotifyLogin } = useSpotify()
  
  // State tanımlamaları
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.TrackObjectFull | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [playbackState, setPlaybackState] = useState<SpotifyApi.CurrentPlaybackResponse | null>(null)

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Playback durumunu güncelle
  useEffect(() => {
    if (!isCapturing || !currentTrack) return

    const updatePlayback = async () => {
      try {
        const state = await spotifyApi.getPlaybackState()
        if (state) {
          setPlaybackState(state)
        }
      } catch (error) {
        console.error('Playback state error:', error)
      }
    }

    updatePlayback()
    const interval = setInterval(updatePlayback, 500)
    return () => clearInterval(interval)
  }, [isCapturing, currentTrack])

  // Klavye kısayolunu dinle
  useEffect(() => {
    if (!isCapturing || !playbackState?.is_playing) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && playbackState.progress_ms !== undefined) {
        e.preventDefault()
        const currentTime = playbackState.progress_ms
        
        setLyrics(prevLyrics => {
          if (prevLyrics.length === 0 || prevLyrics[prevLyrics.length - 1].text !== '') {
            return [...prevLyrics, { time: currentTime, text: '' }] as LyricLine[]
          } else {
            const newLyrics = [...prevLyrics]
            if (newLyrics[newLyrics.length - 1]) {
              newLyrics[newLyrics.length - 1].time = currentTime
            }
            return newLyrics
          }
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isCapturing, playbackState])

  // Handler fonksiyonları
  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const searchTrack = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Şarkı arama başarısız')
      }

      if (data.tracks.items.length > 0) {
        setCurrentTrack(data.tracks.items[0])
        const existingLyrics = await lyricsService.getLyricsByTrackId(data.tracks.items[0].id)
        if (existingLyrics) {
          setLyrics(existingLyrics.lyrics)
        } else {
          setLyrics([])
        }
      } else {
        setError('Şarkı bulunamadı')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Şarkı arama sırasında bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCapture = async () => {
    if (!currentTrack) return

    try {
      if (!isCapturing) {
        console.log('Şarkı başlatılıyor...', {
          trackUri: currentTrack.uri,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken
        })

        // Şarkıyı çal
        await spotifyApi.play({ uris: [currentTrack.uri] })
      } else {
        await spotifyApi.pause()
      }
      setIsCapturing(!isCapturing)
    } catch (error: any) {
      console.error('Playback control error:', error)
      
      if (error.message === 'NO_ACTIVE_DEVICE') {
        setError('Aktif bir Spotify cihazı bulunamadı. Lütfen Spotify uygulamasını açın ve bir şarkı çalmaya başlayın.')
      } else if (error.message === 'PREMIUM_REQUIRED') {
        setError('Bu özellik sadece Spotify Premium üyeleri için kullanılabilir.')
      } else if (error.message?.includes('The access token expired')) {
        setError('Oturum süresi doldu. Lütfen sayfayı yenileyin.')
      } else if (error.message?.includes('Player command failed')) {
        setError('Şarkı çalma hatası. Lütfen Spotify uygulamasını yeniden başlatın ve tekrar deneyin.')
      } else {
        setError('Şarkı kontrolü sırasında bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
      }
    }
  }

  const addLine = () => {
    setLyrics(prev => [...prev, { time: 0, text: '' }])
  }

  const updateLine = (index: number, field: keyof LyricLine, value: string | number) => {
    setLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = {
        ...newLyrics[index],
        [field]: field === 'time' ? parseInt(value as string) || 0 : value
      }
      return newLyrics
    })
  }

  const removeLine = (index: number) => {
    setLyrics(prev => prev.filter((_, i) => i !== index))
  }

  const saveLyrics = async () => {
    if (!currentTrack) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const songLyrics: SongLyrics = {
        id: currentTrack.id,
        name: currentTrack.name,
        artist: currentTrack.artists[0].name,
        lyrics: lyrics.sort((a, b) => a.time - b.time),
        duration: currentTrack.duration_ms,
        addedAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      }

      await lyricsService.saveLyrics(songLyrics)
      setSuccess('Şarkı sözleri başarıyla kaydedildi')
    } catch (error) {
      console.error('Save error:', error)
      setError('Şarkı sözleri kaydedilirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Client tarafında render edilene kadar bekle
  if (typeof window === 'undefined') return null
  if (!mounted) return null

  // Yükleniyor durumunda loading göster
  if (authLoading || spotifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  // Giriş yapılmamışsa boş sayfa göster
  if (!isAuthenticated) return null

  // Spotify bağlantısı yoksa login sayfasını göster
  if (!accessToken || !refreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Spotify Bağlantısı Gerekli</h2>
          <p className="text-muted-foreground">
            Şarkı sözlerini yönetmek için Spotify hesabınıza bağlanmanız gerekiyor.
          </p>
          <button
            onClick={spotifyLogin}
            className="px-4 py-2 bg-[#1DB954] text-white rounded-md hover:bg-[#1DB954]/90"
          >
            Spotify ile Bağlan
          </button>
        </div>
      </div>
    )
  }

  // Ana render
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Şarkı Sözü Yönetimi</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md flex items-center space-x-2"
        >
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>

      {/* Arama */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchTrack()}
            placeholder="Şarkı adı veya sanatçı..."
            className="w-full px-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={searchTrack}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Hata ve Başarı Mesajları */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-primary/10 text-primary rounded-md">
          {success}
        </div>
      )}

      {/* Şarkı Bilgisi */}
      {currentTrack && (
        <div className="flex items-center space-x-4 p-4 bg-card rounded-md">
          <img
            src={currentTrack.album.images[0]?.url}
            alt={currentTrack.name}
            className="w-16 h-16 rounded-md"
          />
          <div className="flex-1">
            <h2 className="font-semibold">{currentTrack.name}</h2>
            <p className="text-muted-foreground">
              {currentTrack.artists.map(a => a.name).join(', ')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleCapture}
              className={`p-2 rounded-md ${
                isCapturing 
                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
              title={isCapturing ? 'Zaman yakalamayı durdur' : 'Zaman yakalamayı başlat'}
            >
              {isCapturing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            {isCapturing && (
              <div className="text-sm text-muted-foreground">
                <Clock size={16} className="inline mr-1" />
                {playbackState?.progress_ms 
                  ? Math.floor(playbackState.progress_ms / 1000) + 's'
                  : '0s'
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sözler Editörü */}
      {currentTrack && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Şarkı Sözleri
              {isCapturing && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Boşluk tuşuna basarak zamanı yakalayın)
                </span>
              )}
            </h3>
            <button
              onClick={addLine}
              className="p-2 text-primary hover:bg-primary/10 rounded-md"
              title="Yeni satır ekle"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {lyrics.map((line, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-24 px-2 py-1 bg-card border border-border rounded-md text-sm">
                  {Math.floor(line.time / 1000)}s
                </div>
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => updateLine(index, 'text', e.target.value)}
                  placeholder="Şarkı sözü..."
                  className="flex-1 px-2 py-1 bg-card border border-border rounded-md"
                />
                <button
                  onClick={() => removeLine(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                  title="Satırı sil"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveLyrics}
              disabled={isLoading || lyrics.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save size={20} />
              <span>Kaydet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 