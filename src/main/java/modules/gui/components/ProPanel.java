package modules.gui.components;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.RowConstraints;
import javafx.scene.layout.VBox;
import javafx.scene.layout.FlowPane;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import model.Process;

import java.util.List;
import java.util.function.Supplier;
public class ProPanel  extends VBox {

    private final FlowPane readyList = createQueuePane();
    private final FlowPane blockedIOList = createQueuePane();
    private final FlowPane blockedMemList = createQueuePane();

    public ProPanel() {
        setSpacing(10);
        setPadding(new Insets(16));
        getStyleClass().add("card");

        Label title = new Label("Colas de Procesos");
        title.getStyleClass().add("card-title");

        GridPane grid = new GridPane();
        grid.setHgap(16);
        grid.setVgap(12);

        ColumnConstraints c1 = new ColumnConstraints();
        ColumnConstraints c2 = new ColumnConstraints();
        ColumnConstraints c3 = new ColumnConstraints();
        c1.setPercentWidth(33.3);
        c2.setPercentWidth(33.3);
        c3.setPercentWidth(33.3);
        grid.getColumnConstraints().addAll(c1, c2, c3);

        RowConstraints row = new RowConstraints();
        row.setPercentHeight(100);
        grid.getRowConstraints().add(row);

        grid.add(createQueueColumn("Ready", readyList), 0, 0);
        grid.add(createQueueColumn("Blocked (I/O)", blockedIOList), 1, 0);
        grid.add(createQueueColumn("Blocked (Memory)", blockedMemList), 2, 0);

        // Datos de ejemplo para que la UI muestre contenido inicial
        setQueues(
                List.of("P1", "P4"),
                List.of("P3"),
                List.of("P8")
        );

        getChildren().addAll(title, grid);
    }

    private FlowPane createQueuePane() {
        FlowPane pane = new FlowPane();
        pane.setHgap(10);
        pane.setVgap(10);
        pane.setPrefWrapLength(220);
        return pane;
    }

    private VBox createQueueColumn(String label, FlowPane content) {
        VBox box = new VBox(8);
        box.getStyleClass().add("queue-column");
        Label title = new Label(label);
        title.getStyleClass().add("queue-title");
        box.getChildren().addAll(title, content);
        return box;
    }

    private void setQueues(List<String> ready, List<String> blockedIO, List<String> blockedMem) {
        populateQueue(readyList, ready, () -> createChip("P", Color.web("#725bff")));
        populateQueue(blockedIOList, blockedIO, () -> createChip("IO", Color.web("#fbbf24")));
        populateQueue(blockedMemList, blockedMem, () -> createChip("MEM", Color.web("#f43f5e")));
    }

    public void updateQueues(List<Process> ready, List<Process> blockedIO, List<Process> blockedMem) {
        List<Process> safeReady = ready != null ? ready : List.of();
        List<Process> safeIO = blockedIO != null ? blockedIO : List.of();
        List<Process> safeMem = blockedMem != null ? blockedMem : List.of();

        populateQueue(readyList, safeReady.stream().map(Process::getPid).toList(),
                () -> createChip("P", Color.web("#725bff")));
        populateQueue(blockedIOList, safeIO.stream().map(Process::getPid).toList(),
                () -> createChip("IO", Color.web("#fbbf24")));
        populateQueue(blockedMemList, safeMem.stream().map(Process::getPid).toList(),
                () -> createChip("MEM", Color.web("#f43f5e")));
    }

    private void populateQueue(FlowPane pane, List<String> items, Supplier<HBox> chipFactory) {
        pane.getChildren().clear();
        if (items == null || items.isEmpty()) {
            Label empty = new Label("Sin procesos");
            empty.getStyleClass().add("placeholder-text");
            pane.getChildren().add(empty);
            return;
        }

        for (String pid : items) {
            HBox chip = chipFactory.get();
            Label label = new Label(pid);
            label.getStyleClass().add("queue-chip-text");
            chip.getChildren().add(label);
            pane.getChildren().add(chip);
        }
    }

    private HBox createChip(String iconText, Color color) {
        Circle circle = new Circle(14, color);
        circle.setOpacity(0.16);

        Label icon = new Label(iconText);
        icon.getStyleClass().add("queue-chip-icon");

        StackIcon iconWrapper = new StackIcon(circle, icon);

        HBox chip = new HBox(10, iconWrapper);
        chip.setAlignment(Pos.CENTER_LEFT);
        chip.getStyleClass().add("queue-chip");

        return chip;
    }

    private static class StackIcon extends HBox {
        StackIcon(Circle circle, Label icon) {
            super(circle, icon);
            setAlignment(Pos.CENTER);
            setSpacing(-20);
            getStyleClass().add("queue-chip-icon-wrapper");
            HBox.setHgrow(icon, Priority.NEVER);
        }
    }
}
