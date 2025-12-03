#ifndef MENUREPOSITORY_H
#define MENUREPOSITORY_H

#include <unordered_map>
#include <vector>
#include <QString>

#include "common/models/PlatoDefinicion.h"
#include "common/adapter/AdaptadorSerializadorJSON.h"

class MenuRepository {
public:
    explicit MenuRepository(AdaptadorSerializadorJSON& serializador);

    bool cargarDesdeArchivo(const QString& rutaArchivo);
    const PlatoDefinicion* obtener(int idPlato) const;
    std::vector<PlatoDefinicion> listar() const;
    std::size_t cantidad() const;

private:
    AdaptadorSerializadorJSON& m_serializador;
    std::unordered_map<int, PlatoDefinicion> m_menu;
};

#endif
