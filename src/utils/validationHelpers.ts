/**
 * Matches a valid DNS name (hostname). Requires at least one dot and one character before the TLD.
 */
export const dnsValidationRegex =
  /^[a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF_~-]+(\.[a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF-_]+)+/g;

/**
 * Matches a valid IPv4 address. Disallows leading zeros.
 */
export const ipv4ValidationRegex =
  /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

/**
 * Matches a valid IPv6 addresses, including reduced forms.
 * @note might not be 100% accurate, but should cover most cases AND is easy to understand.
 */
export const ipv6ValidationRegex =
  /^(([0-9A-Fa-f]{1,4}:){7})([0-9A-Fa-f]{1,4})$|(([0-9A-Fa-f]{1,4}:){1,6}:)(([0-9A-Fa-f]{1,4}:){0,4})([0-9A-Fa-f]{1,4})$/;

/**
 * Matches a valid hostname (DNS, IPv4, or IPv6).
 * @see {@link ipv4ValidationRegex} {@link ipv6ValidationRegex} {@link dnsValidationRegex}
 * @note combining dns and IP validation results in some combinations being accepted even though they should not really be
 * such as 256.256.256.256 etc., but good enough.
 */
export const hostnameValidationRegex = new RegExp(
  `^(?:${ipv4ValidationRegex.source}|${ipv6ValidationRegex.source}|${dnsValidationRegex.source})$`
);
