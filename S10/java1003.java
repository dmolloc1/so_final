class java1003 {
    public static void main(String[] args) {
        Thread hiloA = new MiHilo();
        Thread hiloB = new MiHilo();

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
