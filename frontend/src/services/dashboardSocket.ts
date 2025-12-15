class DashboardSocket {
  private socket: WebSocket | null = null;
  private url: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(userId: number, branchId: number | "all") {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const backendHost = "localhost:8000";

    this.url = `${protocol}://${backendHost}/ws/dashboard/${userId}/${branchId}/`;
    
  }

  connect(onMessage: (data: any) => void, onError?: () => void,  refreshInterval = 5000) {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("WebSocket conectado ✔️");
      // Auto-actualizar cada X ms
      this.intervalId = setInterval(() => {
        this.refresh();
      }, refreshInterval);
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage(message);
    };

    this.socket.onerror = () => {
      console.error("Error en WebSocket ❌");
      if (onError) onError();
    };

    this.socket.onclose = () => {
      console.warn("WebSocket cerrado");
      if (this.intervalId) clearInterval(this.intervalId);
    };
  }

  refresh() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "refresh" }));
    }
  }

  close() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.socket?.close();
  }
}

export default DashboardSocket;
