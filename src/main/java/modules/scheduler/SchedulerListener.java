package modules.scheduler;

import java.util.List;
import model.Process;

/**
 * Listener para observar cambios en el planificador y reflejarlos en la interfaz.
 */
public interface SchedulerListener {
    default void onReadyQueueChanged(List<Process> snapshot, int currentTime) {}

    default void onProcessStarted(Process process, int startTime) {}

    default void onProcessCompleted(Process process, int completionTime) {}

    default void onTimeAdvanced(Process runningProcess, int currentTime) {}
}
