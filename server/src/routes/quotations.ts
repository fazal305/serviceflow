import { Router, type Request } from 'express';
import { z } from 'zod';

import { findOrCreateCustomerByUserId } from '../db/customers.js';
import { createInvoiceFromQuotation } from '../db/invoices.js';
import { decideQuotation, getQuotationById } from '../db/quotations.js';
import { getServiceRequestById, updateServiceRequestStatus } from '../db/serviceRequests.js';
import { canTransition } from '../domain/serviceRequestStatus.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';

export const quotationsRouter = Router();

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

    res.json(await getQuotationById(quotation.id));
  },
);

quotationsRouter.post(
  '/quotations/:id/reject',
  requireAuthentication,
  syncUser,
  requireRole('CUSTOMER'),
  async (req, res) => {
    const { quotation } = await loadOwnedQuotation(req);
    if (quotation.status !== 'PENDING') {
      throw new ApiError(409, 'This quotation has already been decided');
    }

    await decideQuotation(quotation.id, 'REJECTED');
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
    res.status(201).json(invoice);
  },
);
