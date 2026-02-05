// Validation utilities for OverseerrV2

/**
 * Validates MusicBrainz ID format
 * MusicBrainz IDs are UUIDs in the format: 12345678-1234-1234-1234-123456789012
 */
export const isValidMBID = (mbid: string): boolean => {
  if (!mbid || typeof mbid !== 'string') {
    return false;
  }

  // Use Unicode escape sequences instead of control characters to avoid ESLint no-control-regex error
  const mbidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return mbidRegex.test(mbid.trim());
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates URL format
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates that a string contains only alphanumeric characters and underscores
 */
export const isValidUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') {
    return false;
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username.trim());
};

/**
 * Validates password strength (minimum 8 characters, at least one uppercase, one lowercase, one number)
 */
export const isValidPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validates a port number (1-65535)
 */
export const isValidPort = (port: number) => {
  // Remove type annotation since it's trivially inferred from the number literal - fixes no-inferrable-types
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

/**
 * Validates an IP address (IPv4)
 */
export const isValidIPv4 = (ip: string): boolean => {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip.trim());
};

/**
 * Sanitizes input to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 1000); // Limit length to prevent DoS
};

/**
 * Sanitizes a search query for MusicBrainz/Lucene-style search.
 * Escapes special characters that could break or exploit the query.
 */
export const sanitizeSearchQuery = (input: string | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[\\+&|!(){}[\]^"~*?:]/g, '') // Remove Lucene special chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 500); // Limit length
};

/**
 * Parses a string to a positive integer. Returns undefined if invalid.
 */
export const toPositiveInteger = (
  value: string | undefined
): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = parseInt(value, 10);
  return Number.isInteger(num) && num > 0 ? num : undefined;
};

export interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Validates and normalizes pagination parameters.
 * @param page - Page number (1-based)
 * @param limit - Items per page, or default limit when page is provided
 * @param maxLimit - Maximum allowed limit
 */
export const validatePagination = (
  page?: string,
  limit?: string | number,
  maxLimit = 100
): PaginationResult => {
  const defaultLimit = 25;
  const parsedPage = toPositiveInteger(page) ?? 1;
  const limitNum =
    typeof limit === 'number'
      ? Math.min(limit, maxLimit)
      : toPositiveInteger(String(limit)) ?? defaultLimit;
  const clampedLimit = Math.min(Math.max(1, limitNum), maxLimit);
  const offset = (parsedPage - 1) * clampedLimit;

  return {
    page: parsedPage,
    limit: clampedLimit,
    offset,
  };
};
