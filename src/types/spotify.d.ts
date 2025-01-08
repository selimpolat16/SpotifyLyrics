declare namespace SpotifyApi {
  interface TrackObjectFull {
    album: AlbumObjectSimplified
    artists: ArtistObjectSimplified[]
    available_markets: string[]
    disc_number: number
    duration_ms: number
    explicit: boolean
    external_ids: ExternalIdObject
    external_urls: ExternalUrlObject
    href: string
    id: string
    is_playable: boolean
    linked_from?: TrackLinkObject
    restrictions?: TrackRestrictionObject
    name: string
    popularity: number
    preview_url: string | null
    track_number: number
    type: 'track'
    uri: string
    is_local: boolean
  }

  interface AlbumObjectSimplified {
    album_type: string
    total_tracks: number
    available_markets: string[]
    external_urls: ExternalUrlObject
    href: string
    id: string
    images: ImageObject[]
    name: string
    release_date: string
    release_date_precision: string
    restrictions?: AlbumRestrictionObject
    type: 'album'
    uri: string
  }

  interface ArtistObjectSimplified {
    external_urls: ExternalUrlObject
    href: string
    id: string
    name: string
    type: 'artist'
    uri: string
  }

  interface ExternalIdObject {
    isrc?: string
    ean?: string
    upc?: string
  }

  interface ExternalUrlObject {
    spotify: string
  }

  interface TrackLinkObject {
    external_urls: ExternalUrlObject
    href: string
    id: string
    type: 'track'
    uri: string
  }

  interface TrackRestrictionObject {
    reason: string
  }

  interface AlbumRestrictionObject {
    reason: string
  }

  interface ImageObject {
    url: string
    height: number | null
    width: number | null
  }
} 