#include <iostream>
#include <thread>

using namespace std;

class Singleton {
public:
    static Singleton& getInstance() {
        static thread_local Singleton instance;
        return instance;
    }

    void printMessage() {
        cout << "Hola desde el thread " << this_thread::get_id() << endl;
    }

private:
    Singleton() = default;
};

void workerThread() {
    Singleton::getInstance().printMessage();
}

int main() {
    thread t1(workerThread);
    thread t2(workerThread);

    t1.join();
    t2.join();

    return 0;
}
