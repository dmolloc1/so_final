class java1002 {
    public static void main(String[] args) {
        Thread hiloA = new Thread(new MiHilo(), "hiloA");
        Thread hiloB = new Thread(new MiHilo(), "hiloB");

        hiloA.start();
        hiloB.start();

        try {
            Thread.currentThread().sleep(1000);
        } catch (InterruptedException e) {
        }

        System.out.println(Thread.currentThread());

        hiloA.stop();
        hiloB.stop();
    }
}

class MiHilo extends Thread {
    public void run() {
        System.out.println(Thread.currentThread());
    }
}
