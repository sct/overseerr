import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import SlideCheckbox from '@app/components/Common/SlideCheckbox';
import Tooltip from '@app/components/Common/Tooltip';
import { MenuIcon, XIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-aria';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';

const messages = defineMessages({
  deletesuccess: 'Sucessfully deleted slider.',
  deletefail: 'Failed to delete slider.',
  remove: 'Remove',
  enable: 'Toggle Visibility',
});

const Position = {
  None: 'None',
  Above: 'Above',
  Below: 'Below',
} as const;

type DiscoverOptionProps = {
  id: number;
  title: string;
  subtitle?: string;
  data?: string;
  enabled?: boolean;
  isBuiltIn?: boolean;
  onEnable: () => void;
  onDelete: () => void;
  onPositionUpdate: (
    updatedItemId: number,
    position: keyof typeof Position
  ) => void;
};

const DiscoverOption = ({
  id,
  title,
  enabled,
  onPositionUpdate,
  onEnable,
  subtitle,
  data,
  isBuiltIn,
  onDelete,
}: DiscoverOptionProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const ref = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<keyof typeof Position>(
    Position.None
  );

  const { dragProps, isDragging } = useDrag({
    getItems() {
      return [{ id: id.toString(), title }];
    },
  });

  const deleteSlider = async () => {
    try {
      await axios.delete(`/api/v1/settings/discover/${id}`);
      addToast(intl.formatMessage(messages.deletesuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
      onDelete();
    } catch (e) {
      addToast(intl.formatMessage(messages.deletefail), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const { dropProps } = useDrop({
    ref,
    onDropMove: (e) => {
      if (ref.current) {
        const middlePoint = ref.current.offsetHeight / 2;

        if (e.y < middlePoint) {
          setHoverPosition(Position.Above);
        } else {
          setHoverPosition(Position.Below);
        }
      }
    },
    onDropExit: () => {
      setHoverPosition(Position.None);
    },
    onDrop: async (e) => {
      const items = await Promise.all(
        e.items
          .filter((item) => item.kind === 'text' && item.types.has('id'))
          .map(async (item) => {
            if (item.kind === 'text') {
              return item.getText('id');
            }
          })
      );
      if (items?.[0]) {
        const dropped = Number(items[0]);
        onPositionUpdate(dropped, hoverPosition);
      }
    },
  });

  return (
    <div
      className="relative w-full"
      {...dragProps}
      {...dropProps}
      ref={ref}
      data-testid="discover-option"
    >
      {hoverPosition === Position.Above && (
        <div
          className={`absolute -top-1 left-0 w-full border-t-2 border-indigo-500`}
        />
      )}
      {hoverPosition === Position.Below && (
        <div
          className={`absolute -bottom-1 left-0 w-full border-t-2 border-indigo-500`}
        />
      )}
      <div
        role="button"
        tabIndex={0}
        className={`relative flex h-12 items-center space-x-2 rounded border border-gray-700 bg-gray-800 px-2 py-2 text-gray-100 ${
          isDragging ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <MenuIcon className="h-6 w-6" />

        <span className="flex-1">{title}</span>
        {subtitle && <Badge>{subtitle}</Badge>}
        {data && <Badge badgeType="warning">{data}</Badge>}
        {!isBuiltIn && (
          <div className="px-2">
            <Button
              buttonType="danger"
              buttonSize="sm"
              onClick={() => deleteSlider()}
            >
              <XIcon />
              <span>{intl.formatMessage(messages.remove)}</span>
            </Button>
          </div>
        )}
        <Tooltip content={intl.formatMessage(messages.enable)}>
          <div>
            <SlideCheckbox
              onClick={() => {
                onEnable();
              }}
              checked={enabled}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default DiscoverOption;
