#ifndef PEDIDOREPOSITORY_H
#define PEDIDOREPOSITORY_H

#include <unordered_map>
#include <queue>

#include "common/models/PedidoMesa.h"

class PedidoRepository {
public:
    PedidoMesa* obtener(long long idPedido);
    void guardar(long long idPedido, PedidoMesa pedido);
    std::unordered_map<long long, PedidoMesa>& pedidos();
    const std::unordered_map<long long, PedidoMesa>& pedidos() const;
    std::queue<long long>& colaManagerChef();

private:
    std::unordered_map<long long, PedidoMesa> m_pedidos;
    std::queue<long long> m_colaManagerChef;
};

#endif
