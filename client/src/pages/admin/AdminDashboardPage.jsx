import { useDashboardSummary } from '../../api/dashboard';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';

const KPI_CARDS = [
  { key: 'openRequests', label: 'Open requests' },
  { key: 'pendingAssignment', label: 'Pending assignment' },
  { key: 'todaysJobs', label: "Today's jobs" },
  { key: 'activeTechnicians', label: 'Active technicians' },
  { key: 'totalCustomers', label: 'Total customers' },
];

export function AdminDashboardPage() {
  const { data, isPending, isError, refetch } = useDashboardSummary();

  if (isPending) return <LoadingState label="Loading dashboard…" />;
  if (isError) return <ErrorState message="Couldn't load dashboard." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Business overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {KPI_CARDS.map((card) => (
          <div key={card.key} className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-semibold text-foreground">{data[card.key]}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Requests by status</h2>
        {data.statusBreakdown.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No service requests yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {data.statusBreakdown.map((row) => (
              <li key={row.status} className="flex items-center justify-between">
                <StatusBadge status={row.status} />
                <span className="text-sm font-medium text-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
