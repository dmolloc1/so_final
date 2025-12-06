#ifndef PEDIDO_REPOSITORY_H
#define PEDIDO_REPOSITORY_H

#include <unordered_map>
#include <queue>
#include <string>
#include "common/models/PedidoMesa.h"
#include "common/models/InfoPlatoPrioridad.h"

using ColaPrioridadPlatos = std::priority_queue<InfoPlatoPrioridad, std::vector<InfoPlatoPrioridad>,
      std::greater<InfoPlatoPrioridad>>;

class PedidoRepository {
public:
  PedidoRepository();

  long long generarNuevoIdPedido();
  long long generarNuevoIdInstancia();

  std::unordered_map<long long, PedidoMesa>& pedidos();
  const std::unordered_map<long long, PedidoMesa>& pedidos() const;

  std::queue<long long>& colaManagerChef();
  std::unordered_map<std::string, ColaPrioridadPlatos>& colasPorEstacion();
  const std::unordered_map<std::string, ColaPrioridadPlatos>& colasPorEstacion() const;

  std::unordered_map<int, int>& conteoRanking();
  const std::unordered_map<int, int>& conteoRanking() const;

private:
  long long m_siguienteIdPedido;
  long long m_siguienteIdInstanciaPlato;
  std::unordered_map<long long, PedidoMesa> m_pedidosActivos;
  std::queue<long long> m_colaManagerChef;
  std::unordered_map<std::string, ColaPrioridadPlatos> m_colasPorEstacion;
  std::unordered_map<int, int> m_conteoPlatosRanking;
};

#endif
