import {
  CircleCheckBig,
  CircleX,
  TriangleAlert,
  Minus,
  TrendingDown,
  TrendingUp,
  Clock,
  CircleDashed,
  LaptopMinimalCheck,
} from "lucide-react";

interface BadgeProps {
  variant:
    | "urgent"
    | "high"
    | "medium"
    | "low"
    | "pending"
    | "in_progress"
    | "completed"
    | "confirmed"
    | "canceled";
  label?: string;
}

const Badge = ({ variant }: Readonly<BadgeProps>) => {
  const styles = {
    urgent: "px-2 py-1 w-fit bg-red-50 text-red-500 border-red-300 rounded-sm",
    high: "px-2 py-1 w-fit bg-yellow-50 text-yellow-500 border-yellow-300 rounded-sm",
    medium:
      "px-2 py-1 w-fit bg-green-50 text-green-500 border-green-300 rounded-sm",
    low: "px-2 py-1 w-fit bg-gray-50 text-gray-500 border-gray-300 rounded-sm",
    pending:
      "px-3 py-1 w-fit bg-gray-50 text-gray-500 border-[#0047AC]/15 rounded-full",
    in_progress:
      "px-3 py-1 w-fit bg-[#0047AC]/10 text-[#0047AC] border-[#0047AC]/20 rounded-full",
    completed:
      "px-3 py-1 w-fit text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20 rounded-full",
    confirmed:
      "px-3 py-1 w-fit text-black bg-gray-50 border-gray-600 rounded-full",
    canceled:
      "px-3 py-1 w-fit text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20 rounded-full",
  };

  const texts = {
    urgent: "Urgente",
    high: "Alta",
    medium: "Media",
    low: "Baja",
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Resuelto",
    confirmed: "Confirmado",
    canceled: "Cancelado",
  };

  const icons = {
    urgent: <TriangleAlert size={14} />,
    high: <TrendingUp size={14} />,
    medium: <Minus size={14} />,
    low: <TrendingDown size={14} />,
    pending: <Clock size={14} />,
    in_progress: <CircleDashed size={14} />,
    completed: <CircleCheckBig size={14} />,
    confirmed: <LaptopMinimalCheck size={14} />,
    canceled: <CircleX size={14} />,
  };

  return (
    <div
      className={`flex justify-center items-center gap-1 text-[12px] font-semibold border ${styles[variant]}`}
    >
      {icons[variant]} {texts[variant]}
    </div>
  );
};

export default Badge;
