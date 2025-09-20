import { ANIME_KEYWORD_ID } from '@server/api/themoviedb/constants';

const ANIME_KEYWORD_NAME = 'anime';

const toKeywordArray = (keywords: unknown): unknown[] => {
  if (Array.isArray(keywords)) {
    return keywords;
  }

  if (keywords && typeof keywords === 'object') {
    const candidate = keywords as {
      keywords?: unknown;
      results?: unknown;
    };

    if (Array.isArray(candidate.keywords)) {
      return candidate.keywords;
    }

    if (Array.isArray(candidate.results)) {
      return candidate.results;
    }
  }

  return [];
};

export const hasAnimeKeyword = (keywords: unknown): boolean => {
  const keywordList = toKeywordArray(keywords);

  return keywordList.some((keyword) => {
    if (typeof keyword === 'string') {
      return keyword.trim().toLowerCase() === ANIME_KEYWORD_NAME;
    }

    if (keyword && typeof keyword === 'object') {
      const candidate = keyword as { id?: number; name?: string };

      if (candidate.id === ANIME_KEYWORD_ID) {
        return true;
      }

      if (
        typeof candidate.name === 'string' &&
        candidate.name.trim().toLowerCase() === ANIME_KEYWORD_NAME
      ) {
        return true;
      }
    }

    return false;
  });
};

export default hasAnimeKeyword;
