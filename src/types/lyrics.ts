export interface LyricLine {
  time: number // milliseconds
  text: string
}

export interface SongLyrics {
  id: string // spotify track id
  name: string // song name
  artist: string // artist name
  lyrics: LyricLine[]
  duration: number // total duration in milliseconds
  language?: string
  addedAt: number // timestamp
  updatedAt: number // timestamp
} 