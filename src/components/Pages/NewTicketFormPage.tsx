import { useState, useMemo, useEffect } from "react";
import {
  TriangleAlert, TrendingUp, TrendingDown, Minus,
  CheckCircle2, ArrowLeft,
} from "lucide-react";
import PageHeader from "../Molecules/PageHeader";
import { useSearchParams, useNavigate } from "react-router-dom";
import AssigneePicker, { type User as AssigneeUser } from "../Organisms/AssigneePicker";
import { useAppDispatch, useAppSelector, useCurrentUser } from "../../store/hooks";
import { createTicketAsync, clearCreateError } from "../../store/ticketsSlice";
import type { TicketPriority, CategoryId } from "../../types/types";
import { CATEGORIES, getDepartmentForCategory } from "../../config/catalog";
import { canAssign } from "../../store/permissions";
import { getCategoryForm } from "../../forms/registry";

type Priority = "low" | "medium" | "high" | "urgent";

const priorities: { value: Priority; label: string; icon: React.ReactNode }[] = [
  { value: "low",    label: "Baja",    icon: <TrendingDown size={13} /> },
  { value: "medium", label: "Media",   icon: <Minus size={13} /> },
  { value: "high",   label: "Alta",    icon: <TrendingUp size={13} /> },
  { value: "urgent", label: "Urgente", icon: <TriangleAlert size={13} /> },
];

const deptLabels: Record<string, string> = {
  "compras": "Compras",
  "servicios-generales": "Servicios Generales",
  "mantenimiento-seguridad": "Mantenimiento y Seguridad",
};

