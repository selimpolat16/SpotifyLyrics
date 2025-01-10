import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Cookies from 'js-cookie'

export function useAdminAuth() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Client tarafında olduğumuzu kontrol et
    if (typeof window === 'undefined') {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Yeni token al
          const token = await getIdToken(user, true)
          // Token'ı cookie'ye kaydet
          Cookies.set('auth_token', token, { expires: 7 })
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Token alma hatası:', error)
          setIsAuthenticated(false)
          router.push('/admin/login')
        }
      } else {
        // Cookie'yi temizle
        Cookies.remove('auth_token')
        setIsAuthenticated(false)
        router.push('/admin/login')
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  return {
    isAuthenticated: isAuthenticated === null ? false : isAuthenticated,
    isLoading: isAuthenticated === null ? true : isLoading
  }
} 