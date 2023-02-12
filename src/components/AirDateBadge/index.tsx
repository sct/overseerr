import Badge from '@app/components/Common/Badge';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';

const messages = defineMessages({
  airedrelative: 'Aired {relativeTime}',
  airsrelative: 'Airing {relativeTime}',
});

type AirDateBadgeProps = {
  airDate: string;
};

const AirDateBadge = ({ airDate }: AirDateBadgeProps) => {
  const WEEK = 1000 * 60 * 60 * 24 * 8;
  const intl = useIntl();
  const dAirDate = new Date(airDate);
  const nowDate = new Date();
  const dAirDateOffset =
    dAirDate.getTime() - dAirDate.getTimezoneOffset() * -60000;
  const alreadyAired = dAirDateOffset < nowDate.getTime();

  const compareWeek = new Date(
    alreadyAired ? Date.now() - WEEK : Date.now() + WEEK
  );

  let showRelative = false;

  if (
    (alreadyAired && dAirDateOffset > compareWeek.getTime()) ||
    (!alreadyAired && dAirDateOffset < compareWeek.getTime())
  ) {
    showRelative = true;
  }

  const relativeTime = (dAirDateOffset - Date.now()) / 1000;

  const within24Hours = Math.floor(Math.abs(relativeTime / (60 * 60))) <= 24;

  return (
    <div className="flex items-center space-x-2">
      <Badge badgeType="light">
        {intl.formatDate(dAirDate, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        })}
      </Badge>
      {showRelative && (
        <Badge badgeType="light">
          {intl.formatMessage(
            alreadyAired ? messages.airedrelative : messages.airsrelative,
            {
              relativeTime: within24Hours ? (
                alreadyAired ? (
                  'today'
                ) : (
                  'tomorrow'
                )
              ) : (
                <FormattedRelativeTime
                  value={relativeTime}
                  numeric="auto"
                  updateIntervalInSeconds={1}
                />
              ),
            }
          )}
        </Badge>
      )}
    </div>
  );
};

export default AirDateBadge;
