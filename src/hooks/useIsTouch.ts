import { InteractionContext } from '@/context/InteractionContext';
import { useContext } from 'react';

export const useIsTouch = (): boolean => {
  const { isTouch } = useContext(InteractionContext);
  return isTouch ?? false;
};
