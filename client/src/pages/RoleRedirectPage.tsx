import { Navigate } from 'react-router-dom';

import { useMe } from '../api/me';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  TECHNICIAN: '/technician',
  CUSTOMER: '/customer',
};

export function RoleRedirectPage() {
  const { data: me, isPending, isError, refetch } = useMe();

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <LoadingState label="Setting up your account…" />
      </main>
    );
  }

  if (isError || !me) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <ErrorState message="Couldn't load your account." onRetry={() => refetch()} />
      </main>
    );
  }

  return <Navigate to={ROLE_HOME[me.role] ?? '/'} replace />;
}
