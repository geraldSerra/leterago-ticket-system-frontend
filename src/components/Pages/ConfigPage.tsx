import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, X, Crown, Shield, User,
} from "lucide-react";
import PageHeader from "../Molecules/PageHeader";
import { useAppDispatch, useAppSelector, useCurrentUser } from "../../store/hooks";
import {
  createUserAsync,
  updateUserAsync,
  deleteUserAsync,
  clearUsersMutationError,
} from "../../store/usersSlice";
import type { AppUser, UserRole } from "../../store/authSlice";
import { DEPARTMENTS } from "../../config/catalog";
import type { DepartmentId } from "../../types/types";
import { getInitials } from "../../lib/initials";

const ROLE_OPTIONS: { value: UserRole; label: string; icon: typeof Crown; bg: string }[] = [
  { value: "master", label: "Master", icon: Crown,  bg: "bg-indigo-600" },
  { value: "admin",  label: "Admin",  icon: Shield, bg: "bg-[#0047AC]" },
  { value: "user",   label: "Invitado", icon: User, bg: "bg-slate-400" },
];

const DEPARTMENT_LIST: DepartmentId[] = [
  "compras",
  "servicios-generales",
  "mantenimiento-seguridad",
];

export default function ConfigPage() {
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();
  const users = useAppSelector((s) => s.users.list);
  const mutationError = useAppSelector((s) => s.users.mutationError);

  const [editing, setEditing] = useState<AppUser | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null);

  useEffect(() => {
    return () => {
      dispatch(clearUsersMutationError());
    };
  }, [dispatch]);

  const handleDelete = async (user: AppUser) => {
    await dispatch(deleteUserAsync(user.id));
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-6 gap-5 max-w-7xl mx-auto">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <PageHeader
          indicator="Administración"
          title="Gestión de Usuarios"
          description="Crear, asignar roles y departamentos a los usuarios del sistema."
        />
        <button
          onClick={() => {
            dispatch(clearUsersMutationError());
            setEditing("new");
          }}
          className="flex items-center gap-2 bg-[#0047AC] text-white text-sm px-4 py-2.5 rounded-xl cursor-pointer font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Nuevo Usuario
        </button>
      </div>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex justify-between items-start">
          <div>
            <strong className="block text-xs uppercase tracking-wider mb-1">Error</strong>
            {mutationError}
          </div>
          <button
            onClick={() => dispatch(clearUsersMutationError())}
            className="p-1 rounded hover:bg-red-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>Usuario</Th>
                <Th>Rol</Th>
                <Th>Departamentos</Th>
                <Th>ID</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const role = ROLE_OPTIONS.find((r) => r.value === u.role);
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${role?.bg ?? "bg-gray-400"} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                          {getInitials(u.name)}
                        </div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                      </div>
                    </Td>
                    <Td>
                      {role && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${role.bg} text-white`}>
                          <role.icon size={11} />
                          {role.label}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {u.departments.length === 0 ? (
                        <span className="text-gray-400 italic text-xs">Sin departamentos</span>
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {u.departments.map((d) => (
                            <span key={d} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                              {DEPARTMENTS[d]?.label ?? d}
                            </span>
                          ))}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs font-mono text-gray-400">{u.id}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditing(u)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold"
                        >
                          <Pencil size={12} />
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          disabled={isSelf}
                          title={isSelf ? "No puedes eliminar tu propia cuenta" : ""}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <UserFormModal
          mode={editing === "new" ? "create" : "edit"}
          initial={editing === "new" ? null : editing}
          isSelf={editing !== "new" && editing.id === currentUser.id}
          onClose={() => setEditing(null)}
          onSubmit={async (body) => {
            if (editing === "new") {
              const result = await dispatch(createUserAsync(body));
              if (createUserAsync.fulfilled.match(result)) setEditing(null);
            } else {
              const result = await dispatch(
                updateUserAsync({ id: editing.id, changes: body }),
              );
              if (updateUserAsync.fulfilled.match(result)) setEditing(null);
            }
          }}
        />
      )}

      {confirmDelete && (
        <DeleteModal
          user={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

// ─── User form modal ──────────────────────────────────────────────────────────

function UserFormModal({
  mode,
  initial,
  isSelf,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial: AppUser | null;
  isSelf: boolean;
  onClose: () => void;
  onSubmit: (body: {
    id?: string;
    name: string;
    password?: string;
    role: UserRole;
    departments: DepartmentId[];
  }) => void;
}) {
  const [id, setId] = useState(initial?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "user");
  const [departments, setDepartments] = useState<DepartmentId[]>(
    initial?.departments ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleDept = (d: DepartmentId) => {
    setDepartments((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Nombre requerido (≥ 2 caracteres)";
    if (mode === "create" && password.length < 6) {
      e.password = "Contraseña requerida (≥ 6 caracteres)";
    } else if (mode === "edit" && password.length > 0 && password.length < 6) {
      e.password = "Mínimo 6 caracteres";
    }
    if (mode === "create" && id.trim() && !/^[a-zA-Z0-9_-]{2,40}$/.test(id.trim())) {
      e.id = "Solo letras, números, _ y -. 2–40 chars";
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    onSubmit({
      id: mode === "create" && id.trim() ? id.trim() : undefined,
      name: name.trim(),
      password: password.length > 0 ? password : undefined,
      role,
      departments,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-base font-bold text-gray-900">
            {mode === "create" ? "Nuevo Usuario" : `Editar ${initial?.name}`}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {mode === "create" && (
            <Field label="ID (opcional)" hint="Auto-generado si se omite. Ej: admin_carlos" error={errors.id}>
              <input
                value={id}
                onChange={(e) => { setId(e.target.value); setErrors((p) => ({ ...p, id: "" })); }}
                placeholder="ej. admin_carlos"
                className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC] focus:ring-2 focus:ring-blue-100 font-mono ${
                  errors.id ? "border-red-400" : "border-gray-200"
                }`}
              />
            </Field>
          )}

          <Field
            label="Nombre completo"
            hint="Avatar = primera letra del primer nombre + primera letra del primer apellido"
            error={errors.name}
          >
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="ej. Diana Reyes"
              className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC] focus:ring-2 focus:ring-blue-100 ${
                errors.name ? "border-red-400" : "border-gray-200"
              }`}
            />
          </Field>

          <Field
            label={mode === "create" ? "Contraseña" : "Nueva contraseña"}
            hint={mode === "edit" ? "Dejar vacío para no cambiarla" : "Mínimo 6 caracteres"}
            error={errors.password}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
              placeholder={mode === "edit" ? "••••••" : ""}
              className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#0047AC] focus:ring-2 focus:ring-blue-100 ${
                errors.password ? "border-red-400" : "border-gray-200"
              }`}
            />
          </Field>

          <Field label="Rol" hint={isSelf && role === "master" ? "No puedes quitarte el rol master a ti mismo" : undefined}>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((r) => {
                const Icon = r.icon;
                const isCurrent = role === r.value;
                const wouldDemoteSelf = isSelf && initial?.role === "master" && r.value !== "master";
                return (
                  <button
                    key={r.value}
                    type="button"
                    disabled={wouldDemoteSelf}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border font-semibold transition-all ${
                      isCurrent
                        ? "bg-[#0047AC]/10 border-[#0047AC] text-[#0047AC]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    } ${wouldDemoteSelf ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Icon size={13} />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Departamentos">
            <div className="flex flex-col gap-2">
              {DEPARTMENT_LIST.map((d) => {
                const checked = departments.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDept(d)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm transition cursor-pointer text-left ${
                      checked
                        ? "bg-blue-50 border-[#0047AC] text-[#0047AC]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      checked ? "bg-[#0047AC] border-[#0047AC]" : "border-gray-400"
                    }`}>
                      {checked && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <span className="font-medium">{DEPARTMENTS[d].label}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#0047AC] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            {mode === "create" ? "Crear Usuario" : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({
  user, onCancel, onConfirm,
}: { user: AppUser; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">¿Eliminar usuario?</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Se eliminará permanentemente a <strong className="text-gray-800">{user.name}</strong>.
          Si tiene tickets asociados, la operación fallará.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Field & table primitives ─────────────────────────────────────────────────

function Field({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const Th = ({ children }: { children?: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
    {children}
  </th>
);

const Td = ({ children }: { children?: React.ReactNode }) => (
  <td className="px-4 py-3">{children}</td>
);
