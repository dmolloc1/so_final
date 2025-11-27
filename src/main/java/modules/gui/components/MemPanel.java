package modules.gui.components;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.util.Duration;
import modules.gui.SimulationContext;
import modules.memory.MemoryManager;
import modules.memory.MemoryManager.MemorySnapshot;
import modules.memory.MemoryManager.MemorySnapshot.FrameState;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class MemPanel extends VBox {

    private final Label faultsLabel = new Label("0");
    private final Label hitsLabel = new Label("0");
    private final Label algorithmLabel = new Label("-");

    private final TableView<FrameRow> table = new TableView<>();
    private MemoryGrid grid;
    private VBox gridWrapper;

    public MemPanel() {
        setSpacing(12);
        setPadding(new Insets(16));
        getStyleClass().add("card");

        Label title = new Label("Panel de Memoria Virtual");
        title.getStyleClass().add("card-title");

        HBox statsRow = buildStatsRow();
        GridPane contentGrid = buildContentGrid();

        getChildren().addAll(title, statsRow, contentGrid);

        startAutoRefresh();
    }

    private HBox buildStatsRow() {
        HBox row = new HBox(10);
        row.setAlignment(Pos.CENTER_LEFT);

        row.getChildren().addAll(
                buildMetricCard("Page Faults", faultsLabel, "#f59e0b"),
                buildMetricCard("TLB Hits", hitsLabel, "#22c55e"),
                buildMetricCard("Algoritmo", algorithmLabel, "#e5e7eb")
        );

        return row;
    }

    private VBox buildMetricCard(String label, Label valueLabel, String accentColor) {
        VBox box = new VBox(6);
        box.getStyleClass().add("card-grid");
        box.setPadding(new Insets(10));
        box.setStyle("-fx-background-color: rgba(255,255,255,0.04); -fx-background-radius: 12;");

        Label subtitle = new Label(label);
        subtitle.getStyleClass().add("card-subtitle");

        valueLabel.setStyle("-fx-text-fill: " + accentColor + "; -fx-font-size: 18px; -fx-font-weight: 800;");

        box.getChildren().addAll(subtitle, valueLabel);
        return box;
    }

    private GridPane buildContentGrid() {
        GridPane gridPane = new GridPane();
        gridPane.setHgap(12);
        gridPane.setVgap(12);

        ColumnConstraints c1 = new ColumnConstraints();
        c1.setPercentWidth(45);
        ColumnConstraints c2 = new ColumnConstraints();
        c2.setPercentWidth(55);
        gridPane.getColumnConstraints().addAll(c1, c2);

        grid = new MemoryGrid(10);
        VBox.setVgrow(grid, Priority.ALWAYS);

        gridWrapper = new VBox(grid);
        gridWrapper.setAlignment(Pos.CENTER);
        gridWrapper.setSpacing(6);

        configureTable();

        gridPane.add(gridWrapper, 0, 0);
        gridPane.add(table, 1, 0);

        return gridPane;
    }

    private void configureTable() {
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        table.setPlaceholder(new Label("Esperando datos de memoria..."));

        TableColumn<FrameRow, Integer> frameCol = new TableColumn<>("Frame #");
        frameCol.setCellValueFactory(new PropertyValueFactory<>("index"));

        TableColumn<FrameRow, String> pidCol = new TableColumn<>("Process ID");
        pidCol.setCellValueFactory(new PropertyValueFactory<>("processId"));

        TableColumn<FrameRow, String> pageCol = new TableColumn<>("Page #");
        pageCol.setCellValueFactory(new PropertyValueFactory<>("pageNumber"));

        TableColumn<FrameRow, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        table.getColumns().addAll(frameCol, pidCol, pageCol, statusCol);

        table.setRowFactory(tv -> new TableRow<>() {
            @Override
            protected void updateItem(FrameRow item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setStyle("");
                    return;
                }

                String bgColor = switch (item.getStatus()) {
                    case "Replaced" -> "rgba(244,63,94,0.18)";
                    case "Page Fault" -> "rgba(245,158,11,0.18)";
                    case "Loaded" -> "rgba(34,197,94,0.14)";
                    default -> "rgba(255,255,255,0.04)";
                };
                setStyle("-fx-background-color: " + bgColor + "; -fx-text-fill: #e5e7eb;");
            }
        });
    }

    private void startAutoRefresh() {
        Timeline timeline = new Timeline(
                new KeyFrame(Duration.seconds(0.6), e -> refreshFromContext())
        );
        timeline.setCycleCount(Timeline.INDEFINITE);
        timeline.play();
    }

    private void refreshFromContext() {
        MemoryManager manager = SimulationContext.getMemoryManager();
        if (manager == null) {
            return;
        }

        MemorySnapshot snapshot = manager.captureSnapshot();
        updateMetrics(snapshot, manager.getAlgorithmName());
        updateGrid(snapshot);
        updateTable(snapshot);
    }

    private void updateMetrics(MemorySnapshot snapshot, String algorithm) {
        faultsLabel.setText(String.valueOf(snapshot.getPageFaults()));
        int hits = Math.max(0, snapshot.getTotalAccesses() - snapshot.getPageFaults());
        hitsLabel.setText(String.valueOf(hits));
        algorithmLabel.setText(algorithm);
    }

    private void updateGrid(MemorySnapshot snapshot) {
        if (grid == null || snapshot.getTotalFrames() != grid.getFrameCount()) {
            grid = new MemoryGrid(snapshot.getTotalFrames());
            VBox.setVgrow(grid, Priority.ALWAYS);
            gridWrapper.getChildren().setAll(grid);
        }

        List<String> contents = new ArrayList<>();
        for (FrameState state : snapshot.getFrames()) {
            if (state.occupied()) {
                contents.add(state.processId() + " Pg " + state.pageNumber());
            } else {
                contents.add(null);
            }
        }

        grid.updateFrames(contents, snapshot.getLastPageIn(), snapshot.getLastPageOut());
    }

    private void updateTable(MemorySnapshot snapshot) {
        List<FrameRow> rows = new ArrayList<>();

        for (FrameState state : snapshot.getFrames()) {
            String status = computeStatus(state, snapshot);
            rows.add(new FrameRow(
                    state.index(),
                    state.occupied() ? state.processId() : "Free",
                    state.occupied() ? String.valueOf(state.pageNumber()) : "-",
                    status
            ));
        }

        table.getItems().setAll(rows);
    }

    private String computeStatus(FrameState state, MemorySnapshot snapshot) {
        if (!state.occupied()) {
            return "Empty";
        }

        if (state.index() == snapshot.getLastPageOut()) {
            return "Replaced";
        }

        if (state.index() == snapshot.getLastPageIn()) {
            return "Page Fault";
        }

        return "Loaded";
    }

    public static class FrameRow {
        private final int index;
        private final String processId;
        private final String pageNumber;
        private final String status;

        public FrameRow(int index, String processId, String pageNumber, String status) {
            this.index = index;
            this.processId = Objects.requireNonNullElse(processId, "-");
            this.pageNumber = pageNumber;
            this.status = status;
        }

        public int getIndex() {
            return index;
        }

        public String getProcessId() {
            return processId;
        }

        public String getPageNumber() {
            return pageNumber;
        }

        public String getStatus() {
            return status;
        }
    }
}
