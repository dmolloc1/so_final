import api from '../auth/services/api';

export interface SalesReportData {
  total_sales: number;
  sales_count: number;
  daily_sales: Array<{ date: string; total: number; count: number }>;
  monthly_sales: Array<{ month: string; total: number; count: number }>;
  sales_by_branch: Array<{ sucurCod__sucurNom: string; sucurCod_id: number; total: number; count: number }>;
  top_products: Array<{ prodCod__prodNom: string; prodCod__prodCod: number; quantity: number; total: number }>;
  payment_methods: Array<{ ventFormaPago: string; total: number; count: number }>;
  is_manager: boolean;
}

export interface FinancialReportData {
  ingresos_total: number;
  ingresos_pagado: number;
  ingresos_por_cobrar: number;
  egresos_estimado: number;
  utilidad_bruta: number;
  margen_porcentaje: number;
  monthly_data: Array<{ month: string; ingresos: number }>;
  is_manager: boolean;
}

export interface BranchComparisonData {
  branches: Array<{
    branch_id: number;
    branch_name: string;
    total_ventas: number;
    cantidad_ventas: number;
    promedio_venta: number;
    total_por_cobrar: number;
    valor_inventario: number;
  }>;
  is_manager: boolean;
}

export interface ClientsReportData {
  top_clients: Array<{
    cliNombreCom: string;
    cliDocNum: string;
    total_compras: number;
    cantidad_compras: number;
    total_deuda: number;
  }>;
  total_debt: number;
  debt_count: number;
  debt_aging: {
    current: number;
    '30_60': number;
    '60_90': number;
    over_90: number;
  };
  is_manager: boolean;
}

export interface PendingSalesData {
  pending_sales: Array<{
    ventCod: number;
    cliNombreCom: string;
    cliDocNum: string;
    ventFecha: string;
    ventTotal: number;
    ventAdelanto: number;
    ventSaldo: number;
    ventEstado: string;
    ventEstadoRecoj: string;
    sucurCod__sucurNom: string;
  }>;
  summary: {
    total_pendiente: number;
    count: number;
  };
  by_status: Array<{
    ventEstadoRecoj: string;
    count: number;
    total: number;
  }>;
  is_manager: boolean;
}

export interface CashReportData {
  cash_opening?: {
    cajaAperCod: number;
    cajNom: string;
    usuCod: number;
    usuNombreCom: string;
    sucurNom: string;
    cajaApertuFechHora: string;
    cajaAperFechaHorCierre: string | null;
    cajaAperMontInicial: number;
    cajaAperMontCierre: number | null;
    cajaAperMontEsperado: number | null;
    cajaAperDiferencia: number | null;
    cajaAperEstado: string;
    cajaAperObservacio: string | null;
  };
  totales?: {
    total_ventas: number;
    total_igv: number;
    total_subtotal: number;
    total_gravada: number;
    total_exonerada: number;
    total_inafecta: number;
    cantidad_ventas: number;
  };
  por_forma_pago?: Array<{
    ventFormaPago: string;
    total: number;
    cantidad: number;
  }>;
  ventas?: Array<{
    ventCod: number;
    ventFecha: string;
    cliNombreCom: string;
    cliDocNum: string;
    ventTotal: number;
    ventIGV: number;
    ventSubTotal: number;
    ventFormaPago: string;
    ventEstado: string;
  }>;
  cash_openings?: Array<{
    cajaAperCod: number;
    cajNom: string;
    usuNombreCom: string;
    sucurNom: string;
    cajaApertuFechHora: string;
    cajaAperFechaHorCierre: string | null;
    cajaAperMontInicial: number;
    cajaAperEstado: string;
    ventas_count: number;
    ventas_total: number;
  }>;
  is_manager: boolean;
}

interface ReportFilters {
  start_date?: string;
  end_date?: string;
  branch_id?: number;
}

export const reportsService = {
  getSalesReport: async (filters?: ReportFilters): Promise<SalesReportData> => {
    const response = await api.get('/sales/reports/sales/', { params: filters });
    return response.data;
  },

  getFinancialReport: async (filters?: ReportFilters): Promise<FinancialReportData> => {
    const response = await api.get('/sales/reports/financial/', { params: filters });
    return response.data;
  },

  getBranchComparison: async (filters?: ReportFilters): Promise<BranchComparisonData> => {
    const response = await api.get('/sales/reports/branch-comparison/', { params: filters });
    return response.data;
  },

  getClientsReport: async (filters?: ReportFilters): Promise<ClientsReportData> => {
    const response = await api.get('/sales/reports/clients/', { params: filters });
    return response.data;
  },

  getPendingSales: async (filters?: ReportFilters): Promise<PendingSalesData> => {
    const response = await api.get('/sales/reports/pending-sales/', { params: filters });
    return response.data;
  },

  getCashReport: async (filters?: ReportFilters & { cash_opening_id?: number }): Promise<CashReportData> => {
    const response = await api.get('/sales/reports/cash/', { params: filters });
    return response.data;
  },

  exportSalesCSV: async (filters?: ReportFilters) => {
    try {
      const response = await api.get('/sales/reports/export/sales-csv/', {
        params: filters,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_ventas.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar CSV:', error);
    }
  },

  exportClientsDebtCSV: async (filters?: ReportFilters) => {
    try {
      const response = await api.get('/sales/reports/export/clients-debt-csv/', {
        params: filters,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_deudas.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar CSV:', error);
    }
  },

  exportBranchComparisonCSV: async (filters?: ReportFilters) => {
    try {
      const response = await api.get('/sales/reports/export/branch-comparison-csv/', {
        params: filters,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'comparativa_sucursales.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar CSV:', error);
    }
  },

  getSalesList: async (filters?: ReportFilters & { page?: number; page_size?: number }) => {
    const response = await api.get('/sales/reports/sales-list/', { params: filters });
    return response.data;
  },

  getSellerSalesHistory: async (filters?: ReportFilters & { 
    seller_id?: number; 
    client_id?: number; 
    sale_type?: string;
    page?: number; 
    page_size?: number 
  }) => {
    const response = await api.get('/sales/reports/seller-sales-history/', { params: filters });
    return response.data;
  },

  exportSellerSalesHistoryCSV: async (filters?: ReportFilters & { 
    seller_id?: number; 
    client_id?: number; 
    sale_type?: string;
  }) => {
    try {
      const response = await api.get('/sales/reports/export/seller-sales-history-csv/', {
        params: filters,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'historial_ventas_vendedor.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar CSV:', error);
    }
  },
};
