# Skip Setup Feature

## Overview
You can now skip the initial setup process and go directly to the dashboard to test UI functionality and configure apps from the settings.

## How to Skip Setup

### Option 1: Use the "Skip Setup" Button
1. Navigate to `/setup` page
2. Click the **"Skip Setup"** button in the top-right corner
3. You'll be redirected to the dashboard
4. If not logged in, you'll be redirected to login first
5. After login, you can access all settings from the dashboard

### Option 2: Environment Variable
Set the `SKIP_SETUP` environment variable to `true`:
```bash
SKIP_SETUP=true yarn dev
```

This will bypass the setup redirect check entirely.

### Option 3: Query Parameter
Add `?skipSetup=true` to any URL to bypass setup checks:
```
http://localhost:5055/?skipSetup=true
```

## What Happens When You Skip Setup

1. **Initialization Flag**: The `initialized` flag in settings is set to `true`
2. **Redirect**: You're redirected to the dashboard (`/`)
3. **Login Required**: If you're not logged in, you'll be redirected to `/login`
4. **Dashboard Access**: After login, you can access:
   - Dashboard
   - All settings pages
   - Request management
   - User management
   - All other features

## Configuring from Dashboard

After skipping setup, you can configure everything from the Settings pages:

- **General Settings** (`/settings/main`): Application title, URL, locale, etc.
- **Plex Settings** (`/settings/plex`): Connect and configure Plex
- **Services** (`/settings/services`): Configure Radarr, Sonarr, etc.
- **Notifications** (`/settings/notifications`): Set up notification agents
- **API Keys** (`/settings/api-keys`): Manage API keys
- **Audit Log** (`/settings/audit`): View audit logs

## Technical Details

### Changes Made

1. **Setup Component** (`src/components/Setup/index.tsx`):
   - Added "Skip Setup" button
   - Added `skipSetup()` function that calls initialize endpoint

2. **App Initialization** (`src/pages/_app.tsx`):
   - Added check for `SKIP_SETUP` env var or `skipSetup` query param
   - Allows bypassing setup redirect when flag is set

3. **User Context** (`src/context/UserContext.tsx`):
   - Added check for `NEXT_PUBLIC_SKIP_SETUP` env var or query param
   - Allows bypassing login redirect when flag is set (for testing)

4. **Settings Route** (`server/routes/settings/index.ts`):
   - Made `/initialize` endpoint public (no auth required)
   - Allows skipping setup without being logged in

## Testing

To test UI functionality without going through setup:

1. Start the server: `yarn dev`
2. Navigate to `http://localhost:5055/setup`
3. Click "Skip Setup"
4. Login if prompted
5. Access dashboard and settings

## Notes

- Skipping setup sets `initialized = true` in settings
- You still need to log in to access most features
- All configuration can be done from the Settings pages
- The skip setup feature is primarily for development/testing
