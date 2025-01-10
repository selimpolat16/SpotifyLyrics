'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSpotify } from '@/hooks/useSpotify'
import * as spotifyApi from '@/services/spotify'
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat } from 'lucide-react'

interface PlayerProps {
  onTrackChange?: () => void
}

interface TrackInfo {
  name: string
  artists: { name: string }[]
  album: {
    images: { url: string }[]
  }
  duration_ms: number
}

interface CurrentTrack {
  is_playing: boolean
  progress_ms: number
  item: TrackInfo
  device: {
    is_private_session: boolean
    is_restricted: boolean
    type: string
  }
}

export default function Player({ onTrackChange }: PlayerProps) {
  const { accessToken } = useSpotify()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null)
  const [volume, setVolume] = useState(50)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'off' | 'track' | 'context'>('off')
  const [isPremium, setIsPremium] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const checkPremium = async () => {
      try {
        const profile = await spotifyApi.getCurrentUserProfile()
        setIsPremium(profile.product === 'premium')
      } catch (error) {
        console.error('Error checking premium status:', error)
        setIsPremium(false)
      }
    }

    checkPremium()
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return

    const fetchCurrentTrack = async () => {
      try {
        const track = await spotifyApi.getCurrentTrack()
        if (track && track.item && 'album' in track.item) {
          setCurrentTrack(track as CurrentTrack)
          setIsPlaying(track.is_playing || false)
          setProgress(track.progress_ms || 0)
          setDuration(track.item.duration_ms || 0)
          setError(null)
        }
      } catch (error) {
        console.error('Error fetching current track:', error)
        setError('Şarkı bilgileri alınamadı')
      }
    }

    fetchCurrentTrack()
    const interval = setInterval(fetchCurrentTrack, 1000)

    return () => clearInterval(interval)
  }, [accessToken])

  const handlePlayPause = async () => {
    if (!isPremium) {
      setError('Bu özellik için Spotify Premium gereklidir')
      return
    }

    try {
      if (isPlaying) {
        await spotifyApi.pause()
      } else {
        await spotifyApi.play()
      }
      setIsPlaying(!isPlaying)
      setError(null)
    } catch (error) {
      console.error('Error toggling playback:', error)
      setError('Oynatma kontrolü başarısız oldu')
    }
  }

  const handlePrevious = async () => {
    if (!isPremium) {
      setError('Bu özellik için Spotify Premium gereklidir')
      return
    }

    try {
      await spotifyApi.previous()
      onTrackChange?.()
      setError(null)
    } catch (error) {
      console.error('Error skipping to previous:', error)
      setError('Önceki şarkıya geçilemedi')
    }
  }

  const handleNext = async () => {
    if (!isPremium) {
      setError('Bu özellik için Spotify Premium gereklidir')
      return
    }

    try {
      await spotifyApi.next()
      onTrackChange?.()
      setError(null)
    } catch (error) {
      console.error('Error skipping to next:', error)
      setError('Sonraki şarkıya geçilemedi')
    }
  }

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      setError('Bu özellik için Spotify Premium gereklidir')
      return
    }

    const position = parseInt(e.target.value)
    try {
      await spotifyApi.seek(position)
      setProgress(position)
      setError(null)
    } catch (error) {
      console.error('Error seeking:', error)
      setError('Şarkı konumu değiştirilemedi')
    }
  }

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      setError('Bu özellik için Spotify Premium gereklidir')
      return
    }

    const newVolume = parseInt(e.target.value)
    try {
      await spotifyApi.setVolume(newVolume)
      setVolume(newVolume)
      setError(null)
    } catch (error) {
      console.error('Error setting volume:', error)
      setError('Ses seviyesi değiştirilemedi')
    }
  }

  const handleShuffle = async () => {
    if (!isPremium) {
      setError('Bu özellik için Spotify Premium gereklidir')
      return
    }

    try {
      await spotifyApi.setShuffle(!shuffle)
      setShuffle(!shuffle)
      setError(null)
    } catch (error) {
      console.error('Error toggling shuffle:', error)
      setError('Karıştırma modu değiştirilemedi')
    }
  }

  const handleRepeat = async () => {
    if (!isPremium) {
      setError('Bu özellik için Spotify Premium gereklidir')
      return
    }

    const states: ('off' | 'track' | 'context')[] = ['off', 'track', 'context']
    const currentIndex = states.indexOf(repeat)
    const nextState = states[(currentIndex + 1) % states.length]
    try {
      await spotifyApi.setRepeat(nextState)
      setRepeat(nextState)
      setError(null)
    } catch (error) {
      console.error('Error setting repeat mode:', error)
      setError('Tekrar modu değiştirilemedi')
    }
  }

  if (!currentTrack?.item) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border">
      <div className="container mx-auto h-20 flex items-center justify-between px-4">
        {/* Track Info */}
        <div className="flex items-center space-x-4 w-1/4">
          <div className="relative w-14 h-14 rounded-md overflow-hidden">
            <Image
              src={currentTrack.item.album.images[0]?.url || '/placeholder.png'}
              alt={currentTrack.item.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate">{currentTrack.item.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.item.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center space-y-2 w-2/4">
          {error && (
            <div className="text-xs text-red-500 mb-1">{error}</div>
          )}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleShuffle}
              className={`p-2 rounded-full hover:text-white transition-colors ${
                shuffle ? 'text-primary' : 'text-muted-foreground'
              }`}
              title={isPremium ? 'Karıştır' : 'Premium gerekli'}
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full hover:text-white transition-colors text-muted-foreground"
              title={isPremium ? 'Önceki' : 'Premium gerekli'}
            >
              <SkipBack size={22} />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform"
              title={isPremium ? (isPlaying ? 'Duraklat' : 'Oynat') : 'Premium gerekli'}
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:text-white transition-colors text-muted-foreground"
              title={isPremium ? 'Sonraki' : 'Premium gerekli'}
            >
              <SkipForward size={22} />
            </button>
            <button
              onClick={handleRepeat}
              className={`p-2 rounded-full hover:text-white transition-colors ${
                repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'
              }`}
              title={isPremium ? 'Tekrarla' : 'Premium gerekli'}
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full flex items-center space-x-2 px-4">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(progress)}
            </span>
            <div className="relative flex-1 h-1 group">
              <input
                type="range"
                min={0}
                max={duration}
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title={isPremium ? undefined : 'Premium gerekli'}
              />
              <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-primary transition-colors"
                  style={{ width: `${(progress / duration) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 w-1/4 justify-end">
          <Volume2 size={20} className="text-muted-foreground" />
          <div className="relative w-24 h-1 group">
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title={isPremium ? undefined : 'Premium gerekli'}
            />
            <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-muted-foreground group-hover:bg-white transition-colors"
                style={{ width: `${volume}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
} 