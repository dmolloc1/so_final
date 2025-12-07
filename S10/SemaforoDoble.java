public class SemaforoDoble {
    public static void main(String[] args) {
        Thread faroNorte = new Thread(new CicloLuz("Norte", 3));
        Thread faroSur = new Thread(new CicloLuz("Sur", 3));

        faroNorte.start();
        faroSur.start();
    }
}

class CicloLuz implements Runnable {
    private final String apodo;
    private final int repeticiones;

    public CicloLuz(String nombreCorto, int vueltas) {
        this.apodo = nombreCorto;
        this.repeticiones = vueltas;
    }

    @Override
    public void run() {
        String[] paleta = {"ROJO", "AMARILLO", "VERDE"};
        int[] pausas = {800, 400, 700};
        for (int ronda = 0; ronda < repeticiones; ronda++) {
            for (int tono = 0; tono < paleta.length; tono++) {
                System.out.println("Semaforo " + apodo + " -> " + paleta[tono]);
                try {
                    Thread.sleep(pausas[tono]);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
        System.out.println("Semaforo " + apodo + " finaliza su coreografia");
    }
}
