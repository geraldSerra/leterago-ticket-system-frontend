import { Bell, LogOut, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/authSlice";
import type { AppUser } from "../../store/authSlice";
import { getInitials } from "../../lib/initials";

const avatarBg: Record<string, string> = {
  master: "bg-indigo-600",
  admin:  "bg-[#0047AC]",
  user:   "bg-slate-400",
};

const Avatar = ({ user }: { user: AppUser }) => (
  <div className={`w-8 h-8 ${avatarBg[user.role] ?? "bg-slate-400"} text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0`}>
    {getInitials(user.name)}
  </div>
);

const NavBar = () => {
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.currentUser);

  if (!currentUser) return null;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <nav className="flex w-full h-full justify-end items-center gap-3 px-6 bg-white border-b border-gray-100">
      <button className="relative p-2 rounded hover:bg-gray-50 text-gray-500 transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Usuario actual — solo lectura */}
      <div className="flex items-center gap-2.5 px-1 py-1.5">
        <Avatar user={currentUser} />
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{currentUser.name}</p>
          {currentUser.role === "master" && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm mt-0.5 bg-indigo-600 text-white">
              <Crown size={11} />
              Master
            </span>
          )}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="p-2 rounded hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"
      >
        <LogOut size={16} />
      </button>
    </nav>
  );
};

export default NavBar;
