package modules.gui.components;

import javafx.application.Platform;
import model.Process;
import modules.scheduler.Scheduler;
import modules.scheduler.SchedulerListener;

import java.util.Collections;
import java.util.List;

/**
 * Conecta eventos del Scheduler con los componentes visuales del Dashboard.
 */
public class SchedulerVisualizer implements SchedulerListener {

    private final ExePanel exePanel;
    private final ProPanel proPanel;
    private List<Process> allProcesses = Collections.emptyList();

    public SchedulerVisualizer(ExePanel exePanel, ProPanel proPanel) {
        this.exePanel = exePanel;
        this.proPanel = proPanel;
    }

    public void bind(Scheduler scheduler, List<Process> processes) {
        this.allProcesses = processes;
        scheduler.addListener(this);
        Platform.runLater(() -> proPanel.updateQueues(allProcesses, scheduler.getReadyQueueSnapshot()));
    }

    @Override
    public void onReadyQueueChanged(List<Process> snapshot, int currentTime) {
        Platform.runLater(() -> proPanel.updateQueues(allProcesses, snapshot));
    }

    @Override
    public void onProcessStarted(Process process, int startTime) {
        Platform.runLater(() -> exePanel.getGanttChart().startProcess(process.getPid(), startTime));
    }

    @Override
    public void onProcessCompleted(Process process, int completionTime) {
        Platform.runLater(() -> proPanel.updateQueues(allProcesses, proPanelReadyFallback()));
    }

    @Override
    public void onTimeAdvanced(Process runningProcess, int currentTime) {
        Platform.runLater(() -> {
            if (runningProcess != null) {
                exePanel.getGanttChart().extendRunning(runningProcess.getPid(), currentTime);
            }
            proPanel.updateQueues(allProcesses, proPanelReadyFallback());
        });
    }

    private List<Process> proPanelReadyFallback() {
        if (allProcesses == null) {
            return Collections.emptyList();
        }
        return allProcesses.stream()
                .filter(p -> p.getState() == model.ProcessState.READY)
                .toList();
    }
}
