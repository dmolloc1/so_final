package modules.gui;

import modules.memory.MemoryManager;

/**
 * Contexto compartido para exponer instancias activas de la simulación
 * a los componentes de la interfaz.
 */
public class SimulationContext {

    private static MemoryManager memoryManager;

    private SimulationContext() {}

    public static void setMemoryManager(MemoryManager manager) {
        memoryManager = manager;
    }

    public static MemoryManager getMemoryManager() {
        return memoryManager;
    }
}
