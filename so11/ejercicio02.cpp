#include <condition_variable>
#include <iostream>
#include <mutex>
#include <queue>
#include <random>
#include <thread>

int main() {
    std::condition_variable cond;
    std::mutex mtx;
    std::queue<int> intq;
    bool stopped = false;

    std::thread producer([&]() {
        std::default_random_engine gen{};
        std::uniform_int_distribution<int> dist{};
        for (int i = 0; i < 4006; i++) {
            std::lock_guard<std::mutex> lck(mtx);
            intq.push(dist(gen));
            cond.notify_one();
        }
        std::lock_guard<std::mutex> lck(mtx);
        stopped = true;
        cond.notify_one();
    });

    std::thread consumer([&]() {
        while (true) {
            std::unique_lock<std::mutex> lck(mtx);
            cond.wait(lck, [&]() { return stopped || !intq.empty(); });
            while (!intq.empty()) {
                std::cout << "Consumidor saca: " << intq.front() << std::endl;
                intq.pop();
            }
            if (stopped) break;
        }
    });

    producer.join();
    consumer.join();
}
