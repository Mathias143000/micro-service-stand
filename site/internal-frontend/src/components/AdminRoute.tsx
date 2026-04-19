import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { getDefaultRoute, hasRole } = useAuth();

  if (!hasRole("ADMIN")) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}
