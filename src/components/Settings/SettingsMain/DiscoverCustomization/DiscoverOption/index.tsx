import Badge from '@app/components/Common/Badge';
import SlideCheckbox from '@app/components/Common/SlideCheckbox';
import Tooltip from '@app/components/Common/Tooltip';
import { MenuIcon } from '@heroicons/react/solid';
import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-aria';

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
  onEnable: () => void;
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
}: DiscoverOptionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<keyof typeof Position>(
    Position.None
  );

  const { dragProps, isDragging } = useDrag({
    getItems() {
      return [{ id: id.toString(), title }];
    },
  });

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
    <div className="relative w-full" {...dragProps} {...dropProps} ref={ref}>
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
        className={`relative flex items-center space-x-2 rounded border border-gray-700 bg-gray-800 px-2 py-2 text-gray-100 ${
          isDragging ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <MenuIcon className="h-6 w-6" />

        <span className="flex-1">{title}</span>
        {subtitle && <Badge>{subtitle}</Badge>}
        {data && <Badge badgeType="warning">{data}</Badge>}
        <Tooltip content="Enable">
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
