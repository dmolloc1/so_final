export interface DashboardFilters {
  // filtros generales
  date_range?: 'today' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  branch_id?: number | null; // Filtro de sucursal
  
  // filtros por seccion (cada componente independiente)
  sales_date_range?: 'today' | 'week' | 'month' | 'year';
  sales_chart_date_range?: 'today' | 'week' | 'month' | 'year'; // Para el gráfico de ventas
  earnings_date_range?: 'today' | 'week' | 'month' | 'year';
  expenses_date_range?: 'today' | 'week' | 'month' | 'year';
  clients_date_range?: 'today' | 'week' | 'month' | 'year';
  seller_date_range?: 'today' | 'week' | 'month' | 'year';
  reports_date_range?: 'today' | 'week' | 'month' | 'year';
  
}

class DashboardSocket {
  private socket: WebSocket | null = null;
  private url: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentFilters: DashboardFilters = { date_range: 'today' };

  constructor(userId: number, branchId: number | "all") {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const backendHost = "localhost:8000";

    this.url = `${protocol}://${backendHost}/ws/dashboard/${userId}/${branchId}/`;
  }


  connect(onMessage: (data: any) => void, onError?: () => void, refreshInterval = 5000) {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("WebSocket conectado al dashboard");
      // Auto-actualizar cada X ms
      this.intervalId = setInterval(() => {
        this.refresh();
      }, refreshInterval);
    };

    this.socket.onmessage = (event) => {
      //console.log("RAW desde backend:", event.data);

      const message = JSON.parse(event.data);
      onMessage(message);
    };

    this.socket.onerror = () => {
      console.error("Error en WebSocket del dashboard");
      if (onError) onError();
    };

    this.socket.onclose = () => {
      console.warn("WebSocket del dashboard cerrado");
      if (this.intervalId) clearInterval(this.intervalId);
    };
  }

  refresh(filters?: DashboardFilters, section: string = 'all') {
    if (filters) {
      this.currentFilters = { ...this.currentFilters, ...filters };
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ 
        type: "refresh",
        filters: this.currentFilters,
        section: section
      }));
    }
  }

  updateFilters(filters: DashboardFilters, section: string = 'all') {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.refresh(this.currentFilters, section);
  }

  close() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.socket?.close();
  }
}

export default DashboardSocket;
