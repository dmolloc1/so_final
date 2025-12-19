<?php

namespace MicroservicioComprobantes;

class NumeroALetras
{
    private $unidades = [
        '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'
    ];
    
    private $decenas = [
        '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
        'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
    ];
    
    private $centenas = [
        '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS',
        'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
    ];

    public function convertir($numero, $moneda = 'SOLES')
    {
        $entero = floor($numero);
        $decimales = round(($numero - $entero) * 100);
        
        $textoEntero = $this->convertirEntero($entero);
        
        if ($decimales > 0) {
            return $textoEntero . ' CON ' . sprintf('%02d', $decimales) . '/100 ' . $moneda;
        }
        
        return $textoEntero . ' CON 00/100 ' . $moneda;
    }

    private function convertirEntero($numero)
    {
        if ($numero == 0) return 'CERO';
        
        $texto = '';
        
        // Millones
        if ($numero >= 1000000) {
            $millones = floor($numero / 1000000);
            $texto .= $this->convertirCentenas($millones);
            $texto .= ($millones == 1) ? ' MILLÓN ' : ' MILLONES ';
            $numero %= 1000000;
        }
        
        // Miles
        if ($numero >= 1000) {
            $miles = floor($numero / 1000);
            if ($miles == 1) {
                $texto .= 'MIL ';
            } else {
                $texto .= $this->convertirCentenas($miles) . ' MIL ';
            }
            $numero %= 1000;
        }
        
        // Centenas
        if ($numero > 0) {
            $texto .= $this->convertirCentenas($numero);
        }
        
        return trim($texto);
    }

    private function convertirCentenas($numero)
    {
        $texto = '';
        
        if ($numero >= 100) {
            $centena = floor($numero / 100);
            if ($numero == 100) {
                $texto = 'CIEN';
            } else {
                $texto = $this->centenas[$centena] . ' ';
            }
            $numero %= 100;
        }
        
        if ($numero >= 20) {
            $decena = floor($numero / 10);
            $texto .= $this->decenas[$decena];
            $numero %= 10;
            if ($numero > 0) {
                $texto .= ' Y ' . $this->unidades[$numero];
            }
        } elseif ($numero >= 10) {
            $especiales = [
                10 => 'DIEZ', 11 => 'ONCE', 12 => 'DOCE', 13 => 'TRECE',
                14 => 'CATORCE', 15 => 'QUINCE', 16 => 'DIECISÉIS',
                17 => 'DIECISIETE', 18 => 'DIECIOCHO', 19 => 'DIECINUEVE'
            ];
            $texto .= $especiales[$numero];
        } elseif ($numero > 0) {
            $texto .= $this->unidades[$numero];
        }
        
        return trim($texto);
    }
}