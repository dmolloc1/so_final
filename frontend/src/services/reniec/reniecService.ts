const PROXY_URL = '/api/proxy';

export interface PersonaReniec {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

interface ApisNetPeResponse {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
  nombre?: string;
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  numero?: string;
  numeroDocumento?: string;
  nombre_completo?: string;
}

const validarDni = (dni: string): boolean => {
  return /^\d{8}$/.test(dni);
};

const dividirNombreCompleto = (nombreCompleto: string): {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
} => {
  const partes = nombreCompleto.trim().split(' ');
  
  if (partes.length >= 3) {
    return {
      apellidoPaterno: partes[0],
      apellidoMaterno: partes[1],
      nombres: partes.slice(2).join(' ')
    };
  } else if (partes.length === 2) {
    return {
      apellidoPaterno: partes[0],
      apellidoMaterno: '',
      nombres: partes[1]
    };
  } else {
    return {
      apellidoPaterno: '',
      apellidoMaterno: '',
      nombres: nombreCompleto
    };
  }
};

const procesarData = (data: any, dni: string): PersonaReniec => {
  // Si tenemos los campos separados
  if (data.nombres && data.apellido_paterno) {
    return {
      dni: data.numeroDocumento || data.numero || dni,
      nombres: data.nombres,
      apellidoPaterno: data.apellido_paterno || '',
      apellidoMaterno: data.apellido_materno || '',
      nombreCompleto: data.nombre_completo || data.nombre || 
                     `${data.nombres} ${data.apellido_paterno} ${data.apellido_materno}`.trim()
    };
  }
  
  // Si solo tenemos el nombre completo
  const nombreCompleto = data.nombre_completo || data.nombre || '';
  if (nombreCompleto) {
    const partesNombre = dividirNombreCompleto(nombreCompleto);
    return {
      dni: data.numeroDocumento || data.numero || dni,
      nombres: partesNombre.nombres,
      apellidoPaterno: partesNombre.apellidoPaterno,
      apellidoMaterno: partesNombre.apellidoMaterno,
      nombreCompleto: nombreCompleto
    };
  }

  throw new Error('No se pudo extraer información válida de la respuesta');
};

export const consultarDni = async (dni: string): Promise<PersonaReniec> => {
  if (!validarDni(dni)) {
    throw new Error('DNI inválido. Debe tener 8 dígitos.');
  }

  try {
    const url = `${PROXY_URL}/dni?numero=${dni}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('DNI no encontrado en la base de datos de RENIEC');
      } else if (response.status === 429) {
        throw new Error('Límite de consultas alcanzado. Intente más tarde.');
      } else {
        throw new Error('Error al consultar DNI en RENIEC');
      }
    }

    const data: ApisNetPeResponse = await response.json();

    if (data.success === true && data.data) {
      return procesarData(data.data, dni);
    }
    
    if (data.nombre || data.nombres || data.numeroDocumento || data.numero) {
      return procesarData(data, dni);
    }

    if (data.success === false || data.error) {
      throw new Error(data.message || data.error || 'DNI no encontrado en RENIEC');
    }

    throw new Error('DNI no encontrado en RENIEC');

  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Error de conexión. Verifique su conexión a internet.');
  }
};

export default {
  consultarDni,
  validarDni
};