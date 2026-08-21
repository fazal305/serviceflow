import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useInvoices } from '../../api/invoices';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { inputClass } from '../../components/Field';
import { LoadingState } from '../../components/LoadingState';

const STATUS_OPTIONS = ['UNPAID', 'PARTIALLY_PAID', 'PAID'];

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function AdminInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: invoices, isPending, isError, refetch } = useInvoices(statusFilter || undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track invoices and payment status.</p>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className={`${inputClass} max-w-xs`}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll('_', ' ')}
          </option>
        ))}
      </select>

      {isPending && <LoadingState label="Loading invoices…" />}
      {isError && <ErrorState message="Couldn't load invoices." onRetry={() => refetch()} />}

      {invoices && invoices.length === 0 && (
        <EmptyState title="No invoices" description="Invoices created from approved quotations will appear here." />
      )}

      {invoices && invoices.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Invoice</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Paid</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {invoice.customerName ?? invoice.customerEmail}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{money(invoice.total)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{money(invoice.amountPaid)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invoice.status === 'PAID'
                          ? 'bg-success/15 text-success'
                          : invoice.isOverdue
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {invoice.isOverdue && invoice.status !== 'PAID' ? 'OVERDUE' : invoice.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to={`/admin/service-requests/${invoice.serviceRequestId}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
