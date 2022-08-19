import Router from 'next/router';
import PR from 'pulltorefreshjs';
import { useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { RefreshIcon } from '@heroicons/react/outline';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  reload: 'Reload',
  reloading: 'Reloading',
});

const PullToRefresh: React.FC = () => {
  const intl = useIntl();

  useEffect(() => {
    PR.init({
      mainElement: '#pull-to-refresh',
      onRefresh() {
        Router.reload();
      },
      iconArrow: ReactDOMServer.renderToString(
        <div className="z-50 flex items-center justify-center">
          <RefreshIcon className="z-50 h-10 w-10 text-white" />
        </div>
      ),
      iconRefreshing: ReactDOMServer.renderToString(
        <div className="z-50 flex items-center justify-center">
          <RefreshIcon
            className="z-50 h-10 w-10 animate-spin text-white"
            style={{ animationDirection: 'reverse' }}
          />
        </div>
      ),
      instructionsPullToRefresh: ReactDOMServer.renderToString(
        <div>
          <p className="z-50 text-white">
            {intl.formatMessage(messages.reload)}
          </p>
        </div>
      ),
      instructionsReleaseToRefresh: ReactDOMServer.renderToString(
        <div>
          <p className="z-50 text-white">
            {intl.formatMessage(messages.reload)}
          </p>
        </div>
      ),
      instructionsRefreshing: ReactDOMServer.renderToString(
        <div>
          <p className="z-50 text-white">
            {intl.formatMessage(messages.reloading)}
          </p>
        </div>
      ),
      distReload: 90,
    });
    return () => {
      PR.destroyAll();
    };
  }, [intl]);

  return <div id="pull-to-refresh"></div>;
};

export default PullToRefresh;
