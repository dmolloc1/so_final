package modules.gui.components;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.layout.Priority;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.util.Duration;
import modules.gui.SimulationContext;
import modules.memory.MemoryManager;
import modules.memory.MemoryManager.MemorySnapshot;
import modules.memory.MemoryManager.MemorySnapshot.FrameState;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class MemPanel extends VBox {

    private final Rectangle healthIndicator = new Rectangle(16, 16);
    private final ComboBox<String> processSelector = new ComboBox<>();
    private final Label statusLabel = new Label("Sin actividad reciente");

    private final TableView<PageRow> pageTable = new TableView<>();
    private final TableView<FrameRow> frameTable = new TableView<>();
    private final Label victimBanner = new Label();

    public MemPanel() {
        setSpacing(14);
        setPadding(new Insets(16));
        getStyleClass().add("card");

        HBox header = buildHeader();
        HBox selectorBar = buildSelectorBar();
        GridPane tables = buildTables();

        getChildren().addAll(header, selectorBar, tables, victimBanner);

        startAutoRefresh();
    }

    private HBox buildHeader() {
        Label title = new Label("Memoria");
        title.getStyleClass().add("card-title");

        healthIndicator.setArcHeight(4);
        healthIndicator.setArcWidth(4);
        healthIndicator.setFill(Color.web("#1ED760"));

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        HBox header = new HBox(10, title, spacer, healthIndicator);
        header.setAlignment(Pos.CENTER_LEFT);
        return header;
    }

    private HBox buildSelectorBar() {
        processSelector.setPromptText("Selecciona un proceso");
        processSelector.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(processSelector, Priority.ALWAYS);

        statusLabel.getStyleClass().add("card-subtitle");

        HBox bar = new HBox(10, processSelector, statusLabel);
        bar.setAlignment(Pos.CENTER_LEFT);
        return bar;
    }

    private GridPane buildTables() {
        configurePageTable();
        configureFrameTable();

        GridPane grid = new GridPane();
        grid.setHgap(14);
        grid.setVgap(8);

        ColumnConstraints left = new ColumnConstraints();
        left.setPercentWidth(50);
        ColumnConstraints right = new ColumnConstraints();
        right.setPercentWidth(50);
        grid.getColumnConstraints().addAll(left, right);

        VBox leftBox = new VBox(8,
                buildSectionTitle("Tabla de Páginas"),
                pageTable
        );

        VBox rightBox = new VBox(8,
                buildSectionTitle("Marcos Físicos"),
                frameTable
        );

        grid.add(leftBox, 0, 0);
        grid.add(rightBox, 1, 0);

        victimBanner.setMinHeight(28);
        victimBanner.setStyle("-fx-background-color: rgba(253, 224, 71, 0.12); -fx-padding: 8 12; -fx-background-radius: 10; -fx-font-weight: 700; -fx-text-fill: #eab308;");
        victimBanner.setVisible(false);

        return grid;
    }

    private Label buildSectionTitle(String text) {
        Label label = new Label(text);
        label.getStyleClass().add("card-subtitle");
        return label;
    }

    private void configurePageTable() {
        pageTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        pageTable.setPlaceholder(new Label("Selecciona un proceso para ver su tabla"));

        TableColumn<PageRow, Integer> pageCol = new TableColumn<>("Página");
        pageCol.setCellValueFactory(new PropertyValueFactory<>("pageNumber"));

        TableColumn<PageRow, String> frameCol = new TableColumn<>("Frame");
        frameCol.setCellValueFactory(new PropertyValueFactory<>("frame"));

        TableColumn<PageRow, String> statusCol = new TableColumn<>("Estado");
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        pageTable.getColumns().addAll(pageCol, frameCol, statusCol);

        pageTable.setRowFactory(tv -> new TableRow<>() {
            @Override
            protected void updateItem(PageRow item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setStyle("");
                    return;
                }

                if (item.isFault()) {
                    setStyle("-fx-background-color: rgba(248,113,113,0.18);");
                } else {
                    setStyle("-fx-background-color: transparent;");
                }
            }
        });
    }

    private void configureFrameTable() {
        frameTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        frameTable.setPlaceholder(new Label("Sin marcos asignados"));

        TableColumn<FrameRow, Integer> frameIndex = new TableColumn<>("Frame");
        frameIndex.setCellValueFactory(new PropertyValueFactory<>("index"));

        TableColumn<FrameRow, String> pageInfo = new TableColumn<>("Página (PID)");
        pageInfo.setCellValueFactory(new PropertyValueFactory<>("pageInfo"));

        TableColumn<FrameRow, String> statusCol = new TableColumn<>("Estado");
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        frameTable.getColumns().addAll(frameIndex, pageInfo, statusCol);

        frameTable.setRowFactory(tv -> new TableRow<>() {
            @Override
            protected void updateItem(FrameRow item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setStyle("");
                    return;
                }

                String bg = switch (item.getStatus()) {
                    case "Victimizado" -> "rgba(251,113,133,0.18)";
                    case "Cargada" -> "rgba(52,211,153,0.18)";
                    case "Libre" -> "rgba(148,163,184,0.10)";
                    default -> "rgba(99,102,241,0.12)";
                };
                setStyle("-fx-background-color: " + bg + ";");
            }
        });
    }

    private void startAutoRefresh() {
        Timeline timeline = new Timeline(new KeyFrame(Duration.seconds(0.6), e -> refreshFromContext()));
        timeline.setCycleCount(Timeline.INDEFINITE);
        timeline.play();
    }

    private void refreshFromContext() {
        MemoryManager manager = SimulationContext.getMemoryManager();
        if (manager == null) {
            return;
        }

        MemorySnapshot snapshot = manager.captureSnapshot();
        String selectedPid = refreshProcessOptions(snapshot);
        updateIndicator(snapshot);
        updateStatus(snapshot);

        if (selectedPid != null) {
            updatePageTable(manager, snapshot, selectedPid);
        } else {
            pageTable.getItems().clear();
        }

        updateFrameTable(snapshot);
        updateVictimBanner(snapshot);
    }

    private String refreshProcessOptions(MemorySnapshot snapshot) {
        Set<String> pids = snapshot.getFrames().stream()
                .map(FrameState::processId)
                .filter(Objects::nonNull)
                .filter(pid -> !pid.isBlank())
                .collect(Collectors.toCollection(TreeSet::new));

        if (snapshot.getLastRequestedPid() != null && !snapshot.getLastRequestedPid().isBlank()) {
            pids.add(snapshot.getLastRequestedPid());
        }

        ObservableList<String> currentItems = processSelector.getItems();
        if (!currentItems.containsAll(pids) || currentItems.size() != pids.size()) {
            processSelector.setItems(FXCollections.observableArrayList(pids));
        }

        String selected = processSelector.getValue();
        if (selected == null || !pids.contains(selected)) {
            selected = pids.stream().findFirst().orElse(null);
            processSelector.setValue(selected);
        }
        return selected;
    }

    private void updateIndicator(MemorySnapshot snapshot) {
        Color color = snapshot.isLastFault() ? Color.web("#fbbf24") : Color.web("#1ED760");
        healthIndicator.setFill(color);
    }

    private void updateStatus(MemorySnapshot snapshot) {
        if (snapshot.getLastRequestedPid() == null || snapshot.getLastRequestedPid().isBlank()) {
            statusLabel.setText("Sin actividad reciente");
            return;
        }

        String base = "Acceso " + snapshot.getLastRequestedPid() + ": página " + snapshot.getLastRequestedPage();
        statusLabel.setText(snapshot.isLastFault() ? base + " (Fault)" : base + " (Hit)");
    }

    private void updatePageTable(MemoryManager manager, MemorySnapshot snapshot, String pid) {
        Map<Integer, Integer> pageToFrame = new HashMap<>();
        for (FrameState state : snapshot.getFrames()) {
            if (state.occupied() && pid.equals(state.processId())) {
                pageToFrame.put(state.pageNumber(), state.index());
            }
        }

        Set<Integer> pages = new HashSet<>(manager.getLoadedPages(pid));
        if (snapshot.getLastRequestedPid() != null && snapshot.getLastRequestedPid().equals(pid) && snapshot.getLastRequestedPage() >= 0) {
            pages.add(snapshot.getLastRequestedPage());
        }

        List<PageRow> rows = new ArrayList<>();
        for (Integer page : pages.stream().sorted().toList()) {
            Integer frameIndex = pageToFrame.get(page);
            boolean fault = !pageToFrame.containsKey(page) && snapshot.isLastFault() && snapshot.getLastRequestedPage() == page && pid.equals(snapshot.getLastRequestedPid());
            String status = fault ? "Fault" : (frameIndex != null ? "Presente" : "No cargada");
            rows.add(new PageRow(page, frameIndex != null ? frameIndex.toString() : "-", status, fault));
        }

        rows.sort(Comparator.comparingInt(PageRow::getPageNumber));
        pageTable.getItems().setAll(rows);
    }

    private void updateFrameTable(MemorySnapshot snapshot) {
        List<FrameRow> rows = new ArrayList<>();

        for (FrameState state : snapshot.getFrames()) {
            String pageInfo;
            if (state.occupied()) {
                pageInfo = "P" + state.pageNumber() + " (" + state.processId() + ")";
            } else {
                pageInfo = "Libre";
            }

            String status;
            if (state.index() == snapshot.getLastPageOut()) {
                status = "Victimizado";
            } else if (state.index() == snapshot.getLastPageIn()) {
                status = "Cargada";
            } else if (!state.occupied()) {
                status = "Libre";
            } else {
                status = "En uso";
            }

            rows.add(new FrameRow(state.index(), pageInfo, status));
        }

        frameTable.getItems().setAll(rows);
    }

    private void updateVictimBanner(MemorySnapshot snapshot) {
        if (snapshot.getLastPageOut() >= 0 && snapshot.getLastPageOut() < snapshot.getFrames().size()) {
            FrameState victim = snapshot.getFrames().get(snapshot.getLastPageOut());
            String text = "Frame " + victim.index() + " victimizado";
            if (victim.processId() != null) {
                text += " (" + victim.processId() + ")";
            }
            victimBanner.setText(text);
            victimBanner.setVisible(true);
        } else {
            victimBanner.setVisible(false);
        }
    }

    public static class PageRow {
        private final int pageNumber;
        private final String frame;
        private final String status;
        private final boolean fault;

        public PageRow(int pageNumber, String frame, String status, boolean fault) {
            this.pageNumber = pageNumber;
            this.frame = frame;
            this.status = status;
            this.fault = fault;
        }

        public int getPageNumber() {
            return pageNumber;
        }

        public String getFrame() {
            return frame;
        }

        public String getStatus() {
            return status;
        }

        public boolean isFault() {
            return fault;
        }
    }

    public static class FrameRow {
        private final int index;
        private final String pageInfo;
        private final String status;

        public FrameRow(int index, String pageInfo, String status) {
            this.index = index;
            this.pageInfo = pageInfo;
            this.status = status;
        }

        public int getIndex() {
            return index;
        }

        public String getPageInfo() {
            return pageInfo;
        }

        public String getStatus() {
            return status;
        }
    }
}
