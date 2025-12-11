/*
Soluciones a los ejercicios de hilos en Java.
Cada bloque contiene el código listo para copiar en su propio archivo .java.
*/

// Ejercicio 1: ThreadEjemplo.java
/*
public class ThreadEjemplo extends Thread {
    public ThreadEjemplo(String str) {
        super(str);
    }

    @Override
    public void run() {
        for (int i = 0; i < 10; i++) {
            System.out.println(i + " " + getName());
        }
        System.out.println("Termina thread " + getName());
    }

    public static void main(String[] args) {
        new ThreadEjemplo("Pepe").start();
        new ThreadEjemplo("Juan").start();
        System.out.println("Termina thread main");
    }
}
// Compilación: javac ThreadEjemplo.java
*/

// Ejercicio 2: ThreadEjemplo2.java
/*
public class ThreadEjemplo2 implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(i + " " + Thread.currentThread().getName());
        }
        System.out.println("Termina thread " + Thread.currentThread().getName());
    }

    public static void main(String[] args) {
        new Thread(new ThreadEjemplo2(), "Pepe").start();
        new Thread(new ThreadEjemplo2(), "Juan").start();
        System.out.println("Termina thread main");
    }
}
// Compilación: javac ThreadEjemplo2.java
*/

// Ejercicio 3: MostrarCeroUnoHilo.java
/*
public class MostrarCeroUnoHilo {
    public static void main(String[] args) {
        HiloMostrarCero h1 = new HiloMostrarCero();
        h1.start();
        HiloMostrarUno h2 = new HiloMostrarUno();
        h2.start();
    }
}

class HiloMostrarCero extends Thread {
    @Override
    public void run() {
        for (int f = 1; f <= 1000; f++) {
            System.out.print("0-");
        }
    }
}

class HiloMostrarUno extends Thread {
    @Override
    public void run() {
        for (int f = 1; f <= 1000; f++) {
            System.out.print("1-");
        }
    }
}
// Compilación: javac MostrarCeroUnoHilo.java
*/

// Ejercicio 4: MostrarCeroUnoHilo2.java
/*
public class MostrarCeroUnoHilo2 {
    public static void main(String[] args) {
        HiloMostrarCero h1 = new HiloMostrarCero();
        HiloMostrarUno h2 = new HiloMostrarUno();
    }
}

class HiloMostrarCero implements Runnable {
    private Thread t;

    public HiloMostrarCero() {
        t = new Thread(this);
        t.start();
    }

    @Override
    public void run() {
        for (int f = 1; f <= 1000; f++) {
            System.out.print("0-");
        }
    }
}

class HiloMostrarUno implements Runnable {
    private Thread t;

    public HiloMostrarUno() {
        t = new Thread(this);
        t.start();
    }

    @Override
    public void run() {
        for (int f = 1; f <= 1000; f++) {
            System.out.print("1-");
        }
    }
}
// Compilación: javac MostrarCeroUnoHilo2.java
*/

// Ejercicio 5: java1002.java
/*
class java1002 {
    public static void main(String[] args) {
        Thread hiloA = new Thread(new MiHilo(), "hiloA");
        Thread hiloB = new Thread(new MiHilo(), "hiloB");

        hiloA.start();
        hiloB.start();

        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println(Thread.currentThread());

        hiloA.stop();
        hiloB.stop();
    }
}

class MiHilo extends Thread {
    @Override
    public void run() {
        System.out.println(Thread.currentThread());
    }
}
// Compilación: javac java1002.java
*/

// Ejercicio 6: java1003.java
/*
class java1003 {
    public static void main(String[] args) {
        Thread hiloA = new MiHilo();
        Thread hiloB = new MiHilo();

        hiloA.start();
        hiloB.start();

        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println(Thread.currentThread());

        hiloA.stop();
        hiloB.stop();
    }
}

class MiHilo extends Thread {
    @Override
    public void run() {
        System.out.println(Thread.currentThread());
    }
}
// Compilación: javac java1003.java
*/

// Ejercicio 7: MultiHola.java
/*
class TestTh extends Thread {
    private String nombre;
    private int retardo;

    public TestTh(String s, int d) {
        nombre = s;
        retardo = d;
    }

    @Override
    public void run() {
        try {
            sleep(retardo);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
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
// Compilación: javac MultiHola.java
*/

