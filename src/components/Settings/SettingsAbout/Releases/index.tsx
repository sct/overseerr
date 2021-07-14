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
  versionHistory: 'Version History',
  releasedataMissing: 'Data is currently unavailable.',
  viewongithub: 'View on GitHub',
  latestversion: 'Latest',
  currentversion: 'Current',
  viewchangelog: 'View Changelog',
});

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

interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    message: string;
  };
  url: string;
  html_url: string;
  comments_url: string;
}

interface ReleaseProps {
  name: string;
  url: string;
  description: string;
  timestamp: string;
  isCurrent: boolean;
  isLatest: boolean;
}

const Release: React.FC<ReleaseProps> = ({
  name,
  url,
  description,
  timestamp,
  isCurrent,
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
          title={name}
          cancelText={intl.formatMessage(globalMessages.close)}
          okText={intl.formatMessage(messages.viewongithub)}
          onOk={() => {
            window.open(url, '_blank');
          }}
        >
          <div className="prose">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        </Modal>
      </Transition>
      <div className="flex items-center justify-center flex-grow w-full space-x-2 truncate sm:justify-start">
        <span className="text-lg font-bold truncate">
          <span className="mr-2 text-xs font-normal whitespace-nowrap">
            <FormattedRelativeTime
              value={Math.floor(
                (new Date(timestamp).getTime() - Date.now()) / 1000
              )}
              updateIntervalInSeconds={1}
              numeric="auto"
            />
          </span>
          {name}
        </span>
        {isLatest && (
          <Badge badgeType="success">
            {intl.formatMessage(messages.latestversion)}
          </Badge>
        )}
        {isCurrent && (
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

  const REPO_API = `https://api.github.com/repos/sct/overseerr/${
    currentVersion.startsWith('develop-') ? 'commits' : 'releases'
  }?per_page=20`;
  const { data, error } = useSWR<GitHubRelease[] | GitHubCommit[]>(REPO_API);

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
      <h3 className="heading">{intl.formatMessage(messages.versionHistory)}</h3>
      <div className="space-y-3 section">
        {currentVersion.startsWith('develop-')
          ? (data as GitHubCommit[])
              .filter((commit) => !commit.commit.message.includes('[skip ci]'))
              .map((commit, index) => {
                return (
                  <div key={`commit-${commit.sha}`}>
                    <Release
                      name={commit.sha}
                      url={commit.html_url}
                      description={commit.commit.message}
                      timestamp={commit.commit.author.date}
                      isCurrent={currentVersion.includes(commit.sha)}
                      isLatest={index === 0}
                    />
                  </div>
                );
              })
          : (data as GitHubRelease[]).map((release, index) => {
              return (
                <div key={`release-${release.id}`}>
                  <Release
                    name={release.name}
                    url={release.html_url}
                    description={release.body}
                    timestamp={release.created_at}
                    isCurrent={release.name.includes(currentVersion)}
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
