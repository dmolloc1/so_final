#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <string>

std::mutex m;
std::condition_variable cv;
std::string data;

void worker() {
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::unique_lock lk(m);
    cv.wait(lk);
    data += " procesada";
    lk.unlock();
    cv.notify_one();
}

void master() {
    {
        std::lock_guard lk(m);
        data = "Dato";
    }
    cv.notify_one();
    std::unique_lock lk(m);
    cv.wait(lk);
    std::cout << data << std::endl;
}

int main() {
    std::thread t1(worker), t2(master);
    t1.join();
    t2.join();
}
