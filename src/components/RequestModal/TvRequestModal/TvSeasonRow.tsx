import Badge from '@app/components/Common/Badge';
import useSettings from '@app/hooks/useSettings';
import globalMessages from '@app/i18n/globalMessages';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import Season from '@server/entity/Season';
import type SeasonRequest from '@server/entity/SeasonRequest';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import type { TvDetails } from '@server/models/Tv';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  seasonnumber: 'Season {number}',
  extras: 'Extras',
  futureSeason: 'Future season(s)',
});

interface FutureSeason extends TvSeason {
  upcomingSeasonNumber: number;
  season?: never;
  seasonRequest?: never;
  mediaSeason?: never;
}

interface ExistingSeason extends TvSeason {
  upcomingSeasonNumber?: number;
  season: TvDetails['seasons'][0];
  seasonRequest?: SeasonRequest;
  mediaSeason?: Season;
}

interface TvSeason {
  editingSeasons: number[];
  isSelectedSeason: (seasonNumber: number) => boolean;
  toggleSeason: (seasonNumber: number) => void;
  quota?: QuotaResponse;
  currentlyRemaining: number;
  is4k?: boolean;
}

type TvSeasonRowProps = ExistingSeason | FutureSeason;

const TvSeasonRow = ({
  season,
  upcomingSeasonNumber,
  seasonRequest,
  mediaSeason,
  editingSeasons,
  isSelectedSeason,
  toggleSeason,
  quota,
  currentlyRemaining,
  is4k,
}: TvSeasonRowProps) => {
  const intl = useIntl();
  const settings = useSettings();

  const rowSeasonNumber = Number(season?.seasonNumber || upcomingSeasonNumber);

  return (
    <tr key={`season-${season?.id || 'upcoming'}`}>
      <td
        className={`whitespace-nowrap px-4 py-4 text-sm font-medium leading-5 text-gray-100 ${
          !settings.currentSettings.partialRequestsEnabled && 'hidden'
        }`}
      >
        <span
          role="checkbox"
          tabIndex={0}
          aria-checked={
            !!mediaSeason ||
            (!!seasonRequest && !editingSeasons.includes(rowSeasonNumber)) ||
            isSelectedSeason(rowSeasonNumber)
          }
          onClick={() => toggleSeason(rowSeasonNumber)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
              toggleSeason(rowSeasonNumber);
            }
          }}
          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center pt-2 focus:outline-none ${
            mediaSeason ||
            (quota?.tv.limit &&
              currentlyRemaining <= 0 &&
              !isSelectedSeason(rowSeasonNumber)) ||
            (!!seasonRequest && !editingSeasons.includes(rowSeasonNumber))
              ? 'opacity-50'
              : ''
          }`}
        >
          <span
            aria-hidden="true"
            className={`${
              !!mediaSeason ||
              (!!seasonRequest && !editingSeasons.includes(rowSeasonNumber)) ||
              isSelectedSeason(rowSeasonNumber)
                ? 'bg-indigo-500'
                : 'bg-gray-700'
            } absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out`}
          ></span>
          <span
            aria-hidden="true"
            className={`${
              !!mediaSeason ||
              (!!seasonRequest && !editingSeasons.includes(rowSeasonNumber)) ||
              isSelectedSeason(rowSeasonNumber)
                ? 'translate-x-5'
                : 'translate-x-0'
            } absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow transition-transform duration-200 ease-in-out group-focus:border-blue-300 group-focus:ring`}
          ></span>
        </span>
      </td>
      <td className="whitespace-nowrap px-1 py-4 text-sm font-medium leading-5 text-gray-100 md:px-6">
        {upcomingSeasonNumber
          ? intl.formatMessage(messages.futureSeason)
          : rowSeasonNumber === 0
          ? intl.formatMessage(messages.extras)
          : intl.formatMessage(messages.seasonnumber, {
              number: rowSeasonNumber,
            })}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm leading-5 text-gray-200 md:px-6">
        {season?.episodeCount}
      </td>
      <td className="whitespace-nowrap py-4 pr-2 text-sm leading-5 text-gray-200 md:px-6">
        {!seasonRequest && !mediaSeason && (
          <Badge>{intl.formatMessage(globalMessages.notrequested)}</Badge>
        )}
        {!mediaSeason &&
          seasonRequest?.status === MediaRequestStatus.PENDING && (
            <Badge badgeType="warning">
              {intl.formatMessage(globalMessages.pending)}
            </Badge>
          )}
        {((!mediaSeason &&
          seasonRequest?.status === MediaRequestStatus.APPROVED) ||
          mediaSeason?.[is4k ? 'status4k' : 'status'] ===
            MediaStatus.PROCESSING) && (
          <Badge badgeType="primary">
            {intl.formatMessage(globalMessages.requested)}
          </Badge>
        )}
        {upcomingSeasonNumber === undefined && (
          <>
            {mediaSeason?.[is4k ? 'status4k' : 'status'] ===
              MediaStatus.PARTIALLY_AVAILABLE && (
              <Badge badgeType="success">
                {intl.formatMessage(globalMessages.partiallyavailable)}
              </Badge>
            )}
            {mediaSeason?.[is4k ? 'status4k' : 'status'] ===
              MediaStatus.AVAILABLE && (
              <Badge badgeType="success">
                {intl.formatMessage(globalMessages.available)}
              </Badge>
            )}
          </>
        )}
      </td>
    </tr>
  );
};

export default TvSeasonRow;
