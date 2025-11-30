#include <iostream>
#include <thread>
#include <string>

void thread_function(std::string s) {
    std::cout << "función thread ";
    std::cout << "El mensaje es = " << s << std::endl;
}

int main() {
    std::string s = "Kathy Perry";

    std::thread t(&thread_function, s);

    std::cout << "el mensaje del thread principal es = " << s << std::endl;

    t.join();
    return 0;
}
