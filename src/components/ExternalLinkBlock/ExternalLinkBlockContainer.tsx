import type { ExternalLinkBlockProps } from '@app/components/ExternalLinkBlock/ExternalLinkBlockItems';
import { ExternalLinkBlockItems } from '@app/components/ExternalLinkBlock/ExternalLinkBlockItems';

export const ExternalLinkBlock = (props: ExternalLinkBlockProps) => {
  return (
    <div className="flex w-full items-center justify-center space-x-5">
      <ExternalLinkBlockItems {...props} />
    </div>
  );
};
