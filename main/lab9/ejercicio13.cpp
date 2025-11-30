#include <iostream>
#include <thread>

void foo() {
    std::cout << "estoy en foo\n";
}

void bar() {
    std::cout << "estoy en bar\n";
}

int main() {
    std::thread t1(foo);
    std::thread t2(bar);
    std::thread t3(foo);
    std::thread t4(bar);

    t1.join();
    t2.join();
    t3.join();
    t4.join();

    return 0;
}
