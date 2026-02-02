# Music Integration Quick Start (MusicBrainz Team)

## Setup Music Search Tab
1. **Install API Client**:
   ```bash
   cd overseerrV2
   npm install musicbrainz-api
   ```

2. **Update Search Component**:
   ```typescript
   // src/components/MusicSearch/index.tsx
   import MusicBrainzApi from 'musicbrainz-api';

   const mbApi = new MusicBrainzApi({
     appName: 'Overseerr',
     appVersion: '2.0',
     appContactInfo: 'https://github.com/sct/overseerr'
   });

   // Use mbApi.searchArtist(), searchReleaseGroup(), searchRecording()
   ```

3. **Basic Search Implementation**:
   - Artist search: `mbApi.searchArtist({ query: searchTerm })`
   - Album search: `mbApi.searchReleaseGroup({ query: searchTerm })`
   - Track search: `mbApi.searchRecording({ query: searchTerm })`
   - Cover art: Query Cover Art Archive via MusicBrainz release MBID

4. **UI Structure Matching Movies**:
   - Use existing `SearchResult` component
   - Display artist name, album/release, track info
   - Add "Request" button next to each item
   - Include cover image placeholders

## Integrate with Existing Request Flow
1. **Create Music Request Entity**:
   - Similar to movie/TV request structure
   - Fields: artist, album, tracks, requestor, status, date

2. **Update API Routes**:
   - Add `POST /api/v1/request/music` endpoint
   - Validate music data against MusicBrainz
   - Queue to Lidarr and qBittorrent as planned

3. **Error Handling Team**:
   - Catch MusicBrainz API failures
   - Implement retry with exponential backoff
   - Fall back to basic search if metadata unavailable

## Testing Checklist
- [] MusicBrainz API connects success
- [] Artist search returns results with images
- [] Album/track requests create proper entities  
- [] Lidarr receives and enqueues downloads
- [] qBittorrent downloads music files
- [] User sees status updates on music requests
- [] No console errors in search UI