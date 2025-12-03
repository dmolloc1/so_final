#include "LogicaNegocio.h"
#include "LogicaNegocioHandlers.h"
#include "ManejadorCliente.h"
#include "common/network/Protocolo.h"
#include "common/models/Estados.h"
#include "common/adapter/AdaptadorSerializadorJSON.h"
#include <QJsonObject>
#include <QJsonArray>
#include <QDebug>
#include <algorithm>

LogicaNegocio* LogicaNegocio::s_instance = nullptr;

LogicaNegocio::LogicaNegocio(QObject* parent)
  : QObject(parent),
    m_siguienteIdPedido(1),
    m_siguienteIdInstanciaPlato(1),
    m_menuRepository(m_serializador)
{
  cargarMenuDesdeArchivo(":/menu.json");
}

LogicaNegocio* LogicaNegocio::instance() {
  if (s_instance == nullptr) {
    s_instance = new LogicaNegocio();
  }
  return s_instance;
}

PedidoMesa* LogicaNegocio::obtenerPedido(long long idPedido) {
  return m_pedidoRepository.obtener(idPedido);
}

PlatoInstancia* LogicaNegocio::obtenerInstancia(PedidoMesa& pedido, long long idInstancia) {
  for (auto& inst : pedido.platos) {
    if (inst.id_instancia == idInstancia) {
      return &inst;
    }
  }
  return nullptr;
}

const PlatoDefinicion* LogicaNegocio::obtenerDefinicionPlato(int idPlato) {
  return m_menuRepository.obtener(idPlato);
}

void LogicaNegocio::cargarMenuDesdeArchivo(const QString& rutaArchivo) {
  std::lock_guard<std::mutex> lock(m_mutex);
  if (!m_menuRepository.cargarDesdeArchivo(rutaArchivo)) {
    return;
  }

  qInfo() << "Menú cargado desde" << rutaArchivo << "con" << m_menuRepository.cantidad() << "platos.";
}

void LogicaNegocio::registrarManejador(ManejadorCliente* manejador) {
  std::lock_guard<std::mutex> lock(m_mutex);
  m_manejadoresActivos.push_back(manejador);
}

void LogicaNegocio::eliminarManejador(ManejadorCliente* manejador) {
  std::lock_guard<std::mutex> lock(m_mutex);
  m_manejadoresActivos.erase(std::remove(m_manejadoresActivos.begin(),
        m_manejadoresActivos.end(), manejador), m_manejadoresActivos.end());
}

void LogicaNegocio::enviarEstadoInicial(ManejadorCliente* cliente) {
  std::lock_guard<std::mutex> lock(m_mutex);
  QJsonObject estado;

  TipoActor tipo = cliente->getTipoActor();

  if (tipo == TipoActor::MANAGER_CHEF) {
    //estado = getEstadoParaManager(true);
  } else if (tipo == TipoActor::RANKING) {
    estado = getEstadoParaRanking();
    emit enviarRespuesta(cliente, estado);
  } else if (tipo == TipoActor::ESTACION_COCINA) {
    //estado = getEstadoParaEstacion(cliente->getNombreEstacion().toStdString());
  } else if (tipo == TipoActor::RECEPCIONISTA) {
    QJsonObject mensaje;
    QJsonArray menuArray;

    for (const auto& plato : m_menuRepository.listar()) {
      menuArray.append(SerializadorJSON::platoDefinicionToJson(plato));
    }

    mensaje[Protocolo::EVENTO] = Protocolo::ACTUALIZACION_MENU;
    mensaje[Protocolo::DATA] = QJsonObject{ {"menu", menuArray} };

    emit enviarRespuesta(cliente, mensaje);
    return;
  }
}

