# Docker Release Notes - v1.1.0

## Overview

Overseerr Content Filtering v1.1.0 includes comprehensive Docker support with automated multi-platform builds and enhanced deployment options.

## 🐳 Docker Images

### Registry Locations

- **Docker Hub**: `larrikinau/overseerr-content-filtering`
- **GitHub Container Registry**: `ghcr.io/larrikinau/overseerr-content-filtering`

### Supported Platforms

- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, including Apple Silicon)
- `linux/arm/v7` (ARM 32-bit)

### Available Tags

- `latest` - Latest stable release
- `v1.1.0` - Specific version tag
- `develop` - Development builds (unstable)

## 🔄 Automated Release Process

### GitHub Actions Workflow

The release process is fully automated via GitHub Actions:

1. **Semantic Release**: Automatically versions and tags releases
2. **Multi-Platform Build**: Builds for AMD64, ARM64, and ARMv7
3. **Registry Push**: Publishes to both Docker Hub and GHCR
4. **Release Notes**: Auto-generates changelog and release notes

### Configuration Details

```yaml
# Semantic Release Docker Configuration
"semantic-release-docker-buildx": {
  "buildArgs": {
    "COMMIT_TAG": "$GIT_SHA"
  },
  "imageNames": [
    "larrikinau/overseerr-content-filtering",
    "ghcr.io/larrikinau/overseerr-content-filtering"
  ],
  "platforms": [
    "linux/amd64",
    "linux/arm64", 
    "linux/arm/v7"
  ]
}
```

## 🛡️ Security Features

### Built-in Security

- **Non-root User**: Runs as dedicated `app` user (UID 1001)
- **Minimal Base**: Alpine Linux for reduced attack surface
- **Health Checks**: Built-in application health monitoring
- **Clean Build**: Multi-stage build removes development dependencies

### Container Hardening Options

```bash
# Enhanced security example
docker run -d \
  --name overseerr-content-filtering \
  --user 1001:1001 \
  --read-only \
  --tmpfs /tmp \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  -p 5055:5055 \
  -v overseerr-config:/app/config \
  larrikinau/overseerr-content-filtering:v1.1.0
```

## 📊 Performance Optimizations

### Build Optimizations

- **Multi-stage Build**: Separates build and runtime environments
- **Production Dependencies**: Runtime includes only production packages
- **Cache Optimization**: Efficient Docker layer caching
- **Compressed Layers**: Minimal image size

### Runtime Optimizations

- **Node.js 18**: Latest LTS for optimal performance
- **Alpine Linux**: Lightweight base image
- **Health Monitoring**: Integrated application health checks

## 🔧 Environment Configuration

### Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Application logging level | `info` |
| `TZ` | Container timezone | `UTC` |
| `PORT` | Web interface port | `5055` |
| `NODE_ENV` | Node.js environment | `production` |

### Volume Requirements

- **Config Volume**: `/app/config` (persistent storage required)
- **Recommended**: Named volumes for Windows compatibility

## 🚀 Quick Start Examples

### Basic Deployment

```bash
docker run -d \
  --name overseerr-content-filtering \
  -p 5055:5055 \
  -v overseerr-config:/app/config \
  larrikinau/overseerr-content-filtering:latest
```

### Production Deployment

```yaml
version: '3.8'

services:
  overseerr-content-filtering:
    image: larrikinau/overseerr-content-filtering:v1.1.0
    container_name: overseerr-content-filtering
    restart: unless-stopped
    environment:
      - LOG_LEVEL=info
      - TZ=America/New_York
    ports:
      - "5055:5055"
    volumes:
      - overseerr-data:/app/config
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5055/api/v1/status"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  overseerr-data:
```

## 🏗️ Building from Source

### Local Build Script

```bash
# Use provided build script
./scripts/build-docker.sh

# Build specific version
./scripts/build-docker.sh -t v1.1.0

# Multi-platform build
./scripts/build-docker.sh --multi-platform
```

### Manual Build

```bash
# Standard build
docker build -t overseerr-content-filtering:local .

# Multi-platform build
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t overseerr-content-filtering:multi \
  .
```

## 🔄 Migration from Original Overseerr

### Container Replacement

```bash
# Stop original Overseerr
docker stop overseerr
docker rm overseerr

# Start content filtering version
docker run -d \
  --name overseerr-content-filtering \
  -p 5055:5055 \
  -v overseerr_config:/app/config \  # Reuse existing volume
  larrikinau/overseerr-content-filtering:latest
```

### Configuration Compatibility

- **Database**: Fully compatible with existing Overseerr databases
- **Settings**: All existing settings preserved
- **Users**: User accounts and permissions maintained
- **Requests**: Request history and status preserved

## 📈 Monitoring and Logging

### Health Check Endpoint

```bash
# Manual health check
curl http://localhost:5055/api/v1/status
```

### Log Management

```bash
# View logs
docker logs overseerr-content-filtering -f

# Export logs
docker logs overseerr-content-filtering > overseerr.log 2>&1
```

### Metrics Collection

- Application logs via Docker logging drivers
- Health check status monitoring
- Container resource usage metrics

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts**: Change host port mapping
2. **Permission Issues**: Verify volume ownership
3. **Memory Constraints**: Increase container memory limit
4. **Network Issues**: Check firewall and port accessibility

### Debug Mode

```bash
# Enable debug logging
docker run ... -e LOG_LEVEL=debug ...

# Access container shell
docker exec -it overseerr-content-filtering sh
```

## 📚 Documentation

- **[Docker Deployment Guide](DOCKER_DEPLOYMENT.md)** - Comprehensive deployment instructions
- **[Build Guide](BUILD.md)** - Building from source
- **[Release Notes](RELEASE_NOTES_v1.1.0.md)** - Complete changelog

## 🎯 Next Steps

1. **Test Deployment**: Verify container functionality
2. **Production Setup**: Configure reverse proxy and SSL
3. **Monitoring**: Set up health checks and logging
4. **Backup Strategy**: Implement configuration backup procedures

---

For support and issues, please visit the [GitHub repository](https://github.com/larrikinau/overseerr-content-filtering).
