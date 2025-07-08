# 🚀 Quick Start Guide

Get Overseerr Content Filtering running in minutes!

## ⚡ 30-Second Install

For Debian/Ubuntu systems, run this single command:

```bash
curl -fsSL https://raw.githubusercontent.com/Larrikinau/overseerr-content-filtering/main/install-overseerr-filtering.sh | sudo bash
```

**That's it!** 🎉

## 🔧 First-Time Setup

1. **Access the web interface** at `http://localhost:5055`
2. **Connect to Plex**: Follow the setup wizard to link your Plex server
3. **Configure services**: Set up Sonarr/Radarr if you use them
4. **Set content filtering**: Admins can configure rating preferences for users in Settings → Users

## 🔒 Content Filtering Configuration

### Admin-Only Setup
**Note**: Only administrators can configure content rating settings.

1. Go to **Settings → Users**
2. Select a user to configure
3. Find the **Content Rating Filtering** section
4. Set maximum allowed ratings for that user:
   - **Movies**: Choose from G, PG, PG-13, R, NC-17
   - **TV Shows**: Choose from TV-Y, TV-Y7, TV-G, TV-PG, TV-14, TV-MA

### Family-Friendly Defaults
New users automatically get safe defaults:
- Movies: PG-13 and below
- TV Shows: TV-PG and below

## 🏠 Family Setup Example

### For Young Children (Ages 5-8)
- **Movies**: G only
- **TV Shows**: TV-Y, TV-Y7 only

### For Tweens (Ages 9-12)
- **Movies**: G, PG
- **TV Shows**: TV-Y, TV-Y7, TV-G

### For Teens (Ages 13-17)
- **Movies**: G, PG, PG-13
- **TV Shows**: TV-Y through TV-14

### For Adults
- **Movies**: All ratings (or set limits as preferred)
- **TV Shows**: All ratings (or set limits as preferred)

## 🔄 Migrating from Original Overseerr

Moving from the original Overseerr is seamless:

1. **Stop your existing Overseerr service**
2. **Backup your configuration** (optional but recommended):
   ```bash
   sudo cp -r /path/to/overseerr/config ~/overseerr-backup
   ```
3. **Install Content Filtering version** using the quick install above
4. **Copy your existing configuration** to the new installation
5. **Set up content filtering** in user settings

Your existing requests, users, and settings will work unchanged!

## 📱 Access from Other Devices

Once installed, access from any device on your network:
- **Same computer**: `http://localhost:5055`
- **Other devices**: `http://YOUR_SERVER_IP:5055`

Replace `YOUR_SERVER_IP` with your server's IP address (e.g., `http://192.168.1.100:5055`)

## 🛠️ Service Management

### Check Status
```bash
sudo systemctl status overseerr-filtering
```

### View Logs
```bash
sudo journalctl -u overseerr-filtering -f
```

### Restart Service
```bash
sudo systemctl restart overseerr-filtering
```

### Stop/Start Service
```bash
sudo systemctl stop overseerr-filtering
sudo systemctl start overseerr-filtering
```

## 🔧 Troubleshooting

### Service Won't Start
```bash
# Check logs for errors
sudo journalctl -u overseerr-filtering -n 50

# Verify Node.js version
node --version  # Should be 18.0.0 or higher
```

### Can't Access Web Interface
```bash
# Check if service is running
sudo systemctl status overseerr-filtering

# Check if port is open
sudo netstat -tlnp | grep :5055
```

### Port Already in Use
If port 5055 is occupied, change it:
```bash
sudo systemctl edit overseerr-filtering
```

Add these lines:
```ini
[Service]
Environment=PORT=5056
```

Then restart:
```bash
sudo systemctl restart overseerr-filtering
```

## 🆘 Getting Help

### Content Filtering Issues
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Larrikinau/overseerr-content-filtering/issues)
- 📖 **Detailed Guide**: [Installation Documentation](INSTALL.md)
- 🔨 **Build Guide**: [Build from Source](BUILD.md)

### General Overseerr Questions
- 📖 **Official Docs**: [docs.overseerr.dev](https://docs.overseerr.dev/)
- 💬 **Discord**: [discord.gg/overseerr](https://discord.gg/overseerr)
- ❓ **FAQ**: [Overseerr FAQ](https://docs.overseerr.dev/support/faq)

## ⚙️ Advanced Options

### Build from Source
If you prefer to compile yourself:
```bash
git clone https://github.com/Larrikinau/overseerr-content-filtering.git
cd overseerr-content-filtering
yarn install
yarn build
yarn start
```

See [BUILD.md](BUILD.md) for complete instructions.

### Docker Deployment
```bash
# Using the pre-built package
docker run -d \
  --name overseerr-filtering \
  -p 5055:5055 \
  -v overseerr-config:/app/config \
  overseerr-filtering:local
```

## 🎯 What's Next?

1. **Explore the interface**: Browse movies and TV shows with filtering active
2. **Set up notifications**: Configure Discord, email, or other notification methods
3. **Invite family members**: Add users and configure their rating preferences as an admin
4. **Customize requests**: Set up approval workflows for different user types

Enjoy your family-friendly media management! 🍿📺
