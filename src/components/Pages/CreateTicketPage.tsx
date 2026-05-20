import { useState, useMemo } from "react";
import { ArrowRight, Filter } from "lucide-react";
import PageHeader from "../Molecules/PageHeader";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../store/hooks";
import { CATEGORIES, DEPARTMENTS, getCategoriesForDepartments } from "../../config/catalog";
import type { DepartmentId } from "../../types/types";

const ALL_DEPT_IDS = Object.keys(DEPARTMENTS) as DepartmentId[];

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [deptFilter, setDeptFilter] = useState<DepartmentId | "all">("all");

  // Requesters can create tickets in any department; others are scoped to their working depts
  const userDeptIds: DepartmentId[] =
    currentUser.role === "master" || currentUser.role === "requester"
      ? ALL_DEPT_IDS
      : currentUser.departments
          .filter((d) => d.role !== "requester")
          .map((d) => d.departmentId as DepartmentId);

  // Accessible categories based on user's departments
  const accessibleCategories = useMemo(
    () => getCategoriesForDepartments(userDeptIds),
    [currentUser.id, currentUser.departments] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Apply optional department filter
  const visibleCategories = useMemo(() => {
    if (deptFilter === "all") return accessibleCategories;
    return DEPARTMENTS[deptFilter]?.categories.filter((c) =>
      accessibleCategories.includes(c)
    ) ?? [];
  }, [accessibleCategories, deptFilter]);

  // Only show dept filter selector if user has access to 2+ departments
  const showDeptFilter = userDeptIds.length > 1;

  return (
    <div className="flex flex-col w-full min-h-screen p-6 max-w-7xl mx-auto">
      <PageHeader
        indicator="Nuevo Ticket"
        title="Crear Solicitud"
        description="Seleccione el tipo de solicitud para dirigir su requerimiento al equipo correcto."
      />

      {/* Department filter — only visible for multi-dept users */}
      {showDeptFilter && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <Filter size={13} />
            Filtrar por departamento:
          </div>
          <div className="flex gap-2 flex-wrap">
            <FilterPill
              active={deptFilter === "all"}
              onClick={() => setDeptFilter("all")}
              label="Todos"
            />
            {userDeptIds.map((dId) => (
              <FilterPill
                key={dId}
                active={deptFilter === dId}
                onClick={() => setDeptFilter(dId)}
                label={DEPARTMENTS[dId].label}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleCategories.map((catId) => {
          const cat = CATEGORIES[catId];
          // Find which department this category belongs to
          const dept = Object.values(DEPARTMENTS).find((d) =>
            d.categories.includes(catId)
          );
          const Icon = cat.icon;

          return (
            <button
              key={catId}
              onClick={() => navigate(`/create-ticket?category=${catId}`)}
              className="group text-left bg-white border border-gray-200 rounded-lg p-6 hover:border-[#0047AC]  transition-all duration-200 cursor-pointer"
            >
              {/* Department tag */}
              {dept && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 bg-gray-100 px-2 py-0.5 rounded-md">
                  {dept.label}
                </span>
              )}
              <div className={`w-12 h-12 ${cat.iconBg} rounded-md flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 ${cat.iconColor}`} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#0047AC] transition-colors">
                {cat.label}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{cat.description}</p>
              <span className="flex items-center gap-1.5 text-[#0047AC] text-sm font-semibold">
                Seleccionar
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
        active
          ? "bg-[#0047AC] text-white border-[#0047AC]"
          : "bg-white text-gray-600 border-gray-200 hover:border-[#0047AC] hover:text-[#0047AC]"
      }`}
    >
      {label}
    </button>
  );
}
