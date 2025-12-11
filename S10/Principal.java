public class Principal {
    public static void main(String[] args) {
        Thread hilo = new Thread(new Tarea("hilo1"));
        Thread hilo2 = new Thread(new Tarea("hilo2"));

        hilo.start();
        hilo2.start();
    }
}

class Tarea implements Runnable {
    private final String etiqueta;

    public Tarea(String nombreCorto) {
        this.etiqueta = nombreCorto;
    }

    @Override
    public void run() {
        for (int vuelta = 1; vuelta <= 5; vuelta++) {
            System.out.println(etiqueta + " dice hola en pasada " + vuelta);
            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        System.out.println("Termina el trabajo de " + etiqueta);
    }
}
