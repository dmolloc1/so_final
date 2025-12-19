import java.io.*;

public class MethodTest {
    static PrintWriter out = new PrintWriter(System.out, true);

    public static void main(String[] args) {
        FirstThread first = new FirstThread();
        SecondThread second = new SecondThread();
        first.start();
        second.start();
        try {
            out.println("Waiting for first thread to finish...");
            first.join();
            out.println("It's a long wait !!");
            out.println("Waking up second thread ...");
            synchronized (second) {
                second.notify();
            }
            out.println("Waiting for second thread to finish ...");
            second.join();
        } catch (InterruptedException e) {
        }
        out.println("I'm ready to finish too.");
    }
}

class FirstThread extends Thread {
    public void run() {
        try {
            MethodTest.out.println(" First thread starts running.");
            sleep(10000);
            MethodTest.out.println(" First thread finishes running.");
        } catch (InterruptedException e) {
        }
    }
}

class SecondThread extends Thread {
    public synchronized void run() {
        try {
            MethodTest.out.println(" Second thread starts running.");
            MethodTest.out.println(" Second thread suspends itself.");
            wait();
            MethodTest.out.println(" Second thread runs again and finishes.");
        } catch (InterruptedException e) {
        }
    }
}
