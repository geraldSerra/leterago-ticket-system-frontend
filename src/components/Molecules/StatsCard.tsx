import { type ReactNode } from "react";
type StatsCardProps = {
  title: string;
  value: string;
  badge: string;
  icon: ReactNode;
  trendText: string;
  trendType?: "success" | "danger";
};

export default function StatsCard({
  title,
  value,
  badge,
  icon,
  trendText,
  trendType = "success",
}: StatsCardProps) {
  return (
    <div className="bg-gray-100 border border-blue-900/40 rounded-xl p-5 text-white">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-blue-500/10 p-2 rounded-md">{icon}</div>

        <span className="text-[10px] uppercase tracking-wide text-gray-400 bg-[#0B1220] px-2 py-1 rounded">
          {badge}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-1">{title}</p>
      <h3 className="text-2xl font-semibold mb-3">{value}</h3>
      <p
        className={`text-xs flex items-center gap-1 ${
          trendType === "success" ? "text-green-400" : "text-red-400"
        }`}
      >
        {trendType === "success" ? "↗" : "⚠"} {trendText}
      </p>
    </div>
  );
}
