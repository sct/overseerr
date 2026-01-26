/**
 * Validates if a string is a valid UUID (MusicBrainz ID format)
 * MusicBrainz IDs are UUIDs in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export const isValidMBID = (mbid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(mbid);
};

/**
 * Validates if a value is a valid positive integer (for IDs, page numbers, etc.)
 * Prevents NaN, negative numbers, and non-integers
 */
export const isValidPositiveInteger = (
  value: string | number | undefined | null
): boolean => {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  const num = Number(value);
  return (
    !isNaN(num) &&
    Number.isInteger(num) &&
    num > 0 &&
    num <= Number.MAX_SAFE_INTEGER
  );
};

/**
 * Validates and safely converts a value to a positive integer
 * Returns undefined if invalid
 */
export const toPositiveInteger = (
  value: string | number | undefined | null
): number | undefined => {
  if (!isValidPositiveInteger(value)) {
    return undefined;
  }
  return Number(value);
};

/**
 * Sanitizes a search query string to prevent injection attacks
 * Removes potentially dangerous characters while allowing normal search terms
 */
export const sanitizeSearchQuery = (query: string): string => {
  // Remove null bytes and control characters
  return query
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 200); // Limit length to prevent DoS
};

/**
 * Validates and normalizes pagination parameters
 */
export const validatePagination = (
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
): { page: number; limit: number; offset: number } => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, Number(limit) || 25));

  return {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
  };
};
