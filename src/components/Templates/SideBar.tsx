import { CirclePlus, LayoutDashboard, Ticket, Settings } from "lucide-react";
import Tap from "../Atoms/Tap";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/leterago-logo.png";
import { useCurrentUser } from "../../store/hooks";

const allTaps = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} />, roles: ["master", "admin"] },
  { label: "Tickets", path: "/tickets", icon: <Ticket size={18} />, roles: ["master", "admin", "user"] },
  { label: "Nuevo Ticket", path: "/new-ticket", icon: <CirclePlus size={18} />, roles: ["master", "admin", "user"] },
  { label: "Configuración", path: "/config", icon: <Settings size={18} />, roles: ["master"] },
];

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();

  const visibleTaps = allTaps.filter((t) => t.roles.includes(currentUser.role));

  const handleTapClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="w-64 min-h-screen h-full p-4 border-r border-gray-100 bg-white flex flex-col">
      <div className="mb-8 px-2">
        <img src={logo} alt="Logo Leterago" className="w-32 h-auto" />
      </div>
      <nav className="flex flex-col w-full gap-1">
        {visibleTaps.map((tap) => (
          <Tap
            key={tap.label}
            label={tap.label}
            icon={tap.icon}
            active={location.pathname === tap.path}
            onClick={() => handleTapClick(tap.path)}
          />
        ))}
      </nav>
    </div>
  );
};

export default SideBar;
