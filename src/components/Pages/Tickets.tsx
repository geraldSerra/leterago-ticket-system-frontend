import { Download, Plus } from "lucide-react";
import TicketsTable from "../Templates/TicketsTable";
import PageHeader from "../Molecules/PageHeader";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useCurrentUser } from "../../store/hooks";
import { DEPARTMENTS, getCategoriesForDepartments } from "../../config/catalog";
import type { DepartmentId } from "../../types/types";

const Tickets = () => {
  const navigate = useNavigate();
  const { tickets } = useAppSelector((s) => s.tickets);
  const currentUser = useCurrentUser();

  const userDeptIds: DepartmentId[] = currentUser.role === "master"
    ? (Object.keys(DEPARTMENTS) as DepartmentId[])
    : currentUser.departments.map((d) => d.departmentId as DepartmentId);

  const visible = currentUser.role === "user"
    ? tickets.filter((t) => t.createdById === currentUser.id || t.assignedTo === currentUser.name)
    : tickets.filter((t) => getCategoriesForDepartments(userDeptIds).includes(t.categoryId));

  const handleExport = () => {
    const headers = ["ID", "Título", "Departamento", "Categoría", "Prioridad", "Estado", "Asignado a", "Creado el"];
    const rows = visible.map((t) => [
      t.id, t.title, t.departmentId, t.categoryId, t.priority, t.status, t.assignedTo || "", t.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tickets.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-6 gap-5 max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <PageHeader
          title="Tickets"
          indicator="Tabla de solicitudes"
          description="Visualice y gestione todas las solicitudes del sistema."
        />
        <div className="flex gap-2 shrink-0">
          <button
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2.5 rounded-md cursor-pointer font-semibold hover:bg-gray-50 transition-colors "
            onClick={handleExport}
          >
            <Download size={15} />
            Exportar CSV
          </button>
          <button
            className="flex items-center gap-2 bg-[#0047AC] text-white text-sm px-4 py-2.5 rounded-md cursor-pointer font-semibold hover:bg-blue-700 transition-colors "
            onClick={() => navigate("/new-ticket")}
          >
            <Plus size={15} />
            Nuevo Ticket
          </button>
        </div>
      </div>
      <TicketsTable />
    </div>
  );
};

export default Tickets;
