import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isResolvingSession } = useAuth();
  const location = useLocation();

  if (isResolvingSession) {
    return <Loader text="Loading session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
