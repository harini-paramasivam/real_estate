import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "../../components/layout/AppLayout";
import LoginPage from "../../pages/LoginPage";
import DashboardPage from "../../pages/DashboardPage";
import LeadsListPage from "../../pages/LeadsListPage";
import LeadDetailsPage from "../../pages/LeadDetailsPage";
import PropertiesListPage from "../../pages/PropertiesListPage";
import ProjectDetailsPage from "../../pages/ProjectDetailsPage";
import BookingsPage from "../../pages/BookingsPage";
import FollowUpsPage from "../../pages/FollowUpsPage";
import UsersPage from "../../pages/UsersPage";
import NotFoundPage from "../../pages/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/leads", element: <LeadsListPage /> },
          { path: "/leads/:id", element: <LeadDetailsPage /> },
          { path: "/properties", element: <PropertiesListPage /> },
          { path: "/properties/:id", element: <ProjectDetailsPage /> },
          { path: "/bookings", element: <BookingsPage /> },
          { path: "/follow-ups", element: <FollowUpsPage /> },
          {
            element: <ProtectedRoute adminOnly />,
            children: [{ path: "/users", element: <UsersPage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
