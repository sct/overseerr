# Project: Overseerr V2 - Music Features + Fanart.tv

## What We're Building
Extended Overseerr to support **music search and requests** (like movies/TV), using:
- MusicBrainz for metadata
- Fanart.tv for HD artwork (since Spotify API closed)
- Lidarr for downloading

## Key Components
- Backend: `server/routes/music.ts` - API endpoints
- Frontend: Album/Artist details, request modals
- Artwork: Fanart.tv integration (new)

## Current Status
Fanart.tv API client created and integrated into music routes (committed).
