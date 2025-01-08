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
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-16">
            <Image
              src={currentTrack.item.album.images[0]?.url || '/placeholder.png'}
              alt={currentTrack.item.name}
              fill
              className="object-cover rounded-md"
            />
          </div>
          <div>
            <h3 className="font-semibold">{currentTrack.item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {currentTrack.item.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleShuffle}
              className={`p-2 rounded-full ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Shuffle size={20} />
            </button>
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full hover:bg-accent"
            >
              <SkipBack size={24} />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-accent"
            >
              <SkipForward size={24} />
            </button>
            <button
              onClick={handleRepeat}
              className={`p-2 rounded-full ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Repeat size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {formatTime(progress)}
            </span>
            <input
              type="range"
              min={0}
              max={duration}
              value={progress}
              onChange={handleSeek}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Volume2 size={20} className="text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            className="w-24"
          />
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