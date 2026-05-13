import type { AppUser } from "./authSlice";
import type { Ticket } from "../types/types";

/**
 * Puede ver el ticket si:
 *   - es master
 *   - es admin/user con el departamento del ticket en su array
 *   - es el creador
 *   - es el asignado
 */
export function canViewTicket(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (user.departments.includes(ticket.departmentId)) return true;
  if (ticket.createdBy === user.name) return true;
  if (ticket.assignedTo === user.name) return true;
  return false;
}

/**
 * Puede editar completo (título, descripción, prioridad, asignación…):
 *   - master → siempre
 *   - admin   → solo si el departamento del ticket está en su array
 */
export function canEditTicket(user: AppUser, ticket: Ticket): boolean {
  if (user.role === "master") return true;
  if (user.role === "admin" && user.departments.includes(ticket.departmentId)) return true;
  return false;
}

/**
 * Puede cambiar SOLO el estado:
 *   - cualquiera con canEditTicket
 *   - la persona asignada al ticket
 */
export function canChangeStatus(user: AppUser, ticket: Ticket): boolean {
  if (canEditTicket(user, ticket)) return true;
  if (ticket.assignedTo === user.name) return true;
  return false;
}

/**
 * Puede asignar/reasignar:
 *   - solo quien puede editar completo (admin del dept o master)
 */
export function canAssign(user: AppUser, ticket: Ticket): boolean {
  return canEditTicket(user, ticket);
}

/**
 * Puede confirmar (status → "confirmed"):
 *   - solo master o admin del dept (cierre definitivo del flujo).
 */
export function canConfirm(user: AppUser, ticket: Ticket): boolean {
  return canEditTicket(user, ticket);
}
