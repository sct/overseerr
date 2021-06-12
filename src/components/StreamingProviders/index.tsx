import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { WatchProviderDetails } from '../../../server/models/common';

const messages = defineMessages({
  streamingproviders: 'Currently Streaming On',
});

interface StreamingProvidersProps {
  streamingProviders: WatchProviderDetails[];
}

const StreamingProviders: React.FC<StreamingProvidersProps> = ({
  streamingProviders,
}) => {
  const intl = useIntl();

  return (
    <>
      {!!streamingProviders.length && (
        <div className="media-fact">
          <span>{intl.formatMessage(messages.streamingproviders)}</span>
          <span className="media-fact-value">
            {streamingProviders.map((p) => {
              return (
                <span className="block" key={`provider-${p.id}`}>
                  {p.name}
                </span>
              );
            })}
          </span>
        </div>
      )}
    </>
  );
};

export default StreamingProviders;
