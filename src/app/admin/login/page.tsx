'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log('Giriş denemesi:', email) // Debug log
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Giriş başarılı:', userCredential.user.email) // Debug log

      // Firebase token'ı cookie'ye kaydet
      const idToken = await userCredential.user.getIdToken()
      document.cookie = `auth_token=${idToken}; path=/;`

      // Admin kontrolü
      if (userCredential.user.email?.endsWith('@admin.com')) {
        console.log('Admin girişi onaylandı') // Debug log
        router.push('/admin/lyrics')
      } else {
        console.log('Admin değil:', userCredential.user.email) // Debug log
        await auth.signOut()
        setError('Bu hesap admin yetkisine sahip değil.')
      }
    } catch (error) {
      console.error('Login error:', error) // Detaylı hata logu
      
      // Firebase hata mesajlarını Türkçeleştir
      if (error instanceof Error) {
        switch (error.message) {
          case 'Firebase: Error (auth/invalid-email).':
            setError('Geçersiz email adresi.')
            break
          case 'Firebase: Error (auth/user-not-found).':
            setError('Kullanıcı bulunamadı.')
            break
          case 'Firebase: Error (auth/wrong-password).':
            setError('Hatalı şifre.')
            break
          default:
            setError('Giriş başarısız. ' + error.message)
        }
      } else {
        setError('Beklenmeyen bir hata oluştu.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Girişi</h1>

        {error && (
          <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
} 