import React from 'react';
import ReactDOM from 'react-dom';
import type { Config } from 'react-popper-tooltip';
import { usePopperTooltip } from 'react-popper-tooltip';

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  tooltipConfig?: Partial<Config>;
};

const Tooltip = ({ children, content, tooltipConfig }: TooltipProps) => {
  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } =
    usePopperTooltip({
      followCursor: true,
      offset: [-28, 6],
      placement: 'auto-end',
      ...tooltipConfig,
    });

  return (
    <>
      {React.cloneElement(children, { ref: setTriggerRef })}
      {visible &&
        content &&
        ReactDOM.createPortal(
          <div
            ref={setTooltipRef}
            {...getTooltipProps({
              className:
                'z-50 text-sm absolute font-normal bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow text-gray-100',
            })}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
