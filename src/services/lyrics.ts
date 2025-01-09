import { collection, doc, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SongLyrics, LyricLine } from '@/types/lyrics'

const LYRICS_COLLECTION = 'lyrics'

export async function getLyricsByTrackId(trackId: string): Promise<SongLyrics | null> {
  try {
    const docRef = doc(db, LYRICS_COLLECTION, trackId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as SongLyrics
    }

    return null
  } catch (error) {
    console.error('Error fetching lyrics:', error)
    return null
  }
}

export async function getLyricsByArtistAndTitle(artist: string, title: string): Promise<SongLyrics | null> {
  try {
    const q = query(
      collection(db, LYRICS_COLLECTION),
      where('artist', '==', artist),
      where('name', '==', title)
    )

    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as SongLyrics
    }

    return null
  } catch (error) {
    console.error('Error fetching lyrics by artist and title:', error)
    return null
  }
}

export async function saveLyrics(lyrics: SongLyrics): Promise<void> {
  try {
    const docRef = doc(db, LYRICS_COLLECTION, lyrics.id)
    await setDoc(docRef, {
      ...lyrics,
      updatedAt: Date.now()
    })
  } catch (error) {
    console.error('Error saving lyrics:', error)
    throw error
  }
}

export function findCurrentLyricLine(lyrics: LyricLine[], currentTime: number): LyricLine | null {
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