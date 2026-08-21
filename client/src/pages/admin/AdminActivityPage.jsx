import { useActivity } from '../../api/activity';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';

const ACTION_LABELS = {
  REQUEST_SUBMITTED: 'submitted a service request',
  TECHNICIAN_ASSIGNED: 'assigned a technician',
  JOB_SCHEDULED: 'scheduled a job',
  JOB_STARTED: 'started a job',
  JOB_COMPLETED: 'completed a job',
  QUOTATION_CREATED: 'created a quotation',
  QUOTATION_APPROVED: 'approved a quotation',
  QUOTATION_REJECTED: 'rejected a quotation',
  INVOICE_CREATED: 'created an invoice',
  PAYMENT_RECORDED: 'recorded a payment',
  TECHNICIAN_CREATED: 'added a technician',
};

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AdminActivityPage() {
  const { data: entries, isPending, isError, refetch } = useActivity();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recent business actions, most recent first.</p>
      </div>

      {isPending && <LoadingState label="Loading activity…" />}
      {isError && <ErrorState message="Couldn't load activity." onRetry={() => refetch()} />}

      {entries && entries.length === 0 && (
        <EmptyState title="No activity yet" description="Actions taken across the app will appear here." />
      )}

      {entries && entries.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg border border-border bg-card">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
            >
              <span className="text-foreground">
                <span className="font-medium">{entry.actorName ?? 'System'}</span>{' '}
                {ACTION_LABELS[entry.action] ?? entry.action.toLowerCase().replaceAll('_', ' ')}
              </span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
