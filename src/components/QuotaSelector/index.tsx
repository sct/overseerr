import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  movieRequestLimit: '{quotaLimit} movie(s) per {quotaDays} day(s)',
  tvRequestLimit: '{quotaLimit} season(s) per {quotaDays} day(s)',
  unlimited: 'Unlimited',
});

interface QuotaSelectorProps {
  mediaType: 'movie' | 'tv';
  defaultDays?: number;
  defaultLimit?: number;
  dayOverride?: number;
  limitOverride?: number;
  dayFieldName: string;
  limitFieldName: string;
  isDisabled?: boolean;
  onChange: (fieldName: string, value: number) => void;
}

const QuotaSelector: React.FC<QuotaSelectorProps> = ({
  mediaType,
  dayFieldName,
  limitFieldName,
  defaultDays = 7,
  defaultLimit = 0,
  dayOverride,
  limitOverride,
  isDisabled = false,
  onChange,
}) => {
  const initialDays = defaultDays ?? 7;
  const initialLimit = defaultLimit ?? 0;
  const [quotaDays, setQuotaDays] = useState(initialDays);
  const [quotaLimit, setQuotaLimit] = useState(initialLimit);
  const intl = useIntl();

  useEffect(() => {
    onChange(dayFieldName, quotaDays);
  }, [dayFieldName, onChange, quotaDays]);

  useEffect(() => {
    onChange(limitFieldName, quotaLimit);
  }, [limitFieldName, onChange, quotaLimit]);

  return (
    <div className={`${isDisabled ? 'opacity-50' : ''}`}>
      {intl.formatMessage(
        mediaType === 'movie'
          ? messages.movieRequestLimit
          : messages.tvRequestLimit,
        {
          quotaLimit: (
            <select
              className="inline short"
              value={limitOverride ?? quotaLimit}
              onChange={(e) => setQuotaLimit(Number(e.target.value))}
              disabled={isDisabled}
            >
              <option value="0">
                {intl.formatMessage(messages.unlimited)}
              </option>
              {[...Array(100)].map((_item, i) => (
                <option value={i + 1} key={`${mediaType}-limit-${i + 1}`}>
                  {i + 1}
                </option>
              ))}
            </select>
          ),
          quotaDays: (
            <select
              className="inline short"
              value={dayOverride ?? quotaDays}
              onChange={(e) => setQuotaDays(Number(e.target.value))}
              disabled={isDisabled}
            >
              {[...Array(100)].map((_item, i) => (
                <option value={i + 1} key={`${mediaType}-days-${i + 1}`}>
                  {i + 1}
                </option>
              ))}
            </select>
          ),
        }
      )}
    </div>
  );
};

export default React.memo(QuotaSelector);
