import { useState, useEffect } from "react";
import * as userService from "../services/userService";
import { useNavigate } from "react-router-dom";
import { getCashes, getOpenCash } from "../../services/cashService";
import NotAccess from "./NotAccess";
import type { User } from "../types/user";

interface CashGuardRouteProps {
  requireOpen?: boolean;
  requireClosed?: boolean;
  children: React.ReactNode;
}

export const CashGuardRoute: React.FC<CashGuardRouteProps> = ({ requireOpen, requireClosed, children }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const currentUser = await userService.getCurrentUser();
      setUser(currentUser);

      const cashes = await getCashes();
      const hasCaja = cashes.length > 0;

      // Si no tiene caja asignada, mostrar NotAccess
      if (!hasCaja) {
        setAllowed(false);
        return;
      }

      const openCash = await getOpenCash();
      const isOpen = !!openCash;

      if (requireOpen && !isOpen) {
        navigate("/sale-point/open-cash", { replace: true });
        return;
      }

      if (requireClosed && isOpen) {
        navigate("/sale-point/", { replace: true });
        return;
      }

      setAllowed(true);
    };

    check();
  }, [requireOpen, requireClosed, navigate]);

  // Mientras carga
  if (allowed === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no tiene acceso (no tiene caja asignada)
  if (!allowed && user) {
    return <NotAccess user={user} />;
  }
  // Si tiene acceso
  return <>{children}</>;
};