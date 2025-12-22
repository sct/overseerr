# Multi-Plex Server Support Implementation

This document describes the implementation of multi-Plex server support in Overseerr. The changes allow users to connect multiple Plex servers, with media availability checked across all servers and user access granted if they have access to ANY configured server.

## Architecture Overview

### Design Decisions

1. **Access Model**: Users are granted access if they have access to ANY configured Plex server (not all)
2. **Availability Tracking**: Media is shown as "available" if it exists on ANY server (merged availability)
3. **Configuration Pattern**: Follows the existing Radarr/Sonarr multi-instance pattern

### Data Flow

```
┌─────────────────────┐     ┌──────────────────────┐
│   Settings Layer    │────▶│  PlexSettings[]      │
│   (settings.json)   │     │  (id, name, ip, etc) │
└─────────────────────┘     └──────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌───────────┐     ┌───────────┐     ┌───────────┐
            │ PlexAPI   │     │ PlexAPI   │     │ PlexAPI   │
            │ Server 1  │     │ Server 2  │     │ Server N  │
            └───────────┘     └───────────┘     └───────────┘
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                            ┌─────────────────┐
                            │  PlexScanner /  │
                            │AvailabilitySync │
                            └─────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │  Media Entity   │
                            │ (merged status) │
                            └─────────────────┘
```

## Files Changed

### Backend

| File                                                   | Change Type | Description                                                       |
| ------------------------------------------------------ | ----------- | ----------------------------------------------------------------- |
| `server/lib/settings.ts`                               | Modified    | Changed `plex` from single object to array, added migration logic |
| `server/entity/MediaPlexServer.ts`                     | New         | Entity for per-server rating key tracking                         |
| `server/entity/Media.ts`                               | Modified    | Added relation to MediaPlexServer, updated setPlexUrls()          |
| `server/migration/1750000000000-AddMediaPlexServer.ts` | New         | Database migration for new table                                  |
| `server/api/plexapi.ts`                                | Modified    | Made plexSettings required, updated syncLibraries()               |
| `server/api/plextv.ts`                                 | Modified    | Updated checkUserAccess() for multi-server                        |
| `server/routes/settings/plex.ts`                       | New         | CRUD routes for Plex servers                                      |
| `server/routes/settings/index.ts`                      | Modified    | Mounted new plex routes, removed old single-server routes         |
| `server/lib/scanners/plex/index.ts`                    | Modified    | Iterates all servers, tracks per-server status                    |
| `server/lib/availabilitySync.ts`                       | Modified    | Checks all servers for availability                               |

### Frontend

| File                                              | Change Type | Description                                      |
| ------------------------------------------------- | ----------- | ------------------------------------------------ |
| `src/components/Settings/SettingsPlexServers.tsx` | New         | Server list component with CRUD UI               |
| `src/components/Settings/PlexServerModal.tsx`     | New         | Modal for adding/editing servers                 |
| `src/components/Settings/SettingsPlex.tsx`        | Modified    | Uses new components, updated scan status display |

## Detailed Implementation

### 1. Settings Model Changes

**File: `server/lib/settings.ts`**

The `PlexSettings` interface now includes an `id` field:

```typescript
export interface PlexSettings {
  id: number; // NEW - unique identifier for each server
  name: string;
  machineId?: string;
  ip: string;
  port: number;
  useSsl?: boolean;
  libraries: Library[];
  webAppUrl?: string;
}
```

The `AllSettings` interface changed from single object to array:

```typescript
interface AllSettings {
  // ... other fields
  plex: PlexSettings[]; // Changed from PlexSettings
  // ...
}
```

**Migration Logic**: On startup, if `settings.plex` is an object (old format), it's automatically converted to an array with `id: 0`.

### 2. MediaPlexServer Entity

**File: `server/entity/MediaPlexServer.ts`**

New entity to track which server has which content:

```typescript
@Entity()
class MediaPlexServer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Media, (media) => media.plexServers, { onDelete: 'CASCADE' })
  media: Media;

  @Column()
  @Index()
  plexServerId: number; // References PlexSettings.id

  @Column({ nullable: true, type: 'varchar' })
  ratingKey?: string | null;

  @Column({ nullable: true, type: 'varchar' })
  ratingKey4k?: string | null;
}
```

### 3. PlexAPI Changes

**File: `server/api/plexapi.ts`**

The constructor now **requires** explicit server configuration:

```typescript
constructor({
  plexToken,
  plexSettings,  // NOW REQUIRED
  timeout,
}: {
  plexToken?: string;
  plexSettings: PlexSettings;  // Not optional anymore
  timeout?: number;
})
```

The `syncLibraries()` method now returns libraries instead of modifying global state:

