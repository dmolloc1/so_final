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
    data += " procesada";
    processed = true;
    lk.unlock();
    cv.notify_one();
}

int main() {
    std::thread t(worker);
    {
        std::lock_guard lk(m);
        data = "Data";
        ready = true;
    }
    cv.notify_one();
    {
        std::unique_lock lk(m);
        cv.wait(lk, []{ return processed; });
    }
    std::cout << data << std::endl;
    t.join();
}
