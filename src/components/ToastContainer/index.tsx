import type { ToastContainerProps } from 'react-toast-notifications';

const ToastContainer = ({ hasToasts, ...props }: ToastContainerProps) => {
  return (
    <div
      id="toast-container"
      className="fixed right-0 top-4 box-border max-h-full max-w-full overflow-hidden px-4"
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
