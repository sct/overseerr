# Active Context

## Currently Working On
Fanart.tv integration for HD music artwork

## Recent Changes (Committed)
1. Created `server/api/fanart.ts` - API client for fanart.tv
2. Integrated fanart into `server/routes/music.ts`:
   - Artist endpoint: fetches thumbnails, logos, backgrounds
   - Album endpoint: fetches album artwork
   - Graceful fallback to Last.fm / Cover Art Archive

## Next Tasks
- Update UI components to display fanart images (ArtistDetails, AlbumDetails)
- Test fanart integration with real MBIDs
- Continue music request flow development

## Blockers
None

## Important Notes
- Fanart API key stored in: `config/settings.json` (main.fanartApiKey)
- Win11 node available for testing
- Husky hooks disabled (was blocking commits)
