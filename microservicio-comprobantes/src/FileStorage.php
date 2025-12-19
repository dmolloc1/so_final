<?php

namespace MicroservicioComprobantes;

class FileStorage
{
    public function __construct()
    {
        $this->crearDirectorios();
    }

    private function crearDirectorios()
    {
        $dirs = [STORAGE_PATH, XML_PATH, CDR_PATH, LOGS_PATH];
        
        foreach ($dirs as $dir) {
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }

    public function escribirLog($mensaje)
    {
        $logFile = LOGS_PATH . '/app.log';
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$timestamp] $mensaje" . PHP_EOL, FILE_APPEND);
    }

    public function getCertificado()
    {
        if (!file_exists(CERT_PATH)) {
            throw new \Exception("Certificado no encontrado en: " . CERT_PATH);
        }
        
        return file_get_contents(CERT_PATH);
    }

    public function guardarCDR($nombre, $contenido)
    {
        $rutaCompleta = CDR_PATH . '/' . $nombre;
        
        if (file_put_contents($rutaCompleta, $contenido) === false) {
            throw new \Exception("Error al guardar CDR: $nombre");
        }
        
        $this->escribirLog("CDR guardado: $nombre");
        return $rutaCompleta;
    }

    public function obtenerCDR($nombre)
    {
        $rutaCompleta = CDR_PATH . '/' . $nombre;
        
        if (!file_exists($rutaCompleta)) {
            throw new \Exception("CDR no encontrado: $nombre");
        }
        
        return file_get_contents($rutaCompleta);
    }

    // En tu FileStorage.php, modifica el método extraerXMLDesdeCDR:
    public function extraerXMLDesdeCDR($cdrZip, $identificador)
    {
        if (!class_exists('ZipArchive')) {
            $this->escribirLog("ZipArchive no disponible, guardando CDR en base64");
            return false;
        }

        $temp = tempnam(sys_get_temp_dir(), 'cdr');
        file_put_contents($temp, $cdrZip);
        
        $zip = new \ZipArchive();
        $xmlGuardado = false;
        
        if ($zip->open($temp) === true) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $xmlName = $zip->getNameIndex($i);
                $xmlContent = $zip->getFromIndex($i);
                
                // Guardar con el nombre específico que Django espera
                $nombreBase = $identificador . '.xml';
                $xmlPath = XML_PATH . '/' . $nombreBase;
                
                file_put_contents($xmlPath, $xmlContent);
                $this->escribirLog("XML extraído: $nombreBase");
                $xmlGuardado = true;
            }
            $zip->close();
        }
        
        unlink($temp);
        return $xmlGuardado;
    }
}