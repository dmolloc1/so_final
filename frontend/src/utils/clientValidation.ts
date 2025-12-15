export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateDNI = (dni: string): ValidationResult => {
  const cleaned = dni.trim();
  
  if (!cleaned) {
    return { isValid: false, message: 'El DNI es requerido' };
  }
  
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, message: 'El DNI solo debe contener numeros' };
  }
  
  if (cleaned.length !== 8) {
    return { isValid: false, message: 'El DNI debe tener 8 digitos' };
  }
  
  return { isValid: true };
};

export const validateCE = (ce: string): ValidationResult => {
  const cleaned = ce.trim();
  
  if (!cleaned) {
    return { isValid: false, message: 'El Carnet de extranjeria es requerido' };
  }
  
  if (!/^[A-Z0-9]+$/i.test(cleaned)) {
    return { isValid: false, message: 'El Carnet de extranjeria solo debe contener letras y numeros' };
  }
  
  if (cleaned.length < 9 || cleaned.length > 12) {
    return { isValid: false, message: 'El Carnet de extranjeria debe tener entre 9 y 12 caracteres' };
  }
  
  return { isValid: true };
};

export const validateDocumento = (tipoDoc: string, numDoc: string): ValidationResult => {
  switch (tipoDoc) {
    case 'DNI':
      return validateDNI(numDoc);
    case 'CE':
      return validateCE(numDoc);
    default:
      return { isValid: false, message: 'Tipo de documento no valido' };
  }
};

export const validateEmail = (email: string): ValidationResult => {
  const cleaned = email.trim();
  
  if (!cleaned) {
    return { isValid: false, message: 'El email es requerido' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return { isValid: false, message: 'El email no es valido' };
  }
  
  return { isValid: true };
};

export const validateTelefono = (telefono: string): ValidationResult => {
  const cleaned = telefono.trim();
  
  if (!cleaned) {
    return { isValid: false, message: 'El telefono es requerido' };
  }
  
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, message: 'El telefono solo debe contener numeros' };
  }
  
  if (cleaned.length !== 9) {
    return { isValid: false, message: 'El telefono debe tener 9 digitos' };
  }
  
  return { isValid: true };
};

export const validateNombre = (nombre: string): ValidationResult => {
  const cleaned = nombre.trim();
  
  if (!cleaned) {
    return { isValid: false, message: 'El nombre es requerido' };
  }
  
  if (cleaned.length < 2) {
    return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres' };
  }
  
  if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(cleaned)) {
    return { isValid: false, message: 'El nombre solo debe contener letras' };
  }
  
  return { isValid: true };
};

export const getMaxLengthForDocType = (tipoDoc: string): number => {
  switch (tipoDoc) {
    case 'DNI':
      return 8;
    case 'CE':
      return 12;
    default:
      return 20;
  }
};

export const getPlaceholderForDocType = (tipoDoc: string): string => {
  switch (tipoDoc) {
    case 'DNI':
      return 'Ej: 12345678';
    case 'CE':
      return 'Ej: 001234567';
    default:
      return 'Ingrese numero de documento';
  }
};
