package modules.gui;

import javafx.beans.property.ReadOnlyObjectWrapper;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.layout.BorderStroke;
import javafx.scene.layout.BorderStrokeStyle;
import javafx.scene.layout.BorderWidths;
import javafx.scene.layout.CornerRadii;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import modules.memory.MemoryManager;
import modules.memory.MemoryManager.FrameStatus;
import modules.memory.MemoryManager.MemoryFrameInfo;

/**
 * Panel de visualización de memoria virtual.
 * Muestra métricas básicas y la tabla de marcos actualizada
 * a partir del MemoryManager utilizado en la simulación.
 */
public class MemoryTable extends VBox {

    private final Label pageFaultsLabel = createMetricLabel();
    private final Label replacementsLabel = createMetricLabel();
    private final Label tlbHitsLabel = createMetricLabel();
    private final Label algorithmLabel = createMetricLabel();

    private final TableView<MemoryFrameInfo> tableView = new TableView<>();

    public MemoryTable() {
        setSpacing(12);
        setPadding(new Insets(12));
        setBorder(new javafx.scene.layout.Border(new BorderStroke(
                Color.rgb(41, 35, 72, 0.35),
                BorderStrokeStyle.SOLID,
                new CornerRadii(10),
                new BorderWidths(1)
        )));
        getChildren().add(buildHeader());
        getChildren().add(buildSummary());
        configureTable();
        getChildren().add(tableView);
    }

    private Label createMetricLabel() {
        Label label = new Label("0");
        label.setFont(Font.font("Inter", 20));
        return label;
    }

    private VBox buildHeader() {
        Label title = new Label("Panel de Memoria Virtual");
        title.setFont(Font.font("Inter", 18));
        title.setTextFill(Color.web("#1C1B1F"));

        VBox container = new VBox(title);
        container.setSpacing(4);
        return container;
    }

    private HBox buildSummary() {
        HBox summary = new HBox(
                buildMetricCard("Page Faults", pageFaultsLabel, Color.web("#f59e0b")),
                buildMetricCard("TLB Hits", tlbHitsLabel, Color.web("#10b981")),
                buildMetricCard("Algoritmo", algorithmLabel, Color.web("#4b5563")),
                buildMetricCard("Reemplazos", replacementsLabel, Color.web("#6366f1"))
        );
        summary.setSpacing(12);
        summary.setAlignment(Pos.CENTER_LEFT);
        return summary;
    }

    private VBox buildMetricCard(String title, Label valueLabel, Color tint) {
        Label titleLabel = new Label(title);
        titleLabel.setTextFill(Color.web("#6b7280"));
        titleLabel.setFont(Font.font("Inter", 12));

        valueLabel.setTextFill(tint);
        valueLabel.setFont(Font.font("Inter", 22));

        VBox card = new VBox(titleLabel, valueLabel);
        card.setSpacing(4);
        card.setPadding(new Insets(10));
        card.setStyle("-fx-background-color: rgba(41,35,72,0.06); -fx-background-radius: 10px;");
        return card;
    }

    private void configureTable() {
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableView.setPrefHeight(260);

        TableColumn<MemoryFrameInfo, Number> frameCol = new TableColumn<>("Frame #");
        frameCol.setCellValueFactory(data -> new ReadOnlyObjectWrapper<>(data.getValue().getFrameIndex()));

        TableColumn<MemoryFrameInfo, String> pidCol = new TableColumn<>("Process ID");
        pidCol.setCellValueFactory(data -> new ReadOnlyObjectWrapper<>(data.getValue().getProcessId()));

        TableColumn<MemoryFrameInfo, Number> pageCol = new TableColumn<>("Page #");
        pageCol.setCellValueFactory(data -> new ReadOnlyObjectWrapper<>(data.getValue().getPageNumber()));

        TableColumn<MemoryFrameInfo, FrameStatus> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(data -> new ReadOnlyObjectWrapper<>(data.getValue().getStatus()));
        statusCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(FrameStatus status, boolean empty) {
                super.updateItem(status, empty);
                if (empty || status == null) {
                    setText(null);
                    setGraphic(null);
                    return;
                }
                Label pill = new Label();
                pill.setPadding(new Insets(4, 8, 4, 8));
                pill.setFont(Font.font("Inter", 12));
                pill.setText(statusLabel(status));
                pill.setTextFill(colorFor(status));
                pill.setStyle("-fx-background-radius: 12px; -fx-background-color: " + bgFor(status) + ";");
                setGraphic(pill);
                setText(null);
            }
        });

        tableView.getColumns().addAll(frameCol, pidCol, pageCol, statusCol);
        tableView.setRowFactory(tv -> new TableRow<>() {
            @Override
            protected void updateItem(MemoryFrameInfo item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setStyle("");
                    return;
                }

                if (item.getStatus() == FrameStatus.PAGE_FAULT) {
                    setStyle("-fx-background-color: rgba(245,158,11,0.15);");
                } else if (item.getStatus() == FrameStatus.REPLACED) {
                    setStyle("-fx-background-color: rgba(244,63,94,0.18);");
                } else if (item.getStatus() == FrameStatus.LOADED) {
                    setStyle("-fx-background-color: rgba(16,185,129,0.12);");
                } else {
                    setStyle("-fx-background-color: transparent;");
                }
            }
        });
    }

    private String statusLabel(FrameStatus status) {
        return switch (status) {
            case PAGE_FAULT -> "Page Fault";
            case REPLACED -> "Replaced";
            case LOADED -> "Loaded";
            default -> "Empty";
        };
    }

    private Color colorFor(FrameStatus status) {
        return switch (status) {
            case PAGE_FAULT -> Color.web("#d97706");
            case REPLACED -> Color.web("#e11d48");
            case LOADED -> Color.web("#059669");
            default -> Color.web("#6b7280");
        };
    }

    private String bgFor(FrameStatus status) {
        return switch (status) {
            case PAGE_FAULT -> "rgba(245,158,11,0.22)";
            case REPLACED -> "rgba(244,63,94,0.22)";
            case LOADED -> "rgba(16,185,129,0.16)";
            default -> "rgba(107,114,128,0.14)";
        };
    }

    /**
     * Actualiza la vista con el estado actual del MemoryManager.
     */
    public void updateFromMemoryManager(MemoryManager memoryManager) {
        pageFaultsLabel.setText(String.valueOf(memoryManager.getPageFaults()));
        replacementsLabel.setText(String.valueOf(memoryManager.getPageReplacements()));
        algorithmLabel.setText(memoryManager.getAlgorithmName());

        int estimatedTlbHits = Math.max(0, memoryManager.getTotalPageLoads() - memoryManager.getPageFaults());
        tlbHitsLabel.setText(String.valueOf(estimatedTlbHits));

        ObservableList<MemoryFrameInfo> items = FXCollections.observableArrayList(memoryManager.getFrameSnapshot());
        tableView.setItems(items);
    }
}
