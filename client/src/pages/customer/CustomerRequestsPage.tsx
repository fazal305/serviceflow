import { Link } from 'react-router-dom';

import { useServiceRequests } from '../../api/serviceRequests';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';

export function CustomerRequestsPage() {
  const { data: requests, isPending, isError, refetch } = useServiceRequests();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">My requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track the status of your service requests.</p>
      </div>

      {isPending && <LoadingState label="Loading your requests…" />}
      {isError && <ErrorState message="Couldn't load your requests." onRetry={() => refetch()} />}

      {requests && requests.length === 0 && (
        <EmptyState title="No requests yet" description="Submit your first service request to get started." />
      )}

      {requests && requests.length > 0 && (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {request.serviceCategoryName ?? 'General request'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
                {request.technicianName && <span>Technician: {request.technicianName}</span>}
              </div>
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
