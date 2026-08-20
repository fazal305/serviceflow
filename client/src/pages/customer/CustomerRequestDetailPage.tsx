import { Link, useParams } from 'react-router-dom';

import { useRequestInvoice } from '../../api/invoices';
import { useApproveQuotation, useRejectQuotation, useRequestQuotation } from '../../api/quotations';
import { useServiceRequest } from '../../api/serviceRequests';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';

function money(value: string | number) {
  return `$${Number(value).toFixed(2)}`;
}

export function CustomerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: request, isPending, isError, refetch } = useServiceRequest(id);
  const { data: quotation } = useRequestQuotation(id);
  const { data: invoice } = useRequestInvoice(id);
  const approveQuotation = useApproveQuotation(id ?? '');
  const rejectQuotation = useRejectQuotation(id ?? '');

  if (isPending) return <LoadingState label="Loading request…" />;
  if (isError || !request) return <ErrorState message="Couldn't load this request." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/customer" className="text-sm font-medium text-accent">
          ← My requests
        </Link>
        <StatusBadge status={request.status} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground">{request.serviceCategoryName ?? 'General request'}</p>
        <p className="mt-1 text-sm text-muted-foreground">{request.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {request.address}
          {request.technicianName && ` · Technician: ${request.technicianName}`}
        </p>
      </section>

      {quotation && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Quotation</h2>

          <ul className="mt-3 flex flex-col gap-1 text-sm text-foreground">
            {quotation.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.description} × {item.quantity}
                </span>
                <span>{money(item.quantity * item.unitPrice)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-2 border-t border-border pt-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{money(quotation.subtotal)}</span>
            </div>
            {Number(quotation.discountAmount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-{money(quotation.discountAmount)}</span>
              </div>
            )}
            {Number(quotation.taxRate) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({quotation.taxRate}%)</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-foreground">
              <span>Total</span>
              <span>{money(quotation.total)}</span>
            </div>
          </div>

          {quotation.notes && <p className="mt-2 text-sm text-muted-foreground">{quotation.notes}</p>}

          {quotation.status === 'PENDING' && (
            <div className="mt-4 flex flex-col gap-2">
              {(approveQuotation.isError || rejectQuotation.isError) && (
                <p role="alert" className="text-sm text-destructive">
                  Something went wrong — please try again.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => approveQuotation.mutate(quotation.id)}
                  disabled={approveQuotation.isPending || rejectQuotation.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
                >
                  {approveQuotation.isPending ? 'Approving…' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={() => rejectQuotation.mutate(quotation.id)}
                  disabled={approveQuotation.isPending || rejectQuotation.isPending}
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {rejectQuotation.isPending ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          )}

          {quotation.status === 'APPROVED' && (
            <p className="mt-3 text-sm text-success">You approved this quotation.</p>
          )}
          {quotation.status === 'REJECTED' && (
            <p className="mt-3 text-sm text-muted-foreground">
              You rejected this quotation. We'll follow up with a revised one.
            </p>
          )}
        </section>
      )}

      {invoice && (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Invoice {invoice.invoiceNumber}</h2>
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
          <div className="mt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total</span>
              <span>{money(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <span>{money(invoice.amountPaid)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
