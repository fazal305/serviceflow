import { Link } from 'react-router-dom';

import { useInvoices } from '../../api/invoices';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function CustomerInvoicesPage() {
  const { data: invoices, isPending, isError, refetch } = useInvoices();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your invoices and payment status.</p>
      </div>

      {isPending && <LoadingState label="Loading invoices…" />}
      {isError && <ErrorState message="Couldn't load your invoices." onRetry={() => refetch()} />}

      {invoices && invoices.length === 0 && (
        <EmptyState title="No invoices yet" description="Invoices appear here once a quotation is approved." />
      )}

      {invoices && invoices.length > 0 && (
        <ul className="flex flex-col gap-3">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link
                to={`/customer/requests/${invoice.serviceRequestId}`}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
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
                </div>
                <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                  <span>Total {money(invoice.total)}</span>
                  <span>Paid {money(invoice.amountPaid)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
