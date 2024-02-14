import CreateIssueModal from '@app/components/IssueModal/CreateIssueModal';
import { Transition } from '@headlessui/react';
import type { SecondaryType } from '@server/constants/media';

interface IssueModalProps {
  show?: boolean;
  onCancel: () => void;
  mediaType: 'movie' | 'tv' | 'music';
  tmdbId?: number;
  mbId?: string;
  secondaryType?: SecondaryType;
  issueId?: never;
}

const IssueModal = ({ show, mediaType, onCancel, tmdbId, mbId, secondaryType }: IssueModalProps) => (
  <Transition
    as="div"
    enter="transition-opacity duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leave="transition-opacity duration-300"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
    show={show}
  >
    <CreateIssueModal
      mediaType={mediaType}
      onCancel={onCancel}
      tmdbId={tmdbId}
      mbId={mbId}
      secondaryType={secondaryType}
    />
  </Transition>
);

export default IssueModal;
