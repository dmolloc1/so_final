#ifndef LOGICANEGOCIO_H
#define LOGICANEGOCIO_H

#include <QObject>
#include <queue>
#include <unordered_map>
#include <string>
#include <mutex>
#include <vector>
#include <functional>
#include <QJsonObject>
#include "common/models/PedidoMesa.h"
#include "common/models/PlatoDefinicion.h"
#include "common/models/InfoPlatoPrioridad.h"
#include "common/models/Estados.h"
#include "common/adapter/AdaptadorSerializadorJSON.h"
#include "MenuRepository.h"
#include "PedidoRepository.h"

class ManejadorCliente;

using ColaPrioridadPlatos = std::priority_queue<InfoPlatoPrioridad, std::vector<InfoPlatoPrioridad>,
      std::greater<InfoPlatoPrioridad>>;

class LogicaNegocio : public QObject {
  Q_OBJECT

private:
  LogicaNegocio(QObject* parent = nullptr);
  static LogicaNegocio* s_instance;

public:
  static LogicaNegocio* instance();
  LogicaNegocio(const LogicaNegocio&) = delete;
  void operator=(const LogicaNegocio&) = delete;

  void registrarManejador(ManejadorCliente* manejador);
  void eliminarManejador(ManejadorCliente* manejador);

  void cargarMenuDesdeArchivo(const QString& rutaArchivo);

  void procesarNuevoPedido(const QJsonObject& mensaje, ManejadorCliente* remitente);
  void procesarPrepararPedido(const QJsonObject& mensaje, ManejadorCliente* remitente);
  void procesarCancelarPedido(const QJsonObject& mensaje, ManejadorCliente* remitente);
  void procesarMarcarPlatoTerminado(const QJsonObject& mensaje, ManejadorCliente* remitente);
  void procesarConfirmarEntrega(const QJsonObject& mensaje, ManejadorCliente* remitente);
  void procesarDevolverPlato(const QJsonObject& mensaje, ManejadorCliente* remitente);

  void enviarEstadoInicial(ManejadorCliente* cliente);

  // Facade para Ranking
  QJsonObject getEstadoParaRanking();
  void registrarVenta(int idPlato);

signals:
  void enviarRespuesta(ManejadorCliente* cliente, const QJsonObject& mensaje);

private:
  std::mutex m_mutex;
  std::vector<ManejadorCliente*> m_manejadoresActivos;
  
  AdaptadorSerializadorJSON m_serializador;
  MenuRepository m_menuRepository;
  PedidoRepository m_pedidoRepository;

  // Construye menú y pedidos clasificados para el Manager Chef.
  QJsonObject construirEstadoManagerChef();
  
  void enviarError(ManejadorCliente* cliente, const QString& mensajeError, const QJsonObject& dataContexto = QJsonObject());

  // Emitir broadcast de ranking
  void notificarActualizacionRanking();
};

#endif
