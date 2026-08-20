import { Router } from 'express';
import { z } from 'zod';

import { findOrCreateCustomerByUserId } from '../db/customers.js';
import {
  assignTechnician,
  createServiceRequest,
  getServiceRequestById,
  listServiceRequestsForAdmin,
  listServiceRequestsForCustomer,
} from '../db/serviceRequests.js';
import { getTechnicianById } from '../db/technicians.js';
import { canTransition } from '../domain/serviceRequestStatus.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

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
  const request = await getServiceRequestById(req.params.id as string);
  if (!request) throw new ApiError(404, 'Service request not found');

  if (req.appUser!.role === 'CUSTOMER') {
    const customer = await findOrCreateCustomerByUserId(req.appUser!.id);
    if (request.customerId !== customer.id) {
      throw new ApiError(403, 'You do not have permission to view this request');
    }
  }

  res.json(request);
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
