import React, { useState } from 'react';
import BarcodeGenerator from '../../../shared/BarcodeGenerator';
import BarcodeScanner from '../../../shared/BarcodeScanner';
import { Package } from 'lucide-react';

const TestBarcode: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [productInfo, setProductInfo] = useState<any>(null);

  // ✅ Evento al generar código
  const handleBarcodeGenerated = (code: string) => {
    console.log('✅ Código generado:', code);
    setGeneratedCode(code);
  };

  // ✅ Evento al escanear código
  const handleBarcodeScanned = (code: string) => {
    console.log('📷 Código escaneado:', code);
    setScannedCode(code);
    searchProduct(code);
  };

  // 🔍 Simular búsqueda de producto
  const searchProduct = (code: string) => {
    console.log('🔍 Buscando producto con código:', code);
    
    // Simulación de datos (cuando conectes tu API, reemplaza esto)
    const mockProduct = {
      codigo: code,
      nombre: 'Lentes Ray-Ban Aviator',
      precio: 299.90,
      stock: 15,
      categoria: 'Lentes de Sol'
    };
    
    setProductInfo(mockProduct);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema de Códigos de Barras
          </h1>
          <p className="text-gray-600">
            Genera y escanea códigos de barras para productos
          </p>
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* 🧾 Columna 1: Generador */}
          <div>
            <BarcodeGenerator
              onGenerate={handleBarcodeGenerated}
              showControls={true}
            />
          </div>

          {/* 📷 Columna 2: Escáner */}
          <div>
            <BarcodeScanner
              onDetected={handleBarcodeScanned}
              width={400}
              height={400}
            />
          </div>

        </div>

        {/* Información del producto escaneado */}
        {productInfo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Información del Producto
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Código de Barras:</p>
                <p className="text-lg font-mono font-bold text-gray-900">
                  {productInfo.codigo}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Nombre:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {productInfo.nombre}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Precio:</p>
                <p className="text-lg font-semibold text-green-600">
                  S/ {productInfo.precio.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Stock:</p>
                <p className="text-lg font-semibold text-blue-600">
                  {productInfo.stock} unidades
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Categoría:</p>
                <p className="text-lg font-semibold text-purple-600">
                  {productInfo.categoria}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                Agregar al Carrito
              </button>
            </div>
          </div>
        )}

        {/* Historial de escaneos */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Resumen
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Último código generado:</span>
              <span className="font-mono font-semibold text-gray-900">
                {generatedCode || 'Ninguno'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Último código escaneado:</span>
              <span className="font-mono font-semibold text-gray-900">
                {scannedCode || 'Ninguno'}
              </span>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Instrucciones de Uso
          </h3>
          
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>1. Generador:</strong> Click en "Generar Nuevo" para crear un código EAN-13 válido. 
              Puedes descargarlo como imagen PNG.
            </p>
            <p>
              <strong>2. Escáner:</strong> Click en "Iniciar Escaneo" y da permisos de cámara. 
              Coloca el código de barras frente a la cámara.
            </p>
            <p>
              <strong>3. Producto:</strong> Una vez escaneado, se mostrará la información del producto 
              (cuando conectes con tu base de datos).
            </p>
            <p className="mt-3 text-xs text-blue-600">
              💡 <strong>Tip:</strong> Puedes imprimir un código generado y escanearlo para probar el sistema completo.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TestBarcode;
