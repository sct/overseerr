# Overseerr Content Filtering

<p align="center">
<img src="./public/logo_full.svg" alt="Overseerr Content Filtering" style="margin: 20px 0;">
</p>

<p align="center">
<strong>🔒 Enhanced Content Management</strong>
</p>

<p align="center">
<a href="#installation"><img src="https://img.shields.io/badge/Install-Quick%20Setup-brightgreen" alt="Quick Install"></a>
<a href="#features"><img src="https://img.shields.io/badge/Feature-Content%20Filtering-orange" alt="Content Filtering"></a>
<a href="LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/sct/overseerr"></a>
</p>

## Overview

**Overseerr Content Filtering** is an enhanced fork of Overseerr that adds intelligent content filtering capabilities with enterprise-grade family safety controls. This version features **global adult content blocking** and **admin-only rating controls**, providing maximum content safety and centralized management.

## 📋 Why This Fork Exists: Comprehensive Content Filtering

The filtering system provides user-configurable age rating controls:

1. **User Preference Storage**: Individual rating limits stored in user settings
2. **Multi-Layer Protection**: Combined API-level and application-level filtering
3. **Automatic Application**: All discovery, search, and browse results filtered
4. **Performance Optimized**: Minimal overhead on existing functionality

### How Content Filtering Works

This fork uses **dual-layer filtering architecture** to ensure reliable content management across all age rating categories.

**📖 For detailed technical explanation:** See [TECHNICAL_IMPLEMENTATION.md](TECHNICAL_IMPLEMENTATION.md)

**Key Features:**
- User-configurable movie ratings (G, PG, PG-13, R, NC-17)
- User-configurable TV ratings (TV-Y, TV-Y7, TV-G, TV-PG, TV-14, TV-MA)
- Hardcoded baseline safety parameters for API reliability
- Database-driven user preferences with family-safe defaults
- Comprehensive filtering across all discovery and search endpoints

## ✨ Enhanced Features

### 🛡️ **Global Adult Content Blocking (v1.1.0)**
- **Zero Tolerance**: Adult content never appears regardless of user settings
- **Global Enforcement**: Applied to all discovery, search, and genre browsing
- **TMDb API Override**: Hardcoded filtering bypasses API inconsistencies
- **Family-Safe Discovery**: All genre images and content safe for all ages

### 👥 **Admin-Only Content Controls (v1.1.0)**
- **Centralized Management**: Only admins can modify content rating settings
- **User Protection**: Regular users cannot bypass or change rating restrictions
- **Permission-Based**: Uses standard admin permissions for consistency
- **Setting Preservation**: Existing rating preferences maintained during upgrade

### 🔒 **Smart Content Filtering**
- **Movie Ratings**: Admin-configurable limits from G through NC-17
- **TV Ratings**: Admin-configurable limits from TV-Y through TV-MA
- **Automatic application**: Filtering works across all discovery and search
- **Family-safe defaults**: New users start with age-appropriate content settings
- **Professional implementation**: Dual-layer filtering architecture for reliability

### 🚀 **All Original Overseerr Features**
- Full Plex integration with user authentication
- Seamless Sonarr and Radarr integration
- Customizable request system for movies and TV shows
- Granular permission system
- Mobile-friendly responsive design
- Multiple notification agents
- Real-time request management

## 📥 Installation

**Two Installation Options Available:**

### 🚀 Option 1: Pre-built Installation (Recommended)

**Best for:** Most users who want quick setup without compilation

**Advantages:**
- ✅ **Instant deployment** - no compilation time
- ✅ **Tested binaries** - pre-built and verified
- ✅ **Minimal dependencies** - no Node.js/build tools required
- ✅ **Easy updates** - simple container/package updates
- ✅ **Production ready** - optimized builds

#### Quick Install Script
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Larrikinau/overseerr-content-filtering/main/install-overseerr-filtering.sh)
```

#### Docker
```bash
docker run -d \
  --name overseerr-content-filtering \
  -p 5055:5055 \
  -v /path/to/appdata/config:/app/config \
  --restart unless-stopped \
  larrikinau/overseerr-content-filtering
```

📖 **[Complete Docker Deployment Guide](DOCKER_DEPLOYMENT.md)** - Advanced configuration, security, troubleshooting

#### Docker Compose
```yaml
version: '3.8'
services:
  overseerr-content-filtering:
    image: larrikinau/overseerr-content-filtering
    container_name: overseerr-content-filtering
    ports:
      - 5055:5055
    volumes:
      - /path/to/appdata/config:/app/config
    restart: unless-stopped
```

### 🔧 Option 2: Build from Source

**Best for:** Developers, customization needs, or contributing to the project

**Advantages:**
- ✅ **Full control** - modify code before building
- ✅ **Latest changes** - access to unreleased features
- ✅ **Development setup** - for contributing improvements
- ✅ **Custom builds** - optimize for specific environments
- ✅ **Learning opportunity** - understand the codebase

**Requirements:**
- Node.js 18+ and npm/yarn
- Git
- 15-20 minutes build time

#### Development Setup
```bash
git clone https://github.com/Larrikinau/overseerr-content-filtering.git
cd overseerr-content-filtering
yarn install
yarn dev
```

#### Production Build
```bash
yarn build
yarn start
```

---

### 🤔 Which Option Should You Choose?

| Use Case | Recommended Option | Why |
|----------|-------------------|-----|
| **Home media server** | Pre-built (Docker) | Quick setup, reliable |
| **Production deployment** | Pre-built (Docker) | Tested, optimized |
| **Quick testing** | Pre-built (Script) | Fastest to try |
| **Development/Contributing** | Build from Source | Full development environment |
| **Custom modifications** | Build from Source | Need to modify code |
| **Learning the codebase** | Build from Source | Understand implementation |

## 🔧 Configuration

### Content Filtering Setup
**Admin Users Only:**
1. Navigate to **Settings** → **Users** → **User Settings**
2. Configure **Rating Preferences** for users:
   - **Max Movie Rating**: Set maximum allowed movie rating
   - **Max TV Rating**: Set maximum allowed TV show rating
3. Save settings - filtering applies immediately

**Note**: Only administrators can modify content rating settings. Regular users cannot see or change these controls.

### Rating System
- **Movies**: G → PG → PG-13 → R → NC-17 (admins set maximum allowed rating per user)
- **TV Shows**: TV-Y → TV-Y7 → TV-G → TV-PG → TV-14 → TV-MA (admins set maximum allowed rating per user)
- **Defaults**: New users start with PG-13 (movies) and TV-PG (TV shows) for family-safe browsing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Commit changes (`git commit -am 'Add enhancement'`)
4. Push to branch (`git push origin feature/enhancement`)
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original [Overseerr](https://github.com/sct/overseerr) project and contributors
- The open-source community for inspiration and support

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](../../issues)
- 💬 [Discussions](../../discussions)

---

<p align="center">
Built with ❤️ for better content management
</p>
