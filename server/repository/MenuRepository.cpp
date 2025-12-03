#include "MenuRepository.h"

#include <QFile>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonValue>
#include <QDebug>

MenuRepository::MenuRepository(AdaptadorSerializadorJSON& serializador)
  : m_serializador(serializador) {}

bool MenuRepository::cargarDesdeArchivo(const QString& rutaArchivo) {
  QFile archivo(rutaArchivo);
  if (!archivo.open(QIODevice::ReadOnly)) {
    qCritical() << "No se pudo abrir el archivo de menú:" << rutaArchivo;
    return false;
  }

  QByteArray data = archivo.readAll();
  QJsonDocument doc = QJsonDocument::fromJson(data);
  if (!doc.isArray()) {
    qCritical() << "El archivo de menú no es un array JSON válido.";
    return false;
  }

  m_menu.clear();
  QJsonArray menuArray = doc.array();
  for (const QJsonValue& val : menuArray) {
    PlatoDefinicion plato = m_serializador.jsonToPlatoDefinicion(val.toObject());
    m_menu[plato.id] = plato;
  }
  return true;
}

const PlatoDefinicion* MenuRepository::obtener(int idPlato) const {
  auto it = m_menu.find(idPlato);
  if (it == m_menu.end()) {
    return nullptr;
  }
  return &it->second;
}

std::vector<PlatoDefinicion> MenuRepository::listar() const {
  std::vector<PlatoDefinicion> resultado;
  resultado.reserve(m_menu.size());
  for (const auto& par : m_menu) {
    resultado.push_back(par.second);
  }
  return resultado;
}

std::size_t MenuRepository::cantidad() const {
  return m_menu.size();
}
