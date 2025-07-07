# Building Overseerr Content Filtering from Source

This guide covers building Overseerr Content Filtering from source code. This option is ideal for developers, users who want full control over the build process, or those who prefer not to use pre-compiled packages.

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+), macOS 10.15+, or Windows 10+ with WSL2
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 2GB free space for build process
- **Network**: Internet connection for downloading dependencies

### Required Software

1. **Node.js 18+**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # CentOS/RHEL
   sudo dnf install nodejs npm
   
   # macOS (with Homebrew)
   brew install node
   
   # Verify installation
   node --version  # Should be 18.0.0 or higher
   npm --version
   ```

2. **Yarn Package Manager**:
   ```bash
   npm install -g yarn
   yarn --version
   ```

3. **Git**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install git
   
   # CentOS/RHEL
   sudo dnf install git
   
   # macOS
   # Git comes with Xcode Command Line Tools
   xcode-select --install
   ```

4. **Build Tools** (Linux only):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential python3
   
   # CentOS/RHEL
   sudo dnf groupinstall "Development Tools"
   sudo dnf install python3
   ```

## Getting the Source Code

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Larrikinau/overseerr-content-filtering.git
cd overseerr-content-filtering

# Or clone your fork if you've made modifications
git clone https://github.com/YOUR_FORK/overseerr-content-filtering.git
cd overseerr-content-filtering
```

### Verify Source Integrity

```bash
# Check the latest commit and verify it's what you expect
git log --oneline -5

# If you want a specific release, checkout the tag
git checkout v1.0.0

# Verify you're on the correct branch/tag
git status
```

## Build Process

### 1. Install Dependencies

```bash
# Install all project dependencies
yarn install

# This will:
# - Download and install all Node.js dependencies
# - Set up development tools
# - Configure Husky git hooks (for development)
```

### 2. Build the Application

```bash
# Build the complete application
yarn build

# This runs both:
# yarn build:server  - Compiles TypeScript server code
# yarn build:next    - Builds the Next.js frontend
```

**What happens during build:**
- TypeScript compilation of server code
- Next.js frontend optimization and bundling
- Asset processing and optimization
- Generation of production-ready files

### 3. Verify the Build

```bash
# Check that build artifacts were created
ls -la dist/        # Server build output
ls -la .next/       # Frontend build output

# Test that the application starts
NODE_ENV=production yarn start

# Access the application at http://localhost:5055
# Press Ctrl+C to stop
```

## Development vs Production Builds

### Development Build
```bash
# Install development dependencies
yarn install

# Start development server (with hot reload)
yarn dev

# Access at http://localhost:3000
```

### Production Build
```bash
# Install only production dependencies
yarn install --production=false  # Installs all deps needed for building
yarn build                        # Create production build
yarn install --production=true   # Remove dev dependencies

# Or set environment variable
NODE_ENV=production yarn install
NODE_ENV=production yarn build
```

## Configuration for Source Builds

### Environment Variables

Create a `.env.local` file for your configuration:

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit with your settings
nano .env.local
```

**Key variables:**
```bash
# Database (SQLite is default, no configuration needed)
# Leave empty for SQLite: DATABASE_URL=

# Application settings
LOG_LEVEL=info
PORT=5055

# Optional: External database
# DATABASE_URL=postgres://user:pass@localhost:5432/overseerr

# Optional: Redis for sessions (not required)
# REDIS_URL=redis://localhost:6379
```

### Content Filtering Configuration

Content filtering settings are configured through the web interface after first run, but you can pre-configure defaults:

```bash
# Create config directory
mkdir -p config

# The application will create config/settings.json on first run
# You can pre-populate this with your preferred defaults
```

## Running from Source

### Method 1: Direct Node.js

```bash
# Start the production build
NODE_ENV=production node dist/index.js

# Or use the yarn script
yarn start
```

### Method 2: Development Mode

```bash
# Start with hot reload (for development)
yarn dev
```

### Method 3: PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'overseerr-filtering',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5055
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Manage the process
pm2 status
pm2 logs overseerr-filtering
pm2 restart overseerr-filtering
pm2 stop overseerr-filtering
```

## Database Setup

### SQLite (Default)
No additional setup required. The application will create `config/db/db.sqlite3` automatically.

### PostgreSQL (Optional)
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE overseerr;"
sudo -u postgres psql -c "CREATE USER overseerr WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE overseerr TO overseerr;"

# Update .env.local
echo "DATABASE_URL=postgres://overseerr:your_password@localhost:5432/overseerr" >> .env.local
```

## Customizing the Build

### Content Filtering Modifications

If you want to modify the content filtering logic:

1. **Server-side filtering**: Edit files in `server/routes/discover/`
2. **Frontend components**: Edit files in `src/components/`
3. **Database models**: Edit files in `server/entity/`

### Adding Custom Features

```bash
# Create a new branch for your modifications
git checkout -b my-custom-features

# Make your changes
# ... edit files ...

