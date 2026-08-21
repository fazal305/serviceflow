import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useRequestInvoice, useCreateInvoice, useRecordPayment } from '../../api/invoices';
import { useCreateQuotation, useRequestQuotation } from '../../api/quotations';
import { useServiceRequest } from '../../api/serviceRequests';
import { ErrorState } from '../../components/ErrorState';
import { Field, inputClass } from '../../components/Field';
import { LineItemsEditor } from '../../components/LineItemsEditor';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function AdminRequestDetailPage() {
  const { id } = useParams();
  const { data: request, isPending, isError, refetch } = useServiceRequest(id);
  const { data: quotation, refetch: refetchQuotation } = useRequestQuotation(id);
  const { data: invoice, refetch: refetchInvoice } = useRequestInvoice(id);

  const createQuotation = useCreateQuotation(id ?? '');
  const createInvoice = useCreateInvoice(id ?? '');
  const recordPayment = useRecordPayment(invoice?.id ?? '', id);

  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [taxRate, setTaxRate] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [dueDate, setDueDate] = useState('');

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  if (isPending) return <LoadingState label="Loading request…" />;
  if (isError || !request) return <ErrorState message="Couldn't load this request." onRetry={() => refetch()} />;

  const previewSubtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const previewTotal = Math.max(
    0,
    previewSubtotal - Number(discountAmount || 0) + (previewSubtotal * Number(taxRate || 0)) / 100,
  );

  async function submitQuotation(e) {
    e.preventDefault();
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0);
    if (validItems.length === 0) return;

    await createQuotation.mutateAsync({
      items: validItems,
      taxRate: Number(taxRate || 0),
      discountAmount: Number(discountAmount || 0),
      notes: notes.trim() || null,
      validUntil: validUntil || null,
    });
    setQuotationModalOpen(false);
    refetchQuotation();
  }

  async function submitInvoice() {
    if (!quotation) return;
    await createInvoice.mutateAsync({ quotationId: quotation.id, dueDate: dueDate || null });
    setInvoiceModalOpen(false);
    refetchInvoice();
  }

  async function submitPayment(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await recordPayment.mutateAsync({
      amount: Number(form.get('amount')),
      method: String(form.get('method')),
      notes: String(form.get('notes')).trim() || null,
    });
    setPaymentModalOpen(false);
  }

  const canCreateQuotation =
    request.status === 'WAITING_FOR_APPROVAL' && (!quotation || quotation.status === 'REJECTED');
  const canCreateInvoice = quotation?.status === 'APPROVED' && !invoice;
  // Round once, here, to money precision — raw float subtraction (e.g.
  // 109.08 - 100 = 9.079999999999998) was stricter than the rounded value
  // shown in the "amount" input's defaultValue, so the input's own
  // pre-filled value silently failed native HTML `max` validation and
  // blocked every payment submission with no visible error.
  const remaining = invoice ? Math.round((Number(invoice.total) - Number(invoice.amountPaid)) * 100) / 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/service-requests" className="text-sm font-medium text-accent">
          ← Service Requests
        </Link>
        <StatusBadge status={request.status} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-lg font-semibold text-foreground">{request.customerName ?? request.customerEmail}</p>
        <p className="mt-1 text-sm text-muted-foreground">{request.address}</p>
        <p className="mt-3 text-sm text-foreground">{request.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {request.serviceCategoryName ?? 'General'} · {request.priority} priority
          {request.technicianName && ` · Technician: ${request.technicianName}`}
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Quotation</h2>
          {canCreateQuotation && (
            <button
              type="button"
              onClick={() => {
                createQuotation.reset();
                setItems([]);
                setTaxRate('0');
                setDiscountAmount('0');
                setNotes('');
                setValidUntil('');
                setQuotationModalOpen(true);
              }}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Create quotation
            </button>
          )}
        </div>

        {!quotation && !canCreateQuotation && (
          <p className="mt-2 text-sm text-muted-foreground">
            A quotation can be created once the technician has completed the job.
          </p>
        )}

        {quotation && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  quotation.status === 'APPROVED'
                    ? 'bg-success/15 text-success'
                    : quotation.status === 'REJECTED'
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-warning/15 text-warning'
                }`}
              >
                {quotation.status}
              </span>
              {quotation.status === 'PENDING' && (
                <span className="text-xs text-muted-foreground">Awaiting customer decision</span>
              )}
            </div>

            <ul className="flex flex-col gap-1 text-sm text-foreground">
              {quotation.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.description} × {item.quantity}
                  </span>
                  <span>{money(item.quantity * item.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{money(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>{money(quotation.total)}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {quotation?.status === 'APPROVED' && (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Invoice</h2>
            {canCreateInvoice && (
              <button
                type="button"
                onClick={() => {
                  createInvoice.reset();
                  setDueDate('');
                  setInvoiceModalOpen(true);
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Create invoice
              </button>
            )}
          </div>

          {invoice && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
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

              <div className="text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total</span>
                  <span>{money(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span>{money(invoice.amountPaid)}</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Remaining</span>
                    <span>{money(remaining)}</span>
                  </div>
                )}
              </div>

              {invoice.payments.length > 0 && (
                <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {invoice.payments.map((p) => (
                    <li key={p.id}>
                      {money(p.amount)} via {p.method.replace('_', ' ')} on{' '}
                      {new Date(p.paidAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}

              {invoice.status !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => {
                    recordPayment.reset();
                    setPaymentModalOpen(true);
                  }}
                  className="self-start rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                  Record payment
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <Modal open={quotationModalOpen} onClose={() => setQuotationModalOpen(false)} title="Create quotation">
        <form onSubmit={submitQuotation} className="flex flex-col gap-4">
          <LineItemsEditor items={items} onChange={setItems} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tax rate (%)" htmlFor="taxRate">
              <input
                id="taxRate"
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Discount ($)" htmlFor="discountAmount">
              <input
                id="discountAmount"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Valid until (optional)" htmlFor="validUntil">
            <input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Notes (optional)" htmlFor="notes">
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="flex justify-between rounded-md bg-muted px-3 py-2 text-sm font-semibold text-foreground">
            <span>Total</span>
            <span>{money(previewTotal)}</span>
          </div>

          {createQuotation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createQuotation.error instanceof Error ? createQuotation.error.message : 'Failed to create quotation'}
            </p>
          )}

          <button
            type="submit"
            disabled={createQuotation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {createQuotation.isPending ? 'Sending…' : 'Send quotation to customer'}
          </button>
        </form>
      </Modal>

      <Modal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title="Create invoice">
        <div className="flex flex-col gap-4">
          <Field label="Due date (optional)" htmlFor="dueDate">
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          {createInvoice.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createInvoice.error instanceof Error ? createInvoice.error.message : 'Failed to create invoice'}
            </p>
          )}

          <button
            type="button"
            onClick={submitInvoice}
            disabled={createInvoice.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {createInvoice.isPending ? 'Creating…' : 'Create invoice'}
          </button>
        </div>
      </Modal>

      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Record payment">
        <form onSubmit={submitPayment} className="flex flex-col gap-4">
          <Field label={`Amount (remaining: ${money(remaining)})`} htmlFor="amount">
            <input
              key={remaining}
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={remaining}
              defaultValue={remaining.toFixed(2)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Method" htmlFor="method">
            <select id="method" name="method" className={inputClass}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="ONLINE">Online</option>
            </select>
          </Field>
          <Field label="Notes (optional)" htmlFor="paymentNotes">
            <input id="paymentNotes" name="notes" className={inputClass} />
          </Field>

          {recordPayment.isError && (
            <p role="alert" className="text-sm text-destructive">
              {recordPayment.error instanceof Error ? recordPayment.error.message : 'Failed to record payment'}
            </p>
          )}

          <button
            type="submit"
            disabled={recordPayment.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {recordPayment.isPending ? 'Recording…' : 'Record payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
