import { DocumentTextIcon } from '@heroicons/react/outline';
import React, { useState } from 'react';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';
import ReactMarkdown from 'react-markdown';
import useSWR from 'swr';
import globalMessages from '../../../../i18n/globalMessages';
import Badge from '../../../Common/Badge';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import Modal from '../../../Common/Modal';
import Transition from '../../../Transition';

const messages = defineMessages({
  releases: 'Releases',
  releasedataMissing: 'Release data is currently unavailable.',
  versionChangelog: '{version} Changelog',
  viewongithub: 'View on GitHub',
  latestversion: 'Latest',
  currentversion: 'Current',
  viewchangelog: 'View Changelog',
});

const REPO_RELEASE_API =
  'https://api.github.com/repos/sct/overseerr/releases?per_page=20';

interface GitHubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  tarball_url: string;
  zipball_url: string;
  body: string;
}

interface ReleaseProps {
  release: GitHubRelease;
  isLatest: boolean;
  currentVersion: string;
}

const Release: React.FC<ReleaseProps> = ({
  currentVersion,
  release,
  isLatest,
}) => {
  const intl = useIntl();
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col w-full px-4 py-2 space-y-3 bg-gray-800 rounded-md shadow-md sm:space-y-0 sm:space-x-3 sm:flex-row ring-1 ring-gray-700">
      <Transition
        enter="opacity-0 transition duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100 transition duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={isModalOpen}
      >
        <Modal
          onCancel={() => setModalOpen(false)}
          iconSvg={<DocumentTextIcon />}
          title={intl.formatMessage(messages.versionChangelog, {
            version: release.name,
          })}
          cancelText={intl.formatMessage(globalMessages.close)}
          okText={intl.formatMessage(messages.viewongithub)}
          onOk={() => {
            window.open(release.html_url, '_blank');
          }}
        >
          <div className="prose">
            <ReactMarkdown>{release.body}</ReactMarkdown>
          </div>
        </Modal>
      </Transition>
      <div className="flex items-center justify-center flex-grow w-full space-x-2 truncate sm:justify-start">
        <span className="text-lg font-bold truncate">
          <span className="mr-2 text-xs font-normal whitespace-nowrap">
            <FormattedRelativeTime
              value={Math.floor(
                (new Date(release.created_at).getTime() - Date.now()) / 1000
              )}
              updateIntervalInSeconds={1}
              numeric="auto"
            />
          </span>
          {release.name}
        </span>
        {isLatest && (
          <Badge badgeType="success">
            {intl.formatMessage(messages.latestversion)}
          </Badge>
        )}
        {release.name.includes(currentVersion) && (
          <Badge badgeType="primary">
            {intl.formatMessage(messages.currentversion)}
          </Badge>
        )}
      </div>
      <Button buttonType="primary" onClick={() => setModalOpen(true)}>
        <DocumentTextIcon />
        <span>{intl.formatMessage(messages.viewchangelog)}</span>
      </Button>
    </div>
  );
};

interface ReleasesProps {
  currentVersion: string;
}

const Releases: React.FC<ReleasesProps> = ({ currentVersion }) => {
  const intl = useIntl();
  const { data, error } = useSWR<GitHubRelease[]>(REPO_RELEASE_API);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="text-gray-300">
        {intl.formatMessage(messages.releasedataMissing)}
      </div>
    );
  }

  return (
    <div>
      <h3 className="heading">{intl.formatMessage(messages.releases)}</h3>
      <div className="space-y-3 section">
        {data.map((release, index) => {
          return (
            <div key={`release-${release.id}`}>
              <Release
                release={release}
                currentVersion={currentVersion}
                isLatest={index === 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Releases;
