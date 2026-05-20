// ─── Category IDs ─────────────────────────────────────────────────────────────
export type CategoryId =
  | "solicitud-reunion"
  | "solicitud-compra"
  | "solicitud-instalacion"
  | "solicitud-bancos"
  | "solicitud-mantenimiento";

// ─── Department IDs ───────────────────────────────────────────────────────────
export type DepartmentId =
  | "compras"
  | "servicios-generales"
  | "mantenimiento-seguridad";

// ─── Ticket Status / Priority ─────────────────────────────────────────────────
export type TicketStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "confirmed"
  | "canceled";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

// ─── Ticket ───────────────────────────────────────────────────────────────────
export type Ticket = {
  id: string;
  title: string;
  description?: string;

  departmentId: DepartmentId;
  categoryId: CategoryId;

  status: TicketStatus;
  priority: TicketPriority;

  createdById: string;
  createdBy: string;
  assignedTo?: string;

  executionAt?: string;

  /** Category-specific data (loaded only on detail responses, undefined otherwise). */
  payload?: unknown;
  payloadVersion?: number | null;

  createdAt: string;
  updatedAt: string;
};

// ─── Catalog types (kept for compatibility) ──────────────────────────────────
export type TicketPayload = {
  id: string;
  ticketId: string;
  data: Record<string, unknown> | string;
  version: number;
  createdAt: string;
};

// Legacy aliases so old imports don't break during transition
export type Department = DepartmentId;
export type TicketType = CategoryId;
