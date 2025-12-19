#include <iostream>
#include <condition_variable>
#include <thread>
#include <mutex>
#include <chrono>

using namespace std::chrono_literals;

std::condition_variable_any cv;
std::mutex m;
int i = 0;

void wait_fn(int id) {
    std::unique_lock<std::mutex> lk(m);
    if (cv.wait_for(lk, id * 100ms, []{ return i == 1; }))
        std::cout << "Thread " << id << " despertó\n";
    else
        std::cout << "Thread " << id << " timeout\n";
}

void signal() {
    std::this_thread::sleep_for(200ms);
    {
        std::lock_guard lk(m);
        i = 1;
    }
    cv.notify_all();
}

int main() {
    std::thread t1(wait_fn,1), t2(wait_fn,2), t3(wait_fn,3), t4(signal);
    t1.join(); t2.join(); t3.join(); t4.join();
}
