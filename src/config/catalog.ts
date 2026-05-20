import type { CategoryId, DepartmentId } from "../types/types";
import { CalendarDays, ShoppingCart, Wrench, Landmark, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Category definitions ─────────────────────────────────────────────────────
export interface CategoryDef {
  id: CategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export const CATEGORIES: Record<CategoryId, CategoryDef> = {
  "solicitud-reunion": {
    id: "solicitud-reunion",
    label: "Reserva Salones",
    description: "Reserva de salas, coordinación de agendas y equipos audiovisuales o catering.",
    icon: CalendarDays,
    iconColor: "text-[#0047AC]",
    iconBg: "bg-blue-50",
  },
  "solicitud-compra": {
    id: "solicitud-compra",
    label: "Solicitud de Compra",
    description: "Adquisición de insumos, papelería, mobiliario, licencias o hardware.",
    icon: ShoppingCart,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  "solicitud-instalacion": {
    id: "solicitud-instalacion",
    label: "Servicios / Instalación",
    description: "Instalaciones eléctricas, plomería, aires acondicionados y afines.",
    icon: Wrench,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  "solicitud-bancos": {
    id: "solicitud-bancos",
    label: "Mensajería",
    description: "Servicios destinados al transporte, entrega, recepción, gestión de documentos y/o bancarios, paquetes y diligencias corporativas.",
    icon: Landmark,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
  },
  "solicitud-mantenimiento": {
    id: "solicitud-mantenimiento",
    label: "Solicitud de Mantenimiento",
    description: "Mantenimiento preventivo, correctivo y vigilancia de instalaciones.",
    icon: Shield,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
  },
};

// ─── Department definitions ───────────────────────────────────────────────────
export interface DepartmentDef {
  id: DepartmentId;
  label: string;
  categories: CategoryId[];
}

export const DEPARTMENTS: Record<DepartmentId, DepartmentDef> = {
  "compras": {
    id: "compras",
    label: "Compras",
    categories: ["solicitud-compra"],
  },
  "servicios-generales": {
    id: "servicios-generales",
    label: "Servicios Generales",
    categories: ["solicitud-reunion", "solicitud-instalacion", "solicitud-bancos"],
  },
  "mantenimiento-seguridad": {
    id: "mantenimiento-seguridad",
    label: "Mantenimiento y Seguridad",
    categories: ["solicitud-mantenimiento"],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Given a categoryId, returns its parent department */
export function getDepartmentForCategory(categoryId: CategoryId): DepartmentId | undefined {
  const entry = Object.values(DEPARTMENTS).find((d) =>
    d.categories.includes(categoryId)
  );
  return entry?.id;
}

/** Given a list of departmentIds, returns all accessible categoryIds */
export function getCategoriesForDepartments(deptIds: DepartmentId[]): CategoryId[] {
  const set = new Set<CategoryId>();
  deptIds.forEach((id) => {
    DEPARTMENTS[id]?.categories.forEach((c) => set.add(c));
  });
  return Array.from(set);
}
