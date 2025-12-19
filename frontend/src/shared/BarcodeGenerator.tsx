import { useRef, useState , useEffect} from "react";
import React from "react";
import JsBarcode from "jsbarcode";
import { RefreshCw} from "lucide-react";

interface BarcodeGeneratorProps {
  value?: string;
  onGenerate?:(code:string)=>void;
  showControls?: boolean;
  width?: number;
  height?: number;
}
const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  value='',
  onGenerate,
  showControls = true,
  width = 2,
  height = 100,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [barcodeValue, setBarcodeValue]=useState(value);
    const [error, setError]= useState<string |null>(null);

    //prueba
    /*Formato: XXX-XXXXX-XXXXX-X
   * - 3 dígitos: Prefijo de país (775 para Perú)
   * - 5 dígitos: Código de empresa (aleatorio)
   * - 4 dígitos: Código de producto (aleatorio)
   * - 1 dígito: Checksum (calculado automáticamente)
   */
    const generateRandomCodeEAN13 = ():string => {
        const prefijoCountry = '775';
        const companyCode = Math.floor(Math.random() *100000).toString().padStart(5,'0');
        const productCode = Math.floor(Math.random() *10000).toString().padStart(4,'0');
        const partialCode = prefijoCountry+ companyCode +  productCode;
        const checksum = calculateChecksum(partialCode);
        return partialCode + checksum;

    }
    //algoritmo de calculo de checksum-Cálculo del dígito de control
    const calculateChecksum = (code:string):string => {
        let suma = 0;

        for (let i = 0; i < code.length; i++) {
            const digit = parseInt(code[i]);
            if(i%2 ===0){
                suma += digit;
            } else {
                suma += digit *3;
            }
            
        }
        const checksum = (10- suma%10)%10;
        return checksum.toString();
    }
    const validatecodeEAN13 = (code: string): boolean => {
        // Debe tener exactamente 13 digitos
        if (!/^\d{13}$/.test(code)) {
        return false;
        }
        
        // Verificar el dígito de control
        const first12 = code.substring(0, 12);
        const checksum = code[12];
        const calculatedChecksum = calculateChecksum(first12);
        
        return checksum === calculatedChecksum;
    };

    const generateBarcode = (code: string) => {
        if (!canvasRef.current) return;

        try {
            // Validar el código
            if (!validatecodeEAN13(code)) {
                setError('Código EAN-13 invalido. Debe tener 13 dígitos y un checksum válido.');
                return;
            }

            // Generar el código de barras
            JsBarcode(canvasRef.current, code, {
                format: 'EAN13',
                width,
                height,
                displayValue: true,
                fontSize: 14,
                margin: 10,
            });

            setError(null);
            
            // Notifica al componente padre
            if (onGenerate) {
                onGenerate(code);
            }
        } catch (err: any) {
            setError(err.message || 'Error al generar el codigo de barras');
            console.error('Error generating barcode:', err);
        }
    };

    const handleGenerateRandom = () => {
        const newCode = generateRandomCodeEAN13();
        setBarcodeValue(newCode);
        generateBarcode(newCode);
    };

    useEffect(() => {
        if (!barcodeValue) {
        handleGenerateRandom();
        } else {
        generateBarcode(barcodeValue);
        }
    }, []);

    // Regenerar cuando cambia el valor externo
    useEffect(() => {
        if (value) {
        setBarcodeValue(value);
        generateBarcode(value);
        }
    }, [value]);
                

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Título */}
        <h3 className="text-lg font-semibold text-gray-800">
            Generador de Código de Barras EAN-13
        </h3>

        {/* Canvas para el código de barras */}
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
            <canvas ref={canvasRef} />
        </div>

        {/* Mostrar el código */}
        <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Código generado:</p>
            <p className="text-xl font-mono font-bold text-gray-800">{barcodeValue}</p>
        </div>

        {/* Mensaje de error */}
        {error && (
            <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            </div>
        )}

        {/* Controles */}
        {showControls && (
            <div className="flex gap-3">
            <button
                onClick={handleGenerateRandom}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                Generar Nuevo
            </button>

            </div>
        )}

        </div>
    );
};

export default BarcodeGenerator;