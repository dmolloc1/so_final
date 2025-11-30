#include <iostream>
#include <thread>

using namespace std;

thread_local int counter = 0;

void increment_counter() {
    counter++;
    cout << "Thread " << this_thread::get_id() << " counter = " << counter << endl;
}

int main() {
    thread t1(increment_counter);
    thread t2(increment_counter);

    t1.join();
    t2.join();

    return 0;
}
