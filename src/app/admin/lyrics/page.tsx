'use client'

import { useState, useEffect } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import * as spotifyApi from '@/services/spotify'
import * as lyricsService from '@/services/lyrics'
import { Search, Plus, Save, Trash, LogOut } from 'lucide-react'
import type { SongLyrics, LyricLine } from '@/types/lyrics'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function LyricsAdmin() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const { accessToken } = useSpotify()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.TrackObjectFull | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Client tarafında render edilene kadar bekle
  if (!mounted) {
    return null
  }

  // Çıkış yap
  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Spotify'da şarkı ara
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
        // Mevcut sözleri yükle
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

  // Yeni boş satır ekle
  const addLine = () => {
    setLyrics([...lyrics, { time: 0, text: '' }])
  }

  // Satır güncelle
  const updateLine = (index: number, field: keyof LyricLine, value: string | number) => {
    const newLyrics = [...lyrics]
    newLyrics[index] = {
      ...newLyrics[index],
      [field]: field === 'time' ? parseInt(value as string) || 0 : value
    }
    setLyrics(newLyrics)
  }

  // Satır sil
  const removeLine = (index: number) => {
    setLyrics(lyrics.filter((_, i) => i !== index))
  }

  // Sözleri kaydet
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
        lyrics: lyrics.sort((a, b) => a.time - b.time), // Zamana göre sırala
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

  // Yükleniyor durumunda loading göster
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  // Giriş yapılmamışsa boş sayfa göster (middleware zaten login'e yönlendirecek)
  if (!isAuthenticated) {
    return null
  }

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
          <div>
            <h2 className="font-semibold">{currentTrack.name}</h2>
            <p className="text-muted-foreground">
              {currentTrack.artists.map(a => a.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Sözler Editörü */}
      {currentTrack && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Şarkı Sözleri</h3>
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
                <input
                  type="number"
                  value={line.time}
                  onChange={(e) => updateLine(index, 'time', e.target.value)}
                  placeholder="Zaman (ms)"
                  className="w-24 px-2 py-1 bg-card border border-border rounded-md"
                />
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