// Ejercicio 8: MultiHola2.java
/*
class TestTh extends Thread {
    private String nombre;
    private int retardo;

    public TestTh(String s, int d) {
        nombre = s;
        retardo = d;
    }

    @Override
    public void run() {
        try {
            sleep(retardo);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("Hola Mundo! " + nombre + " " + retardo);
    }
}

public class MultiHola2 {
    public static void main(String[] args) {
        TestTh t1, t2, t3, t4, t5, t6, t7;
        t1 = new TestTh("Thread 1", (int) (Math.random() * 2000));
        t2 = new TestTh("Thread 2", (int) (Math.random() * 2000));
        t3 = new TestTh("Thread 3", (int) (Math.random() * 2000));
        t4 = new TestTh("Thread 4", (int) (Math.random() * 2000));
        t5 = new TestTh("Thread 5", (int) (Math.random() * 2000));
        t6 = new TestTh("Thread 6", (int) (Math.random() * 2000));
        t7 = new TestTh("Thread 7", (int) (Math.random() * 2000));

        t1.start();
        t2.start();
        t3.start();
        t4.start();
        t5.start();
        t6.start();
        t7.start();
    }
}
// Compilación: javac MultiHola2.java
*/

// Ejercicio 9: MethodTest.java
/*
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
            Thread.currentThread().interrupt();
        }
        out.println("I'm ready to finish too.");
    }
}

class FirstThread extends Thread {
    @Override
    public void run() {
        try {
            MethodTest.out.println(" First thread starts running.");
            sleep(10000);
            MethodTest.out.println(" First thread finishes running.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

class SecondThread extends Thread {
    @Override
    public synchronized void run() {
        try {
            MethodTest.out.println(" Second thread starts running.");
            MethodTest.out.println(" Second thread suspends itself.");
            wait();
            MethodTest.out.println(" Second thread runs again and finishes.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
// Compilación: javac MethodTest.java
*/

// Ejercicio 10: SimpleThread.java
/*
public class SimpleThread extends Thread {
    private int countDown = 5;
    private int threadNumber;
    private static int threadCount = 0;

    public SimpleThread() {
        threadNumber = ++threadCount;
        System.out.println("Making " + threadNumber);
    }

    @Override
    public void run() {
        while (true) {
            System.out.println("Thread " + threadNumber + "(" + countDown + ")");
            if (--countDown == 0) {
                return;
            }
        }
    }

    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            new SimpleThread().start();
        }
        System.out.println("All Threads Started");
    }
}
// Compilación: javac SimpleThread.java
*/

// Ejercicios propuestos
// Ejercicio 1: Principal.java
/*
public class Principal {
    public static void main(String[] args) {
        Thread hilo = new Thread(new Tarea("hilo1"));
        Thread hilo2 = new Thread(new Tarea("hilo2"));

        hilo.start();
        hilo2.start();
    }
}

class Tarea implements Runnable {
    private final String nombre;

    public Tarea(String nombre) {
        this.nombre = nombre;
    }

    @Override
    public void run() {
        for (int i = 1; i <= 5; i++) {
            System.out.println(nombre + " - ciclo " + i);
        }
    }
}
// Compilación: javac Principal.java
*/

// Ejercicio 2: MultiHola2 con arreglo
/*
public class MultiHola2 {
    public static void main(String[] args) {
        TestTh[] hilos = new TestTh[7];
        for (int i = 0; i < hilos.length; i++) {
            hilos[i] = new TestTh("Thread " + (i + 1), (int) (Math.random() * 2000));
            hilos[i].start();
        }
    }
}
// Reutiliza la clase TestTh definida en el ejercicio 7.
*/

// Ejercicio 3: Semáforos con dos threads
/*
public class Semaforos {
    public static void main(String[] args) {
        Thread semaforoA = new Thread(new Semaforo("Semaforo A"));
        Thread semaforoB = new Thread(new Semaforo("Semaforo B"));

        semaforoA.start();
        semaforoB.start();
    }
}

class Semaforo implements Runnable {
    private final String nombre;
    private static final String[] ESTADOS = {"ROJO", "AMARILLO", "VERDE"};

    public Semaforo(String nombre) {
        this.nombre = nombre;
    }

    @Override
    public void run() {
        for (int i = 0; i < 3; i++) {
            for (String estado : ESTADOS) {
                System.out.println(nombre + ": " + estado);
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }
}
// Compilación: javac Semaforos.java
*/
