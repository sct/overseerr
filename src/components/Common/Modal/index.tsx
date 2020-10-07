import React, { MouseEvent, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import Button, { ButtonType } from '../Button';
import { useTransition, animated } from 'react-spring';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import LoadingSpinner from '../LoadingSpinner';

interface ModalProps {
  title?: string;
  onCancel?: (e: MouseEvent<HTMLElement>) => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  cancelText?: string;
  okText?: string;
  cancelButtonType?: ButtonType;
  okButtonType?: ButtonType;
  visible?: boolean;
  disableScrollLock?: boolean;
  backgroundClickable?: boolean;
  iconSvg?: ReactNode;
  loading?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  title,
  onCancel,
  onOk,
  cancelText,
  okText,
  cancelButtonType,
  okButtonType,
  children,
  visible,
  disableScrollLock,
  backgroundClickable = true,
  iconSvg,
  loading = false,
}) => {
  useLockBodyScroll(!!visible, disableScrollLock);
  const transitions = useTransition(visible, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { tension: 500, velocity: 40, friction: 60 },
  });
  const containerTransitions = useTransition(visible && !loading, null, {
    from: { opacity: 0, transform: 'scale(0.5)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.5)' },
    config: { tension: 500, velocity: 40, friction: 60 },
  });
  const loadingTransitions = useTransition(visible && loading, null, {
    from: { opacity: 0, transform: 'scale(0.5)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.5)' },
    config: { tension: 500, velocity: 40, friction: 60 },
  });

  const cancelType = cancelButtonType ?? 'default';
  const okType = okButtonType ?? 'primary';

  return (
    <>
      {transitions.map(
        ({ props, item, key }) =>
          item &&
          ReactDOM.createPortal(
            <animated.div
              className="fixed top-0 left-0 right-0 bottom-0 bg-cool-gray-800 bg-opacity-50 w-full h-full z-50 flex justify-center items-center"
              style={props}
              key={key}
              onClick={
                typeof onCancel === 'function' && backgroundClickable
                  ? onCancel
                  : undefined
              }
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  typeof onCancel === 'function' && backgroundClickable
                    ? onCancel
                    : undefined;
                }
              }}
            >
              {loadingTransitions.map(
                ({ props, item, key }) =>
                  item && (
                    <animated.div style={props} key={key}>
                      <LoadingSpinner />
                    </animated.div>
                  )
              )}
              {containerTransitions.map(
                ({ props, item, key }) =>
                  item && (
                    <animated.div
                      style={props}
                      className="inline-block align-bottom bg-cool-gray-700 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="modal-headline"
                      key={key}
                    >
                      <div className="sm:flex sm:items-start">
                        {iconSvg && (
                          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-cool-gray-600 text-white sm:mx-0 sm:h-10 sm:w-10">
                            {iconSvg}
                          </div>
                        )}
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                          {title && (
                            <h3
                              className="text-lg leading-6 font-medium text-white"
                              id="modal-headline"
                            >
                              {title}
                            </h3>
                          )}
                          {children && (
                            <div className="mt-2">
                              <p className="text-sm leading-5 text-cool-gray-300">
                                {children}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {(onCancel || onOk) && (
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          {typeof onOk === 'function' && (
                            <Button
                              buttonType={okType}
                              onClick={onOk}
                              className="ml-3"
                            >
                              {okText ? okText : 'Ok'}
                            </Button>
                          )}
                          {typeof onCancel === 'function' && (
                            <Button
                              buttonType={cancelType}
                              onClick={onCancel}
                              className="px-4"
                            >
                              {cancelText ? cancelText : 'Cancel'}
                            </Button>
                          )}
                        </div>
                      )}
                    </animated.div>
                  )
              )}
            </animated.div>,
            document.body
          )
      )}
    </>
  );
};

export default Modal;
