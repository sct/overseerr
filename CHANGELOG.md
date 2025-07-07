# Changelog

All notable changes to Overseerr Content Filtering will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
