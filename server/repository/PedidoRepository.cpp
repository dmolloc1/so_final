#include "PedidoRepository.h"

#include <utility>

PedidoMesa* PedidoRepository::obtener(long long idPedido) {
  auto it = m_pedidos.find(idPedido);
  if (it == m_pedidos.end()) {
    return nullptr;
  }
  return &it->second;
}

void PedidoRepository::guardar(long long idPedido, PedidoMesa pedido) {
  m_pedidos[idPedido] = std::move(pedido);
}

std::unordered_map<long long, PedidoMesa>& PedidoRepository::pedidos() {
  return m_pedidos;
}

const std::unordered_map<long long, PedidoMesa>& PedidoRepository::pedidos() const {
  return m_pedidos;
}

std::queue<long long>& PedidoRepository::colaManagerChef() {
  return m_colaManagerChef;
}
