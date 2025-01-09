import { NextResponse } from 'next/server'
import SpotifyWebApi from 'spotify-web-api-node'
import { cookies } from 'next/headers'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/spotify`,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Spotify auth error:', error)
      return NextResponse.redirect(new URL('/admin/lyrics?error=spotify_auth_failed', request.url))
    }

    if (!code) {
      console.error('No code provided')
      return NextResponse.redirect(new URL('/admin/lyrics?error=no_code', request.url))
    }

    // Environment değişkenlerini kontrol et
    console.log('Environment variables:', {
      clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_APP_URL,
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    })

    // Token'ları al
    try {
      const data = await spotifyApi.authorizationCodeGrant(code)
      const { access_token, refresh_token, expires_in } = data.body

      // Admin sayfasına yönlendir
      const redirectUrl = new URL('/admin/lyrics/auth', request.url)
      redirectUrl.searchParams.set('access_token', access_token)
      redirectUrl.searchParams.set('refresh_token', refresh_token)
      redirectUrl.searchParams.set('expires_in', expires_in.toString())

      const response = NextResponse.redirect(redirectUrl)

      // Cookie'ye user ID'yi kaydet
      if (state && state !== 'anonymous') {
        response.cookies.set('spotify_user_id', state, {
          path: '/',
          maxAge: 30 * 24 * 60 * 60, // 30 gün
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        })
      }

      return response
    } catch (spotifyError: any) {
      console.error('Spotify API error:', {
        message: spotifyError.message,
        body: spotifyError.body,
        statusCode: spotifyError.statusCode,
      })
      throw spotifyError
    }
  } catch (error) {
    console.error('Spotify callback error:', error)
    return NextResponse.redirect(new URL('/admin/lyrics?error=callback_failed', request.url))
  }
} 