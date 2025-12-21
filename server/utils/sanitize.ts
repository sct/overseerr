 // Sanitizes a display name per Radarr/Sonarr requirements
 // Must contain only lowercase letters (a-z), numbers (0-9), and hyphens (-)
export const sanitizeDisplayName = (displayName: string): string => {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
};
