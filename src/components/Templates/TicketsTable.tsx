import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import type { Ticket } from "../../types/types";
import Badged from "../Atoms/Badged";
import { useAppSelector, useCurrentUser } from "../../store/hooks";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, DEPARTMENTS, getCategoriesForDepartments } from "../../config/catalog";

function TicketsTable() {
  const { tickets } = useAppSelector((s) => s.tickets);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();

  const visible: Ticket[] = useMemo(() => {
    const accessibleCats = getCategoriesForDepartments(currentUser.departments);
    return tickets.filter((t) => accessibleCats.includes(t.categoryId));
  }, [tickets, currentUser]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    return visible.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (deptFilter !== "all" && r.departmentId !== deptFilter) return false;
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.assignedTo || "").toLowerCase().includes(q)
      );
    });
  }, [visible, search, statusFilter, priorityFilter, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const showDeptFilter = currentUser.departments.length > 1;

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por ID, título o responsable..."
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0047AC] transition-all"
          />
        </div>

        {showDeptFilter && (
          <FilterSelect value={deptFilter} onChange={(v) => { setDeptFilter(v); setPage(1); }} label="Área">
            <option value="all">Todos los departamentos</option>
            {currentUser.departments.map((dId) => (
              <option key={dId} value={dId}>{DEPARTMENTS[dId].label}</option>
            ))}
          </FilterSelect>
        )}

        <FilterSelect value={priorityFilter} onChange={(v) => { setPriorityFilter(v); setPage(1); }} label="Prioridad">
          <option value="all">Todas</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </FilterSelect>

        <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} label="Estado">
          <option value="all">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Resuelto</option>
          <option value="confirmed">Confirmado</option>
          <option value="canceled">Cancelado</option>
        </FilterSelect>

        {(search || statusFilter !== "all" || priorityFilter !== "all" || deptFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setPriorityFilter("all"); setDeptFilter("all"); setPage(1); }}
            className="text-xs text-[#0047AC] font-semibold hover:underline whitespace-nowrap"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <Th>ID</Th>
              <Th>Título</Th>
              <Th>Departamento / Categoría</Th>
              <Th>Prioridad</Th>
              <Th>Estado</Th>
              <Th>Asignado a</Th>
              <Th>Fecha</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                  No se encontraron tickets con los filtros aplicados.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const dept = DEPARTMENTS[row.departmentId];
              const cat = CATEGORIES[row.categoryId];
              return (
                <tr
                  key={row.id}
                  className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/ticket-detail/${row.id}`)}
                >
                  <Td>
                    <span className="text-[#0047AC] font-bold text-xs font-mono">{row.id}</span>
                  </Td>
                  <Td>
                    <span className="text-gray-900 font-semibold text-sm line-clamp-1 max-w-52 block">{row.title}</span>
                    {row.description && (
                      <p className="text-gray-400 text-xs line-clamp-1 max-w-52">{row.description}</p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-700 text-xs font-semibold">{dept?.label ?? row.departmentId}</span>
                      <span className="text-gray-400 text-xs">{cat?.label ?? row.categoryId}</span>
                    </div>
                  </Td>
                  <Td><Badged variant={row.priority} /></Td>
                  <Td><Badged variant={row.status} /></Td>
                  <Td>
                    {row.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0047AC] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {row.assignedTo.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <span className="text-gray-700 text-xs whitespace-nowrap">{row.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Sin asignar</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-gray-500 text-xs whitespace-nowrap">{row.createdAt}</span>
                  </Td>
                  <Td>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/ticket-detail/${row.id}`); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-blue-100 text-[#0047AC]"
                    >
                      <Eye size={15} />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
        <span>
          {filtered.length === 0
            ? "0 registros"
            : `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} de ${filtered.length} registros`}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                p === page ? "bg-[#0047AC] text-white" : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
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

function FilterSelect({ value, onChange, label, children }: { value: string; onChange: (v: string) => void; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

export default TicketsTable;
