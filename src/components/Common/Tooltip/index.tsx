import { usePopperTooltip } from 'react-popper-tooltip';
import type { Config } from 'react-popper-tooltip';

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  tooltipConfig?: Config;
};

const Tooltip = ({ children, content, tooltipConfig }: TooltipProps) => {
  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } =
    usePopperTooltip({
      followCursor: true,
      placement: 'left-end',
      ...tooltipConfig,
    });

  return (
    <>
      <div ref={setTriggerRef}>{children}</div>
      {visible && (
        <div
          ref={setTooltipRef}
          {...getTooltipProps({
            className:
              'bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow text-gray-100',
          })}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip;
