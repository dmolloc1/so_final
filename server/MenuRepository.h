#ifndef MENU_REPOSITORY_H
#define MENU_REPOSITORY_H

#include <unordered_map>
#include <QString>
#include <QJsonArray>
#include "common/models/PlatoDefinicion.h"
#include "common/adapter/AdaptadorSerializadorJSON.h"

class MenuRepository {
public:
  explicit MenuRepository(AdaptadorSerializadorJSON& serializador);

  bool cargarDesdeArchivo(const QString& rutaArchivo);
  const PlatoDefinicion* obtenerPlato(int id) const;
  const std::unordered_map<int, PlatoDefinicion>& menu() const;
  QJsonArray menuComoJson() const;

private:
  AdaptadorSerializadorJSON& m_serializador;
  std::unordered_map<int, PlatoDefinicion> m_menu;
};

#endif
