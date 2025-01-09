import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export function useAdminAuth() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Client tarafında olduğumuzu kontrol et
    if (typeof window === 'undefined') {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Admin rolünü kontrol et (örneğin custom claims veya email ile)
        if (user.email?.endsWith('@admin.com')) {
          setIsAuthenticated(true)
        } else {
          // Admin değilse çıkış yaptır
          auth.signOut()
          setIsAuthenticated(false)
          router.push('/admin/login')
        }
      } else {
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