import React from 'react';
import { ToastContainerProps } from 'react-toast-notifications';

const ToastContainer: React.FC<ToastContainerProps> = ({
  hasToasts,
  ...props
}) => {
  return (
    <div
      id="toast-container"
      className="fixed max-w-full max-h-full overflow-hidden top-4 right-4"
      style={{
        pointerEvents: hasToasts ? 'all' : 'none',
        zIndex: 10000,
        paddingTop: 'env(safe-area-inset-top)',
      }}
      {...props}
    />
  );
};

export default ToastContainer;
