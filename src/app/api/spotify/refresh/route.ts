import { NextResponse } from 'next/server'
import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 })
    }

    spotifyApi.setRefreshToken(refreshToken)
    const data = await spotifyApi.refreshAccessToken()

    return NextResponse.json({
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 