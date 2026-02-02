# Music Feature Gap Analysis (to Match Movie/TV Quality)

## Current Implementation State
- Music tab exists with basic search UI
- Lidarr integration for download queuing
- qBittorrent workflow connection
- Spotify originally planned for metadata (currently unavailable)

## Movie/TV Request "Gold Standard" Features
From existing codebase:
- **Unified API**: TMDB integration with rich metadata
- **Availability Check**: "In Plex" status indicators  
- **Bulk Actions**: Select/approve multiple at once
- **Progress Tracking**: Download status updates
- **Keyboard Shortcuts**: `Ctrl+A` (approve), `Ctrl+D` (decline)
- **Audit Logs**: Admin visibility into request actions
- **Export**: CSV export of requests/filters
- **Rate Limiting**: API protection (600 req/min)
- **Error Boundaries**: Graceful error handling
- **Notifications**: User updates on request status
- **UI Consistency**: Responsive, mobile-friendly layouts

## Music Feature Parity Gaps

### HIGH PRIORITY (Ship Blockers)
1. **Rich Metadata**: No Spotify/media source integration → Switch to MusicBrainz
2. **Availability Status**: No "already downloaded" checks
3. **Error Handling**: No retry logic for Lidarr API failures
4. **Bulk Actions**: Missing select-all, bulk approve/decline
5. **Status Tracking**: No progress indicators for Lidarr downloads

### MEDIUM PRIORITY (Quality of Life)
6. **Keyboard Shortcuts**: `/` for search focus bugs
7. **Mobile UX**: Layout inconsistencies on small screens
8. **Request History**: No user view of past music requests
9. **Admin Tools**: Export music requests, audit logs integration

### LOW PRIORITY (Polish)
10. **Search Filters**: Year, genre, popularity filters
11. **Related Content**: "Similar artists" recommendations
12. **Batch Import**: CSV upload of music wantlists

## Technical Implementation Plan

### Phase 1: Core Metadata (Start Tomorrow)
- Install MusicBrainz API library (`musicbrainz-api`)
- Update `src/pages/music/search.tsx` to use MB instead of Spotify
- Implement artist/album/song metadata parsing
- Add basic availability checks (query Lidarr library)

### Phase 2: Request Flow (Week 1)
- Add webhook automation for auto-queuing to Lidarr
- Implement request status tracking (pending/processing/imported)
- Add error retry logic for API failures
- Integrate with existing notification system

### Phase 3: UX Polish (Week 2)  
- Add bulk actions UI (checkboxes, toolbar)
- Implement keyboard shortcuts
- Improve mobile responsive layouts
- Add progress indicators and status updates

### Phase 4: Adv Features (Week 3)
- Search filters (genre, year, rating)
- Related content suggestions
- CSV export/import capabilities
- Batch processing optimizations

## Success Criteria
- Music requests feel equally polished as movie/TV
- <5% failure rate for well-formed requests
- <2s search response times
- Mobile-responsive at all breakpoints
- Full audit trail for admin oversight