```typescript
public async syncLibraries(): Promise<Library[]> {
  // Returns array of libraries for the caller to handle
}
```

### 4. Multi-Server Authentication

**File: `server/api/plextv.ts`**

The `checkUserAccess()` method checks if user has access to ANY configured server:

```typescript
public async checkUserAccess(userId: number): Promise<boolean> {
  const plexServers = settings.plex;

  for (const plexServer of plexServers) {
    const hasAccess = user.Server?.some(
      (server) => server.$.machineIdentifier === plexServer.machineId
    );
    if (hasAccess) return true;  // Access to ANY server = allowed
  }
  return false;
}
```

### 5. Plex Server CRUD Routes

**File: `server/routes/settings/plex.ts`**

New REST API endpoints:

| Method | Endpoint                                               | Description          |
| ------ | ------------------------------------------------------ | -------------------- |
| GET    | `/api/v1/settings/plex`                                | List all servers     |
| POST   | `/api/v1/settings/plex`                                | Add new server       |
| POST   | `/api/v1/settings/plex/test`                           | Test connection      |
| GET    | `/api/v1/settings/plex/{plexId}`                       | Get single server    |
| PUT    | `/api/v1/settings/plex/{plexId}`                       | Update server        |
| DELETE | `/api/v1/settings/plex/{plexId}`                       | Delete server        |
| GET    | `/api/v1/settings/plex/{plexId}/libraries`             | Get server libraries |
| POST   | `/api/v1/settings/plex/{plexId}/libraries/sync`        | Sync libraries       |
| PUT    | `/api/v1/settings/plex/{plexId}/libraries/{libraryId}` | Toggle library       |
| GET    | `/api/v1/settings/plex/sync`                           | Get scan status      |
| POST   | `/api/v1/settings/plex/sync`                           | Start/cancel scan    |
| GET    | `/api/v1/settings/plex/devices/servers`                | Fetch from plex.tv   |

### 6. PlexScanner Updates

**File: `server/lib/scanners/plex/index.ts`**

The scanner now iterates over all configured servers:

```typescript
public async run(): Promise<void> {
  const plexServers = settings.plex;

  for (const plexServer of plexServers) {
    this.currentServer = plexServer;
    this.plexClient = new PlexAPI({
      plexToken: admin.plexToken,
      plexSettings: plexServer,
    });

    this.libraries = plexServer.libraries.filter((lib) => lib.enabled);

    // Scan each library on this server
    for (const library of this.libraries) {
      // ... scanning logic
    }
  }
}
```

Status now includes current server:

```typescript
type SyncStatus = StatusBase & {
  currentLibrary: Library;
  libraries: Library[];
  currentServer?: PlexSettings; // NEW
};
```

### 7. AvailabilitySync Updates

**File: `server/lib/availabilitySync.ts`**

Initializes clients for all servers:

```typescript
async run() {
  for (const plexServer of this.plexServers) {
    this.plexClients.push(
      new PlexAPI({
        plexToken: admin.plexToken,
        plexSettings: plexServer,
      })
    );
  }
}
```

Checks all servers for availability:

```typescript
private async mediaExistsInPlex(media: Media, is4k: boolean) {
  for (const plexClient of this.plexClients) {
    // Check each server
    if (plexMedia) {
      existsInPlex = true;
      break;  // Found on this server, no need to check others
    }
  }
}
```

### 8. Frontend Components

**SettingsPlexServers Component**

- Displays all servers as cards
- Each card shows: name, address, SSL badge, enabled libraries count
- Expandable library list with toggle switches
- Sync button per server
- Edit/Delete buttons

**PlexServerModal Component**

- Server preset dropdown (fetches available servers from plex.tv)
- Manual hostname/port/SSL configuration
- Server name field
- Web App URL field
- Test connection button

## Database Migration

The migration (`1750000000000-AddMediaPlexServer.ts`):

1. Creates `media_plex_server` table
2. Creates index on `plexServerId`
3. Migrates existing `ratingKey`/`ratingKey4k` from Media table with `plexServerId = 0`

```sql
CREATE TABLE "media_plex_server" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "plexServerId" integer NOT NULL,
  "ratingKey" varchar,
  "ratingKey4k" varchar,
  "mediaId" integer,
  FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE
);

CREATE INDEX "IDX_media_plex_server_plexServerId" ON "media_plex_server" ("plexServerId");
```

## Backwards Compatibility

1. **Settings Migration**: Old single-server `plex` object is automatically converted to array on startup
2. **Database Migration**: Existing rating keys are migrated to new table with `plexServerId = 0`
3. **Legacy Columns**: `ratingKey`/`ratingKey4k` columns on Media entity are preserved for backwards compatibility
4. **URL Generation**: Uses first configured server's machineId for Plex URLs

