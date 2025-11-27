package gui;

import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Window;
import utils.Logger;

import java.io.File;
import java.util.function.Consumer;

public class DashboardController {

    @FXML private Label configLabel;
    @FXML private Label processLabel;
    @FXML private Label statusLabel;
    @FXML private Label schedulerLabel;
    @FXML private Label replacementLabel;
    @FXML private Label framesLabel;
    @FXML private Label quantumLabel;
    @FXML private Label timeUnitLabel;
    @FXML private Button runButton;
    @FXML private ListView<Logger.LogEntry> logList;
    @FXML private VBox timelineContainer;
    @FXML private ListView<String> readyList;
    @FXML private ListView<String> ioBlockedList;
    @FXML private ListView<String> memoryBlockedList;
    @FXML private TableView<MemoryRow> memoryTable;
    @FXML private TableColumn<MemoryRow, Integer> frameColumn;
    @FXML private TableColumn<MemoryRow, String> processColumn;
    @FXML private TableColumn<MemoryRow, Integer> pageColumn;
    @FXML private TableColumn<MemoryRow, String> statusColumn;

    private final ObservableList<Logger.LogEntry> logItems = FXCollections.observableArrayList();
    private final ObservableList<MemoryRow> memoryItems = FXCollections.observableArrayList();

    private File configFile = new File("src/main/resources/data/config.txt");
    private File processFile = new File("src/main/resources/data/procesos.txt");

    @FXML
    public void initialize() {
        configLabel.setText(configFile.getName());
        processLabel.setText(processFile.getName());

        logList.setItems(logItems);
        logList.setCellFactory(list -> new LogCell());

        frameColumn.setCellValueFactory(new PropertyValueFactory<>("frame"));
        processColumn.setCellValueFactory(new PropertyValueFactory<>("processId"));
        pageColumn.setCellValueFactory(new PropertyValueFactory<>("page"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));
        memoryTable.setItems(memoryItems);

        Logger.addListener(this::handleNewLog);
    }

    @FXML
    private void handleChangeConfig() {
        chooseFile(file -> {
            configFile = file;
            configLabel.setText(file.getName());
            statusLabel.setText("Configuración seleccionada");
        });
    }

    @FXML
    private void handleChangeProcess() {
        chooseFile(file -> {
            processFile = file;
            processLabel.setText(file.getName());
            statusLabel.setText("Archivo de procesos seleccionado");
        });
    }

    @FXML
    private void handleRun() {
        if (!configFile.exists() || !processFile.exists()) {
            statusLabel.setText("Archivos no encontrados en disco");
            return;
        }

        statusLabel.setText("Ejecutando simulación...");
        runButton.setDisable(true);
        logItems.clear();
        memoryItems.clear();

        Task<Void> simulationTask = new Task<>() {
            @Override
            protected Void call() throws Exception {
                SimulationRunner.runSimulation(
                        configFile.getAbsolutePath(),
                        processFile.getAbsolutePath()
                );
                return null;
            }
        };

        simulationTask.setOnSucceeded(e -> {
            statusLabel.setText("Simulación completada");
            runButton.setDisable(false);
        });

        simulationTask.setOnFailed(e -> {
            statusLabel.setText("Error: " + simulationTask.getException().getMessage());
            runButton.setDisable(false);
        });

        Thread thread = new Thread(simulationTask, "simulation-thread");
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void handleClearLog() {
        logItems.clear();
        Logger.clear();
    }

    private void chooseFile(Consumer<File> consumer) {
        FileChooser chooser = new FileChooser();
        chooser.getExtensionFilters().addAll(
                new FileChooser.ExtensionFilter("Archivos de texto", "*.txt"),
                new FileChooser.ExtensionFilter("Todos los archivos", "*.*")
        );
        Window window = statusLabel.getScene() != null ? statusLabel.getScene().getWindow() : null;
        File file = chooser.showOpenDialog(window);
        if (file != null) {
            consumer.accept(file);
        }
    }

    private void handleNewLog(Logger.LogEntry entry) {
        Platform.runLater(() -> {
            logItems.add(entry);
            logList.scrollTo(logItems.size() - 1);
            updateBadges(entry);
        });
    }

    private void updateBadges(Logger.LogEntry entry) {
        String msg = entry.getMessage();
        if (msg.contains("Algoritmo de planificación")) {
            schedulerLabel.setText(msg.substring(msg.indexOf(":") + 1).trim());
        } else if (msg.contains("Algoritmo de reemplazo") || msg.contains("memoria:")) {
            replacementLabel.setText(msg.substring(msg.indexOf(":") + 1).trim());
        } else if (msg.contains("Marcos de memoria")) {
            framesLabel.setText(msg.replaceAll("[^0-9]+", ""));
        } else if (msg.contains("Quantum")) {
            quantumLabel.setText(msg.replaceAll("[^0-9]+", ""));
        } else if (msg.contains("Unidad de tiempo")) {
            timeUnitLabel.setText(msg.replace("Unidad de tiempo:", "").trim());
        } else if (msg.startsWith("EJECUTANDO")) {
            addTimelineEntry(entry);
        }
    }

    private void addTimelineEntry(Logger.LogEntry entry) {
        Label label = new Label(entry.toString());
        label.setStyle("-fx-background-color: #e0e7ff; -fx-padding: 6 10; -fx-background-radius: 8;");
        HBox box = new HBox(label);
        timelineContainer.getChildren().add(box);
    }

    public static class MemoryRow {
        private final int frame;
        private final String processId;
        private final int page;
        private final String status;

        public MemoryRow(int frame, String processId, int page, String status) {
            this.frame = frame;
            this.processId = processId;
            this.page = page;
            this.status = status;
        }

        public int getFrame() { return frame; }
        public String getProcessId() { return processId; }
        public int getPage() { return page; }
        public String getStatus() { return status; }
    }

    private static class LogCell extends ListCell<Logger.LogEntry> {
        @Override
        protected void updateItem(Logger.LogEntry item, boolean empty) {
            super.updateItem(item, empty);
            if (empty || item == null) {
                setText(null);
                setStyle("");
            } else {
                setText(item.toString());
                String color = switch (item.getLevel()) {
                    case ERROR -> "#ef4444";
                    case WARNING -> "#f59e0b";
                    case DEBUG -> "#6b7280";
                    case EVENT -> "#10b981";
                    default -> "#111827";
                };
                setStyle("-fx-text-fill: " + color + "; -fx-font-family: 'Consolas';");
            }
        }
    }
}
