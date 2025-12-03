<h1 align="center">Operating System Simulator – Trabajo Final</h1>

<div align="center">

> **Universidad Nacional de San Agustín**  
> **Facultad de Ingeniería de Producción y Servicios**  
> **Escuela Profesional de Ingeniería de Sistemas**  
> **Curso:** Sistemas Operativos – 2025-B

[![Made with Java](https://img.shields.io/badge/Made%20with-Java-red?style=for-the-badge&logo=java)](https://www.java.com)
[![OS Concepts](https://img.shields.io/badge/OS-Concepts-blue?style=for-the-badge&logo=linux)](https://github.com)
[![Status](https://img.shields.io/badge/Status-In%20Progress-yellow?style=for-the-badge)](https://github.com)

</div>

---

## 1. Modulos

### 1.1. Módulo de Planificación
- **FCFS** (First Come First Served)
- **SJF** (Shortest Job First)  
- **Round Robin** con quantum configurable
- Métricas: Tiempo de espera, retorno y utilización de CPU

###  1.2. Módulo de Memoria Virtual
- **FIFO** (First In First Out)
- **LRU** (Least Recently Used)
- **Algoritmo Óptimo**
- Registro de fallos de página y reemplazos

###  1.3. Módulo de Sincronización
-  Procesos como **Threads independientes**
-  Estados: `NUEVO → LISTO → EJECUTANDO → BLOQUEADO → TERMINADO`
-  Semáforos y Locks para evitar *race conditions*
-  **BONUS:** Manejo de ráfagas de E/S (+2 pts)

###  1.4. Interfaz Gráfica
-  Diagrama de Gantt interactivo
-  Tabla de páginas en tiempo real
-  Log de eventos del sistema

---
## 2. Estructura del Proyecto
```
Operating-System-Simulator/
│
├── pom.xml
│
├── src/
│   └── main/
│       ├── java/
│       │   ├── TestScheduler.java
│       │   ├── TestScheduler2.java
│       │   ├── model/
│       │   │   ├── Burst.java
│       │   │   ├── Config.java
│       │   │   ├── DatosResultados.java
│       │   │   ├── Process.java
│       │   │   ├── ProcessState.java
│       │   │   └── ResultadoProceso.java
│       │   ├── modules/
│       │   │   ├── gui/
│       │   │   │   ├── MainFX.java
│       │   │   │   ├── README.md
│       │   │   │   ├── SimulationRunner.java
│       │   │   │   ├── components/
│       │   │   │   │   ├── GanttChart.java
│       │   │   │   │   ├── MainWindow.java
│       │   │   │   │   ├── MemoryTable.java
│       │   │   │   │   ├── MemoryVisualizer.java
│       │   │   │   │   └── SimulationControls.java
│       │   │   │   ├── dashboard/
│       │   │   │   │   ├── ExePanel.java
│       │   │   │   │   ├── LogsPanel.java
│       │   │   │   │   ├── MemPanel.java
│       │   │   │   │   └── ProPanel.java
│       │   │   │   └── pages/
│       │   │   │       ├── ConfigPage.java
│       │   │   │       ├── DashboardPage.java
│       │   │   │       └── ResultadosPage.java
│       │   │   ├── memory/
│       │   │   │   ├── FIFO.java
│       │   │   │   ├── LRU.java
│       │   │   │   ├── MemoryEventListener.java
│       │   │   │   ├── MemoryManager.java
│       │   │   │   ├── NRU.java
│       │   │   │   └── Optimal.java
│       │   │   ├── scheduler/
│       │   │   │   ├── FCFS.java
│       │   │   │   ├── Priority.java
│       │   │   │   ├── RoundRobin.java
│       │   │   │   ├── SJF.java
│       │   │   │   ├── SRT.java
│       │   │   │   └── Scheduler.java
│       │   │   └── sync/
│       │   │       ├── IOManager.java
│       │   │       ├── ProcessThread.java
│       │   │       ├── SimulationEngine.java
│       │   │       └── SimulationStateListener.java
│       │   └── utils/
│       │       ├── FileParser.java
│       │       ├── Logger.java
│       │       └── SimulationFactory.java
│       └── resources/
│           ├── data/
│           │   └── procesos.txt
│           └── gui/
│               └── styles.css
│
└── docs/
    └── diagramas/
        └── README.md


```
## 3. Compilacion 

### 3.1 En Ubuntu
Requiere Maven y JDK 17.
```
mvn javafx:run
```


### 3.2 En Windows (powershell)

Requiere Maven y JDK 17.
- Ir a la página oficial: Apache Maven Download https://maven.apache.org/download.cgi 	
- Descargar el archivo apache-maven-3.9.11-bin.zip (Binary zip archive).
C:\Program Files\Apache\Maven\apache-maven-3.9.x\bin
Agregarlo al path


## Desplegar ...
```
mvn clean compile
mvn javafx:run
```

## 4. Diagramas ...
```
Enlace mockups: https://www.canva.com/design/DAG51rAcC7Y/fr2ibHrbrLbHoTcIJMwuNg/edit?utm_content=DAG51rAcC7Y&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

```
# Direcciones de Acceso rapido a archivos para pruebas 
```
->FabbPP
C:\Users\fabia\Documents\UNSA\2025-II\Github\Operating-System-Simulator\src\main\resources\data
```

# Descripción de Procesos.txt
PID TIEMPO_LLEGADA INSTRUCCIONES PRIORIDAD MARCOS
EJEMPLO: P1 0 CPU(4),IO(3),CPU(5) 1 4

P1 = Identificador del proceso (Process ID)
0 = Tiempo de llegada 
CPU(4),IO(3),CPU(5) = Unidades de proceso rafagas
1 = prioridad util para planificador de procesos (scheduler) con el algoritmo que se desee
4 = marcos 