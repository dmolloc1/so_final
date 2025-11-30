#include <iostream>
#include <thread>

void thread_function() {
    std::cout << "funcion Thread\n";
}

int main() {
    std::thread t(&thread_function);
    std::cout << "Thread principal\n";
    if (t.joinable())
        t.join();
    return 0;
}
