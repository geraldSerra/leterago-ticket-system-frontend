import { Outlet } from "react-router-dom";
import SideBar from "../Templates/SideBar";
import NavBar from "../Molecules/NavBar";
import { useCurrentUser } from "../../store/hooks";

const RootTemplate = () => {
  const currentUser = useCurrentUser();

  // User role: only allow /new-ticket
  if (currentUser.role === "user") {
    return (
      <div className="flex flex-row w-full h-screen bg-gray-50">
        <SideBar />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="h-14 shrink-0">
            <NavBar />
          </div>
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full h-screen bg-gray-50">
      <SideBar />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-14 shrink-0">
          <NavBar />
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default RootTemplate;
