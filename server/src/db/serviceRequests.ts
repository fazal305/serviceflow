import { getPool } from './pool.js';
import type { ServiceRequestStatus } from '../domain/serviceRequestStatus.js';

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string;
  serviceCategoryId: string | null;
  serviceCategoryName: string | null;
  description: string;
  status: ServiceRequestStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  preferredDate: string | null;
  preferredTime: string | null;
  address: string;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
  technicianId: string | null;
  technicianName: string | null;
}

interface ServiceRequestRow {
  id: string;
  customer_id: string;
  customer_name: string | null;
  customer_email: string;
  service_category_id: string | null;
  service_category_name: string | null;
  description: string;
  status: ServiceRequestStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  preferred_date: string | null;
  preferred_time: string | null;
  address: string;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
  technician_id: string | null;
  technician_name: string | null;
}

function toServiceRequest(row: ServiceRequestRow): ServiceRequest {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    serviceCategoryId: row.service_category_id,
    serviceCategoryName: row.service_category_name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    address: row.address,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    technicianId: row.technician_id,
    technicianName: row.technician_name,
  };
}

const SELECT_REQUEST = `
  SELECT sr.id, sr.customer_id, sr.service_category_id, sr.description, sr.status, sr.priority,
         sr.preferred_date, sr.preferred_time, sr.address, sr.contact_phone,
         sr.created_at, sr.updated_at,
         cu.full_name AS customer_name, cu.email AS customer_email,
         sc.name AS service_category_name,
         a.technician_id, tu.full_name AS technician_name
  FROM service_requests sr
  JOIN customers c ON c.id = sr.customer_id
  JOIN users cu ON cu.id = c.user_id
  LEFT JOIN service_categories sc ON sc.id = sr.service_category_id
  LEFT JOIN assignments a ON a.service_request_id = sr.id
  LEFT JOIN technicians t ON t.id = a.technician_id
  LEFT JOIN users tu ON tu.id = t.user_id
`;

export interface CreateServiceRequestInput {
  customerId: string;
  serviceCategoryId: string | null;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  preferredDate: string | null;
  preferredTime: string | null;
  address: string;
  contactPhone: string | null;
}

export async function createServiceRequest(input: CreateServiceRequestInput): Promise<ServiceRequest> {
  const { rows } = await getPool().query<{ id: string }>(
    `INSERT INTO service_requests
       (customer_id, service_category_id, description, priority, preferred_date, preferred_time, address, contact_phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.customerId,
      input.serviceCategoryId,
      input.description,
      input.priority,
      input.preferredDate,
      input.preferredTime,
      input.address,
      input.contactPhone,
    ],
  );
  const created = await getServiceRequestById(rows[0].id);
  if (!created) throw new Error('Failed to load service request after creation');
  return created;
}

export async function getServiceRequestById(id: string): Promise<ServiceRequest | null> {
  const { rows } = await getPool().query<ServiceRequestRow>(`${SELECT_REQUEST} WHERE sr.id = $1`, [id]);
  return rows[0] ? toServiceRequest(rows[0]) : null;
}

export async function listServiceRequestsForCustomer(customerId: string): Promise<ServiceRequest[]> {
  const { rows } = await getPool().query<ServiceRequestRow>(
    `${SELECT_REQUEST} WHERE sr.customer_id = $1 ORDER BY sr.created_at DESC`,
    [customerId],
  );
  return rows.map(toServiceRequest);
}

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus;
  serviceCategoryId?: string;
}

export async function listServiceRequestsForAdmin(filters: ServiceRequestFilters): Promise<ServiceRequest[]> {
  const { rows } = await getPool().query<ServiceRequestRow>(
    `${SELECT_REQUEST}
     WHERE ($1::request_status IS NULL OR sr.status = $1)
       AND ($2::uuid IS NULL OR sr.service_category_id = $2)
     ORDER BY sr.created_at DESC`,
    [filters.status ?? null, filters.serviceCategoryId ?? null],
  );
  return rows.map(toServiceRequest);
}

export async function updateServiceRequestStatus(
  id: string,
  status: ServiceRequestStatus,
): Promise<void> {
  await getPool().query('UPDATE service_requests SET status = $1, updated_at = now() WHERE id = $2', [
    status,
    id,
  ]);
}

export async function assignTechnician(params: {
  serviceRequestId: string;
  technicianId: string;
  assignedBy: string;
}): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO assignments (service_request_id, technician_id, assigned_by) VALUES ($1, $2, $3)',
      [params.serviceRequestId, params.technicianId, params.assignedBy],
    );
    await client.query('UPDATE service_requests SET status = $1, updated_at = now() WHERE id = $2', [
      'ASSIGNED',
      params.serviceRequestId,
    ]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
