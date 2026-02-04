import { formatBytes } from '@app/utils/numberHelpers';
import { describe, expect, it } from 'vitest';

describe('formatBytes', () => {
  describe('basic conversions', () => {
    it('should return "0 Bytes" for 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(1)).toBe('1 Bytes');
      expect(formatBytes(100)).toBe('100 Bytes');
      expect(formatBytes(512)).toBe('512 Bytes');
      expect(formatBytes(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2048)).toBe('2 KB');
      expect(formatBytes(10240)).toBe('10 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
      expect(formatBytes(10485760)).toBe('10 MB');
      expect(formatBytes(104857600)).toBe('100 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1610612736)).toBe('1.5 GB');
      expect(formatBytes(10737418240)).toBe('10 GB');
    });

    it('should format terabytes correctly', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB');
      expect(formatBytes(1649267441664)).toBe('1.5 TB');
    });

    it('should format petabytes correctly', () => {
      expect(formatBytes(1125899906842624)).toBe('1 PB');
    });
  });

  describe('decimal precision', () => {
    it('should use 2 decimal places by default', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1234567)).toBe('1.18 MB');
    });

    it('should respect custom decimal places', () => {
      expect(formatBytes(1234567, 0)).toBe('1 MB');
      expect(formatBytes(1234567, 1)).toBe('1.2 MB');
      expect(formatBytes(1234567, 3)).toBe('1.177 MB');
      expect(formatBytes(1234567, 4)).toBe('1.1774 MB');
    });

    it('should handle negative decimal places as 0', () => {
      expect(formatBytes(1536, -1)).toBe('2 KB');
      expect(formatBytes(1536, -5)).toBe('2 KB');
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      // Exabyte
      expect(formatBytes(1152921504606846976)).toBe('1 EB');
      // Zettabyte
      expect(formatBytes(1180591620717411303424)).toBe('1 ZB');
    });

    it('should handle fractional bytes (rounds down)', () => {
      expect(formatBytes(1.5)).toBe('1.5 Bytes');
      expect(formatBytes(1.999)).toBe('2 Bytes');
    });

    it('should handle exact power of 1024 boundaries', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('real-world scenarios', () => {
    it('should format typical file sizes', () => {
      // Small text file
      expect(formatBytes(4096)).toBe('4 KB');
      // Image file
      expect(formatBytes(2500000)).toBe('2.38 MB');
      // Video file
      expect(formatBytes(734003200)).toBe('700 MB');
      // Movie file
      expect(formatBytes(4294967296)).toBe('4 GB');
      // Blu-ray movie
      expect(formatBytes(25769803776)).toBe('24 GB');
    });

    it('should format download speeds', () => {
      // 100 Mbps in bytes
      expect(formatBytes(12500000)).toBe('11.92 MB');
      // 1 Gbps in bytes
      expect(formatBytes(125000000)).toBe('119.21 MB');
    });
  });
});
