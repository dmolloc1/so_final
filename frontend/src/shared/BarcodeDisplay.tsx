import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { X, Download, RefreshCw } from 'lucide-react';

interface BarcodeDisplayProps {
  code: string;
  productName?: string;
  onClose: () => void;
  onRegenerate?: () => void;
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  code,
  productName,
  onClose,
  onRegenerate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && code) {
      try {
        JsBarcode(canvasRef.current, code, {
          format: 'EAN13',
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10,
        });
      } catch (error) {
        console.error('Error generando codigo:', error);
      }
    }
  }, [code]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `barcode-${code}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const imageUrl = canvasRef.current.toDataURL('image/png');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Código de Barras - ${code}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            h2 { margin-bottom: 10px; }
            img { margin: 20px 0; }
            .code { font-size: 18px; font-weight: bold; margin-top: 10px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${productName ? `<h2>${productName}</h2>` : ''}
          <img src="${imageUrl}" alt="Código de barras" />
          <div class="code">${code}</div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            Código de Barras
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {productName && (
            <div className="mb-4 text-center">
              <p className="text-lg font-medium text-gray-800">{productName}</p>
            </div>
          )}

          {/* Barcode */}
          <div className="flex justify-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
            <canvas ref={canvasRef} />
          </div>

          {/* Code Display */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Código:</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{code}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar PNG
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Imprimir
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeDisplay;

