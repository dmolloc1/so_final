class TestThArray extends Thread {
    private final String alias;
    private final int demora;

    public TestThArray(String nombre, int ms) {
        this.alias = nombre;
        this.demora = ms;
    }

    @Override
    public void run() {
        try {
            sleep(demora);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("Hola Mundo! " + alias + " " + demora);
    }
}

public class MultiHola2Array {
    public static void main(String[] args) {
        TestThArray[] hilos = new TestThArray[7];
        for (int idx = 0; idx < hilos.length; idx++) {
            String etiqueta = "Thread " + (idx + 1);
            int pausa = (int) (Math.random() * 2000);
            hilos[idx] = new TestThArray(etiqueta, pausa);
        }
        for (TestThArray hilo : hilos) {
            hilo.start();
        }
    }
}
