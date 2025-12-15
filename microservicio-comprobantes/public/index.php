<?php

require_once __DIR__ . '/../vendor/autoload.php';

if (file_exists(__DIR__ . '/../.env')) {
  $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($lines as $line) {
      // Saltar comentarios
      if (strpos(trim($line), '#') === 0) continue;
      
      // Parsear variable
      if (strpos($line, '=') !== false) {
          list($key, $value) = explode('=', $line, 2);
          $key = trim($key);
          $value = trim($value);
          
          // Establecer variable de entorno
          putenv("$key=$value");
          $_ENV[$key] = $value;
      }
  }
}


require_once __DIR__ . '/../src/config.php';
require_once __DIR__ . '/../src/Router.php';
require_once __DIR__ . '/../src/FileStorage.php';
require_once __DIR__ . '/../src/NumeroALetras.php';


use MicroservicioComprobantes\Router;
use MicroservicioComprobantes\FileStorage;
use MicroservicioComprobantes\NumeroALetras;
use Greenter\See;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Company;
use Greenter\Model\Company\Address;
use Greenter\Model\Sale\Legend;
use Greenter\Ws\Services\SunatEndpoints;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;

// Configurar headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$router = new Router();
$fileStorage = new FileStorage();
$numeroALetras = new NumeroALetras();

