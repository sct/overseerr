export interface EpisodeAirDateSource {
  airDateUtc?: string | null;
  airDate?: string | null;
}

export const getEpisodeAirDate = (
  episode: EpisodeAirDateSource
): number | undefined => {
  const rawAirDate = episode.airDateUtc ?? episode.airDate;

  if (!rawAirDate) {
    return undefined;
  }

  const parsedAirDate = Date.parse(rawAirDate);

  if (Number.isNaN(parsedAirDate)) {
    return undefined;
  }

  const parsedDate = new Date(parsedAirDate);
  const parsedYear = parsedDate.getUTCFullYear();

  if (!Number.isFinite(parsedYear) || parsedYear <= 1) {
    return undefined;
  }

  return parsedAirDate;
};
