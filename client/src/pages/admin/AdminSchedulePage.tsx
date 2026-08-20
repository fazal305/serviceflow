import { useJobs } from '../../api/jobs';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function AdminSchedulePage() {
  const { data: jobs, isPending, isError, refetch } = useJobs();

  if (isPending) return <LoadingState label="Loading schedule…" />;
  if (isError) return <ErrorState message="Couldn't load schedule." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upcoming and in-progress jobs, by date.</p>
      </div>

      {jobs.length === 0 && (
        <EmptyState
          title="Nothing scheduled"
          description="Schedule an assigned service request to see it here."
        />
      )}

      {jobs.length > 0 && (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(job.scheduledDate)}
                    {job.scheduledTime && ` — ${job.scheduledTime}`}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{job.customerName ?? job.customerEmail}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{job.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.serviceCategoryName ?? 'General'} · Technician: {job.technicianName ?? '—'}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