## Testing Considerations

1. **Empty State**: Test with no Plex servers configured
2. **Single Server**: Test backwards compatibility with migrated single server
3. **Multiple Servers**: Test with 2+ servers, including overlapping content
4. **User Access**: Test user login with access to different servers
5. **Scanning**: Test full/recent scans across multiple servers
6. **Availability**: Test media showing as available when on any server

## Critical Issue: Multi-Owner Authentication

### The Problem

The original implementation assumed all Plex servers are owned by the same Plex account (the Overseerr admin). This is **incorrect** for the multi-server use case where different servers are owned by different Plex accounts (to bypass the 100-user limit).

**How Plex Auth Currently Works:**

```
1. User logs in via Plex OAuth → gets their authToken
2. Overseerr uses Admin (user id=1) plexToken to call Plex.tv/api/users
3. /api/users returns ONLY users the Admin has shared THEIR servers with
4. User is checked against this list
```

**The Flaw:**

`/api/users` only returns users that the **token owner** has shared access with. If:

- Server A is owned by Admin A (Overseerr admin, user id=1)
- Server B is owned by Admin B (different Plex account)

Users shared on Server B will **NOT appear** in Admin A's `/api/users` response, so they cannot log in.

### Required Changes

#### 1. Update PlexSettings Interface

Add `authToken` to each server configuration:

```typescript
export interface PlexSettings {
  id: number;
  name: string;
  machineId?: string;
  ip: string;
  port: number;
  useSsl?: boolean;
  libraries: Library[];
  webAppUrl?: string;
  authToken?: string; // NEW: Server owner's Plex token
}
```

#### 2. Update Server Configuration UI

`PlexServerModal.tsx` must:

1. Prompt for the server owner's Plex token (or allow OAuth login for that specific server)
2. Store the token in `PlexSettings.authToken`
3. Use this token when testing connection and syncing libraries

#### 3. Update `checkUserAccess` Method

`server/api/plextv.ts` - check each server using ITS owner's token:

```typescript
public static async checkUserAccessAnyServer(userId: number): Promise<boolean> {
  const settings = getSettings();

  for (const plexServer of settings.plex) {
    if (!plexServer.authToken || !plexServer.machineId) {
      continue;
    }

    // Use THIS server's owner token
    const plexTv = new PlexTvAPI(plexServer.authToken);

    try {
      const usersResponse = await plexTv.getUsers();
      const user = usersResponse.MediaContainer.User.find(
        (u) => parseInt(u.$.id) === userId
      );

      if (user) {
        const hasAccess = user.Server?.some(
          (server) => server.$.machineIdentifier === plexServer.machineId
        );
        if (hasAccess) {
          return true;
        }
      }
    } catch (e) {
      logger.warn(`Failed to check access for server ${plexServer.name}`, {
        errorMessage: e.message,
      });
    }
  }

  return false;
}
```

#### 4. Update Auth Routes

`server/routes/auth.ts` - use new method:

```typescript
// Replace:
const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');
if (await mainPlexTv.checkUserAccess(account.id))

// With:
if (await PlexTvAPI.checkUserAccessAnyServer(account.id))
```

#### 5. Update PlexAPI Instantiation

For scanning and availability, use server-specific token:

```typescript
// In PlexScanner.run():
for (const plexServer of settings.plex) {
  const token = plexServer.authToken || admin.plexToken; // Fallback for migration
  this.plexClient = new PlexAPI({
    plexToken: token,
    plexSettings: plexServer,
  });
}
```

### Migration Path

For existing single-server installations:

1. On upgrade, copy `admin.plexToken` to `settings.plex[0].authToken`
2. UI should prompt to configure tokens for additional servers
3. Provide clear documentation that each server needs its owner's token

### Security Considerations

1. **Token Storage**: Server tokens are stored in `settings.json` (same as current admin token)
2. **Token Permissions**: Each token only needs access to its own server
3. **Token Refresh**: May need to implement token refresh per-server

## Known Limitations

1. **Per-Server Rating Keys**: While `MediaPlexServer` entity exists, the full implementation for per-server deep links is not complete - currently uses first server's rating key
2. **Library Names**: Libraries with the same name on different servers may cause confusion in UI
3. **Scan Performance**: Scanning many servers sequentially may take longer than single server
4. **Per-Server Auth Tokens**: **NOT YET IMPLEMENTED** - Required for multi-owner server support (see above)

## Future Enhancements

1. Implement full per-server deep links using `MediaPlexServer` entity
2. Add server health monitoring/status indicators
3. Add per-server scan scheduling
4. Add server priority ordering for deep link generation
5. **Implement per-server auth tokens for multi-owner support** (critical for 100-user limit bypass)
