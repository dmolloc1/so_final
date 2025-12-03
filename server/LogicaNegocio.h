#ifndef LOGICANEGOCIO_H
#define LOGICANEGOCIO_H

#include <QObject>
#include <queue>
#include <unordered_map>
#include <string>
#include <mutex>
#include <vector>
#include <QJsonObject>

#include "common/models/PedidoMesa.h"
#include "common/models/PlatoDefinicion.h"
#include "common/models/InfoPlatoPrioridad.h"
#include "common/models/Estados.h"
#include "common/adapter/AdaptadorSerializadorJSON.h"
#include "repository/MenuRepository.h"
#include "repository/PedidoRepository.h"
#include "repository/RankingRepository.h"

class ManejadorCliente;

using ColaPrioridadPlatos = std::priority_queue<
    InfoPlatoPrioridad,
    std::vector<InfoPlatoPrioridad>,
    std::greater<InfoPlatoPrioridad>
>;

class LogicaNegocio : public QObject {
    Q_OBJECT

private:
    LogicaNegocio(QObject* parent = nullptr);
    static LogicaNegocio* s_instance;

public:
    static LogicaNegocio* instance();
    LogicaNegocio(const LogicaNegocio&) = delete;
    void operator=(const LogicaNegocio&) = delete;

    //Patron Strategy
    void procesarMensaje(const QJsonObject& mensaje, ManejadorCliente* remitente);

    void procesarNuevoPedido(const QJsonObject& mensaje, ManejadorCliente* remitente);
    void procesarPrepararPedido(const QJsonObject& mensaje, ManejadorCliente* remitente);
    void procesarCancelarPedido(const QJsonObject& mensaje, ManejadorCliente* remitente);
    void procesarMarcarPlatoTerminado(const QJsonObject& mensaje, ManejadorCliente* remitente);
    void procesarConfirmarEntrega(const QJsonObject& mensaje, ManejadorCliente* remitente);
    void procesarDevolverPlato(const QJsonObject& mensaje, ManejadorCliente* remitente);

    void registrarManejador(ManejadorCliente* manejador);
    void eliminarManejador(ManejadorCliente* manejador);

    void cargarMenuDesdeArchivo(const QString& rutaArchivo);
    void enviarEstadoInicial(ManejadorCliente* cliente);

    QJsonObject getEstadoParaRanking();
    void registrarVenta(int idPlato);

signals:
    void enviarRespuesta(ManejadorCliente* cliente, const QJsonObject& mensaje);

private:
    PedidoMesa* obtenerPedido(long long idPedido);
    PlatoInstancia* obtenerInstancia(PedidoMesa& pedido, long long idInstancia);
    const PlatoDefinicion* obtenerDefinicionPlato(int idPlato);

    std::mutex m_mutex;
    std::vector<ManejadorCliente*> m_manejadoresActivos;

    std::unordered_map<std::string, ColaPrioridadPlatos> m_colasPorEstacion;

    long long m_siguienteIdPedido;
    long long m_siguienteIdInstanciaPlato;

    AdaptadorSerializadorJSON m_serializador;
    MenuRepository m_menuRepository;
    PedidoRepository m_pedidoRepository;
    RankingRepository m_rankingRepository;
};

#endif
