import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, Suspense, lazy, useEffect } from "react";
import Sidebar from '../components/Sidebar/Sidebar';
import Dashboard from '../pages/Dashboard/Dashboard';
import Login from "../pages/Login/Login";
import ProtectedRoute from "../auth/components/ProtectedRoute";
import { CashGuardRoute } from "../auth/components/CashGuardRoute";
import { useAuth } from "../auth/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import BranchesProvider from "../pages/Settings/Components/BranchManagement/ContextBranches";

//  Lazy imports para módulos pesados
const Inventory = lazy(() => import('../pages/Inventory/Inventory'));
const SalePoint = lazy(() => import('../pages/Sale-Point/components/SalePoint/SalePoint'));
const Sales = lazy(() => import('../pages/Sales/Sales'));
const Prescriptions = lazy(() => import('../pages/Prescriptions/Prescriptions'));
const Reports = lazy(() => import('../pages/Reports/Reports'));
const CentralReports = lazy(() => import('../pages/Reports/components/CentralReports/CentralReports'));
const SupervisorReports = lazy(() => import('../pages/Reports/components/SupervisorReports/SupervisorReports'));
const CashReports = lazy(() => import('../pages/Reports/components/CentralReports/CashReports'));
const Settings = lazy(() => import('../pages/Settings/Settings'));
const Proveedores = lazy(() => import('../pages/Settings/Components/Proveedores/Proveedores'));
const Branches = lazy(() => import('../pages/Settings/Components/BranchManagement/Branches'));
const Users = lazy(() => import('../pages/Settings/Components/UserManagement/Users'));
const Central = lazy(() => import('../pages/Settings/Components/CentralManagement/Central'));
const GeneralDashboard = lazy(() => import('../pages/Dashboard/components/GeneralDashboard/GeneralDashboard'));
const CentralDashboard = lazy(() => import('../pages/Dashboard/components/CentralDashboard/CentralDashboard'));
const SupervisorDashboard = lazy(() => import('../pages/Dashboard/components/SupervisorDashboard/SupervisorDashboard'));
const TestInventory = lazy(() => import('../pages/TestInventory'));
const Cash = lazy(() => import('../pages/Settings/Components/CashManagement/Cash'))
const OpenCash = lazy(() => import('../pages/Sale-Point/components/OpenCash/OpenCash'));

const SalePointBase = lazy(() => import('../pages/Sale-Point/SalePointBase'));
const CloseCash = lazy(() => import('../pages/Sale-Point/components/CloseCash/CloseCash'));
const Clientes = lazy(() => import('../pages/Prescriptions/Components/Clientes/Clientes'))

function AppContent() {
  const location = useLocation();
  const { user: authUser, loading } = useAuth(); //  Hook que maneja localStorage y sucursal
  const [user, setUser] = useState(authUser);     //  Estado local sincronizado con authUser

  const isLoginRoute = location.pathname === '/';

  useEffect(() => { //Punto critico para que sesion siga iniciada y siempre se recargue AuthUser
    setUser(authUser);
  }, [authUser]);

  // Mientras carga, muestra loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no hay usuario y no está en login, redirecciona
  if (!user && !isLoginRoute) {
    return (
      <Routes>
        <Route path="*" element={<Login onLoginSuccess={setUser} />} />
      </Routes>
    );
  }

  // Si hay usuario y está en login, muestra dashboard
  if (user && isLoginRoute) {

    return <Navigate to="/dashboard" replace />;

  }

  if (isLoginRoute) {
    return (
      <Routes>
        <Route path="/" element={<Login onLoginSuccess={setUser} />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fijo */}
      <div className="w-64 h-screen fixed top-0 left-0 bg-white shadow">
        <Sidebar />
      </div>
      <div className="flex-1 ml-64 overflow-y-auto">
        <Suspense fallback={<div className="p-6">Cargando módulo...</div>}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user} allowedLevels={[0, 1, 2, 3]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route path="" element={<GeneralDashboard />} />
              <Route path="general" element={
                <ProtectedRoute user={user} allowedLevels={[0, 1, 2, 3]}>
                  <GeneralDashboard />
                </ProtectedRoute>
              } />
              <Route path="supervisor" element={
                <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              } />
              <Route path="central" element={ //de todas las sucursales
                <ProtectedRoute user={user} allowedLevels={[0]}>
                  <CentralDashboard />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="/sale-point" element={
              <ProtectedRoute user={user} allowedLevels={[2]}>
                <SalePointBase key={location.key} />
              </ProtectedRoute>
            } >
              {/* SalePointBase maneja rutas hijas */}
              <Route path="" element={
                <CashGuardRoute requireOpen>
                  <SalePoint />
                </CashGuardRoute>
              } />
              <Route path="open-cash" element={
                <CashGuardRoute requireClosed >
                  <OpenCash />
                </CashGuardRoute>
              } />
              <Route path="close-cash" element={
                <CashGuardRoute requireOpen>
                  <CloseCash />
                </CashGuardRoute>
              } />
            </Route>

            <Route path="/sales" element={
              <ProtectedRoute user={user} allowedLevels={[0, 1, 2]}>
                <Sales />
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute user={user} allowedLevels={[0, 1, 3]}>
                <Inventory />
              </ProtectedRoute>
            } />

            <Route path="/prescriptions" element={
              <ProtectedRoute user={user} allowedLevels={[0, 1, 4]}>
                <Prescriptions />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute user={user} allowedLevels={[0, 1, 4]}>
                <Clientes />
              </ProtectedRoute>
            } />


            <Route path="/reports" element={
              <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                <Reports />
              </ProtectedRoute>
            }>
              <Route path="" element={
                user?.roles.some(role => role.rolNivel === 0)
                  ? <Navigate to="/reports/central" replace />
                  : <Navigate to="/reports/supervisor" replace />
              } />
              <Route path="supervisor" element={
                <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                  <SupervisorReports />
                </ProtectedRoute>
              } />
              <Route path="central" element={
                <ProtectedRoute user={user} allowedLevels={[0]}>
                  <CentralReports />
                </ProtectedRoute>
              } />
              <Route path="cash" element={
                <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                  <CashReports />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="/settings" element={
              <BranchesProvider>
                <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                  <Settings /> {/* <Outlet /> */}
                </ProtectedRoute>
              </BranchesProvider>
            }>
              <Route path="" element={<Central />} />
              <Route path="supliers" element={
                <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                  <Proveedores />
                </ProtectedRoute>
              } />
              <Route path="branches" element={
                <ProtectedRoute user={user} allowedLevels={[0]}>
                  <Branches />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="cash" element={
                <ProtectedRoute user={user} allowedLevels={[0, 1]}>
                  <Cash />
                </ProtectedRoute>
              } />
              <Route path="test-inventory" element={<TestInventory />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}