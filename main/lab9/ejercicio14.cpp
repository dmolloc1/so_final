#include <chrono>
#include <iostream>
#include <thread>

using namespace std;

void sleepThread() {
    this_thread::sleep_for(chrono::minutes(1));
}

int main() {
    thread thread1(sleepThread);
    thread thread2(sleepThread);

    thread::id t1_id = thread1.get_id();
    thread::id t2_id = thread2.get_id();

    cout << "ID asociado con thread1 = " << t1_id << endl;
    cout << "ID asociado con thread2 = " << t2_id << endl;

    thread1.join();
    thread2.join();

    return 0;
}
