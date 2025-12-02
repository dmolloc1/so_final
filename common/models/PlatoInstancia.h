#ifndef PLATOINSTANCIA_H
#define PLATOINSTANCIA_H

#include <memory>
#include <chrono>
#include <QString>

class EstadoPlato;

class PlatoInstancia {
public:
    long long id_instancia;
    int id_plato_definicion;

    std::chrono::system_clock::time_point timestamp_creacion;
    std::chrono::system_clock::time_point timestamp_ultimo_cambio;

private:
    std::unique_ptr<EstadoPlato> estado;   

public:
    PlatoInstancia(long long idInstancia, int idDefinicion);

    QString getNombreEstado() const;

    void setEstado(std::unique_ptr<EstadoPlato> nuevoEstado);

    void iniciarPreparacion();
    void marcarPreparando();
    void finalizar();
    void entregar();
    void devolver();

    EstadoPlato* getEstado() const { return estado.get(); }
};

#endif
