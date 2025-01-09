import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      console.error('Refresh token is missing')
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing client credentials:', { clientId: !!clientId, clientSecret: !!clientSecret })
      return NextResponse.json({ error: 'Missing Spotify client credentials' }, { status: 500 })
    }

    // Create the Authorization header
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
      console.log('Attempting to refresh token with Spotify...')
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token,
        }).toString(),
      })

      const data = await response.json()
      console.log('Spotify refresh token response:', { status: response.status, data })

      if (!response.ok) {
        console.error('Failed to refresh token:', data)
        return NextResponse.json(
          { error: 'Failed to refresh token', details: data.error_description || data.error },
          { status: response.status }
        )
      }

      if (!data.access_token) {
        console.error('No access token in response:', data)
        return NextResponse.json(
          { error: 'Invalid response from Spotify', details: 'No access token received' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } catch (spotifyError) {
      console.error('Spotify API error:', spotifyError)
      return NextResponse.json(
        { 
          error: 'Failed to refresh token',
          details: spotifyError instanceof Error ? spotifyError.message : String(spotifyError)
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 