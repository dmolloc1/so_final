class TestTh extends Thread {
    private String nombre;
    private int retardo;

    public TestTh(String s, int d) {
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

public class MultiHola {
    public static void main(String[] args) {
        TestTh t1, t2;

        t1 = new TestTh("Thread 1", (int) (Math.random() * 2000));
        t2 = new TestTh("Thread 2", (int) (Math.random() * 2000));

        t1.start();
        t2.start();
    }
}
