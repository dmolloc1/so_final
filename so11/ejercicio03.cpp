#include <thread>
#include <mutex>
#include <condition_variable>
#include <syncstream>
#include <iostream>
using namespace std::chrono_literals;

struct Resource {
    bool full = false;
    std::mutex mux;
    std::condition_variable cond;

    void produce() {
        std::unique_lock lock(mux);
        cond.wait(lock, [this]{ return !full; });
        std::osyncstream(std::cout) << "Produciendo recurso\n";
        full = true;
        lock.unlock();
        cond.notify_one();
        std::this_thread::sleep_for(200ms);
    }

    void consume() {
        std::unique_lock lock(mux);
        cond.wait(lock, [this]{ return full; });
        std::osyncstream(std::cout) << "Consumiendo recurso\n";
        full = false;
        lock.unlock();
        cond.notify_one();
        std::this_thread::sleep_for(200ms);
    }
};

int main() {
    Resource r;
    std::jthread t1([&](std::stop_token st){ while(!st.stop_requested()) r.produce(); });
    std::jthread t2([&](std::stop_token st){ while(!st.stop_requested()) r.consume(); });
    std::this_thread::sleep_for(2s);
}
