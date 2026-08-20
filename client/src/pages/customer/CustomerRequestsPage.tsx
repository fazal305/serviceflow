import { Link } from 'react-router-dom';

import { useServiceRequests } from '../../api/serviceRequests';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { RequestCard } from '../../components/RequestCard';

const INACTIVE_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

export function CustomerRequestsPage() {
  const { data: allRequests, isPending, isError, refetch } = useServiceRequests();
  const requests = allRequests?.filter((r) => !INACTIVE_STATUSES.has(r.status));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">My requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track the status of your active service requests.</p>
      </div>

      {isPending && <LoadingState label="Loading your requests…" />}
      {isError && <ErrorState message="Couldn't load your requests." onRetry={() => refetch()} />}

      {requests && requests.length === 0 && (
        <EmptyState title="No active requests" description="Submit a service request to get started." />
      )}

      {requests && requests.length > 0 && (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.id}>
              <RequestCard request={request} />
            </li>
          ))}
        </ul>
      )}

      {requests && requests.length === 0 && (
        <Link
          to="/customer/requests/new"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Submit a request
        </Link>
      )}
    </div>
  );
}
