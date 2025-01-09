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
        }
      } catch (error) {
        console.error('Error fetching current track:', error)
      }
    }

    fetchCurrentTrack()
    const interval = setInterval(fetchCurrentTrack, 1000)

    return () => clearInterval(interval)
  }, [accessToken])

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await spotifyApi.pause()
      } else {
        await spotifyApi.play()
      }
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error('Error toggling playback:', error)
    }
  }

  const handlePrevious = async () => {
    try {
      await spotifyApi.previous()
      onTrackChange?.()
    } catch (error) {
      console.error('Error skipping to previous:', error)
    }
  }

  const handleNext = async () => {
    try {
      await spotifyApi.next()
      onTrackChange?.()
    } catch (error) {
      console.error('Error skipping to next:', error)
    }
  }

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseInt(e.target.value)
    try {
      await spotifyApi.seek(position)
      setProgress(position)
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value)
    try {
      await spotifyApi.setVolume(newVolume)
      setVolume(newVolume)
    } catch (error) {
      console.error('Error setting volume:', error)
    }
  }

  const handleShuffle = async () => {
    try {
      await spotifyApi.setShuffle(!shuffle)
      setShuffle(!shuffle)
    } catch (error) {
      console.error('Error toggling shuffle:', error)
    }
  }

  const handleRepeat = async () => {
    const states: ('off' | 'track' | 'context')[] = ['off', 'track', 'context']
    const currentIndex = states.indexOf(repeat)
    const nextState = states[(currentIndex + 1) % states.length]
    try {
      await spotifyApi.setRepeat(nextState)
      setRepeat(nextState)
    } catch (error) {
      console.error('Error setting repeat mode:', error)
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
          <div className="flex items-center space-x-4">
            <button
              onClick={handleShuffle}
              className={`p-2 rounded-full hover:text-white transition-colors ${
                shuffle ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full hover:text-white transition-colors text-muted-foreground"
            >
              <SkipBack size={22} />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:text-white transition-colors text-muted-foreground"
            >
              <SkipForward size={22} />
            </button>
            <button
              onClick={handleRepeat}
              className={`p-2 rounded-full hover:text-white transition-colors ${
                repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'
              }`}
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