QJsonObject LogicaNegocio::getEstadoParaRanking() {
  // Convertir Mapa a Vector para ordenar
  struct ItemRanking {
    QString nombre;
    int cantidad;
  };
  std::vector<ItemRanking> lista;

  for (auto const& [id, cantidad] : m_rankingRepository.conteo()) {
    const PlatoDefinicion* plato = m_menuRepository.obtener(id);
    if (plato) {
      lista.push_back({QString::fromStdString(plato->nombre), cantidad});
    }
  }

  // Ordenar (Mayor a menor cantidad)
  std::sort(lista.begin(), lista.end(), [](const ItemRanking& a, const ItemRanking& b) {
    return a.cantidad > b.cantidad;
  });

  // Construir JSON
  QJsonArray rankingArray;
  for (const auto& item : lista) {
    QJsonObject obj;
    obj["nombre"] = item.nombre;
    obj["cantidad"] = item.cantidad;
    rankingArray.append(obj);
  }

  QJsonObject mensaje;
  mensaje[Protocolo::EVENTO] = Protocolo::ACTUALIZACION_RANKING;
  mensaje[Protocolo::DATA] = QJsonObject{ {"ranking", rankingArray} };
  
  return mensaje;
}

void LogicaNegocio::registrarVenta(int idPlato) {
  QJsonObject rankingMsg;
  {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_rankingRepository.incrementar(idPlato);
    rankingMsg = getEstadoParaRanking(); // Generar bajo lock
  }

  // Notificar a todos (Observer)
  emit enviarRespuesta(nullptr, rankingMsg);
}

void LogicaNegocio::procesarNuevoPedido(const QJsonObject& mensaje, ManejadorCliente* remitente) {
  std::lock_guard<std::mutex> lock(m_mutex);

  if (!mensaje.contains(Protocolo::DATA) || !mensaje[Protocolo::DATA].isObject()) {
    qWarning() << "NUEVO_PEDIDO sin data";
    return;
  }

  QJsonObject data = mensaje[Protocolo::DATA].toObject();

  if (!data.contains("platos") || !data["platos"].isArray()) {
    qWarning() << "NUEVO_PEDIDO sin platos";
    return;
  }

  long long idPedido = m_siguienteIdPedido++;

  PedidoMesa pedido;
  pedido.id_pedido = idPedido;
  pedido.estado_general = EstadoPedido::PENDIENTE;

  QJsonArray platos = data["platos"].toArray();

  for (auto plato : platos) {
    int idPlato = plato.toInt();

    const PlatoDefinicion* platoDef = m_menuRepository.obtener(idPlato);
    if (!platoDef) {
      qWarning() << "Plato inválido:" << idPlato;
      continue;
    }

    PlatoInstancia platoInst;
    platoInst.id_instancia = m_siguienteIdInstanciaPlato++;
    platoInst.id_plato_definicion = platoDef->id;
    platoInst.estado = EstadoPlato::EN_ESPERA;

    pedido.platos.push_back(platoInst);

    // Encolar tarea para cocina
    InfoPlatoPrioridad platoPrior(platoInst.id_instancia, platoDef->tiempo_preparacion_estimado);
    platoPrior.id_pedido = idPedido;
    m_colasPorEstacion[platoDef->estacion].push(platoPrior);
  }

  m_pedidoRepository.guardar(idPedido, pedido);
  m_pedidoRepository.colaManagerChef().push(idPedido);

  QJsonObject msg;
  msg[Protocolo::EVENTO] = Protocolo::PEDIDO_REGISTRADO;
  msg["id_pedido"] = (int)idPedido;

  emit enviarRespuesta(remitente, msg);

  for (auto cli : m_manejadoresActivos)
    if (cli->getTipoActor() == TipoActor::MANAGER_CHEF)
      emit enviarRespuesta(cli, msg);

  qInfo() << "Pedido" << idPedido << "registrado.";
}

