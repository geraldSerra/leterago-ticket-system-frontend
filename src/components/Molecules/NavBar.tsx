import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, Check, Shield, User, Crown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setCurrentUser, type AppUser } from "../../store/authSlice";
import { DEPARTMENTS } from "../../config/catalog";
import type { DepartmentId } from "../../types/types";
import { getInitials } from "../../lib/initials";

const roleColors: Record<string, { bg: string; text: string }> = {
  master: { bg: "bg-indigo-600", text: "text-white" },
  admin: { bg: "bg-[#0047AC]", text: "text-white" },
  user: { bg: "bg-slate-400", text: "text-white" },
};

const roleLabels: Record<string, string> = {
  master: "Master",
  admin: "Admin",
  user: "Invitado",
};

const RoleIcon = ({ role }: { role: string }) => {
  if (role === "master") return <Crown size={11} />;
  if (role === "admin") return <Shield size={11} />;
  return <User size={11} />;
};

const Avatar = ({ user, size = "md" }: { user: AppUser; size?: "sm" | "md" }) => {
  const c = roleColors[user.role];
  const sizeClass = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${sizeClass} ${c.bg} ${c.text} rounded-full flex items-center justify-center font-bold shrink-0 ring-2 ring-white`}>
      {getInitials(user.name)}
    </div>
  );
};

function getDeptSummary(user: AppUser): string {
  if (user.role === "master") return "Acceso total";
  if (user.role === "user") return "Solo crear tickets";
  if (user.departments.length === 0) return "";
  if (user.departments.length === 1) return DEPARTMENTS[user.departments[0] as DepartmentId]?.label ?? "";
  return user.departments.map((d) => DEPARTMENTS[d as DepartmentId]?.label ?? d).join(", ");
}

const NavBar = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const profiles = useAppSelector((s) => s.users.list);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!currentUser) return null;

  const roleColor = roleColors[currentUser.role];

  return (
    <nav className="flex w-full h-full justify-end items-center gap-3 px-6 bg-white border-b border-gray-100">
      <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>
      <div className="w-px h-6 bg-gray-200" />

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
        >
          <Avatar user={currentUser} />
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{currentUser.name}</p>
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${roleColor.bg} ${roleColor.text}`}>
              <RoleIcon role={currentUser.role} />
              {roleLabels[currentUser.role]}
            </span>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Cambiar perfil</p>
            </div>
            <div className="p-2">
              {profiles.map((profile) => {
                const isActive = profile.id === currentUser.id;
                const c = roleColors[profile.role];
                const deptSummary = getDeptSummary(profile);
                return (
                  <button
                    key={profile.id}
                    onClick={() => { dispatch(setCurrentUser(profile)); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                      isActive ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <Avatar user={profile} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? "text-blue-700" : "text-gray-800"}`}>
                        {profile.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                          <RoleIcon role={profile.role} />
                          {roleLabels[profile.role]}
                        </span>
                        {deptSummary && (
                          <span className="text-[10px] text-gray-400 truncate max-w-40">{deptSummary}</span>
                        )}
                      </div>
                    </div>
                    {isActive && <Check size={14} className="text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
