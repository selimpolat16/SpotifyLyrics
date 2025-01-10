'use client'

import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Giriş başarılı:', userCredential.user.email)
      
      // Firebase token'ını al
      const token = await userCredential.user.getIdToken()
      
      // Token'ı cookie'ye kaydet (7 gün geçerli)
      Cookies.set('auth_token', token, { expires: 7 })
      
      // Yönlendirme yap
      router.push('/admin/lyrics')
      router.refresh()
    } catch (error: any) {
      console.error('Giriş hatası:', error.code, error.message)
      
      // Daha detaylı hata mesajları
      if (error.code === 'auth/invalid-credential') {
        setError('E-posta veya şifre hatalı')
      } else if (error.code === 'auth/invalid-email') {
        setError('Geçersiz e-posta adresi')
      } else if (error.code === 'auth/user-disabled') {
        setError('Bu hesap devre dışı bırakılmış')
      } else if (error.code === 'auth/user-not-found') {
        setError('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı')
      } else if (error.code === 'auth/wrong-password') {
        setError('Hatalı şifre')
      } else {
        setError('Giriş yapılırken bir hata oluştu: ' + error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Admin Girişi</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

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