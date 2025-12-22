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

| File                                                    | Change Type | Description                                                       |
| ------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `server/lib/settings.ts`                                | Modified    | Changed `plex` from single object to array, added migration logic |
| `server/entity/MediaPlexServer.ts`                      | New         | Entity for per-server rating key tracking                         |
| `server/entity/Media.ts`                                | Modified    | Added relation to MediaPlexServer, updated setPlexUrls()          |
| `server/migration/1750000000000-AddMediaPlexServer.ts`  | New         | Database migration for new table                                  |
| `server/api/plexapi.ts`                                 | Modified    | Made plexSettings required, updated syncLibraries()               |
| `server/api/plextv.ts`                                  | Modified    | Updated checkUserAccess() for multi-server                        |
| `server/routes/settings/plex.ts`                        | New         | CRUD routes for Plex servers                                      |
| `server/routes/settings/index.ts`                       | Modified    | Mounted new plex routes, removed old single-server routes         |
| `server/lib/scanners/plex/index.ts`                     | Modified    | Iterates all servers, tracks per-server status                    |
| `server/lib/availabilitySync.ts`                        | Modified    | Checks all servers for availability                               |
| `server/entity/User.ts`                                 | Modified    | Added plexServerId column                                         |
| `server/migration/1750000000001-AddUserPlexServerId.ts` | New         | Migration to add plexServerId to user table                       |
| `server/routes/user/index.ts`                           | Modified    | User import with server association                               |
| `server/routes/auth.ts`                                 | Modified    | Multi-server access check on login                                |

### Frontend

| File                                                                    | Change Type | Description                                      |
| ----------------------------------------------------------------------- | ----------- | ------------------------------------------------ |
| `src/components/Settings/SettingsPlexServers.tsx`                       | New         | Server list component with CRUD UI               |
| `src/components/Settings/PlexServerModal.tsx`                           | New         | Modal for adding/editing servers                 |
| `src/components/Settings/SettingsPlex.tsx`                              | Modified    | Uses new components, updated scan status display |
| `src/components/UserList/index.tsx`                                     | Modified    | Server column, colored badges, bulk delete       |
| `src/components/UserList/PlexImportModal.tsx`                           | Modified    | Server column with colored badges                |
| `src/components/UserProfile/UserSettings/UserGeneralSettings/index.tsx` | Modified    | Plex Server field for user settings              |
| `src/hooks/useUser.ts`                                                  | Modified    | Added plexServerId to User interface             |

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

## Multi-Owner Authentication (Implemented)

### The Problem (Solved)

The original implementation assumed all Plex servers are owned by the same Plex account (the Overseerr admin). This is **incorrect** for the multi-server use case where different servers are owned by different Plex accounts (to bypass the 100-user limit).

This has now been **fully implemented**.

### How Multi-Owner Auth Works

```
User logs in via Plex OAuth → gets their authToken
    ↓
PlexTvAPI.checkUserAccessAnyServer() is called
    ↓
For each configured Plex server:
    ├── Use server's authToken (or fallback to admin token)
    ├── Call Plex.tv /api/users with that token
    ├── Check if user appears in response
    └── If user has access to this server → ALLOW + record plexServerId
    ↓
If no server grants access → DENY
```

### Implementation Details

#### 1. PlexSettings Interface

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
  authToken?: string; // Server owner's Plex token for multi-owner support
}
```

#### 2. User Entity

Added `plexServerId` to track which server authenticated the user:

```typescript
@Column({ nullable: true, select: true })
public plexServerId?: number; // The Plex server this user was authenticated from
```

#### 3. Static Access Check Method

`PlexTvAPI.checkUserAccessAnyServer()` iterates through all servers:

```typescript
public static async checkUserAccessAnyServer(
  userId: number,
  fallbackToken?: string
): Promise<{ hasAccess: boolean; plexServerId?: number }>
```

Returns both access status and which server granted access.

#### 4. Helper: Get All Users from All Servers

`PlexTvAPI.getAllUsersFromAllServers()` aggregates users from all configured servers with their server association.

#### 5. Updated Auth Routes

Both `/auth/plex` and `/auth/local` now use the new multi-server access check.

#### 6. Server Configuration UI

`PlexServerModal` now includes an optional "Server Owner Token" field.

#### 7. User Import Enhancements

`PlexTvAPI.getAllUsersFromAllServers()` now:

- Fetches the **server owner** for each server (they don't appear in `/api/users`)
- Returns `plexServerId` and `plexServerName` for each user
- Handles server ID `0` correctly (JavaScript falsy value edge case)

#### 8. User List UI Enhancements

The User List (`src/components/UserList/index.tsx`) now displays:

- **Server column** with colored badges indicating which Plex server each user is from
- **Bulk Delete button** alongside Bulk Edit for mass user deletion
- Color-coded badges using a rotating palette (purple, cyan, pink, teal, orange, blue, emerald, rose)

The Import Plex Users modal (`src/components/UserList/PlexImportModal.tsx`) now shows:

- **Server column** with colored badges for each unimported user
- Server owners are included in the import list

The User General Settings page (`src/components/UserProfile/UserSettings/UserGeneralSettings/index.tsx`) now shows:

- **Plex Server field** for Plex users displaying which server they're from

### Backwards Compatibility

- If `authToken` is not set on a server, the admin's token is used as fallback
- Existing single-server installations continue to work without changes
- The `plexServerId` on User is nullable - existing users won't have it set

### Security Considerations

1. **Token Storage**: Server tokens are stored in `settings.json` (same as current admin token)
2. **Token Permissions**: Each token only needs access to its own server
3. **Token Fallback**: Admin token is used when server-specific token is not configured

## Known Limitations

1. **Per-Server Rating Keys**: While `MediaPlexServer` entity exists, the full implementation for per-server deep links is not complete - currently uses first server's rating key
2. **Library Names**: Libraries with the same name on different servers may cause confusion in UI
3. **Scan Performance**: Scanning many servers sequentially may take longer than single server

## Future Enhancements

1. Implement full per-server deep links using `MediaPlexServer` entity
2. Add server health monitoring/status indicators
3. Add per-server scan scheduling
4. Add server priority ordering for deep link generation
