import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch, useCurrentUser } from "../../store/hooks";
import {
  updateTicketAsync,
  deleteTicketAsync,
  fetchTicketDetailAsync,
} from "../../store/ticketsSlice";
import type { TicketStatus, TicketPriority } from "../../types/types";
import Badge from "../Atoms/Badged";
import {
  ArrowLeft,
  ChevronDown, Pencil, Trash2, X, Check, Settings,
  TrendingDown, Minus, TrendingUp, TriangleAlert,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { type User as AssigneeUser } from "../Organisms/AssigneePicker";
import { canEditTicket, canChangeStatus, canAssign, canConfirm } from "../../store/permissions";
import { getCategoryForm } from "../../forms/registry";
import TicketDetailsPanel from "../Organisms/TicketDetailsPanel";
import { formatDate } from "../../lib/formatDate";

const statusOptions: TicketStatus[] = ["pending", "in_progress", "completed", "confirmed", "canceled"];
const statusLabels: Record<TicketStatus, string> = {
  pending: "Pendiente", in_progress: "En progreso", completed: "Resuelto",
  confirmed: "Confirmado", canceled: "Cancelado",
};
const priorityLabels: Record<TicketPriority, string> = {
  urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja",
};
const priorityOptions: TicketPriority[] = ["urgent", "high", "medium", "low"];

// ─── Box-style dropdown ───────────────────────────────────────────────────────
function BoxDropdown<T extends string>({
  label, displayValue, options, optionLabels, current, onSelect,
}: {
  label: string; displayValue: React.ReactNode;
  options: T[]; optionLabels: Record<T, string>;
  current: T; onSelect: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-row items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 hover:border-[#0047AC] hover:bg-blue-50/30 transition-colors"
      >
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          {displayValue}
          <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-gray-200 rounded-lg shadow-sm z-50 overflow-hidden min-w-44">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between
                ${opt === current ? "font-semibold text-[#0047AC]" : "text-gray-700"}`}
            >
              {optionLabels[opt]}
              {opt === current && <Check size={13} className="text-[#0047AC]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────
function DeleteModal({
  ticketId, onConfirm, onCancel,
}: { ticketId: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">¿Eliminar ticket?</h3>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Esta acción es permanente. El ticket{" "}
          <span className="font-bold text-gray-800 font-mono">{ticketId}</span> será eliminado.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-md text-sm font-semibold hover:bg-red-600">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TicketDetail() {
  const { id }      = useParams<{ id: string }>();
  const { tickets } = useAppSelector((s) => s.tickets);
  const currentUser = useCurrentUser();
  const allUsers    = useAppSelector((s) => s.users.list);
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();

  // Hydrate this ticket's payload (the list endpoint doesn't return it).
  useEffect(() => {
    if (id) dispatch(fetchTicketDetailAsync(id));
  }, [dispatch, id]);

  const ticket = tickets.find((t) => t.id === id) ?? tickets[0];

  // Permission flags derived from permissions.ts
  const canEdit        = ticket ? canEditTicket(currentUser, ticket)  : false;
  const canStatus      = ticket ? canChangeStatus(currentUser, ticket) : false;
  const canAssignPerm  = ticket ? canAssign(currentUser, ticket)       : false;
  const canConfirmNow  = ticket
    ? canConfirm(currentUser, ticket) && ticket.status === "completed"
    : false;

  // "confirmed" is gated by role + transition (only admin/master, only from "completed").
  // Always include it if it's the current value, so the select keeps a valid option.
  const allowedStatuses: TicketStatus[] = statusOptions.filter((s) => {
    if (s !== "confirmed") return true;
    if (!ticket) return false;
    return ticket.status === "confirmed" || canConfirmNow;
  });

  // Edit mode state
  const [editing,         setEditing]         = useState(false);
  const [showDelete,      setShowDelete]      = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowActionsMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const [editTitle,       setEditTitle]       = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus,      setEditStatus]      = useState<TicketStatus>("pending");
  const [editPriority,    setEditPriority]    = useState<TicketPriority>("medium");
  const [editAssignedTo,  setEditAssignedTo]  = useState<AssigneeUser | null>(null);
  const [editPayload,     setEditPayload]     = useState<unknown>(undefined);

  // Category-specific form (read-only by default; editable while `editing`)
  const formDef = useMemo(
    () => (ticket ? getCategoryForm(ticket.categoryId) : undefined),
    [ticket?.categoryId],
  );

  // All users in this ticket's department — for AssigneePicker
  const assigneeUsers: AssigneeUser[] = useMemo(() => {
    if (!ticket) return [];
    return allUsers
      .filter((u) => u.role === "master" || u.departments.some((d) => d.departmentId === ticket.departmentId))
      .map((u) => ({ id: u.id, name: u.name }));
  }, [allUsers, ticket]);

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500 text-sm">Ticket no encontrado.</p>
        <button onClick={() => navigate("/tickets")}
          className="text-[#0047AC] text-sm font-semibold hover:underline">
          Volver a Tickets
        </button>
      </div>
    );
  }

  const startEdit = async () => {
    let payloadForEdit = ticket.payload;
    if (formDef && payloadForEdit == null) {
      const result = await dispatch(fetchTicketDetailAsync(ticket.id));
      if (fetchTicketDetailAsync.fulfilled.match(result)) {
        payloadForEdit = (result.payload as { payload?: unknown }).payload ?? null;
      }
    }
    setEditTitle(ticket.title);
    setEditDescription(ticket.description ?? "");
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    const match = assigneeUsers.find((u) => u.name === ticket.assignedTo) ?? null;
    setEditAssignedTo(match);
    setEditPayload({ ...(formDef?.defaultValue as Record<string, unknown> ?? {}), ...(payloadForEdit as Record<string, unknown> ?? {}) });
    setEditing(true);
  };

  const saveEdit = () => {
    dispatch(updateTicketAsync({
      id: ticket.id,
      changes: {
        title:        editTitle,
        description:  editDescription,
        status:       editStatus,
        priority:     editPriority,
        assignedToId: editAssignedTo?.id ?? null,
        payload:      formDef ? editPayload : undefined,
      },
    }));
    setEditing(false);
  };

  return (
    <>
      {showDelete && (
        <DeleteModal
          ticketId={ticket.id}
          onConfirm={() => { dispatch(deleteTicketAsync(ticket.id)); navigate("/tickets"); }}
          onCancel={() => setShowDelete(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 p-6 max-w-7xl mx-auto">

        {/* ── Top action bar ── */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap mb-6">
          {/* Left: back + ID + badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(currentUser.role === "user" ? "/new-ticket" : "/tickets")}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-2xl font-bold text-gray-700 uppercase tracking-widest font-mono">
              {ticket.id}
            </span>
          </div>

          {/* Right: action boxes */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status box — visible to anyone who can change status */}
            {(canEdit || canStatus) && !editing && (
              <BoxDropdown
                label="Estado"
                displayValue={<Badge variant={ticket.status} />}
                options={allowedStatuses}
                optionLabels={statusLabels}
                current={ticket.status}
                onSelect={(s) => dispatch(updateTicketAsync({ id: ticket.id, changes: { status: s } }))}
              />
            )}

            {/* Actions — admin/master only */}
            {canEdit && !editing && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowActionsMenu((v) => !v)}
                  className="p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-all"
                ><Settings size={24} /></button>
                {showActionsMenu && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-gray-200 rounded-lg shadow-sm min-w-36 overflow-hidden">
                    <button
                      onClick={() => { startEdit(); setShowActionsMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Pencil size={13} />Editar
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => { setShowDelete(true); setShowActionsMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                    >
                      <Trash2 size={13} />Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Edit mode: Cancel + Save */}
            {editing && (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 border border-gray-200 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 font-semibold text-gray-600"
                >
                  <X size={13} />Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1.5 bg-[#0047AC] text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                >
                  <Check size={13} />Guardar
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Title ── */}
        {editing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-200 py-2 mb-6 outline-none focus:border-[#0047AC] transition-colors"
          />
        ) : (
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{ticket.title}</h1>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 ">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Descripción
              </p>
              {editing ? (
                <textarea
                  rows={8}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC] resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {ticket.description || "Sin descripción registrada."}
                </p>
              )}
            </div>



            {/* Category-specific form (read-only when not editing) */}
            {formDef && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">
                  Detalles de la solicitud
                </p>
                <formDef.Component
                  value={editing
                    ? editPayload
                    : { ...(formDef.defaultValue as Record<string, unknown>), ...(ticket.payload as Record<string, unknown> ?? {}) }
                  }
                  onChange={editing ? setEditPayload : () => {}}
                  readOnly={!editing}
                />
              </div>
            )}

            {/* Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 ">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                Actividad
              </p>
              <div className="flex flex-col">
                <TimelineItem
                  color="bg-[#0047AC]"
                  title="Ticket creado"
                  subtitle={`por ${ticket.createdBy} · ${formatDate(ticket.createdAt)}`}
                  last={ticket.status === "pending" && !ticket.assignedTo}
                />
                {ticket.assignedTo && (
                  <TimelineItem
                    color="bg-indigo-400"
                    title={`Asignado a ${ticket.assignedTo}`}
                    subtitle="Asignación registrada"
                    last={ticket.status === "pending"}
                  />
                )}
                {ticket.status !== "pending" && (
                  <TimelineItem
                    color="bg-emerald-500"
                    title={`Estado actualizado: ${statusLabels[ticket.status]}`}
                    subtitle={`Última actualización · ${formatDate(ticket.updatedAt)}`}
                    last
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Right ── */}
          <div className="flex flex-col gap-4">

            {editing ? (
              <TicketDetailsPanel
                readOnly={false}
                categoryId={ticket.categoryId}
                departmentId={ticket.departmentId}
                priority={editPriority}
                onPriorityChange={setEditPriority}
                canAssign={canAssignPerm}
                assigneeUsers={assigneeUsers}
                assignedTo={editAssignedTo}
                onAssignedToChange={setEditAssignedTo}
              />
            ) : (
              <TicketDetailsPanel
                readOnly={true}
                categoryId={ticket.categoryId}
                departmentId={ticket.departmentId}
                createdBy={ticket.createdBy}
                assignedToName={ticket.assignedTo}
                currentUserName={currentUser.name}
                createdAt={ticket.createdAt}
                updatedAt={ticket.updatedAt}
              />
            )}

            {/* Priority card */}
            {!editing && <div className="bg-gradient-to-br from-[#0047AC] to-blue-800 rounded-lg p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-2">Prioridad</p>
              <p className="text-2xl font-bold">{priorityLabels[ticket.priority]}</p>
              <p className="text-xs text-blue-200 mt-1">
                {ticket.priority === "urgent" && "SLA: 1–2 horas"}
                {ticket.priority === "high"   && "SLA: 12–24 horas"}
                {ticket.priority === "medium" && "SLA: 2–4 días"}
                {ticket.priority === "low"    && "SLA: 4–7 días"}
              </p>
            </div>}

            {/* Permission info chip */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-400 flex flex-col gap-1.5">
              <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Tus permisos</p>
              <PermRow allowed={canEdit}       label="Editar ticket completo" />
              <PermRow allowed={canStatus}     label="Cambiar estado" />
              <PermRow allowed={canAssignPerm} label="Asignar responsable" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function PermRow({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${allowed ? "bg-emerald-400" : "bg-gray-300"}`} />
      <span className={allowed ? "text-gray-600" : "text-gray-400"}>{label}</span>
    </div>
  );
}

function TimelineItem({ color, title, subtitle, last }: {
  color: string; title: string; subtitle: string; last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0 mt-1`} />
        {!last && <div className="w-px flex-1 bg-gray-200 my-1" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

