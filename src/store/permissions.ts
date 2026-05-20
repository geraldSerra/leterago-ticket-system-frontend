import type { AppUser } from "./authSlice";
import type { Ticket } from "../types/types";

function isAdminInDept(user: AppUser, departmentId: string): boolean {
  if (user.role === "master") return true;
  return user.departments.some((d) => d.departmentId === departmentId && d.role === "admin");
}

export function canViewTicket(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (user.role === "requester") return ticket.createdById === user.id;
  if (user.departments.some((d) => d.departmentId === ticket.departmentId && d.role !== "requester")) return true;
  if (ticket.createdById === user.id) return true;
  if (ticket.assignedTo === user.name) return true;
  return false;
}

export function canEditTicket(user: AppUser, ticket: Ticket): boolean {
  return isAdminInDept(user, ticket.departmentId);
}

export function canChangeStatus(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  const deptRole = user.departments.find((d) => d.departmentId === ticket.departmentId)?.role;
  if (deptRole === "admin") return true;
  if (deptRole === "participant" && ticket.assignedTo === user.name) return true;
  return false;
}

export function canAssign(user: AppUser, ticket: Ticket): boolean {
  return isAdminInDept(user, ticket.departmentId);
}

export function canConfirm(user: AppUser, ticket: Ticket): boolean {
  return isAdminInDept(user, ticket.departmentId);
}
