#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <string>

std::mutex m;
std::condition_variable cv;
std::string data;
bool ready = false;
bool processed = false;

void worker() {
    std::unique_lock lk(m);
    cv.wait(lk, []{ return ready; });
    data += " trabajada";
    processed = true;
    lk.unlock();
    cv.notify_one();
}

void master() {
    {
        std::lock_guard lk(m);
        data = "Dato";
        ready = true;
    }
    cv.notify_one();
    std::unique_lock lk(m);
    cv.wait(lk, []{ return processed; });
    std::cout << data << std::endl;
}

int main() {
    std::thread t1(worker), t2(master);
    t1.join();
    t2.join();
}
