#include <iostream>
#include <thread>

using namespace std;

void thread_func() {
    static thread_local int stls_variable = 0;
    stls_variable += 1;
    cout << "Thread ID: " << this_thread::get_id() << ", Variable: " << stls_variable << endl;
}

int main() {
    thread t1(thread_func);
    thread t2(thread_func);

    t1.join();
    t2.join();

    return 0;
}
