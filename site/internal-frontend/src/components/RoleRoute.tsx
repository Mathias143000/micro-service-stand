import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { StaffRoleName } from "../types";

interface Props {
  allowed: StaffRoleName[];
  children: JSX.Element;
}

export default function RoleRoute({ allowed, children }: Props) {
  const { getDefaultRoute, hasRole } = useAuth();
  const isAllowed = allowed.some((role) => hasRole(role));

  if (!isAllowed) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}