export default function NewTicketFormPage() {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes]             = useState("");
  const [priority, setPriority]       = useState<Priority>("medium");
  const [assignedTo, setAssignedTo]   = useState<AssigneeUser | null>(null);
  const [submitted, setSubmitted]     = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const dispatch    = useAppDispatch();
  const currentUser = useCurrentUser();
  const allUsers    = useAppSelector((s) => s.users.list);
  const creating    = useAppSelector((s) => s.tickets.creating);
  const createError = useAppSelector((s) => s.tickets.createError);

  const categoryId   = (params.get("category") || "solicitud-reunion") as CategoryId;
  const catDef       = CATEGORIES[categoryId];
  const departmentId = useMemo(() => getDepartmentForCategory(categoryId), [categoryId]);

  // Category-specific form (registered in src/forms/registry.ts)
  const formDef = useMemo(() => getCategoryForm(categoryId), [categoryId]);
  const [payload, setPayload] = useState<unknown>(formDef?.defaultValue);

  // Reset payload state when navigating between categories
  useEffect(() => {
    setPayload(formDef?.defaultValue);
  }, [categoryId, formDef]);

  // canAssign needs a mock ticket to check permissions; we use the dept
  // A user can assign if their role is admin/master AND the dept is in their array
  const userCanAssign = useMemo(() => {
    if (!departmentId) return false;
    // Create a minimal ticket-like object just for the permission check
    return canAssign(currentUser, {
      id: "", title: "", departmentId, categoryId,
      status: "pending", priority: "medium",
      createdBy: currentUser.name, createdAt: "", updatedAt: "",
    });
  }, [currentUser, departmentId, categoryId]);

  // Users available for assignment: everyone who has this department
  const assigneeUsers: AssigneeUser[] = useMemo(() => {
    if (!departmentId) return [];
    return allUsers
      .filter((u) => u.departments.includes(departmentId))
      .map((u) => ({ id: u.id, name: u.name }));
  }, [allUsers, departmentId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim())       e.title       = "El título es obligatorio.";
    if (!description.trim()) e.description = "La descripción es obligatoria.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (!departmentId) return;

    const result = await dispatch(
      createTicketAsync({
        title:        title.trim(),
        description:  description.trim(),
        note:         notes.trim() || undefined,
        departmentId,
        categoryId,
        priority:     priority as TicketPriority,
        assignedToId: userCanAssign ? assignedTo?.id : undefined,
        payload:      formDef ? payload : undefined,
      })
    );

    if (createTicketAsync.fulfilled.match(result)) {
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setTitle(""); setDescription(""); setNotes("");
    setPriority("medium"); setAssignedTo(null); setErrors({});
    setPayload(formDef?.defaultValue);
    dispatch(clearCreateError());
  };

  if (!catDef) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        Categoría no encontrada.{" "}
        <button className="ml-2 text-[#0047AC]" onClick={() => navigate("/new-ticket")}>
          Volver
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ticket creado!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tu solicitud fue registrada en estado <strong>Pendiente</strong>.
            {!userCanAssign && " Un administrador la asignará pronto."}
          </p>
          <div className="flex flex-col gap-3">
            {(currentUser.role === "master" || currentUser.role === "admin") && (
              <button
                onClick={() => navigate("/tickets")}
                className="w-full bg-[#0047AC] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Ver todos los tickets
              </button>
            )}
            <button
              onClick={resetForm}
              className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Crear otro ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = catDef.icon;

  return (
    <div className="flex flex-col w-full min-h-screen px-6 py-8 max-w-5xl mx-auto gap-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors mt-1 shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          indicator="Creación de solicitud"
          title={catDef.label}
          description="Complete los campos para registrar su requerimiento."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ── Left: main fields ── */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#0047AC] rounded-full" />
              Información General
            </h2>

            <div className="flex flex-col gap-4">
              <Field label="TÍTULO DE LA SOLICITUD" error={errors.title}>
                <input
                  type="text"
                  placeholder="Ej. Reunión Trimestral de Ventas Q3"
                  className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm outline-none
                    focus:border-[#0047AC] focus:ring-2 focus:ring-blue-100 transition-all
                    ${errors.title ? "border-red-400" : "border-gray-200"}`}
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
                />
              </Field>

              <Field label="DESCRIPCIÓN" error={errors.description}>
                <textarea
                  rows={5}
                  placeholder="Describa el propósito y requerimientos..."
                  className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm outline-none
                    focus:border-[#0047AC] focus:ring-2 focus:ring-blue-100 transition-all resize-none
                    ${errors.description ? "border-red-400" : "border-gray-200"}`}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
                />
              </Field>

              <Field label="NOTAS (OPCIONAL)">
                <input
                  type="text"
                  placeholder="Información adicional relevante..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                    outline-none focus:border-[#0047AC] focus:ring-2 focus:ring-blue-100 transition-all"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </div>
          </div>

          {formDef && (
            <formDef.Component value={payload} onChange={setPayload} />
          )}
        </div>

        {/* ── Right: meta ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#0047AC] rounded-full" />
              Detalles del Ticket
            </h2>

            {/* Category — readonly */}
            <Field label="CATEGORÍA">
              <div className={`flex items-center gap-2.5 ${catDef.iconBg} border border-gray-200 rounded-xl px-3.5 py-2.5`}>
                <Icon className={`w-4 h-4 ${catDef.iconColor} shrink-0`} />
                <span className="text-sm font-semibold text-gray-800">{catDef.label}</span>
              </div>
            </Field>

            {/* Department — readonly */}
            <Field label="DEPARTAMENTO">
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 font-medium">
                {departmentId ? deptLabels[departmentId] ?? departmentId : "—"}
              </div>
            </Field>

            {/* Assignee — only for users who canAssign */}
            {userCanAssign && (
              <Field label="ASIGNADO A">
                <AssigneePicker
                  users={assigneeUsers}
                  value={assignedTo}
                  onChange={setAssignedTo}
                  width="w-full"
                />
              </Field>
            )}

            {/* Priority */}
            <Field label="PRIORIDAD">
              <div className="grid grid-cols-2 gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border
                      font-semibold transition-all cursor-pointer
                      ${priority === p.value
                        ? "bg-[#0047AC]/10 border-[#0047AC] text-[#0047AC]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {p.icon}{p.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* SLA */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-[#0047AC] uppercase tracking-wider mb-2">SLA por prioridad</p>
              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  { label: "Urgente", time: "1–2 horas" },
                  { label: "Alta",    time: "12–24 horas" },
                  { label: "Media",   time: "2–4 días" },
                  { label: "Baja",    time: "4–7 días" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-semibold text-gray-700">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <strong className="block text-xs uppercase tracking-wider mb-1">Error</strong>
              {createError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={creating}
            className="w-full bg-[#0047AC] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? "Creando..." : "Crear Ticket"}
          </button>
          <button
            onClick={() => navigate(-1)}
            disabled={creating}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