// Ruta para generar boleta
$router->post('/boleta', function() use ($fileStorage, $numeroALetras) {
    try {
        // Obtener datos de entrada
        $inputData = file_get_contents('php://input');
        if (empty($inputData)) {
            throw new Exception('No se recibieron datos');
        }

        $data = json_decode($inputData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON inválido: ' . json_last_error_msg());
        }

        // Validar datos requeridos
        if (!isset($data['serie'], $data['correlativo'], $data['cliente'], $data['items'])) {
            throw new Exception('Datos incompletos: se requiere serie, correlativo, cliente e items');
        }

        // Crear empresa emisora
        $company = (new Company())
            ->setRuc(COMPANY_RUC)
            ->setRazonSocial(COMPANY_RAZON_SOCIAL)
            ->setNombreComercial(COMPANY_NOMBRE_COMERCIAL)
            ->setAddress((new Address())
                ->setUbigueo(COMPANY_UBIGEO)
                ->setDepartamento(COMPANY_DEPARTAMENTO)
                ->setProvincia(COMPANY_PROVINCIA)
                ->setDistrito(COMPANY_DISTRITO)
                ->setUrbanizacion('-')
                ->setDireccion(COMPANY_DIRECCION)
                ->setCodLocal('0000'));

        // Crear cliente
        $clienteData = $data['cliente'];
        $client = (new Client())
            ->setTipoDoc($clienteData['tipo_doc'])
            ->setNumDoc($clienteData['num_doc'])
            ->setRznSocial($clienteData['rzn_social']);

        // Procesar items
        $items = [];
        $totalValorVenta = 0;
        $totalIgv = 0;

        foreach ($data['items'] as $itemData) {
            $valorVenta = $itemData['valor_unitario'] * $itemData['cantidad'];
            $igv = round($valorVenta * 0.18, 2);
            
            $item = (new SaleDetail())
                ->setCodProducto($itemData['codigo'])
                ->setUnidad('NIU')
                ->setCantidad($itemData['cantidad'])
                ->setDescripcion($itemData['descripcion'])
                ->setMtoValorUnitario($itemData['valor_unitario'])
                ->setMtoValorVenta($valorVenta)
                ->setMtoBaseIgv($valorVenta)
                ->setPorcentajeIgv(18.00)
                ->setIgv($igv)
                ->setTipAfeIgv('10')
                ->setTotalImpuestos($igv)
                ->setMtoPrecioUnitario($itemData['valor_unitario'] * 1.18);
            
            $items[] = $item;
            $totalValorVenta += $valorVenta;
            $totalIgv += $igv;
        }

        $totalAPagar = $totalValorVenta + $totalIgv;

        // Convertir monto a letras
        $montoEnLetras = $numeroALetras->convertir($totalAPagar);

        // Crear boleta
        $boleta = (new Invoice())
            ->setUblVersion('2.1')
            ->setTipoOperacion('0101')
            ->setTipoDoc('03')
            ->setSerie($data['serie'])
            ->setCorrelativo($data['correlativo'])
            ->setFechaEmision(new DateTime($data['fecha_emision'] ?? 'now'))
            ->setFormaPago((new FormaPagoContado())->setMoneda('PEN'))
            ->setTipoMoneda('PEN')
            ->setCompany($company)
            ->setClient($client)
            ->setMtoOperGravadas($totalValorVenta)
            ->setMtoIGV($totalIgv)
            ->setTotalImpuestos($totalIgv)
            ->setValorVenta($totalValorVenta)
            ->setSubTotal($totalAPagar)
            ->setMtoImpVenta($totalAPagar)
            ->setDetails($items);

        // Agregar leyenda
        $boleta->setLegends([
            (new Legend())
                ->setCode('1000')
                ->setValue($data['leyenda'] ?? 'SON: ' . strtoupper($montoEnLetras))
        ]);

        // Configurar Greenter
        $see = new See();
        $see->setCertificate($fileStorage->getCertificado());
        $see->setService(SUNAT_ENDPOINT);
        $see->setClaveSOL(SUNAT_RUC, SUNAT_USUARIO, SUNAT_CLAVE);

        // Enviar a SUNAT
        $res = $see->send($boleta);

        if ($res->isSuccess()) {
            $cdrZip = $res->getCdrZip();
            $zipName = 'R-' . $boleta->getSerie() . '-' . $boleta->getCorrelativo() . '.zip';
            
            // Guardar CDR
            $fileStorage->guardarCDR($zipName, $cdrZip);
            $fileStorage->extraerXMLDesdeCDR($cdrZip, $boleta->getSerie() . '-' . $boleta->getCorrelativo());
            
            $cdrResponse = $res->getCdrResponse();
            
            echo json_encode([
                'success' => true,
                'estado' => 'ACEPTADO', // Cambiado para que Django lo entienda
                'descripcion' => $cdrResponse->getDescription(),
                'codigo' => $cdrResponse->getCode(),
                'nombre_cdr_zip' => $zipName,
                'id' => $boleta->getSerie() . '-' . $boleta->getCorrelativo(),
                // CAMPOS NUEVOS QUE DJANGO ESPERA:
                'hash' => $cdrZip ? md5($cdrZip) : '',
                'cdr_base64' => $cdrZip ? base64_encode($cdrZip) : '',
                'xml_base64' => '', // Por ahora vacío, puedes implementarlo después
                'enlace_xml' => '/xml/' . $boleta->getSerie() . '-' . $boleta->getCorrelativo() . '.xml',
                'enlace_cdr' => '/cdr/' . $zipName
            ]);
        } else {
            $errorMessage = $res->getError() ? $res->getError()->getMessage() : 'Error desconocido';
            $fileStorage->escribirLog("Error SUNAT: $errorMessage");
            
            echo json_encode([
                'success' => false,
                'error' => $errorMessage
            ]);
        }

    } catch (Exception $e) {
        $fileStorage->escribirLog("Excepción: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
});

// Ruta para obtener CDR
$router->get('/cdr/{filename}', function($filename) use ($fileStorage) {
    try {
        $cdrContent = $fileStorage->obtenerCDR($filename);
        
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo $cdrContent;
    } catch (Exception $e) {
        http_response_code(404);
        echo json_encode(['error' => 'CDR no encontrado']);
    }
});

// Ruta para estado de salud
$router->get('/health', function() {
    echo json_encode([
        'status' => 'OK',
        'timestamp' => date('Y-m-d H:i:s'),
        'service' => 'Microservicio Comprobantes'
    ]);
});

// Ruta para obtener XML
$router->get('/xml/{filename}', function($filename) use ($fileStorage) {
    try {
        $xmlPath = XML_PATH . '/' . $filename;
        
        if (!file_exists($xmlPath)) {
            throw new Exception("XML no encontrado: $filename");
        }
        
        $xmlContent = file_get_contents($xmlPath);
        
        header('Content-Type: application/xml');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo $xmlContent;
    } catch (Exception $e) {
        http_response_code(404);
        echo json_encode(['error' => 'XML no encontrado']);
    }
});

// Ruta para servir archivos XML estáticos
$router->get('/storage/xml/{filename}', function($filename) {
    $xmlPath = XML_PATH . '/' . $filename;
    
    if (!file_exists($xmlPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'XML no encontrado']);
        return;
    }
    
    header('Content-Type: application/xml');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo file_get_contents($xmlPath);
});

// Ruta para servir archivos CDR estáticos
$router->get('/storage/cdr/{filename}', function($filename) {
    $cdrPath = CDR_PATH . '/' . $filename;
    
    if (!file_exists($cdrPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'CDR no encontrado']);
        return;
    }
    
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo file_get_contents($cdrPath);
});


$router->dispatch();
