#ifndef RANKINGREPOSITORY_H
#define RANKINGREPOSITORY_H

#include <unordered_map>

class RankingRepository {
public:
    void incrementar(int idPlato);
    void decrementar(int idPlato);
    const std::unordered_map<int, int>& conteo() const;

private:
    std::unordered_map<int, int> m_conteoPlatosRanking;
};

#endif