void LogicaNegocio::procesarPrepararPedido(const QJsonObject& mensaje, ManejadorCliente* remitente) {
  std::lock_guard<std::mutex> lock(m_mutex);

  OperacionContext ctx{mensaje, {}, this, remitente};
  auto chain = std::make_shared<DataExtractionHandler>(QStringLiteral("data"));
  chain->setNext(std::make_shared<PedidoLookupHandler>())
       ->setNext(std::make_shared<InstanciaLookupHandler>())
       ->setNext(std::make_shared<EstacionAutorizadaHandler>());

  if (!chain->process(ctx)) {
    return;
  }

  PedidoMesa& pedido = *ctx.pedido;
  PlatoInstancia& instancia = *ctx.instancia;

  instancia.estado = EstadoPlato::EN_PROGRESO;

  if (pedido.estado_general == EstadoPedido::PENDIENTE) {
    pedido.estado_general = EstadoPedido::EN_PROGRESO;
  }

  QJsonObject msg;
  msg[Protocolo::EVENTO] = Protocolo::PLATO_EN_PREPARACION;
  msg["id_pedido"] = (int)pedido.id_pedido;
  msg["id_instancia"] = (int)instancia.id_instancia;

  for (auto cli : m_manejadoresActivos)
    emit enviarRespuesta(cli, msg);

  qInfo() << "Plato" << instancia.id_instancia << "del pedido" << pedido.id_pedido
          << "pasó a EN_PREPARACION.";
}

void LogicaNegocio::procesarCancelarPedido(const QJsonObject& mensaje, ManejadorCliente* remitente) {
  std::lock_guard<std::mutex> lock(m_mutex);

  OperacionContext ctx{mensaje, {}, this, remitente};
  auto chain = std::make_shared<DataExtractionHandler>(QString::fromLatin1(Protocolo::DATA));
  chain->setNext(std::make_shared<PedidoLookupHandler>());

  if (!chain->process(ctx)) {
    return;
  }

  PedidoMesa& pedido = *ctx.pedido;
  pedido.estado_general = EstadoPedido::CANCELADO;

  for (auto& inst : pedido.platos) {
    inst.estado = EstadoPlato::CANCELADO;
  }

  QJsonObject msg;
  msg[Protocolo::EVENTO] = Protocolo::PEDIDO_CANCELADO;
  msg["id_pedido"] = (int)pedido.id_pedido;

  // Notifica a todos los roles
  for (auto cli : m_manejadoresActivos)
    emit enviarRespuesta(cli, msg);

  qInfo() << "Pedido" << pedido.id_pedido << "ha sido CANCELADO.";
}

void LogicaNegocio::procesarMarcarPlatoTerminado(const QJsonObject& mensaje, ManejadorCliente* remitente) {
  std::lock_guard<std::mutex> lock(m_mutex);

  OperacionContext ctx{mensaje, {}, this, remitente};
  auto chain = std::make_shared<DataExtractionHandler>(QStringLiteral("data"));
  chain->setNext(std::make_shared<PedidoLookupHandler>())
       ->setNext(std::make_shared<InstanciaLookupHandler>())
       ->setNext(std::make_shared<EstacionAutorizadaHandler>());

  if (!chain->process(ctx)) {
    return;
  }

  PedidoMesa& pedido = *ctx.pedido;
  PlatoInstancia& instancia = *ctx.instancia;

  instancia.estado = EstadoPlato::FINALIZADO;

  bool todoTerminado = true;
  for (const auto& inst : pedido.platos) {
    if (inst.estado != EstadoPlato::FINALIZADO && inst.estado != EstadoPlato::CANCELADO) {
      todoTerminado = false;
      break;
    }
  }

  if (todoTerminado) {
    pedido.estado_general = EstadoPedido::LISTO;
  }

  QJsonObject msg;
  msg[Protocolo::EVENTO] = Protocolo::PLATO_TERMINADO;
  msg["id_pedido"] = (int)pedido.id_pedido;
  msg["id_instancia"] = (int)instancia.id_instancia;
  msg["pedido_listo"] = todoTerminado;

  for (auto cli : m_manejadoresActivos)
    emit enviarRespuesta(cli, msg);

  qInfo() << "Plato" << instancia.id_instancia << "terminado. Pedido"
          << pedido.id_pedido << (todoTerminado ? "LISTO" : "AÚN EN PROCESO");
}

