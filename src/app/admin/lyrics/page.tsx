'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import * as spotifyApi from '@/services/spotify'
import * as lyricsService from '@/services/lyrics'
import { Search, Plus, Save, Trash, LogOut, Play, Pause, Clock, Undo2, Redo2, GripVertical } from 'lucide-react'
import type { SongLyrics, LyricLine } from '@/types/lyrics'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useLyrics } from '@/hooks/useLyrics'

export default function LyricsAdmin() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const { accessToken, refreshToken, isLoading: spotifyLoading, login: spotifyLogin } = useSpotify()
  
  // State tanımlamaları
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.TrackObjectFull | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [playbackState, setPlaybackState] = useState<SpotifyApi.CurrentPlaybackResponse | null>(null)

  const {
    lyrics: lyricsState,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    setLyrics: setLyricsState,
    updateLyrics: updateLyricsState,
    addLine: addLineState,
    updateLine: updateLineState,
    removeLine: removeLineState,
    reorderLines,
    bulkAddLines,
    undo,
    redo,
    markAsChanged,
    markAsSaved,
  } = useLyrics()

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
        const currentTime = playbackState.progress_ms || 0
        
        // Redux state'i güncellemek için updateLineState kullanıyoruz
        const emptyLineIndex = lyricsState.findIndex(line => line.time === 0)
        if (emptyLineIndex !== -1) {
          const line = lyricsState[emptyLineIndex]
          updateLineState(emptyLineIndex, { ...line, time: currentTime })
          markAsChanged()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isCapturing, playbackState, lyricsState, updateLineState, markAsChanged])

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
          setLyricsState(existingLyrics.lyrics)
        } else {
          setLyricsState([])
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

  const addMultipleLines = () => {
    const newLines = Array(5).fill(null).map(() => ({ time: 0, text: '' }))
    bulkAddLines(newLines)
    markAsChanged()
  }

  // Handle paste event for bulk line addition
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text')
    if (!text) return

    const lines = text.split('\n').filter(line => line.trim())
    const newLines = lines.map(text => ({
      time: 0,
      text: text.trim(),
    }))

    bulkAddLines(newLines)
    markAsChanged()
  }, [bulkAddLines, markAsChanged])

  // Add paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (sourceIndex === targetIndex) return
    reorderLines(sourceIndex, targetIndex)
    markAsChanged()
  }

  // Save lyrics
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
        lyrics: [...lyricsState].sort((a, b) => a.time - b.time),
        duration: currentTrack.duration_ms,
        addedAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      }

      await lyricsService.saveLyrics(songLyrics)
      markAsSaved()
      setSuccess('Şarkı sözleri başarıyla kaydedildi')
    } catch (error) {
      console.error('Save error:', error)
      setError('Şarkı sözleri kaydedilirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Add single line
  const addLine = () => {
    addLineState({ time: 0, text: '' })
    markAsChanged()
  }

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
            onClick={() => spotifyLogin(true)}
            className="px-8 py-3 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/90 font-semibold text-lg"
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
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold">
                Şarkı Sözleri
                {isCapturing && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    (Boşluk tuşuna basarak zamanı yakalayın)
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-2 text-primary hover:bg-primary/10 rounded-md disabled:opacity-50"
                  title="Geri Al (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-2 text-primary hover:bg-primary/10 rounded-md disabled:opacity-50"
                  title="İleri Al (Ctrl+Shift+Z)"
                >
                  <Redo2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={addMultipleLines}
                className="p-2 text-primary hover:bg-primary/10 rounded-md flex items-center space-x-1"
                title="5 satır ekle"
              >
                <Plus size={20} />
                <span>5 Satır Ekle</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {lyricsState.map((line: LyricLine, index: number) => (
              <div
                key={`${line.time}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center space-x-2 group bg-card hover:bg-card/80 rounded-md p-1"
              >
                <div 
                  className="p-2 cursor-move text-muted-foreground hover:text-foreground"
                  title="Sürükle ve bırak"
                >
                  <GripVertical size={16} />
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={Math.floor(line.time / 1000)}
                    onChange={(e) => updateLineState(index, { ...line, time: parseInt(e.target.value) * 1000 })}
                    className="w-16 px-2 py-1 bg-card border border-border rounded-l-md text-sm"
                    min="0"
                    step="1"
                  />
                  <span className="px-2 py-1 bg-card border border-border rounded-r-md text-sm text-muted-foreground">
                    s
                  </span>
                </div>
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => updateLineState(index, { ...line, text: e.target.value })}
                  placeholder="Şarkı sözü..."
                  className="flex-1 px-2 py-1 bg-card border border-border rounded-md"
                />
                <button
                  onClick={() => removeLineState(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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
              disabled={isLoading || !hasUnsavedChanges}
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