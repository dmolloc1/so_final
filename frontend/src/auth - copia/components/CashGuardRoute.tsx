import { useState, useEffect } from "react";
import * as userService from "../services/userService";
import { useNavigate } from "react-router-dom";
import { getCashes, getOpenCash } from "../../services/cashService";

interface CashGuardRouteProps {
  requireOpen?: boolean;
  requireClosed?: boolean;
  children: React.ReactNode;
}
export const CashGuardRoute: React.FC<CashGuardRouteProps> = ({ requireOpen, requireClosed, children }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const user = await userService.getCurrentUser();
      const cashes = await getCashes();
      const hasCaja = cashes.length > 0;

      if (!hasCaja) {
        navigate("/dashboard", { replace: true });
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

  if (allowed === null) return <div className="p-6">Verificando acceso...</div>;
  return <>{children}</>;
};