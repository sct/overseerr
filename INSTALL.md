# Overseerr Content Filtering - Installation Guide

This guide covers installing the pre-compiled Overseerr Content Filtering package on Debian/Ubuntu systems.

## Quick Installation (Recommended)

The easiest way to install Overseerr Content Filtering is using our automated installation script:

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/Larrikinau/overseerr-content-filtering/main/install-overseerr-filtering.sh | sudo bash
```

That's it! The script will:
- Check prerequisites and install dependencies
- Download the latest pre-compiled package
- Set up the application as a system service
- Start the service automatically

After installation, access the web interface at `http://localhost:5055` or `http://YOUR_SERVER_IP:5055`.

## Manual Installation

If you prefer to install manually, follow these steps:

### Prerequisites

1. **Node.js 18+** - Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **System packages**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y curl tar systemctl
   ```

### Installation Steps

1. **Create a service user**:
   ```bash
   sudo useradd --system --no-create-home --shell /bin/false overseerr
   ```

2. **Download the package**:
   ```bash
   cd /tmp
curl -L -o overseerr-filtering.tar.gz https://github.com/Larrikinau/overseerr-content-filtering/releases/latest/download/overseerr-filtering-v1.0.0.tar.gz
   ```

3. **Extract and install**:
   ```bash
   sudo mkdir -p /opt/overseerr-filtering
   sudo tar -xzf overseerr-filtering.tar.gz -C /opt/overseerr-filtering --strip-components=1
   sudo chown -R overseerr:overseerr /opt/overseerr-filtering
   sudo chmod +x /opt/overseerr-filtering/start.sh
   ```

4. **Create systemd service**:
   ```bash
   sudo tee /etc/systemd/system/overseerr-filtering.service > /dev/null <<EOF
   [Unit]
   Description=Overseerr Content Filtering
   After=network.target
   
   [Service]
   Type=simple
   User=overseerr
   Group=overseerr
   WorkingDirectory=/opt/overseerr-filtering
   ExecStart=/opt/overseerr-filtering/start.sh
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   Environment=PORT=5055
   
   [Install]
   WantedBy=multi-user.target
   EOF
   ```

5. **Enable and start the service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable overseerr-filtering
   sudo systemctl start overseerr-filtering
   ```

6. **Verify installation**:
   ```bash
   sudo systemctl status overseerr-filtering
   ```

## Configuration

Configuration files are located in `/opt/overseerr-filtering/config/`.

### First-time Setup

1. Access the web interface at `http://localhost:5055`
2. Follow the setup wizard to configure your Plex server connection
3. Configure your content filtering preferences in the settings

### Advanced Configuration

Edit the configuration file:
```bash
sudo nano /opt/overseerr-filtering/config/settings.json
```

After making changes, restart the service:
```bash
sudo systemctl restart overseerr-filtering
```

## Service Management

### Basic Commands

- **Start service**: `sudo systemctl start overseerr-filtering`
- **Stop service**: `sudo systemctl stop overseerr-filtering`
- **Restart service**: `sudo systemctl restart overseerr-filtering`
- **Check status**: `sudo systemctl status overseerr-filtering`
- **View logs**: `sudo journalctl -u overseerr-filtering -f`

### Automatic Startup

The service is automatically configured to start on system boot. To disable:
```bash
sudo systemctl disable overseerr-filtering
```

To re-enable:
```bash
sudo systemctl enable overseerr-filtering
```

## Updating

To update to a newer version:

1. **Stop the service**:
   ```bash
   sudo systemctl stop overseerr-filtering
   ```

2. **Download the new package**:
   ```bash
   cd /tmp
curl -L -o overseerr-filtering.tar.gz https://github.com/Larrikinau/overseerr-content-filtering/releases/latest/download/overseerr-filtering-v1.0.0.tar.gz
   ```

3. **Extract and replace**:
   ```bash
   sudo tar -xzf overseerr-filtering.tar.gz -C /opt/overseerr-filtering --strip-components=1
   sudo chown -R overseerr:overseerr /opt/overseerr-filtering
   sudo chmod +x /opt/overseerr-filtering/start.sh
   ```

4. **Start the service**:
   ```bash
   sudo systemctl start overseerr-filtering
   ```

Alternatively, just re-run the installation script to update automatically.

## Uninstalling

To completely remove Overseerr Content Filtering:

```bash
# Stop and disable the service
sudo systemctl stop overseerr-filtering
sudo systemctl disable overseerr-filtering

# Remove service file
sudo rm /etc/systemd/system/overseerr-filtering.service
sudo systemctl daemon-reload

# Remove application files
sudo rm -rf /opt/overseerr-filtering

# Remove user (optional)
sudo userdel overseerr
```

## Troubleshooting

### Service Won't Start

1. **Check logs**:
   ```bash
   sudo journalctl -u overseerr-filtering -n 50
   ```

2. **Check file permissions**:
   ```bash
   sudo chown -R overseerr:overseerr /opt/overseerr-filtering
   sudo chmod +x /opt/overseerr-filtering/start.sh
   ```

3. **Verify Node.js version**:
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

### Port Already in Use

If port 5055 is already in use, you can change the port by:

1. **Edit the service file**:
   ```bash
   sudo systemctl edit overseerr-filtering
   ```

2. **Add environment override**:
   ```ini
   [Service]
   Environment=PORT=5056
   ```

3. **Restart the service**:
   ```bash
   sudo systemctl restart overseerr-filtering
   ```

### Web Interface Not Accessible

1. **Check if service is running**:
   ```bash
   sudo systemctl status overseerr-filtering
   ```

2. **Check firewall settings**:
   ```bash
   sudo ufw allow 5055/tcp
   ```

3. **Test local connection**:
   ```bash
   curl -I http://localhost:5055
   ```

## File Locations

- **Application files**: `/opt/overseerr-filtering/`
- **Configuration**: `/opt/overseerr-filtering/config/`
- **Logs**: Use `journalctl -u overseerr-filtering` or check `/opt/overseerr-filtering/logs/`
- **Service file**: `/etc/systemd/system/overseerr-filtering.service`

## Getting Help

- **GitHub Issues**: https://github.com/Larrikinau/overseerr-content-filtering/issues
- **Documentation**: https://github.com/Larrikinau/overseerr-content-filtering/wiki
- **Original Overseerr Docs**: https://docs.overseerr.dev/

## Compile from Source

If you prefer to compile from source instead of using the pre-compiled package, see the [BUILD.md](BUILD.md) file for detailed instructions.

## Security Considerations

- The application runs as a non-privileged user (`overseerr`)
- No sensitive data is stored in the pre-compiled package
- All dependencies are included and verified during build
- Regular security updates are recommended

## What's Included

This pre-compiled package includes:
- Complete frontend and backend builds
- All necessary dependencies
- Startup scripts
- Default configuration templates
- Documentation

The package is built in a clean environment and contains no personal paths or sensitive information.
