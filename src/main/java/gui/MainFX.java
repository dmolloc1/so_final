package gui;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.stage.Stage;
import javafx.scene.Scene;
import javafx.scene.layout.VBox;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.stage.FileChooser;
import javafx.scene.control.Separator;
import javafx.scene.control.TextArea;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import modules.gui.MemoryTable;
import utils.Logger;

import java.io.File;
import java.util.stream.Collectors;

public class MainFX extends Application {

  private File configFile = new File("src/main/resources/data/config.txt");
  private File processFile = new File("src/main/resources/data/procesos.txt");

  @Override
  public void start(Stage stage) {
    stage.setTitle("Simulador de Sistema Operativo");

    Label labelConfig = new Label("Config: " + configFile.getName());
    Label labelProcess = new Label("Procesos: " + processFile.getName());
    Label labelStatus = new Label("Archivos cargados. Presiona 'Iniciar' para comenzar.");

    MemoryTable memoryTable = new MemoryTable();
    TextArea logArea = new TextArea();
    logArea.setEditable(false);
    logArea.setPrefRowCount(10);
    logArea.setWrapText(true);

    Button btnConfig = new Button("Cambiar archivo de configuración");
    Button btnProcess = new Button("Cambiar archivo de procesos");
    Button btnRun = new Button("Iniciar simulación");

    btnConfig.setOnAction(e -> {
      File newFile = openFile(stage);
      if (newFile != null) {
        configFile = newFile;
        labelConfig.setText("Config: " + configFile.getName());
        labelStatus.setText("Configuración actualizada");
      }
    });

    btnProcess.setOnAction(e -> {
      File newFile = openFile(stage);
      if (newFile != null) {
        processFile = newFile;
        labelProcess.setText("Procesos: " + processFile.getName());
        labelStatus.setText("Archivo de procesos actualizado");
      }
    });

    btnRun.setOnAction(e -> {
      if (!configFile.exists() || !processFile.exists()) {
        labelStatus.setText("Error: Los archivos no existen en las rutas especificadas");
        return;
      }

      btnRun.setDisable(true);
      labelStatus.setText("Ejecutando simulación...");
      Logger.clear();

      new Thread(() -> {
        try {
          SimulationRunner.SimulationResult result = SimulationRunner.runSimulation(
            configFile.getAbsolutePath(),
            processFile.getAbsolutePath()
          );

          Platform.runLater(() -> {
            memoryTable.updateFromMemoryManager(result.memoryManager());
            logArea.setText(
              Logger.getAllLogs().stream()
                .map(Object::toString)
                .collect(Collectors.joining("\n"))
            );
            logArea.positionCaret(logArea.getText().length());
            labelStatus.setText("Simulación completada (panel actualizado)");
          });

        } catch (Exception ex) {
          Platform.runLater(() -> labelStatus.setText("Error: " + ex.getMessage()));
          ex.printStackTrace();
        } finally {
          Platform.runLater(() -> btnRun.setDisable(false));
        }
      }).start();
    });

    HBox selectors = new HBox(10, btnConfig, btnProcess, btnRun);
    VBox.setVgrow(memoryTable, Priority.ALWAYS);
    VBox.setVgrow(logArea, Priority.ALWAYS);

    VBox root = new VBox(12,
        labelConfig,
        labelProcess,
        selectors,
        labelStatus,
        new Separator(),
        memoryTable,
        new Label("Logs en tiempo real"),
        logArea
    );
    root.setStyle("-fx-padding: 20; -fx-font-size: 14px; -fx-background-color: #f6f6f8;");
    stage.setScene(new Scene(root, 900, 600));

    stage.show();
  }

  private File openFile(Stage stage) {
    FileChooser fc = new FileChooser();
    fc.getExtensionFilters().addAll(
      new FileChooser.ExtensionFilter("Archivos de texto", "*.txt"),
      new FileChooser.ExtensionFilter("Todos los archivos", "*.*")
    );
    return fc.showOpenDialog(stage);
  }

  public static void main(String[] args) {
    launch(args);
  }
}