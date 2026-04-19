import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { useAuth } from "./context/AuthContext";
import AnalyticsPage from "./pages/AnalyticsPage";
import ClientsPage from "./pages/ClientsPage";
import ContractsPage from "./pages/ContractsPage";
import CreditsPage from "./pages/CreditsPage";
import DealsPage from "./pages/DealsPage";
import LoginPage from "./pages/LoginPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import PaymentsPage from "./pages/PaymentsPage";
import PropertiesPage from "./pages/PropertiesPage";
import RegisterPage from "./pages/RegisterPage";
import UsersPage from "./pages/UsersPage";

function DefaultRedirect() {
  const { getDefaultRoute } = useAuth();
  return <Navigate to={getDefaultRoute()} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/clients"
          element={
            <RoleRoute allowed={["ADMIN", "REALTOR"]}>
              <ClientsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/deals"
          element={
            <RoleRoute allowed={["ADMIN", "REALTOR"]}>
              <DealsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <RoleRoute allowed={["ADMIN", "REALTOR"]}>
              <ContractsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/properties"
          element={
            <RoleRoute allowed={["ADMIN", "REALTOR"]}>
              <PropertiesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/credits"
          element={
            <RoleRoute allowed={["ADMIN", "BANK_EMPLOYEE"]}>
              <CreditsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <RoleRoute allowed={["ADMIN", "BANK_EMPLOYEE"]}>
              <PaymentsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <RoleRoute allowed={["ADMIN", "REALTOR"]}>
              <AnalyticsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AdminRoute>
              <RegisterPage />
            </AdminRoute>
          }
        />
        <Route
          path="/organizations"
          element={
            <AdminRoute>
              <OrganizationsPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<DefaultRedirect />} />
      </Route>
    </Routes>
  );
}

export default App;
