import { useServiceRequests } from '../../api/serviceRequests';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { RequestCard } from '../../components/RequestCard';

const INACTIVE_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

export function CustomerServiceHistoryPage() {
  const { data: allRequests, isPending, isError, refetch } = useServiceRequests();
  const requests = allRequests?.filter((r) => INACTIVE_STATUSES.has(r.status));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Service history</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your completed and cancelled requests.</p>
      </div>

      {isPending && <LoadingState label="Loading history…" />}
      {isError && <ErrorState message="Couldn't load your history." onRetry={() => refetch()} />}

      {requests && requests.length === 0 && (
        <EmptyState title="No history yet" description="Completed and cancelled requests will appear here." />
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
    </div>
  );
}
