import { Router } from 'express';
import { z } from 'zod';

import type { Request } from 'express';

import { findOrCreateCustomerByUserId } from '../db/customers.js';
import { getInvoiceForRequest } from '../db/invoices.js';
import { scheduleJob } from '../db/jobs.js';
import { createQuotation, getLatestQuotationForRequest } from '../db/quotations.js';
import {
  assignTechnician,
  createServiceRequest,
  getServiceRequestById,
  listServiceRequestsForAdmin,
  listServiceRequestsForCustomer,
  type ServiceRequest,
} from '../db/serviceRequests.js';
import { getTechnicianById } from '../db/technicians.js';
import { canTransition } from '../domain/serviceRequestStatus.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

async function loadRequestForViewer(req: Request): Promise<ServiceRequest> {
  const request = await getServiceRequestById(req.params.id as string);
  if (!request) throw new ApiError(404, 'Service request not found');

  if (req.appUser!.role === 'CUSTOMER') {
    const customer = await findOrCreateCustomerByUserId(req.appUser!.id);
    if (request.customerId !== customer.id) {
      throw new ApiError(403, 'You do not have permission to view this request');
    }
  }

  return request;
}

export const serviceRequestsRouter = Router();

const createSchema = z.object({
  serviceCategoryId: z.string().uuid().nullable(),
  description: z.string().trim().min(10).max(4000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  preferredDate: z.string().date().nullable(),
  preferredTime: z.string().trim().max(40).nullable(),
  address: z.string().trim().min(5).max(500),
  contactPhone: z.string().trim().max(40).nullable(),
});

serviceRequestsRouter.post(
  '/service-requests',
  requireAuthentication,
  syncUser,
  requireRole('CUSTOMER'),
  validateBody(createSchema),
  async (req, res) => {
    const customer = await findOrCreateCustomerByUserId(req.appUser!.id);
    const created = await createServiceRequest({ customerId: customer.id, ...req.body });
    res.status(201).json(created);
  },
);

const listQuerySchema = z.object({
  status: z
    .enum([
      'NEW',
      'UNDER_REVIEW',
      'ASSIGNED',
      'SCHEDULED',
      'IN_PROGRESS',
      'WAITING_FOR_APPROVAL',
      'QUOTATION_APPROVED',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),
  serviceCategoryId: z.string().uuid().optional(),
});

serviceRequestsRouter.get(
  '/service-requests',
  requireAuthentication,
  syncUser,
  validateQuery(listQuerySchema),
  async (req, res) => {
    const filters = req.validatedQuery as z.infer<typeof listQuerySchema>;

    if (req.appUser!.role === 'ADMIN') {
      res.json(await listServiceRequestsForAdmin(filters));
      return;
    }

    if (req.appUser!.role === 'CUSTOMER') {
      const customer = await findOrCreateCustomerByUserId(req.appUser!.id);
      res.json(await listServiceRequestsForCustomer(customer.id));
      return;
    }

    // Technicians get their assigned-jobs view in Phase 3.
    res.json([]);
  },
);

serviceRequestsRouter.get('/service-requests/:id', requireAuthentication, syncUser, async (req, res) => {
  res.json(await loadRequestForViewer(req));
});

const assignSchema = z.object({
  technicianId: z.string().uuid(),
});

serviceRequestsRouter.post(
  '/service-requests/:id/assign',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  validateBody(assignSchema),
  async (req, res) => {
    const request = await getServiceRequestById(req.params.id as string);
    if (!request) throw new ApiError(404, 'Service request not found');

    if (!canTransition(request.status, 'ASSIGNED')) {
      throw new ApiError(409, `Cannot assign a request in status ${request.status}`);
    }

    const technician = await getTechnicianById(req.body.technicianId);
    if (!technician || !technician.isActive) {
      throw new ApiError(400, 'Technician not found or inactive');
    }

    await assignTechnician({
      serviceRequestId: request.id,
      technicianId: technician.id,
      assignedBy: req.appUser!.id,
    });

    res.json(await getServiceRequestById(request.id));
  },
);

const scheduleSchema = z.object({
  scheduledDate: z.string().date(),
  scheduledTime: z.string().trim().max(40).nullable(),
});

serviceRequestsRouter.post(
  '/service-requests/:id/schedule',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  validateBody(scheduleSchema),
  async (req, res) => {
    const request = await getServiceRequestById(req.params.id as string);
    if (!request) throw new ApiError(404, 'Service request not found');

    if (!canTransition(request.status, 'SCHEDULED')) {
      throw new ApiError(409, `Cannot schedule a request in status ${request.status}`);
    }

    await scheduleJob({
      serviceRequestId: request.id,
      scheduledDate: req.body.scheduledDate,
      scheduledTime: req.body.scheduledTime,
    });

    res.json(await getServiceRequestById(request.id));
  },
);

serviceRequestsRouter.get(
  '/service-requests/:id/quotation',
  requireAuthentication,
  syncUser,
  async (req, res) => {
    const request = await loadRequestForViewer(req);
    res.json(await getLatestQuotationForRequest(request.id));
  },
);

const quotationItemSchema = z.object({
  type: z.enum(['LABOR', 'PART']),
  description: z.string().trim().min(1).max(300),
  quantity: z.number().int().min(1).max(9999),
  unitPrice: z.number().min(0).max(1_000_000),
});

const createQuotationSchema = z.object({
  items: z.array(quotationItemSchema).min(1),
  taxRate: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).max(1_000_000).default(0),
  notes: z.string().trim().max(2000).nullable(),
  validUntil: z.string().date().nullable(),
});

serviceRequestsRouter.post(
  '/service-requests/:id/quotations',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  validateBody(createQuotationSchema),
  async (req, res) => {
    const request = await getServiceRequestById(req.params.id as string);
    if (!request) throw new ApiError(404, 'Service request not found');

    if (request.status !== 'WAITING_FOR_APPROVAL') {
      throw new ApiError(409, `Cannot quote a request in status ${request.status}`);
    }

    const existing = await getLatestQuotationForRequest(request.id);
    if (existing && existing.status !== 'REJECTED') {
      throw new ApiError(409, 'This request already has an active quotation');
    }

    const quotation = await createQuotation({
      serviceRequestId: request.id,
      createdBy: req.appUser!.id,
      ...req.body,
    });
    res.status(201).json(quotation);
  },
);

serviceRequestsRouter.get(
  '/service-requests/:id/invoice',
  requireAuthentication,
  syncUser,
  async (req, res) => {
    const request = await loadRequestForViewer(req);
    res.json(await getInvoiceForRequest(request.id));
  },
);
