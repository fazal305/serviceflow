import { Router, type Request } from 'express';
import { z } from 'zod';

import { logActivity } from '../db/activityLog.js';
import { findOrCreateCustomerByUserId, getCustomerById } from '../db/customers.js';
import { createInvoiceFromQuotation } from '../db/invoices.js';
import { notifyAdmins, createNotification } from '../db/notifications.js';
import { decideQuotation, getQuotationById } from '../db/quotations.js';
import { getServiceRequestById, updateServiceRequestStatus } from '../db/serviceRequests.js';
import { canTransition } from '../domain/serviceRequestStatus.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';

export const quotationsRouter = Router();

function money(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}

async function loadOwnedQuotation(req: Request) {
  const quotation = await getQuotationById(req.params.id as string);
  if (!quotation) throw new ApiError(404, 'Quotation not found');

  const request = await getServiceRequestById(quotation.serviceRequestId);
  if (!request) throw new ApiError(404, 'Service request not found');

  if (req.appUser!.role === 'CUSTOMER') {
    const customer = await findOrCreateCustomerByUserId(req.appUser!.id);
    if (request.customerId !== customer.id) {
      throw new ApiError(403, 'You do not have permission to access this quotation');
    }
  }

  return { quotation, request };
}

quotationsRouter.post(
  '/quotations/:id/approve',
  requireAuthentication,
  syncUser,
  requireRole('CUSTOMER'),
  async (req, res) => {
    const { quotation, request } = await loadOwnedQuotation(req);
    if (quotation.status !== 'PENDING') {
      throw new ApiError(409, 'This quotation has already been decided');
    }
    if (!canTransition(request.status, 'QUOTATION_APPROVED')) {
      throw new ApiError(409, `Cannot approve a quotation for a request in status ${request.status}`);
    }

    await decideQuotation(quotation.id, 'APPROVED');
    await updateServiceRequestStatus(request.id, 'QUOTATION_APPROVED');

    await Promise.all([
      logActivity({
        actorUserId: req.appUser!.id,
        action: 'QUOTATION_APPROVED',
        entityType: 'quotation',
        entityId: quotation.id,
      }),
      notifyAdmins({
        title: 'Quotation approved',
        message: `The customer approved a ${money(quotation.total)} quotation.`,
        entityType: 'service_request',
        entityId: request.id,
      }),
    ]);

    res.json(await getQuotationById(quotation.id));
  },
);

quotationsRouter.post(
  '/quotations/:id/reject',
  requireAuthentication,
  syncUser,
  requireRole('CUSTOMER'),
  async (req, res) => {
    const { quotation, request } = await loadOwnedQuotation(req);
    if (quotation.status !== 'PENDING') {
      throw new ApiError(409, 'This quotation has already been decided');
    }

    await decideQuotation(quotation.id, 'REJECTED');

    await Promise.all([
      logActivity({
        actorUserId: req.appUser!.id,
        action: 'QUOTATION_REJECTED',
        entityType: 'quotation',
        entityId: quotation.id,
      }),
      notifyAdmins({
        title: 'Quotation rejected',
        message: `The customer rejected a ${money(quotation.total)} quotation. A revised one can be sent.`,
        entityType: 'service_request',
        entityId: request.id,
      }),
    ]);

    res.json(await getQuotationById(quotation.id));
  },
);

const invoiceSchema = z.object({
  dueDate: z.string().date().nullable(),
});

quotationsRouter.post(
  '/quotations/:id/invoice',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  validateBody(invoiceSchema),
  async (req, res) => {
    const quotation = await getQuotationById(req.params.id as string);
    if (!quotation) throw new ApiError(404, 'Quotation not found');
    if (quotation.status !== 'APPROVED') {
      throw new ApiError(409, 'Only approved quotations can be invoiced');
    }

    const invoice = await createInvoiceFromQuotation({
      quotationId: quotation.id,
      dueDate: req.body.dueDate,
    });

    const customer = await getCustomerById(invoice.customerId);
    await Promise.all([
      logActivity({
        actorUserId: req.appUser!.id,
        action: 'INVOICE_CREATED',
        entityType: 'invoice',
        entityId: invoice.id,
        metadata: { invoiceNumber: invoice.invoiceNumber, total: invoice.total },
      }),
      customer &&
        createNotification({
          userId: customer.userId,
          title: 'Invoice ready',
          message: `Invoice ${invoice.invoiceNumber} for ${money(invoice.total)} is ready.`,
          entityType: 'invoice',
          entityId: invoice.id,
        }),
    ]);

    res.status(201).json(invoice);
  },
);
