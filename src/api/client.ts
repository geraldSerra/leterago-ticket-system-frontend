import type {
  CategoryId,
  DepartmentId,
  TicketPriority,
  TicketStatus,
} from "../types/types";

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ServerUserRef = {
  id: string;
  name: string;
};

export type ServerUser = {
  id: string;
  name: string;
  role: "master" | "admin" | "user";
  departments: DepartmentId[];
};

export type ServerTicket = {
  id: string;
  title: string;
  description: string | null;
  note: string | null;
  departmentId: DepartmentId;
  categoryId: CategoryId;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: string;
  createdBy: ServerUserRef | null;
  assignedToId: string | null;
  assignedTo: ServerUserRef | null;
  executionDate: string | null;
  executionTime: string | null;
  payload: unknown | null;
  payloadVersion: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ServerTicketList = {
  items: ServerTicket[];
  total: number;
  take: number;
  skip: number;
};

export type CreateTicketBody = {
  title: string;
  description?: string;
  note?: string;
  departmentId: DepartmentId;
  categoryId: CategoryId;
  priority: TicketPriority;
  assignedToId?: string;
  executionDate?: string;
  executionTime?: string;
  payload?: unknown;
};

export type UpdateTicketBody = {
  title?: string;
  description?: string | null;
  note?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string | null;
  executionDate?: string | null;
  executionTime?: string | null;
  payload?: unknown;
};

export type ListTicketsQuery = {
  status?: TicketStatus;
  priority?: TicketPriority;
  departmentId?: DepartmentId;
  categoryId?: CategoryId;
  assignedToId?: string;
  createdById?: string;
  search?: string;
  take?: number;
  skip?: number;
};

async function request<T>(
  path: string,
  userId: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as Record<string, unknown>);
    const message =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : null) ?? `${res.status} ${res.statusText}`;
    const details =
      body && typeof body === "object" && "details" in body
        ? (body as { details: unknown }).details
        : undefined;
    throw new ApiError(res.status, message, details);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function buildQuery(query: Record<string, unknown> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export type CreateUserBody = {
  id?: string;
  name: string;
  password: string;
  role: "master" | "admin" | "user";
  departments: DepartmentId[];
};

export type UpdateUserBody = {
  name?: string;
  password?: string;
  role?: "master" | "admin" | "user";
  departments?: DepartmentId[];
};

export const api = {
  // Tickets
  listTickets: (userId: string, query?: ListTicketsQuery) =>
    request<ServerTicketList>(`/tickets${buildQuery(query)}`, userId),

  getTicket: (userId: string, id: string) =>
    request<ServerTicket>(`/tickets/${id}`, userId),

  createTicket: (userId: string, body: CreateTicketBody) =>
    request<ServerTicket>("/tickets", userId, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateTicket: (userId: string, id: string, body: UpdateTicketBody) =>
    request<ServerTicket>(`/tickets/${id}`, userId, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteTicket: (userId: string, id: string) =>
    request<void>(`/tickets/${id}`, userId, { method: "DELETE" }),

  // Users
  listUsers: (
    userId: string,
    query?: { role?: "master" | "admin" | "user"; departmentId?: DepartmentId },
  ) => request<ServerUser[]>(`/users${buildQuery(query)}`, userId),

  getUser: (userId: string, id: string) =>
    request<ServerUser>(`/users/${id}`, userId),

  createUser: (userId: string, body: CreateUserBody) =>
    request<ServerUser>("/users", userId, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateUser: (userId: string, id: string, body: UpdateUserBody) =>
    request<ServerUser>(`/users/${id}`, userId, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteUser: (userId: string, id: string) =>
    request<void>(`/users/${id}`, userId, { method: "DELETE" }),
};
