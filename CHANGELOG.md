# Changelog

All notable changes to Overseerr Content Filtering will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-07-07

### Added
- **🛡️ Global Adult Content Blocking**: Zero tolerance enforcement regardless of user settings
- **👥 Admin-Only Content Controls**: Centralized management with permission-based access
- **🐳 Comprehensive Docker Support**: Multi-platform builds and automated registry publishing
- **📚 Professional Documentation**: Complete deployment guides and technical documentation
- **🔧 Docker Build Script**: Automated local building with multi-platform support
- **📊 Health Checks**: Built-in application monitoring and status verification
- **🛡️ Enhanced Security**: Container hardening and privacy-safe build system

### Enhanced
- **TMDb API Integration**: Hardcoded `include_adult: false` for reliable adult content blocking
- **Permission System**: Content rating controls now require MANAGE_USERS permission
- **User Interface**: Admin-only visibility for content rating preference controls
- **Docker Configuration**: Simplified deployment with minimal required parameters
- **Documentation Structure**: Comprehensive guides for all deployment scenarios
- **Build System**: Privacy-safe automated packaging and distribution

### Changed
- **BREAKING**: Content rating controls now restricted to admin users only
- **API Behavior**: Adult content never included regardless of user preferences
- **Docker Images**: Updated to `larrikinau/overseerr-content-filtering` namespace
- **Configuration Flow**: Admin-controlled content filtering instead of user self-service

### Technical Implementation
- Modified `shouldIncludeAdult()` method to always return `false`
- Enhanced UserGeneralSettings component with permission checks
- Updated semantic-release configuration for Docker publishing
- Added comprehensive Docker deployment documentation
- Implemented multi-platform build support (AMD64, ARM64, ARMv7)

### Security Improvements
- **Zero Adult Content**: Hardcoded filtering prevents any adult material discovery
- **Access Control**: Only administrators can modify content rating restrictions
- **Container Security**: Non-root execution and minimal attack surface
- **Privacy Protection**: Build system removes all personal information

### Documentation
- **DOCKER_DEPLOYMENT.md**: Complete Docker setup and configuration guide
- **DOCKER_RELEASE_NOTES.md**: Detailed Docker publishing and usage documentation
- **BUILD.md**: Enhanced build-from-source instructions
- **RELEASE_NOTES_v1.1.0.md**: Comprehensive changelog and migration guide
- **TECHNICAL_IMPLEMENTATION.md**: Restored dual-layer filtering architecture documentation
- **QUICK_START.md**: 30-second deployment guide for rapid setup

---

## [1.0.0] - 2025-07-06

### Added
- **Content Filtering System**: Comprehensive rating-based filtering for movies and TV shows
- **User Rating Preferences**: Individual user configuration for maximum allowed ratings
- **Movie Rating Support**: G, PG, PG-13, R, NC-17, Adult content filtering
- **TV Rating Support**: TV-Y, TV-Y7, TV-G, TV-PG, TV-14, TV-MA filtering
- **Automatic API Filtering**: Content filtering applied at TMDB API level
- **Database Migration**: New user settings table for rating preferences
- **Enhanced User Settings**: Rating preference UI in user profile settings
- **Admin Controls**: Rating preferences management in admin user settings
- **Professional Implementation**: Clean, maintainable content filtering architecture

### Enhanced
- **TMDB Integration**: Extended to support rating-based filtering parameters
- **User Interface**: Added rating preference controls to settings pages
- **Database Schema**: Enhanced user settings with rating preference fields
- **Performance**: Optimized filtering with minimal impact on existing functionality

### Technical Details
- New database migration: `1751780113000-AddUserRatingPreferences.ts`
- Enhanced user settings entity with rating fields
- TMDB API wrapper updated with filtering capabilities
- React components for rating preference management
- Comprehensive testing and validation

### Documentation
- Installation guides and setup instructions
- Content filtering configuration documentation
- Technical implementation details
- User guide for rating preferences

---

**Note**: This fork maintains full compatibility with original Overseerr while adding content filtering capabilities. All original features and functionality are preserved.

For the complete list of original Overseerr features and changes, see the [upstream repository](https://github.com/sct/overseerr).
