#include <iostream>
#include <thread>

using namespace std;

void func(int n, double m) {
    cout << n << " " << m << endl;
}

int main() {
    thread th(func, 1, 5.7);

    if (th.joinable()) {
        th.join();
    }

    return 0;
}
