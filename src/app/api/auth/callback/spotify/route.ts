import { NextResponse } from 'next/server'
import SpotifyWebApi from 'spotify-web-api-node'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=${error}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=missing_code`
    )
  }

  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
    })

    const data = await spotifyApi.authorizationCodeGrant(code)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?access_token=${data.body.access_token}&refresh_token=${data.body.refresh_token}&expires_in=${data.body.expires_in}&state=${state}`
    )
  } catch (error) {
    console.error('Error getting Spotify tokens:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=token_error`
    )
  }
} 