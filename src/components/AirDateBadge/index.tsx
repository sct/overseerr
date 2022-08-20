import Badge from '@app/components/Common/Badge';
import { selectUnit } from '@formatjs/intl-utils';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';

const messages = defineMessages({
  airedrelative: 'Aired {relativeTime}',
  airsrelative: 'Airs {relativeTime}',
});

type AirDateBadgeProps = {
  airDate: string;
};

const AirDateBadge = ({ airDate }: AirDateBadgeProps) => {
  const intl = useIntl();
  const alreadyAired = new Date(airDate).getTime() < new Date().getTime();
  const { value, unit } = selectUnit(Math.floor(new Date(airDate).getTime()));

  return (
    <Badge badgeType="light">
      {intl.formatMessage(
        alreadyAired ? messages.airedrelative : messages.airsrelative,
        {
          relativeTime: (
            <FormattedRelativeTime value={value} numeric="auto" unit={unit} />
          ),
        }
      )}
    </Badge>
  );
};

export default AirDateBadge;
