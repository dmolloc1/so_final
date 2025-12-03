#include "../../../common/models/PlatoInstancia.h"
#include "EstadoPlato.h"
#include "EnEsperaState.h"

PlatoInstancia::PlatoInstancia(long long idInstancia, int idDefinicion)
    : id_instancia(idInstancia),
      id_plato_definicion(idDefinicion),
      timestamp_creacion(std::chrono::system_clock::now()),
      timestamp_ultimo_cambio(timestamp_creacion),
      estado(std::make_unique<EnEsperaState>())
{
}

QString PlatoInstancia::getNombreEstado() const {
    return estado->nombre();
}

void PlatoInstancia::setEstado(std::unique_ptr<EstadoPlato> nuevoEstado) {
    estado = std::move(nuevoEstado);
    timestamp_ultimo_cambio = std::chrono::system_clock::now();
}

void PlatoInstancia::iniciarPreparacion() {
    estado->iniciarPreparacion(*this);
}

void PlatoInstancia::marcarPreparando() {
    estado->marcarPreparando(*this);
}

void PlatoInstancia::finalizar() {
    estado->finalizar(*this);
}

void PlatoInstancia::entregar() {
    estado->entregar(*this);
}

void PlatoInstancia::devolver() {
    estado->devolver(*this);
}
