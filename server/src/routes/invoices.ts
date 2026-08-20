import { Router, type Request } from 'express';
import { z } from 'zod';

import { findOrCreateCustomerByUserId } from '../db/customers.js';
import { getInvoiceById, listInvoicesForAdmin, listInvoicesForCustomer } from '../db/invoices.js';
import { recordPayment } from '../db/payments.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

export const invoicesRouter = Router();

const listQuerySchema = z.object({
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']).optional(),
});

invoicesRouter.get(
  '/invoices',
  requireAuthentication,
  syncUser,
  validateQuery(listQuerySchema),
  async (req, res) => {
    const { status } = req.validatedQuery as z.infer<typeof listQuerySchema>;

    if (req.appUser!.role === 'ADMIN') {
      res.json(await listInvoicesForAdmin(status));
      return;
    }

    if (req.appUser!.role === 'CUSTOMER') {
      const customer = await findOrCreateCustomerByUserId(req.appUser!.id);
      res.json(await listInvoicesForCustomer(customer.id));
      return;
    }

    throw new ApiError(403, 'You do not have permission to view invoices');
  },
);

async function loadOwnedInvoice(req: Request) {
  const invoice = await getInvoiceById(req.params.id as string);
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  if (req.appUser!.role === 'CUSTOMER') {
    const customer = await findOrCreateCustomerByUserId(req.appUser!.id);
    if (invoice.customerId !== customer.id) {
      throw new ApiError(403, 'You do not have permission to access this invoice');
    }
  }

  return invoice;
}

invoicesRouter.get('/invoices/:id', requireAuthentication, syncUser, async (req, res) => {
  res.json(await loadOwnedInvoice(req));
});

const paymentSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'ONLINE']),
  notes: z.string().trim().max(500).nullable(),
});

invoicesRouter.post(
  '/invoices/:id/payments',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  validateBody(paymentSchema),
  async (req, res) => {
    const invoice = await getInvoiceById(req.params.id as string);
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    if (invoice.status === 'PAID') {
      throw new ApiError(409, 'This invoice is already fully paid');
    }

    const remaining = Number(invoice.total) - Number(invoice.amountPaid);
    if (req.body.amount > remaining + 0.01) {
      throw new ApiError(400, `Payment exceeds the remaining balance of ${remaining.toFixed(2)}`);
    }

    await recordPayment({
      invoiceId: invoice.id,
      amount: req.body.amount,
      method: req.body.method,
      notes: req.body.notes,
      recordedBy: req.appUser!.id,
    });

    res.status(201).json(await getInvoiceById(invoice.id));
  },
);
