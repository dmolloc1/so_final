import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, XCircle } from "lucide-react";

interface BarcodeScannerProps {
  onDetected?: (code: string) => void;
  width?: number;
  height?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onDetected,
  width = 400,
  height = 300,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = "reader-barcode";

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode(divId);
      scannerRef.current = scanner;

      setIsScanning(true);
      setError(null);
      setCode(null);

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        const cameraId = cameras[0].id;

        await scanner.start(
          cameraId,
          {
            fps: 10, // fotogramas por segundo
            qrbox: { width, height }, // tamaño del recuadro de escaneo
          },
          (decodedText) => {
            console.log("Código detectado:", decodedText);
            setCode(decodedText);
            if (onDetected) onDetected(decodedText);
            stopScanner(); // detener al detectar uno
          },
          (err) => {
            // Los errores intermitentes no se muestran
          }
        );
      } else {
        setError("No se encontró ninguna cámara disponible");
      }
    } catch (err) {
      console.error(err);
      setError("Error al iniciar la cámara o escáner");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    // Limpia al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800">
        Escáner de Código de Barras EAN-13
      </h3>

      {/* Contenedor de cámara */}
      <div
        id={divId}
        className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
        style={{ width, height }}
      />

      {code && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Código detectado:</p>
          <p className="text-xl font-mono font-bold text-green-700">{code}</p>
        </div>
      )}

      {error && (
        <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-3">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
            Iniciar Escaneo
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Detener
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