void LogicaNegocio::procesarConfirmarEntrega(const QJsonObject& mensaje, ManejadorCliente* remitente) {
  std::lock_guard<std::mutex> lock(m_mutex);

  OperacionContext ctx{mensaje, {}, this, remitente};
  auto chain = std::make_shared<DataExtractionHandler>(QString::fromLatin1(Protocolo::DATA));
  chain->setNext(std::make_shared<PedidoLookupHandler>());

  if (!chain->process(ctx)) {
    return;
  }

  PedidoMesa& pedido = *ctx.pedido;
  if (pedido.estado_general != EstadoPedido::LISTO) {
    qWarning() << "No se puede confirmar entrega: pedido no está LISTO. Estado actual:" << (int)pedido.estado_general;
    return;
  }

  pedido.estado_general = EstadoPedido::ENTREGADO;

  for (auto& inst : pedido.platos) {
    inst.estado = EstadoPlato::ENTREGADO;
  }

  QJsonObject msg;
  msg[Protocolo::EVENTO] = Protocolo::PEDIDO_ENTREGADO;
  msg["id_pedido"] = (int)pedido.id_pedido;

  for (auto cli : m_manejadoresActivos) {
    emit enviarRespuesta(cli, msg);
  }

  // Actualizar ranking
  for (const auto& inst : pedido.platos) {
    m_rankingRepository.incrementar(inst.id_plato_definicion);
  }

  qInfo() << "Pedido" << pedido.id_pedido << "ENTREGADO correctamente.";
}

void LogicaNegocio::procesarDevolverPlato(const QJsonObject& mensaje, ManejadorCliente* remitente) {
  std::lock_guard<std::mutex> lock(m_mutex);

  OperacionContext ctx{mensaje, {}, this, remitente};
  auto chain = std::make_shared<DataExtractionHandler>(QStringLiteral("data"));
  chain->setNext(std::make_shared<PedidoLookupHandler>())
       ->setNext(std::make_shared<InstanciaLookupHandler>());

  if (!chain->process(ctx)) {
    return;
  }

  PedidoMesa& pedido = *ctx.pedido;
  PlatoInstancia& instancia = *ctx.instancia;
  std::string estacionObjetivo;

  if (instancia.estado != EstadoPlato::ENTREGADO) {
    qWarning() << "No se puede devolver un plato que NO está ENTREGADO. Estado actual:"
               << (int)instancia.estado;
    return;
  }

  instancia.estado = EstadoPlato::DEVUELTO;

  if (ctx.definicion) {
    estacionObjetivo = ctx.definicion->estacion;
  } else {
    qWarning() << "Definición de plato no encontrada para instancia" << instancia.id_instancia;
    return;
  }

  pedido.estado_general = EstadoPedido::EN_PROGRESO;

  const PlatoDefinicion* def = m_menuRepository.obtener(pedido.platos[0].id_plato_definicion);
  if (!def) {
    qWarning() << "Definición de plato no encontrada para pedido" << pedido.id_pedido;
    return;
  }

  InfoPlatoPrioridad pr(instancia.id_instancia, def->tiempo_preparacion_estimado);
  pr.id_pedido = pedido.id_pedido;
  m_colasPorEstacion[estacionObjetivo].push(pr);

  for (const auto& inst : pedido.platos) {
    if (inst.id_instancia == instancia.id_instancia) {
      m_rankingRepository.decrementar(inst.id_plato_definicion);
      break;
    }
  }

  QJsonObject msg;
  msg[Protocolo::EVENTO] = Protocolo::PLATO_DEVUELTO;
  msg["id_pedido"] = (int)pedido.id_pedido;
  msg["id_instancia"] = (int)instancia.id_instancia;
  msg["estacion"] = QString::fromStdString(estacionObjetivo);

  for (auto cli : m_manejadoresActivos)
    emit enviarRespuesta(cli, msg);

  qInfo() << "Plato" << instancia.id_instancia << "del pedido" << pedido.id_pedido
          << "ha sido DEVUELTO.";
}


