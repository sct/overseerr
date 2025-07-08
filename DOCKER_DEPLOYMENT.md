# Docker Deployment Guide

## Overseerr Content Filtering Docker Setup

This guide covers Docker deployment options for Overseerr Content Filtering, including both pre-built images and local building.

## 🐳 Quick Start with Pre-built Images

### Option 1: Docker Run

```bash
docker run -d \
  --name overseerr-content-filtering \
  -p 5055:5055 \
  -v /path/to/appdata/config:/app/config \
  --restart unless-stopped \
  larrikinau/overseerr-content-filtering
```

### Option 2: Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  overseerr-content-filtering:
    image: larrikinau/overseerr-content-filtering:latest
    container_name: overseerr-content-filtering
    environment:
      - TZ=Asia/Tokyo  # optional
    ports:
      - "5055:5055"
    volumes:
      - /path/to/appdata/config:/app/config
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5055/api/v1/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Then run:

```bash
docker-compose up -d
```

## 🏗️ Building from Source

### Prerequisites

- Docker with BuildKit enabled
- Git
- Optional: Docker Buildx for multi-platform builds

### Build Script

Use the provided build script for easy building:

```bash
# Basic build
./scripts/build-docker.sh

# Build with specific tag
./scripts/build-docker.sh -t v1.1.0

# Multi-platform build and push
./scripts/build-docker.sh --multi-platform --push

# Build without cache
./scripts/build-docker.sh --no-cache
```

### Manual Build

```bash
# Clone the repository
git clone https://github.com/larrikinau/overseerr-content-filtering.git
cd overseerr-content-filtering

# Build the image
docker build -t overseerr-content-filtering:local .

# Run the container
docker run -d \
  --name overseerr-content-filtering \
  -p 5055:5055 \
  -v overseerr-config:/app/config \
  overseerr-content-filtering:local
```

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` | No |
| `TZ` | Timezone for the container | `UTC` | No |
| `PORT` | Port for the web interface | `5055` | No |
| `CONFIG_DIRECTORY` | Path to config directory | `/app/config` | No |

## 📁 Volume Mounts

### Required Volumes

- **Config Directory**: `/app/config`
  - Contains database, logs, and configuration files
  - Must be persistent across container restarts
  - **Important**: Use named volumes on Windows to avoid database corruption

### Example Volume Configurations

#### Linux/macOS (Host Path)
```bash
-v /opt/overseerr/config:/app/config
```

#### Windows (Named Volume)
```bash
-v overseerr-data:/app/config
```

#### Docker Compose (Named Volume)
```yaml
volumes:
  - overseerr-data:/app/config

volumes:
  overseerr-data:
```

## 🌐 Network Configuration

### Port Mapping

- **Default Port**: 5055
- **Custom Port**: Set via `PORT` environment variable
- **Host Port**: Map to any available host port

```bash
# Default mapping
-p 5055:5055

# Custom host port
-p 8080:5055

# Custom container port
-e PORT=8080 -p 8080:8080
```

### Reverse Proxy Setup

#### Nginx Example

```nginx
server {
    listen 80;
    server_name overseerr.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5055;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Traefik Example

```yaml
services:
  overseerr-content-filtering:
    image: larrikinau/overseerr-content-filtering:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.overseerr.rule=Host(`overseerr.yourdomain.com`)"
      - "traefik.http.routers.overseerr.tls=true"
      - "traefik.http.routers.overseerr.tls.certresolver=letsencrypt"
      - "traefik.http.services.overseerr.loadbalancer.server.port=5055"
```

## 🔒 Security Considerations

### Container Security

1. **Run as non-root user** (built into image)
2. **Read-only root filesystem** (optional)
3. **Drop unnecessary capabilities**
4. **Use specific image tags** instead of `latest`

#### Enhanced Security Example

```bash
docker run -d \
  --name overseerr-content-filtering \
  --user 1001:1001 \
  --read-only \
  --tmpfs /tmp \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  -e LOG_LEVEL=info \
  -p 5055:5055 \
  -v overseerr-config:/app/config \
  larrikinau/overseerr-content-filtering:v1.1.0
```

### Network Security

```bash
# Create isolated network
docker network create overseerr-net

# Run with custom network
docker run -d \
  --name overseerr-content-filtering \
  --network overseerr-net \
  -p 127.0.0.1:5055:5055 \  # Bind to localhost only
  larrikinau/overseerr-content-filtering:latest
```

## 📊 Health Checks

### Built-in Health Check

The Docker image includes a health check that monitors the application status:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5055/api/v1/status || exit 1
```

### Custom Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5055/api/v1/status"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 🔄 Updates and Maintenance

### Updating the Container

#### Docker Run
```bash
# Stop and remove old container
docker stop overseerr-content-filtering
docker rm overseerr-content-filtering

# Pull latest image
docker pull larrikinau/overseerr-content-filtering:latest

# Start new container with same configuration
docker run -d --name overseerr-content-filtering [options] larrikinau/overseerr-content-filtering:latest
```

#### Docker Compose
```bash
# Pull and restart
docker-compose pull overseerr-content-filtering
docker-compose up -d overseerr-content-filtering
```

### Backup Configuration

```bash
# Create backup of config volume
docker run --rm \
  -v overseerr-config:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/overseerr-backup-$(date +%Y%m%d).tar.gz /data
```

### Restore Configuration

```bash
# Restore from backup
docker run --rm \
  -v overseerr-config:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/overseerr-backup-YYYYMMDD.tar.gz -C /
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission denied errors**
   ```bash
   # Fix ownership
   docker exec overseerr-content-filtering chown -R app:app /app/config
   ```

2. **Database corruption (Windows)**
   - Use named volumes instead of host mounts
   - Ensure WSL2 is enabled

3. **Port conflicts**
   ```bash
   # Check what's using the port
   netstat -tlnp | grep :5055
   
   # Use different host port
   docker run ... -p 8080:5055 ...
   ```

4. **Memory issues**
   ```bash
   # Increase container memory limit
   docker run ... --memory=2g ...
   ```

### Debug Mode

```bash
# Enable debug logging
docker run ... -e LOG_LEVEL=debug ...

# Check logs
docker logs overseerr-content-filtering -f
```

### Container Shell Access

```bash
# Access container shell
docker exec -it overseerr-content-filtering sh

# Check application status
docker exec overseerr-content-filtering ps aux
```

## 📚 Additional Resources

- [Official Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project Documentation](docs/)
- [Issue Tracker](../../issues)

## 🏷️ Image Tags

### Available Tags

- `latest` - Latest stable release
- `v1.1.0` - Specific version
- `develop` - Development branch (unstable)

### Multi-Platform Support

The images support multiple architectures:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/v8)
- `linux/arm/v7` (ARM32/v7)

```bash
# Pull specific architecture
docker pull --platform linux/arm64 larrikinau/overseerr-content-filtering:latest
```

---

For more information, visit the [project repository](https://github.com/larrikinau/overseerr-content-filtering).
