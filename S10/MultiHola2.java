class TestTh2 extends Thread {
    private String nombre;
    private int retardo;

    public TestTh2(String s, int d) {
        nombre = s;
        retardo = d;
    }

    public void run() {
        try {
            sleep(retardo);
        } catch (InterruptedException e) {
        }

        System.out.println("Hola Mundo! " + nombre + " " + retardo);
    }
}

public class MultiHola2 {
    public static void main(String[] args) {
        TestTh2 t1, t2, t3, t4, t5, t6, t7;

        t1 = new TestTh2("Thread 1", (int) (Math.random() * 2000));
        t2 = new TestTh2("Thread 2", (int) (Math.random() * 2000));
        t3 = new TestTh2("Thread 3", (int) (Math.random() * 2000));
        t4 = new TestTh2("Thread 4", (int) (Math.random() * 2000));
        t5 = new TestTh2("Thread 5", (int) (Math.random() * 2000));
        t6 = new TestTh2("Thread 6", (int) (Math.random() * 2000));
        t7 = new TestTh2("Thread 7", (int) (Math.random() * 2000));

        t1.start();
        t2.start();
        t3.start();
        t4.start();
        t5.start();
        t6.start();
        t7.start();
    }
}
