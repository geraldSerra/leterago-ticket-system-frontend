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
  ArrowLeft, Calendar, User, Building, Tag, Clock,
  ChevronDown, Pencil, Trash2, X, Check, UserCheck,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { CATEGORIES, DEPARTMENTS } from "../../config/catalog";
import AssigneePicker, { type User as AssigneeUser } from "../Organisms/AssigneePicker";
import { canEditTicket, canChangeStatus, canAssign, canConfirm } from "../../store/permissions";
import { getCategoryForm } from "../../forms/registry";
import { getInitials } from "../../lib/initials";

const statusOptions: TicketStatus[] = ["pending", "in_progress", "completed", "confirmed", "canceled"];
const statusLabels: Record<TicketStatus, string> = {
  pending: "Pendiente", in_progress: "En progreso", completed: "Resuelto",
  confirmed: "Confirmado", canceled: "Cancelado",
};
const priorityLabels: Record<TicketPriority, string> = {
  urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja",
};
const priorityOptions: TicketPriority[] = ["urgent", "high", "medium", "low"];

// ─── Generic inline dropdown ──────────────────────────────────────────────────
function Dropdown<T extends string>({
  value, options, labels, onSelect, triggerLabel,
}: {
  value: T; options: T[]; labels: Record<T, string>;
  onSelect: (v: T) => void; triggerLabel: string;
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
        className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors font-semibold text-gray-700"
      >
        {triggerLabel}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden min-w-44">
          {options.map((s) => (
            <button
              key={s}
              onClick={() => { onSelect(s); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors
                flex items-center justify-between
                ${s === value ? "font-semibold text-[#0047AC]" : "text-gray-700"}`}
            >
              {labels[s]}
              {s === value && <Check size={13} className="text-[#0047AC]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quick status dropdown (for assigned user) ────────────────────────────────
function StatusDropdown({
  value, options, onSelect,
}: {
  value: TicketStatus; options: TicketStatus[]; onSelect: (v: TicketStatus) => void;
}) {
  return (
    <Dropdown
      value={value}
      options={options}
      labels={statusLabels}
      onSelect={onSelect}
      triggerLabel={`Estado: ${statusLabels[value]}`}
    />
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────
function DeleteModal({
  ticketId, onConfirm, onCancel,
}: { ticketId: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">¿Eliminar ticket?</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Esta acción es permanente. El ticket{" "}
          <span className="font-bold text-gray-800 font-mono">{ticketId}</span> será eliminado.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User info chip ───────────────────────────────────────────────────────────
function UserChip({ name, badge }: { name: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0047AC] text-[10px] font-bold flex items-center justify-center shrink-0">
        {getInitials(name)}
      </div>
      <p className="text-sm font-semibold text-gray-800 leading-tight">{name}</p>
      {badge && (
        <span className="ml-auto text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
          {badge}
        </span>
      )}
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
  const [editing,    setEditing]    = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editTitle,       setEditTitle]       = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNote,        setEditNote]        = useState("");
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
      .filter((u) => u.departments.includes(ticket.departmentId))
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

  const dept = DEPARTMENTS[ticket.departmentId];
  const cat  = CATEGORIES[ticket.categoryId];

  const startEdit = () => {
    setEditTitle(ticket.title);
    setEditDescription(ticket.description ?? "");
    setEditNote(ticket.note ?? "");
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    const match = assigneeUsers.find((u) => u.name === ticket.assignedTo) ?? null;
    setEditAssignedTo(match);
    setEditPayload(ticket.payload ?? formDef?.defaultValue);
    setEditing(true);
  };

  const saveEdit = () => {
    dispatch(updateTicketAsync({
      id: ticket.id,
      changes: {
        title:        editTitle,
        description:  editDescription,
        note:         editNote,
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

      <div className="min-h-screen bg-gray-50 p-6 max-w-5xl mx-auto">

        {/* ── Top action bar ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(currentUser.role === "user" ? "/new-ticket" : "/tickets")}
              className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
              {ticket.id}
            </span>
            <Badge variant={ticket.status} />
            <Badge variant={ticket.priority} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Assigned user can only change status */}
            {canStatus && !canEdit && (
              <StatusDropdown
                value={ticket.status}
                options={allowedStatuses}
                onSelect={(s) => dispatch(updateTicketAsync({ id: ticket.id, changes: { status: s } }))}
              />
            )}

            {/* Admin/Master full controls */}
            {canEdit && !editing && (
              <>
                <Dropdown
                  value={ticket.status}
                  options={allowedStatuses}
                  labels={statusLabels}
                  onSelect={(s) => dispatch(updateTicketAsync({ id: ticket.id, changes: { status: s } }))}
                  triggerLabel="Estado"
                />
                <Dropdown
                  value={ticket.priority}
                  options={priorityOptions}
                  labels={priorityLabels}
                  onSelect={(p) => dispatch(updateTicketAsync({ id: ticket.id, changes: { priority: p } }))}
                  triggerLabel="Prioridad"
                />
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 font-semibold text-gray-700"
                >
                  <Pencil size={13} />
                  Editar
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-1.5 border border-red-200 rounded-xl px-3 py-2 text-sm bg-white hover:bg-red-50 font-semibold text-red-500"
                >
                  <Trash2 size={13} />
                  Eliminar
                </button>
              </>
            )}

            {editing && (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 font-semibold text-gray-600"
                >
                  <X size={13} />Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1.5 bg-[#0047AC] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-700"
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
            className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6 outline-none focus:border-[#0047AC] focus:ring-2 focus:ring-blue-100"
          />
        ) : (
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{ticket.title}</h1>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Descripción
              </p>
              {editing ? (
                <textarea
                  rows={5}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC] resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {ticket.description || "Sin descripción registrada."}
                </p>
              )}
            </div>

            {/* Notes */}
            {(ticket.note || editing) && (
              <div className={`rounded-2xl border p-5 shadow-sm
                ${editing ? "bg-white border-gray-200" : "bg-amber-50 border-amber-200"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2
                  ${editing ? "text-gray-400" : "text-amber-600"}`}>
                  Notas internas
                </p>
                {editing ? (
                  <input
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Notas internas opcionales..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC]"
                  />
                ) : (
                  <p className="text-sm text-amber-800">{ticket.note}</p>
                )}
              </div>
            )}

            {/* Edit panel — only when editing and canEdit */}
            {editing && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Gestión del ticket
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Estado
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC]"
                    >
                      {allowedStatuses.map((s) => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Prioridad
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TicketPriority)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC]"
                    >
                      {priorityOptions.map((p) => (
                        <option key={p} value={p}>{priorityLabels[p]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* AssigneePicker — only if canAssign */}
                {canAssignPerm && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck size={11} />
                      ASIGNADO A
                    </label>
                    <p className="text-[10px] text-gray-400 -mt-1">
                      Muestra todos los usuarios con acceso a <strong>{dept?.label}</strong>
                    </p>
                    <AssigneePicker
                      users={assigneeUsers}
                      value={editAssignedTo}
                      onChange={setEditAssignedTo}
                      width="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Category-specific form (read-only when not editing) */}
            {formDef && (editing || ticket.payload != null) && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">
                  Detalles de la solicitud
                </p>
                <formDef.Component
                  value={editing ? editPayload : ticket.payload}
                  onChange={editing ? setEditPayload : () => {}}
                  readOnly={!editing}
                />
              </div>
            )}

            {/* Activity */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                Actividad
              </p>
              <div className="flex flex-col">
                <TimelineItem
                  color="bg-[#0047AC]"
                  title="Ticket creado"
                  subtitle={`por ${ticket.createdBy} · ${ticket.createdAt}`}
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
                    subtitle={`Última actualización · ${ticket.updatedAt}`}
                    last
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Right ── */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4">

              <MetaItem icon={<Building size={14} />} label="Departamento"
                value={dept?.label ?? ticket.departmentId} />

              <MetaItem icon={<Tag size={14} />} label="Categoría"
                value={cat?.label ?? ticket.categoryId} />

              {/* Creator */}
              <div>
                <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
                  <User size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Creado por</span>
                </div>
                <UserChip name={ticket.createdBy} />
              </div>

              {/* Assignee */}
              <div>
                <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
                  <UserCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Asignado a</span>
                </div>
                {ticket.assignedTo ? (
                  <UserChip
                    name={ticket.assignedTo}
                    badge={ticket.assignedTo === currentUser.name ? "Tú" : undefined}
                  />
                ) : (
                  <p className="text-gray-400 italic text-sm">Sin asignar</p>
                )}
              </div>

              {ticket.executionDate && (
                <MetaItem
                  icon={<Calendar size={14} />}
                  label="Fecha de ejecución"
                  value={`${ticket.executionDate}${ticket.executionTime ? " · " + ticket.executionTime : ""}`}
                />
              )}
              <MetaItem icon={<Clock size={14} />} label="Creado el"   value={ticket.createdAt} />
              <MetaItem icon={<Clock size={14} />} label="Actualizado" value={ticket.updatedAt} />
            </div>

            {/* Priority card */}
            <div className="bg-gradient-to-br from-[#0047AC] to-blue-800 rounded-2xl p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-2">Prioridad</p>
              <p className="text-2xl font-bold">{priorityLabels[ticket.priority]}</p>
              <p className="text-xs text-blue-200 mt-1">
                {ticket.priority === "urgent" && "SLA: 1–2 horas"}
                {ticket.priority === "high"   && "SLA: 12–24 horas"}
                {ticket.priority === "medium" && "SLA: 2–4 días"}
                {ticket.priority === "low"    && "SLA: 4–7 días"}
              </p>
            </div>

            {/* Permission info chip */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-400 flex flex-col gap-1.5">
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

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
