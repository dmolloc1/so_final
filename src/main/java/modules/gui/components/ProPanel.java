package modules.gui.components;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import model.Process;
import model.ProcessState;

import java.util.List;
import java.util.stream.Collectors;
public class ProPanel  extends VBox {

    private final VBox readyList;
    private final VBox blockedIOList;
    private final VBox blockedMemoryList;

    public ProPanel() {
        setSpacing(10);
        setPadding(new Insets(16));
        getStyleClass().add("card");

        Label title = new Label("Colas de Procesos");
        title.getStyleClass().add("card-title");

        HBox queues = new HBox(12);
        queues.setAlignment(Pos.TOP_LEFT);

        readyList = createQueueColumn("Ready");
        blockedIOList = createQueueColumn("Blocked (I/O)");
        blockedMemoryList = createQueueColumn("Blocked (Memory)");

        queues.getChildren().addAll(readyList, blockedIOList, blockedMemoryList);
        HBox.setHgrow(readyList, Priority.ALWAYS);
        HBox.setHgrow(blockedIOList, Priority.ALWAYS);
        HBox.setHgrow(blockedMemoryList, Priority.ALWAYS);

        getChildren().addAll(title, queues);
    }

    private VBox createQueueColumn(String label) {
        VBox column = new VBox(10);
        column.setAlignment(Pos.TOP_LEFT);

        Label title = new Label(label);
        title.getStyleClass().add("queue-title");

        VBox list = new VBox(8);
        list.getStyleClass().add("queue-container");
        list.setFillWidth(true);

        column.getChildren().addAll(title, list);
        VBox.setVgrow(list, Priority.ALWAYS);
        return column;
    }

    public void updateQueues(List<Process> allProcesses, List<Process> readyProcesses) {
        renderList((VBox) readyList.getChildren().get(1), readyProcesses, "pill-primary");

        List<Process> blockedIO = filterByState(allProcesses, ProcessState.BLOCKED_IO);
        List<Process> blockedMem = filterByState(allProcesses, ProcessState.BLOCKED_MEMORY);

        renderList((VBox) blockedIOList.getChildren().get(1), blockedIO, "pill-warning");
        renderList((VBox) blockedMemoryList.getChildren().get(1), blockedMem, "pill-danger");
    }

    private void renderList(VBox container, List<Process> processes, String pillStyle) {
        container.getChildren().clear();

        if (processes.isEmpty()) {
            Label placeholder = new Label("Sin procesos");
            placeholder.getStyleClass().add("placeholder-text");
            container.getChildren().add(placeholder);
            return;
        }

        for (Process process : processes) {
            container.getChildren().add(new ProcessBadge(process.getPid(), pillStyle));
        }
    }

    private List<Process> filterByState(List<Process> all, ProcessState state) {
        return all.stream()
                .filter(p -> p.getState() == state)
                .collect(Collectors.toList());
    }
}
