# Music Metadata Alternatives (Spotify Unavailable)

## Issue: Spotify API Outage

- Status: Currently unavailable per [status.spotify.dev](https://status.spotify.dev)
- Impact: Cannot use Spotify for rich music metadata (artist bios, cover art, related artists)

## Alternative APIs for Music Integration

### 1. MusicBrainz API (Primary Recommendation)

- **URL**: [musicbrainz.org](https://musicbrainz.org/)
- **API Docs**: [musicbrainz.org/doc/Developer_Resources](https://musicbrainz.org/doc/Developer_Resources)
- **Features**: Artist info, albums, tracks, relationships, cover art via Cover Art Archive
- **Rate Limiting**: Very generous (>1k requests/sec), no auth required
- **Data Quality**: Community-driven, very comprehensive
- **Pros**: Free, no auth, rich metadata, established (since 2000s)
- **Cons**: API responses can be complex, no direct streaming

### 2. Discogs API

- **URL**: [discogs.com/developers](https://www.discogs.com/developers)
- **Features**: Vinyl/CD catalog, artist/releases data, marketplace prices
- **Auth**: Personal access tokens required
- **Rate Limiting**: 60 requests/minute (personal), higher with commercial
- **Pros**: Great for physical media, user-generated content
- **Cons**: Focus on releases, not streaming; requires token setup

### 3. Last.fm API

- **URL**: [www.last.fm/api](https://www.last.fm/api)
- **Features**: Artist profiles, top tracks, similar artists, user stats
- **Auth**: Free API key
- **Rate Limiting**: Reasonable for personal use
- **Pros**: Artist-centric, easy to integrate
- **Cons**: Heavier social focus, limited album/track depth

### 4. iTunes API (Search)

- **URL**: [affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/)
- **Features**: Artist/album/search results, cover art
- **No Auth**: Public endpoint
- **Rate Limiting**: Fairly generous, no formal limits
- **Pros**: Apple ecosystem integration, quality cover art
- **Cons**: Apple-related content only

## Recommended Plan

1. **Immediate**: Switch to MusicBrainz for core metadata
2. **Fallbacks**: Combine with Last.fm for artist bios/profiles
3. **Cache Implement**: Redis caching to reduce API calls
4. **Error Handling**: Graceful fallback if APIs fail

## Implementation Steps

- Update `overseerrV2/src/components/MusicSearch/index.tsx` to use MusicBrainz
- Add MusicBrainz client library (`npm install musicbrainz-api`)
- Test search results: artist → albums → tracks
- Ensure UI matches existing movie/TV search aesthetics
