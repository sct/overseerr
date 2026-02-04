import { refreshIntervalHelper } from '@app/utils/refreshIntervalHelper';
import type { DownloadingItem } from '@server/lib/downloadtracker';
import { describe, expect, it } from 'vitest';

// Helper to create mock downloading items
const createDownloadingItem = (id = 1): DownloadingItem =>
  ({
    mediaType: 'movie',
    externalId: id,
    size: 1024,
    sizeLeft: 512,
    status: 'downloading',
    timeLeft: '1h',
    estimatedCompletionTime: new Date(),
    title: `Test Item ${id}`,
  } as DownloadingItem);

describe('refreshIntervalHelper', () => {
  const DEFAULT_TIMER = 5000;

  describe('when downloads are active', () => {
    it('should return timer when downloadStatus has items', () => {
      const downloadItem = {
        downloadStatus: [createDownloadingItem(1)],
        downloadStatus4k: undefined,
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(DEFAULT_TIMER);
    });

    it('should return timer when downloadStatus4k has items', () => {
      const downloadItem = {
        downloadStatus: undefined,
        downloadStatus4k: [createDownloadingItem(1)],
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(DEFAULT_TIMER);
    });

    it('should return timer when both have items', () => {
      const downloadItem = {
        downloadStatus: [createDownloadingItem(1)],
        downloadStatus4k: [createDownloadingItem(2)],
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(DEFAULT_TIMER);
    });

    it('should return timer when multiple downloads are active', () => {
      const downloadItem = {
        downloadStatus: [
          createDownloadingItem(1),
          createDownloadingItem(2),
          createDownloadingItem(3),
        ],
        downloadStatus4k: [createDownloadingItem(4), createDownloadingItem(5)],
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(DEFAULT_TIMER);
    });
  });

  describe('when no downloads are active', () => {
    it('should return 0 when both are undefined', () => {
      const downloadItem = {
        downloadStatus: undefined,
        downloadStatus4k: undefined,
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(0);
    });

    it('should return 0 when both are empty arrays', () => {
      const downloadItem = {
        downloadStatus: [],
        downloadStatus4k: [],
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(0);
    });

    it('should return 0 when downloadStatus is empty and downloadStatus4k is undefined', () => {
      const downloadItem = {
        downloadStatus: [],
        downloadStatus4k: undefined,
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(0);
    });

    it('should return 0 when downloadStatus is undefined and downloadStatus4k is empty', () => {
      const downloadItem = {
        downloadStatus: undefined,
        downloadStatus4k: [],
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(0);
    });
  });

  describe('timer values', () => {
    it('should return custom timer value when downloads active', () => {
      const downloadItem = {
        downloadStatus: [createDownloadingItem(1)],
        downloadStatus4k: undefined,
      };

      expect(refreshIntervalHelper(downloadItem, 1000)).toBe(1000);
      expect(refreshIntervalHelper(downloadItem, 10000)).toBe(10000);
      expect(refreshIntervalHelper(downloadItem, 30000)).toBe(30000);
    });

    it('should return 0 regardless of timer value when no downloads', () => {
      const downloadItem = {
        downloadStatus: [],
        downloadStatus4k: [],
      };

      expect(refreshIntervalHelper(downloadItem, 1000)).toBe(0);
      expect(refreshIntervalHelper(downloadItem, 10000)).toBe(0);
      expect(refreshIntervalHelper(downloadItem, 30000)).toBe(0);
    });

    it('should handle timer value of 0', () => {
      const downloadItem = {
        downloadStatus: [createDownloadingItem(1)],
        downloadStatus4k: undefined,
      };

      const result = refreshIntervalHelper(downloadItem, 0);

      expect(result).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large timer values', () => {
      const downloadItem = {
        downloadStatus: [createDownloadingItem(1)],
        downloadStatus4k: undefined,
      };

      const largeTimer = 999999999;
      const result = refreshIntervalHelper(downloadItem, largeTimer);

      expect(result).toBe(largeTimer);
    });

    it('should only check array length, not content', () => {
      // Even if download items have unusual properties, as long as array has length > 0
      const downloadItem = {
        downloadStatus: [{}] as DownloadingItem[],
        downloadStatus4k: undefined,
      };

      const result = refreshIntervalHelper(downloadItem, DEFAULT_TIMER);

      expect(result).toBe(DEFAULT_TIMER);
    });
  });

  describe('real-world scenarios', () => {
    it('should enable polling when movie is downloading', () => {
      const movieDownload = {
        downloadStatus: [
          {
            mediaType: 'movie',
            externalId: 12345,
            size: 2147483648, // 2GB
            sizeLeft: 1073741824, // 1GB left
            status: 'downloading',
            timeLeft: '30m',
            estimatedCompletionTime: new Date(Date.now() + 30 * 60 * 1000),
            title: 'Inception',
          } as DownloadingItem,
        ],
        downloadStatus4k: undefined,
      };

      // Typical refresh interval of 5 seconds
      const result = refreshIntervalHelper(movieDownload, 5000);

      expect(result).toBe(5000);
    });

    it('should disable polling when download completes', () => {
      const completedDownload = {
        downloadStatus: [], // Empty after download completes
        downloadStatus4k: [],
      };

      const result = refreshIntervalHelper(completedDownload, 5000);

      expect(result).toBe(0);
    });

    it('should enable polling for 4K content downloads', () => {
      const download4k = {
        downloadStatus: [],
        downloadStatus4k: [
          {
            mediaType: 'movie',
            externalId: 67890,
            size: 42949672960, // ~40GB 4K movie
            sizeLeft: 21474836480, // 20GB left
            status: 'downloading',
            timeLeft: '2h',
            estimatedCompletionTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
            title: 'Dune (4K)',
          } as DownloadingItem,
        ],
      };

      const result = refreshIntervalHelper(download4k, 5000);

      expect(result).toBe(5000);
    });
  });
});
