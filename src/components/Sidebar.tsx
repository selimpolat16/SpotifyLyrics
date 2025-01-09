'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSpotify } from '@/hooks/useSpotify'
import * as spotifyApi from '@/services/spotify'
import { Home, Search, Library, LogOut, Music2 } from 'lucide-react'
import { useAuthContext } from '@/components/AuthProvider'

interface UserProfile {
  display_name: string | null
  images: { url: string }[]
}

export default function Sidebar() {
  const { accessToken } = useSpotify()
  const { logout } = useAuthContext()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const fetchUserProfile = async () => {
      try {
        const profile = await spotifyApi.getCurrentUserProfile()
        if (profile) {
          setUserProfile({
            display_name: profile.display_name || 'Spotify User',
            images: profile.images || [],
          })
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [accessToken])

  return (
    <aside className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col">
      {/* User Profile */}
      {userProfile && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={userProfile.images[0]?.url || '/placeholder-user.png'}
                alt={userProfile.display_name || 'User'}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{userProfile.display_name || 'User'}</h3>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-accent rounded-md"
              title="Çıkış Yap"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent text-foreground hover:text-accent-foreground transition-colors"
            >
              <Home size={20} />
              <span>Ana Sayfa</span>
            </Link>
          </li>
          <li>
            <Link
              href="/search"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent text-foreground hover:text-accent-foreground transition-colors"
            >
              <Search size={20} />
              <span>Ara</span>
            </Link>
          </li>
          <li>
            <Link
              href="/library"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent text-foreground hover:text-accent-foreground transition-colors"
            >
              <Library size={20} />
              <span>Kitaplık</span>
            </Link>
          </li>
        </ul>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground px-2 mb-4">ÇALMA LİSTELERİ</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/liked-songs"
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent text-foreground hover:text-accent-foreground transition-colors"
              >
                <Music2 size={20} />
                <span>Beğenilen Şarkılar</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  )
} 