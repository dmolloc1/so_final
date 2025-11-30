#include <iostream>
#include <thread>

int main() {
    std::cout << "Numero de threads = " << std::thread::hardware_concurrency() << std::endl;
    return 0;
}
