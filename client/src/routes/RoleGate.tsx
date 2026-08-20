import { Navigate, Outlet } from 'react-router-dom';

import { useMe, type UserRole } from '../api/me';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';

export function RoleGate({ role }: { role: UserRole }) {
  const { data: me, isPending, isError, refetch } = useMe();

  // isPending (not isLoading) covers "no data yet" from the very first
  // render, including the instant before the query transitions into
  // fetchStatus 'fetching' — isLoading is false during that instant, which
  // let this fall through to the role-mismatch branch below and bounce an
  // about-to-be-confirmed admin straight back out to /app on every cold load.
  if (isPending) return <LoadingState label="Checking your account…" />;
  if (isError) return <ErrorState message="Couldn't verify your account." onRetry={() => refetch()} />;
  if (me.role !== role) return <Navigate to="/app" replace />;

  return <Outlet />;
}
