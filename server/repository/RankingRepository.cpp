#include "RankingRepository.h"

void RankingRepository::incrementar(int idPlato) {
  m_conteoPlatosRanking[idPlato]++;
}

void RankingRepository::decrementar(int idPlato) {
  auto it = m_conteoPlatosRanking.find(idPlato);
  if (it != m_conteoPlatosRanking.end() && it->second > 0) {
    it->second--;
  }
}

const std::unordered_map<int, int>& RankingRepository::conteo() const {
  return m_conteoPlatosRanking;
}
