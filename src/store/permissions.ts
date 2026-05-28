import type { AppUser } from "./authSlice";
import type { Ticket } from "../types/types";

function has(user: AppUser, code: string): boolean {
  return (user.permissions ?? []).includes(code);
}

function inDept(user: AppUser, departmentId: string): boolean {
  return user.departments.some((d) => d.departmentId === departmentId);
}

function isDeptAdmin(user: AppUser, departmentId: string): boolean {
  return user.departments.some((d) => d.departmentId === departmentId && d.role === "admin");
}

export function canViewTicket(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (has(user, "tickets.view_all")) return true;
  if (has(user, "tickets.view_department")) {
    if (inDept(user, ticket.departmentId)) return true;
    if (ticket.createdById === user.id || ticket.assignedTo === user.name) return true;
  }
  if (has(user, "tickets.view_own")) {
    return ticket.createdById === user.id || ticket.assignedTo === user.name;
  }
  return false;
}

export function canEditTicket(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (isDeptAdmin(user, ticket.departmentId)) return true;
  if (!has(user, "tickets.edit")) return false;
  if (has(user, "tickets.view_all")) return true;
  return inDept(user, ticket.departmentId);
}

export function canChangeStatus(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (isDeptAdmin(user, ticket.departmentId)) return true;
  if (!has(user, "tickets.change_status")) return false;
  if (has(user, "tickets.view_all")) return true;
  if (inDept(user, ticket.departmentId)) return true;
  return ticket.assignedTo === user.name;
}

export function canAssign(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (isDeptAdmin(user, ticket.departmentId)) return true;
  if (!has(user, "tickets.assign")) return false;
  if (has(user, "tickets.view_all")) return true;
  return inDept(user, ticket.departmentId);
}

export function canConfirm(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (isDeptAdmin(user, ticket.departmentId)) return true;
  if (!has(user, "tickets.confirm")) return false;
  if (has(user, "tickets.view_all")) return true;
  return inDept(user, ticket.departmentId);
}

export function canViewExtended(user: AppUser): boolean {
  if (user.role === "master") return true;
  return has(user, "tickets.view_extended");
}
