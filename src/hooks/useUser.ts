import useSwr from 'swr';
import { useRef } from 'react';
export interface User {
  id: number;
  email: string;
}

interface UserHookResponse {
  user?: User;
  loading: boolean;
  error: string;
  revalidate: () => Promise<boolean>;
}

export const useUser = ({
  id,
  initialData,
}: { id?: number; initialData?: User } = {}): UserHookResponse => {
  const initialRef = useRef(initialData);
  const { data, error, revalidate } = useSwr<User>(
    id ? `/api/v1/user/${id}` : `/api/v1/auth/me`,
    { initialData: initialRef.current }
  );

  return {
    user: data,
    loading: !data && !error,
    error,
    revalidate,
  };
};
