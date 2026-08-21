import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useReportsSummary } from '../../api/reports';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';

function money(value) {
  return `$${value.toFixed(2)}`;
}

function monthLabel(ym) {
  const [year, month] = ym.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit',
  });
}

export function AdminReportsPage() {
  const { data, isPending, isError, refetch } = useReportsSummary();

  if (isPending) return <LoadingState label="Loading reports…" />;
  if (isError || !data) return <ErrorState message="Couldn't load reports." onRetry={() => refetch()} />;

  const revenueData = data.revenueByMonth.map((r) => ({ ...r, label: monthLabel(r.month) }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Business performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-semibold text-foreground">{data.completedJobs}</p>
          <p className="mt-1 text-sm text-muted-foreground">Completed jobs</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-semibold text-foreground">{money(data.pendingPaymentsTotal)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Pending payments</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-semibold text-foreground">
            {data.avgCompletionDays !== null ? data.avgCompletionDays.toFixed(1) : '—'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Avg. days to complete</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Revenue (last 6 months)</h2>
        {revenueData.length === 0 ? (
          <EmptyState title="No revenue yet" description="Recorded payments will appear here by month." />
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => money(Number(value ?? 0))}
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Jobs by category</h2>
          {data.jobsByCategory.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {data.jobsByCategory.map((row) => (
                <li key={row.category} className="flex justify-between text-sm">
                  <span className="text-foreground">{row.category}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Completed jobs by technician</h2>
          {data.jobsByTechnician.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No completed jobs yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {data.jobsByTechnician.map((row) => (
                <li key={row.technician} className="flex justify-between text-sm">
                  <span className="text-foreground">{row.technician}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
