import { Router, type Request } from 'express';
import { z } from 'zod';

import {
  addJobNote,
  addJobPart,
  completeJob,
  getJobById,
  getTechnicianIdForUser,
  listJobNotes,
  listJobParts,
  listJobsForAdmin,
  listJobsForTechnician,
  startJob,
} from '../db/jobs.js';
import { canTransition } from '../domain/serviceRequestStatus.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';

export const jobsRouter = Router();

async function loadOwnedJob(req: Request) {
  const job = await getJobById(req.params.id as string);
  if (!job) throw new ApiError(404, 'Job not found');

  if (req.appUser!.role === 'TECHNICIAN') {
    const technicianId = await getTechnicianIdForUser(req.appUser!.id);
    if (technicianId !== job.technicianId) {
      throw new ApiError(403, 'You do not have permission to access this job');
    }
  }

  return job;
}

jobsRouter.get('/jobs', requireAuthentication, syncUser, async (req, res) => {
  if (req.appUser!.role === 'ADMIN') {
    res.json(await listJobsForAdmin());
    return;
  }

  if (req.appUser!.role === 'TECHNICIAN') {
    const technicianId = await getTechnicianIdForUser(req.appUser!.id);
    res.json(technicianId ? await listJobsForTechnician(technicianId) : []);
    return;
  }

  throw new ApiError(403, 'You do not have permission to view jobs');
});

jobsRouter.get('/jobs/:id', requireAuthentication, syncUser, async (req, res) => {
  const job = await loadOwnedJob(req);
  const [notes, parts] = await Promise.all([listJobNotes(job.id), listJobParts(job.id)]);
  res.json({ ...job, notes, parts });
});

jobsRouter.post(
  '/jobs/:id/start',
  requireAuthentication,
  syncUser,
  requireRole('TECHNICIAN'),
  async (req, res) => {
    const job = await loadOwnedJob(req);
    if (!canTransition(job.status, 'IN_PROGRESS')) {
      throw new ApiError(409, `Cannot start a job in status ${job.status}`);
    }
    await startJob(job.id, job.serviceRequestId);
    res.json(await getJobById(job.id));
  },
);

jobsRouter.post(
  '/jobs/:id/complete',
  requireAuthentication,
  syncUser,
  requireRole('TECHNICIAN'),
  async (req, res) => {
    const job = await loadOwnedJob(req);
    if (!canTransition(job.status, 'WAITING_FOR_APPROVAL')) {
      throw new ApiError(409, `Cannot complete a job in status ${job.status}`);
    }
    await completeJob(job.id, job.serviceRequestId);
    res.json(await getJobById(job.id));
  },
);

const noteSchema = z.object({
  note: z.string().trim().min(1).max(2000),
});

jobsRouter.post(
  '/jobs/:id/notes',
  requireAuthentication,
  syncUser,
  requireRole('TECHNICIAN'),
  validateBody(noteSchema),
  async (req, res) => {
    const job = await loadOwnedJob(req);
    const note = await addJobNote(job.id, req.appUser!.id, req.body.note);
    res.status(201).json({ ...note, authorName: req.appUser!.fullName });
  },
);

const partSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(9999),
  unitCost: z.number().min(0).max(1_000_000).nullable(),
});

jobsRouter.post(
  '/jobs/:id/parts',
  requireAuthentication,
  syncUser,
  requireRole('TECHNICIAN'),
  validateBody(partSchema),
  async (req, res) => {
    const job = await loadOwnedJob(req);
    const part = await addJobPart({ jobId: job.id, ...req.body });
    res.status(201).json(part);
  },
);
