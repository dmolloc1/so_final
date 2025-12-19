#include <iostream>
#include <condition_variable>
#include <mutex>
#include <thread>

std::mutex mtx;
std::condition_variable cv;

void worker() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock);
    std::cout << "Trabajo realizado\n";
}

void notifier() {
    std::cout << "Datos listos\n";
    cv.notify_one();
}

int main() {
    std::thread t1(worker);
    std::thread t2(notifier);
    t1.join();
    t2.join();
}
