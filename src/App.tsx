import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./App.css";
import RootTemplate from "./components/Layouts/RootTemplate";
import CreateTicketPage from "./components/Pages/CreateTicketPage";
import NewTicketFormPage from "./components/Pages/NewTicketFormPage";
import Tickets from "./components/Pages/Tickets";
import DashboardPage from "./components/Pages/DashboardPage";
import TicketDetail from "./components/Pages/TicketDetailPage";
import ConfigPage from "./components/Pages/ConfigPage";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { fetchUsers } from "./store/usersSlice";
import { setCurrentUser } from "./store/authSlice";
import { fetchTickets } from "./store/ticketsSlice";

function AppRoutes() {
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const isUser = currentUser?.role === "user";
  const isMaster = currentUser?.role === "master";

  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootTemplate />,
      children: [
        {
          path: "/",
          element: isUser ? <Navigate to="/new-ticket" replace /> : <DashboardPage />,
        },
        {
          path: "/tickets",
          element: isUser ? <Navigate to="/new-ticket" replace /> : <Tickets />,
        },
        { path: "/new-ticket", element: <CreateTicketPage /> },
        { path: "/create-ticket", element: <NewTicketFormPage /> },
        {
          path: "/ticket-detail/:id",
          element: isUser ? <Navigate to="/new-ticket" replace /> : <TicketDetail />,
        },
        {
          path: "/ticket-detail",
          element: isUser ? <Navigate to="/new-ticket" replace /> : <TicketDetail />,
        },
        {
          path: "/config",
          element: isMaster ? <ConfigPage /> : <Navigate to="/" replace />,
        },
      ],
    },
  ]);

  return (
    <div className="w-full h-screen text-gray-900">
      <RouterProvider router={router} />
    </div>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-white text-gray-500 gap-3">
      <div className="w-8 h-8 border-3 border-blue-200 border-t-[#0047AC] rounded-full animate-spin" />
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-white text-gray-700 gap-3 p-6">
      <p className="text-base font-bold">No se pudo conectar con el servidor</p>
      <p className="text-sm text-gray-500 max-w-md text-center">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 bg-[#0047AC] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}

function AppBootstrap() {
  const dispatch = useAppDispatch();
  const usersStatus = useAppSelector((s) => s.users.status);
  const usersError = useAppSelector((s) => s.users.error);
  const usersList = useAppSelector((s) => s.users.list);
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const ticketsStatus = useAppSelector((s) => s.tickets.status);

  useEffect(() => {
    if (usersStatus === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, usersStatus]);

  useEffect(() => {
    if (usersStatus === "ready" && !currentUser && usersList.length > 0) {
      const master = usersList.find((u) => u.role === "master") ?? usersList[0];
      dispatch(setCurrentUser(master));
    }
  }, [dispatch, usersStatus, currentUser, usersList]);

  // Re-fetch tickets whenever the active user changes (different user → different visibility).
  useEffect(() => {
    if (currentUser) {
      dispatch(fetchTickets());
    }
  }, [dispatch, currentUser?.id]);

  void ticketsStatus;

  if (usersStatus === "error") {
    return (
      <ErrorScreen
        message={usersError ?? "Error desconocido"}
        onRetry={() => dispatch(fetchUsers())}
      />
    );
  }

  if (usersStatus !== "ready" || !currentUser) {
    return <LoadingScreen message="Cargando..." />;
  }

  return <AppRoutes />;
}

function App() {
  return <AppBootstrap />;
}

export default App;