# Test your changes
yarn dev

# Build and test production version
yarn build
NODE_ENV=production yarn start
```

### Building with Custom Branding

```bash
# Customize the application name and branding
# Edit these files:
# - src/components/Layout/index.tsx (page title)
# - public/manifest.json (app name)
# - package.json (application metadata)

# Rebuild after changes
yarn build
```

## Testing

### Running Tests

```bash
# Run unit tests
yarn test

# Run integration tests
yarn test:integration

# Run linting
yarn lint

# Run type checking
yarn type-check
```

### Manual Testing

1. **Content Filtering Test**:
   ```bash
   # Start the application
   yarn start
   
   # Complete setup at http://localhost:5055
   # 1. Connect to your Plex server
   # 2. Configure user rating preferences (admin only)
   # 3. Test movie/TV discovery pages
   # 4. Verify filtering is applied
   ```

2. **API Testing**:
   ```bash
   # Test API endpoints
   curl http://localhost:5055/api/v1/discover/movies
   curl http://localhost:5055/api/v1/discover/tv
   ```

## Deployment from Source

### System Service (Linux)

1. **Create service user**:
   ```bash
   sudo useradd --system --no-create-home --shell /bin/false overseerr
   ```

2. **Install to system location**:
   ```bash
   # Copy application files
   sudo mkdir -p /opt/overseerr-filtering
   sudo cp -r . /opt/overseerr-filtering/
   sudo chown -R overseerr:overseerr /opt/overseerr-filtering
   ```

3. **Create systemd service**:
   ```bash
   sudo tee /etc/systemd/system/overseerr-filtering.service > /dev/null << 'EOF'
   [Unit]
   Description=Overseerr Content Filtering
   After=network.target
   
   [Service]
   Type=simple
   User=overseerr
   Group=overseerr
   WorkingDirectory=/opt/overseerr-filtering
   ExecStart=/usr/bin/node dist/index.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   Environment=PORT=5055
   
   [Install]
   WantedBy=multi-user.target
   EOF
   
   # Enable and start service
   sudo systemctl daemon-reload
   sudo systemctl enable overseerr-filtering
   sudo systemctl start overseerr-filtering
   ```

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package.json yarn.lock ./
   
   # Install dependencies
   RUN yarn install --production
   
   # Copy application code
   COPY . .
   
   # Build application
   RUN yarn build
   
   # Create non-root user
   RUN addgroup -g 1001 -S overseerr
   RUN adduser -S overseerr -u 1001
   RUN chown -R overseerr:overseerr /app
   USER overseerr
   
   # Create config directory
   RUN mkdir -p config/logs config/db
   
   EXPOSE 5055
   
   CMD ["node", "dist/index.js"]
   ```

2. **Build and run**:
   ```bash
   # Build image
   docker build -t overseerr-content-filtering:local .
   
   # Run container
   docker run -d \
     --name overseerr-content-filtering \
     -p 5055:5055 \
     -v overseerr-config:/app/config \
     overseerr-content-filtering:local
   ```

## Troubleshooting

### Common Build Issues

1. **Node.js version errors**:
   ```bash
   # Check version
   node --version
   
   # Upgrade if needed
   nvm install 18  # If using nvm
   nvm use 18
   ```

2. **Yarn installation failures**:
   ```bash
   # Clear cache and retry
   yarn cache clean
   rm -rf node_modules
   yarn install
   ```

3. **Build memory issues**:
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   yarn build
   ```

4. **Permission errors**:
   ```bash
   # Fix ownership (Linux/macOS)
   sudo chown -R $USER:$USER .
   ```

### Build Process Debug

```bash
# Enable verbose logging
DEBUG=* yarn build

# Check for TypeScript errors
yarn tsc --noEmit

# Verify dependencies
yarn check --verify-tree
```

## Security Considerations

### Building from Source Security

- ✅ **Full transparency** - You can inspect all code before building
- ✅ **No pre-compiled binaries** - Everything built on your system
- ✅ **Dependency verification** - Yarn verifies package integrity
- ✅ **Custom modifications** - Add your own security patches

### Recommended Security Practices

1. **Verify source integrity**:
   ```bash
   # Check GPG signatures if available
   git verify-commit HEAD
   
   # Verify against known good checksums
   sha256sum package.json yarn.lock
   ```

2. **Audit dependencies**:
   ```bash
   # Check for known vulnerabilities
   yarn audit
   
   # Fix auto-fixable issues
   yarn audit fix
   ```

3. **Network security**:
   ```bash
   # Run behind reverse proxy
   # Use HTTPS in production
   # Configure firewall appropriately
   ```

## Getting Help

- **Documentation**: See other `.md` files in this repository
- **Issues**: Create an issue on GitHub for bugs or questions
- **Discussions**: Use GitHub Discussions for general help
- **Original Overseerr**: https://docs.overseerr.dev/ for base functionality

## License

This project maintains the same license as the original Overseerr project. See `LICENSE` file for details.
