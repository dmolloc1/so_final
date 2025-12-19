#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>

class Application {
    std::mutex m;
    std::condition_variable cv;
    bool loaded = false;

public:
    void loadData() {
        std::this_thread::sleep_for(std::chrono::seconds(1));
        std::lock_guard<std::mutex> lck(m);
        loaded = true;
        cv.notify_one();
    }

    void process() {
        std::unique_lock<std::mutex> lck(m);
        cv.wait(lck, [&]{ return loaded; });
        std::cout << "Datos procesados\n";
    }
};

int main() {
    Application app;
    std::thread t1(&Application::process, &app);
    std::thread t2(&Application::loadData, &app);
    t1.join();
    t2.join();
}
