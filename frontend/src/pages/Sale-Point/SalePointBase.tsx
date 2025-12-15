  import { Outlet, useLocation, useNavigate } from "react-router-dom";
  import * as userService from "../../auth/services/userService";
  import { useState, useEffect, useCallback } from "react";
  import type { User } from "../../auth/types/user";
  import { getOpenCash, getCashes } from "../../services/cashService";

  export default function SalePointBase() {
    const [isMyCashOpen, setIsMyCashOpen] = useState<boolean>(false);
    const [hasCajaAsignada, setHasCajaAsignada] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const isOnOpenCash = location.pathname.endsWith("/open-cash");
    const isOnCloseCash = location.pathname.endsWith("/close-cash");

    const refreshOpenCash = useCallback(async () => {
      try {
        const openCash = await getOpenCash();
        console.log("Open Cash resultado:", openCash);
        setIsMyCashOpen(!!openCash);

        const user = await userService.getCurrentUser();
        const allCashes = await getCashes();
        console.log("Todas las cajas:", allCashes);

        const filtered = allCashes.filter(c => {
          if (user.roles?.some(r => r.rolNom === "CAJERO")) {
            return c.usuCod === user.usuCod;
          } else if (user.sucurCod) {
            return c.sucurCod === user.sucurCod;
          }
          return false;
        }); //Igual esta filtración esta en el backend pero la repetimos acá para saber si tiene caja asignada

        console.log("Cajas filtradas:", filtered);
        setHasCajaAsignada(filtered.length > 0);
        console.log("isMyCashOpen:", !!openCash, "| hasCajaAsignada:", filtered.length > 0);
      } catch (err) {
        console.error("Error actualizando estado de caja", err);
      }
    }, []);

    useEffect(() => {
      const init = async () => {
        try {
          
          const user = await userService.getCurrentUser();
          setCurrentUser(user);
          await refreshOpenCash();
        } catch (err) {
          console.error("Error inicializando punto de venta", err);
        } finally {
          setLoading(false);
        }
      };
      init();
    }, [refreshOpenCash]);

    // Re-check cuando volvemos al sale-point principal
    useEffect(() => {
      console.log("Location cambió a:", location.pathname);
      if (location.pathname === "/sale-point") {
        console.log("Refrescando porque volvimos a /sale-point");
        refreshOpenCash();
      }
    }, [location.pathname, refreshOpenCash]);

    console.log("Renderizando SalePointBase:", {
      loading,
      isMyCashOpen,
      hasCajaAsignada,
      isOnOpenCash,
      isOnCloseCash,
      pathname: location.pathname,
      shouldShowBanner: !isMyCashOpen && !isOnOpenCash && !isOnCloseCash && hasCajaAsignada
    });

    if (loading) return <div className="p-6">Cargando punto de venta...</div>;

    return (
      <div>
        <Outlet context={{ currentUser, refreshOpenCash }} />
      </div>
    );
  }