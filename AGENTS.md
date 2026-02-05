# Overseerr Development Guide

This document provides essential information for AI coding agents working on the Overseerr project.

## Project Overview

**Overseerr** is a free and open source web application for managing media library requests. It integrates with media services like [Sonarr](https://sonarr.tv/) (TV), [Radarr](https://radarr.video/) (movies), [Lidarr](https://lidarr.audio/) (music), and [Plex](https://www.plex.tv/) (media server).

### Key Features

- Full Plex integration for authentication and user management
- Media request system with granular permissions
- Sonarr/Radarr/Lidarr integration for automated downloads
- Discover trending/popular/upcoming media via TMDB
- Multi-language support (28+ locales)
- Notification agents (Discord, Email, Telegram, Pushover, etc.)
- Mobile-friendly responsive UI
- PWA (Progressive Web App) support

## Technology Stack

### Frontend

- **Framework**: [Next.js](https://nextjs.org/) 16.x (React 18)
- **Language**: TypeScript 5.x
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 3.x
- **UI Components**: [Headless UI](https://headlessui.com/), [Heroicons](https://heroicons.com/)
- **State Management**: [SWR](https://swr.vercel.app/) for data fetching, React Context for app state
- **Internationalization**: [react-intl](https://formatjs.io/docs/react-intl/)
- **Forms**: [Formik](https://formik.org/) + [Yup](https://github.com/jquense/yup)

### Backend

- **Runtime**: Node.js 18+
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: TypeScript 5.x
- **ORM**: [TypeORM](https://typeorm.io/) 0.3.x
- **Database**: SQLite (with WAL mode enabled)
- **API Documentation**: OpenAPI 3.0 (Swagger UI at `/api-docs`)
- **Authentication**: Session-based (cookie) + API key support
- **Validation**: [express-openapi-validator](https://github.com/cdimascio/express-openapi-validator) + [Zod](https://zod.dev/)

### External APIs

- [TMDB](https://www.themoviedb.org/) (The Movie Database) - primary media metadata
- [MusicBrainz](https://musicbrainz.org/) - music metadata
- [Plex](https://www.plex.tv/) - media server integration
- [Sonarr/Radarr/Lidarr](https://wiki.servarr.com/) - media management

### Testing & Quality

- **Unit Tests**: [Vitest](https://vitest.dev/) with jsdom
- **E2E Tests**: [Cypress](https://www.cypress.io/) 12.x
- **Linting**: ESLint with TypeScript, React, and accessibility plugins
- **Formatting**: Prettier with import organization
- **Git Hooks**: Husky + lint-staged

### Deployment

- **Container**: Docker with multi-platform builds (linux/amd64, linux/arm64, linux/arm/v7)
- **CI/CD**: GitHub Actions
- **Package Manager**: Yarn (classic)

## Project Structure

```
overseerr/
├── src/                          # Next.js frontend
│   ├── components/               # React components
│   │   ├── Common/               # Shared UI components (Button, Modal, etc.)
│   │   ├── Layout/               # Layout components (Sidebar, Header)
│   │   ├── Settings/             # Settings-related components
│   │   ├── Discover/             # Discovery page components
│   │   ├── MovieDetails/         # Movie detail components
│   │   ├── TvDetails/            # TV show detail components
│   │   ├── RequestModal/         # Request creation modals
│   │   └── ...
│   ├── pages/                    # Next.js pages (file-based routing)
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── movie/[movieId]/      # Movie details
│   │   ├── tv/[tvId]/            # TV show details
│   │   ├── artist/[mbid]/        # Music artist details
│   │   ├── album/[mbid]/         # Music album details
│   │   ├── discover/             # Discovery pages
│   │   ├── settings/             # Admin settings
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── context/                  # React contexts (User, Settings, Language)
│   ├── utils/                    # Frontend utilities
│   ├── i18n/                     # Localization files (locale/*.json)
│   └── styles/                   # Global CSS styles
│
├── server/                       # Express backend
│   ├── index.ts                  # Server entry point
│   ├── datasource.ts             # TypeORM database configuration
│   ├── api/                      # External API clients
│   │   ├── themoviedb/           # TMDB API integration
│   │   ├── plexapi.ts            # Plex API client
│   │   ├── servarr/              # Sonarr/Radarr/Lidarr clients
│   │   └── ...
│   ├── entity/                   # TypeORM entities
│   │   ├── User.ts               # User entity
│   │   ├── MediaRequest.ts       # Media request entity
│   │   ├── Media.ts              # Media item entity
│   │   └── ...
│   ├── migration/                # Database migrations
│   ├── subscriber/               # TypeORM entity subscribers
│   ├── routes/                   # Express route handlers
│   │   ├── index.ts              # Main router
│   │   ├── auth.ts               # Authentication routes
│   │   ├── request.ts            # Request management
│   │   ├── settings/             # Settings routes
│   │   └── ...
│   ├── lib/                      # Core business logic
│   │   ├── notifications/        # Notification agents
│   │   ├── scanners/             # Media scanners (Plex, Sonarr, Radarr, Lidarr)
│   │   ├── permissions.ts        # Permission system
│   │   └── settings.ts           # Settings management
│   ├── job/                      # Scheduled background jobs
│   ├── middleware/               # Express middleware
│   └── utils/                    # Backend utilities
│
├── tests/                        # Unit and integration tests
│   ├── components/               # Component tests
│   ├── hooks/                    # Hook tests
│   ├── server/                   # Server-side tests
│   └── setup.ts                  # Vitest test setup
│
├── cypress/                      # E2E tests
│   └── e2e/                      # Test specs
│
├── config/                       # Runtime configuration (database, etc.)
├── public/                       # Static assets
├── overseerr-api.yml             # OpenAPI specification
└── package.json                  # Dependencies and scripts
```

## Build and Development Commands

### Prerequisites

- Node.js 18+ and Yarn
- Git
- (Optional) Docker

### Installation

```bash
yarn install
```

### Development

```bash
# Start development server (Next.js + Express with hot reload)
yarn dev

# Server will be available at http://localhost:5055
```

### Building

```bash
# Build both frontend and backend
yarn build

# Build only frontend
yarn build:next

# Build only backend
yarn build:server
```

### Production

```bash
# Start production server (requires build first)
yarn start
```

### Code Quality

```bash
# Run ESLint
yarn lint

# Format code with Prettier
yarn format

# Check formatting
yarn format:check

# Type checking
yarn typecheck
yarn typecheck:server  # Server only
yarn typecheck:client  # Client only
```

### Testing

```bash
# Run all unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with UI
yarn test:ui

# Run tests with coverage
yarn test:coverage

# Run E2E tests (requires build and db setup)
yarn cypress:build
yarn cypress:open

# Or run Cypress headlessly
cypress run
```

### Database Migrations

```bash
# Generate migration from entity changes
yarn migration:generate

# Create empty migration
yarn migration:create

# Run pending migrations
yarn migration:run
```

### Internationalization

```bash
# Extract translation strings from source code
yarn i18n:extract
```

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Prefer `type` imports: `import type { Foo } from './foo'`
- Use absolute imports with path aliases: `@app/*` for client, `@server/*` for server
- Avoid relative imports (use `no-relative-import-paths` ESLint rule)

### React Components

- Use functional components with hooks
- Use React 18's JSX transform (no `React` import needed)
- Place components in `src/components/ComponentName/index.tsx`
- Export component as default from index file

### Styling

- Use Tailwind CSS utility classes
- Custom styles go in `src/styles/globals.css`
- Use Tailwind's `@apply` for complex reusable styles

### Naming Conventions

- **Files**: PascalCase for components (e.g., `MovieDetails.tsx`), camelCase for utilities
- **Components**: PascalCase (e.g., `MovieDetails`)
- **Hooks**: camelCase starting with `use` (e.g., `useUser`)
- **API routes**: kebab-case for route files
- **Database entities**: PascalCase (e.g., `MediaRequest`)

### Git Commits

All commits **MUST** follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

```
feat(requests): add quota management for users
fix(auth): resolve login redirect loop
docs(readme): update installation instructions
```

## Testing Instructions

### Unit Tests (Vitest)

Test files: `tests/**/*.test.ts` or `src/**/*.test.tsx`

Example component test:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Button from './index';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### E2E Tests (Cypress)

Test files: `cypress/e2e/**/*.cy.ts`

Example E2E test:

```typescript
describe('Login', () => {
  it('should login with Plex', () => {
    cy.visit('/login');
    cy.get('[data-testid="plex-login"]').click();
    // ... test flow
  });
});
```

### Test Environment Variables

Create a `.env` file for test configuration:

```
ADMIN_EMAIL=admin@seerr.dev
ADMIN_PASSWORD=test1234
USER_EMAIL=user@seerr.dev
USER_PASSWORD=test1234
```

## Architecture Details

### Authentication Flow

1. User authenticates via Plex OAuth (`/auth/plex`) or local login (`/auth/local`)
2. Server creates session stored in SQLite (TypeORM Session entity)
3. Session cookie returned to client
4. Subsequent requests include cookie for authentication
5. API key authentication also supported via `X-Api-Key` header

### Permission System

Permissions are defined as bitwise flags in `@server/lib/permissions.ts`:

- `Permission.USER` - Basic user access
- `Permission.REQUEST` - Can request media
- `Permission.REQUEST_4K` - Can request 4K content
- `Permission.MANAGE_USERS` - Can manage other users
- `Permission.ADMIN` - Full admin access
- ... and more

### Media Request Flow

1. User searches TMDB for content
2. User submits request for movie/TV show/music
3. Request stored in `MediaRequest` entity
4. Admin approves/declines request
5. If approved, content sent to Sonarr/Radarr/Lidarr
6. Media availability synced from Plex libraries

### Notification System

Notifications are sent via configurable agents:

- Discord, Email, Telegram, Pushover, Gotify, Slack, Webhook, WebPush
- Each agent extends base `BaseAgent` class
- Notifications triggered on events: request created, approved, available, etc.

### Background Jobs

Scheduled jobs defined in `@server/job/schedule.ts`:

- Media availability sync from Plex
- Request sync to Sonarr/Radarr/Lidarr
- Watchlist sync from Plex
- Download status updates

## Security Considerations

### CSRF Protection

- Enabled by default (`settings.main.csrfProtection`)
- CSRF token provided in `XSRF-TOKEN` cookie
- Must be sent as `X-XSRF-TOKEN` header for state-changing requests

### Rate Limiting

- Global API: 600 requests/minute per user/IP
- Auth endpoints: 100 requests/15 minutes (stricter)
- Search endpoints: 300 requests/minute
- Initialize endpoint: 10 requests/hour

### Session Security

- HttpOnly cookies
- Secure flag in production
- 30-day session expiry
- Sessions stored in database (not memory)

### API Key Security

- API keys stored hashed (bcrypt)
- Keys have same permissions as owning user
- Can be revoked at any time

## Docker Development

```bash
# Build and run with Docker Compose
docker-compose up -d

# Build production image
docker build -t overseerr .

# Run production container
docker run -d \
  --name overseerr \
  -p 5055:5055 \
  -v /path/to/config:/app/config \
  overseerr
```

### Environment Variables

- `NODE_ENV` - Set to `production` for production builds
- `PORT` - Server port (default: 5055)
- `HOST` - Bind host (default: all interfaces)
- `CONFIG_DIRECTORY` - Path to config directory (default: `./config`)
- `SKIP_SETUP` - Skip initial setup (for testing)

## Common Development Tasks

### Adding a New API Endpoint

1. Define route in `server/routes/<feature>.ts`
2. Update OpenAPI spec in `overseerr-api.yml`
3. Add authentication middleware if needed (`isAuthenticated()`)
4. Create corresponding frontend hook in `src/hooks/use<Feature>.ts`

### Adding a Database Entity

1. Create entity in `server/entity/<Entity>.ts`
2. Register in `server/datasource.ts`
3. Generate migration: `yarn migration:generate`
4. Import and use in appropriate routes/services

### Adding a Notification Agent

1. Create agent class in `server/lib/notifications/agents/<agent>.ts`
2. Extend `BaseAgent` and implement `send()` method
3. Register in `server/index.ts`
4. Add settings UI component

### Adding Translations

1. Add strings to source code using `FormattedMessage` or `intl.formatMessage`
2. Run `yarn i18n:extract` to update translation files
3. Translate in `src/i18n/locale/<lang>.json`

## Troubleshooting

### Build Issues

- Clear `.next` and `dist` directories: `rm -rf .next dist`
- Delete `node_modules` and reinstall: `rm -rf node_modules && yarn`
- Check TypeScript errors: `yarn typecheck`

### Database Issues

- Delete database: `rm config/db/db.sqlite3`
- Run migrations: `yarn migration:run`
- Enable WAL mode for better concurrency (already enabled by default)

### Test Issues

- Ensure test database is prepared: `yarn cypress:prepare`
- Check for port conflicts (default: 5055)
- Clear Jest/Vitest cache: `yarn test --clearCache`

## Resources

- **Documentation**: https://docs.overseerr.dev/
- **API Docs**: https://api-docs.overseerr.dev/
- **Discord**: https://discord.gg/overseerr
- **GitHub**: https://github.com/sct/overseerr
- **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

_This file is intended for AI coding agents. For general contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)._
