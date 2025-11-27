package gui.pages;

import gui.SimulationRunner;
import java.io.File;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
<<<<<<< HEAD
import javafx.scene.control.*;
import javafx.scene.layout.*;
=======
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.Separator;
import javafx.scene.control.TextField;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
import javafx.stage.FileChooser;
import javafx.stage.Stage;

public class ConfigPage extends VBox {

<<<<<<< HEAD
    private File configFile = new File("src/main/resources/data/config.txt");
    private File processFile = new File("src/main/resources/data/procesos.txt");

    private final Label labelConfig = new Label();
    private final Label labelProcess = new Label();
    private final Label labelStatus = new Label();

    public ConfigPage(Stage stage) {
        setSpacing(20);
        setPadding(new Insets(20));
        setAlignment(Pos.TOP_LEFT);
        getStyleClass().add("page-container");

        labelConfig.setText("Config: " + configFile.getName());
        labelProcess.setText("Procesos: " + processFile.getName());
        labelStatus.setText("Listo para iniciar");

        VBox sectionFiles = buildFileSection(stage);
        VBox sectionCPU = buildCpuSection();
        VBox sectionMemory = buildMemorySection();
        Button startButton = buildStartButton();

        getChildren().addAll(
                sectionFiles,
                sectionCPU,
                sectionMemory,
                startButton,
                labelStatus
        );
    }

    private VBox buildFileSection(Stage stage) {
        VBox box = new VBox(10);

        Label title = new Label("Load Input Files");
        title.setStyle("-fx-font-weight: bold; -fx-font-size: 14px;");
        Label subtitle = new Label("Selecciona archivos de configuración y procesos.");

        Button btnConfig = new Button("Cargar archivo de configuración");
        Button btnProcess = new Button("Cargar archivo de procesos");

        btnConfig.setOnAction(e -> {
            File f = openFile(stage);
            if (f != null) {
                configFile = f;
                labelConfig.setText("Config: " + f.getName());
            }
        });

        btnProcess.setOnAction(e -> {
            File f = openFile(stage);
            if (f != null) {
                processFile = f;
                labelProcess.setText("Procesos: " + f.getName());
            }
        });

        box.getChildren().addAll(
                title,
                subtitle,
                new HBox(10, labelConfig, btnConfig),
                new HBox(10, labelProcess, btnProcess)
        );

        return box;
    }

    private VBox buildCpuSection() {
        VBox box = new VBox(10);

        Label title = new Label("Configuración de Algoritmo de Planificación CPU");
        title.setStyle("-fx-font-weight: bold; -fx-font-size: 14px;");
        Label subtitle = new Label("Selecciona el algoritmo para la simulación.");

        ComboBox<String> schedulerCombo = new ComboBox<>();
        schedulerCombo.getItems().addAll("FCFS", "RR", "SJF");
        schedulerCombo.getSelectionModel().select("FCFS");

        box.getChildren().addAll(
                title,
                subtitle,
                new HBox(10, new Label("Scheduler:"), schedulerCombo)
        );

        return box;
    }

    private VBox buildMemorySection() {
        VBox box = new VBox(10);

        Label title = new Label("Configuración de Memoria");
        title.setStyle("-fx-font-weight: bold; -fx-font-size: 14px;");
        Label subtitle = new Label("Selecciona el algoritmo de reemplazo.");

        ComboBox<String> replaceCombo = new ComboBox<>();
        replaceCombo.getItems().addAll("FIFO", "LRU", "OPTIMAL");
        replaceCombo.getSelectionModel().select("FIFO");

        box.getChildren().addAll(
                title,
                subtitle,
                new HBox(10, new Label("Replacement:"), replaceCombo)
        );

        return box;
    }

    private Button buildStartButton() {
        Button btn = new Button("Start Simulation");
        btn.setStyle("-fx-background-color: #4CAF50; -fx-text-fill: white; -fx-font-weight: bold;");
        btn.setOnAction(e -> runSimulation(labelStatus));
        return btn;
    }

    private File openFile(Stage stage) {
        FileChooser fc = new FileChooser();
        fc.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("TXT files", "*.txt")
        );

        File initialDir = new File("src/main/resources/data");
        if(initialDir.exists()) {
            fc.setInitialDirectory(initialDir);
        }
        return fc.showOpenDialog(stage);
    }

    private void runSimulation(Label status) {
        try {
            SimulationRunner.runSimulation(
                    configFile.getAbsolutePath(),
                    processFile.getAbsolutePath()
            );
            status.setText("Simulación completada.");
        } catch (Exception ex) {
            status.setText("Error: " + ex.getMessage());
            ex.printStackTrace();
        }
    }
}
=======
  private File configFile = new File("src/main/resources/data/config.txt");
  private File processFile = new File("src/main/resources/data/procesos.txt");

  public ConfigPage(Stage stage) {
    setSpacing(18);
    setPadding(new Insets(10));
    getStyleClass().add("page-container");

    Label title = new Label("Simulation Configuration");
    title.getStyleClass().add("page-title");

    Label description = new Label(
      "Prepara la simulación cargando archivos y ajustando parámetros principales."
    );
    description.getStyleClass().add("page-subtitle");

    VBox filesCard = createFileCard(stage);
    VBox cpuCard = createCpuCard();
    VBox memoryCard = createMemoryCard();
    VBox systemCard = createSystemCard();

    Label statusLabel = new Label(
      "Archivos cargados. Presiona 'Iniciar simulación' para comenzar."
    );
    statusLabel.getStyleClass().add("status-text");

    Button runButton = new Button("Iniciar simulación");
    runButton.getStyleClass().add("primary-button");
    runButton.setMaxWidth(Double.MAX_VALUE);
    runButton.setOnAction(e -> runSimulation(statusLabel));

    getChildren().addAll(
      new VBox(6, title, description),
      filesCard,
      cpuCard,
      memoryCard,
      systemCard,
      runButton,
      statusLabel
    );
  }

  private VBox createFileCard(Stage stage) {
    Label cardTitle = new Label("Load Input Files");
    cardTitle.getStyleClass().add("card-title");

    Label cardSubtitle = new Label(
      "Arrastra y suelta o selecciona tus archivos de procesos y configuración."
    );
    cardSubtitle.getStyleClass().add("card-subtitle");

    VBox dropZone = new VBox();
    dropZone.setAlignment(Pos.CENTER);
    dropZone.setSpacing(8);
    dropZone.setPadding(new Insets(22));
    dropZone.getStyleClass().add("upload-zone");

    Label cloud = new Label("☁");
    cloud.getStyleClass().add("upload-icon");
    Label dropText = new Label("Suelta archivos aquí o usa los botones de exploración.");
    dropText.getStyleClass().add("helper-text");

    HBox fileButtons = new HBox(10);
    fileButtons.setAlignment(Pos.CENTER);
    Button browseConfig = new Button("Configurar archivo");
    browseConfig.getStyleClass().add("secondary-button");
    browseConfig.setOnAction(e -> chooseConfig(stage, cardSubtitle));

    Button browseProcesses = new Button("Procesos");
    browseProcesses.getStyleClass().add("secondary-button");
    browseProcesses.setOnAction(e -> chooseProcesses(stage, cardSubtitle));

    fileButtons.getChildren().addAll(browseConfig, browseProcesses);
    dropZone.getChildren().addAll(cloud, dropText, fileButtons);

    HBox chipRow = new HBox(10);
    chipRow.setAlignment(Pos.CENTER_LEFT);
    Label configChip = new Label(configFile.getName());
    configChip.getStyleClass().add("file-chip");
    Label processChip = new Label(processFile.getName());
    processChip.getStyleClass().add("file-chip");
    chipRow.getChildren().addAll(configChip, processChip);

    VBox card = new VBox(12, cardTitle, cardSubtitle, dropZone, chipRow);
    card.getStyleClass().add("card");
    return card;
  }

  private VBox createCpuCard() {
    Label cardTitle = new Label("CPU Settings");
    cardTitle.getStyleClass().add("card-title");
    Label cardSubtitle = new Label(
      "Configura la planificación del procesador y parámetros relacionados."
    );
    cardSubtitle.getStyleClass().add("card-subtitle");

    ComboBox<String> schedulerCombo = new ComboBox<>();
    schedulerCombo.getItems().addAll("FCFS", "Round Robin", "SJF");
    schedulerCombo.getSelectionModel().selectFirst();
    schedulerCombo.getStyleClass().add("input-control");

    TextField quantumField = new TextField("10");
    quantumField.getStyleClass().add("input-control");

    GridPane grid = new GridPane();
    grid.setHgap(14);
    grid.setVgap(12);
    ColumnConstraints col = new ColumnConstraints();
    col.setHgrow(Priority.ALWAYS);
    grid.getColumnConstraints().addAll(col, col);

    grid.add(new Label("Algoritmo"), 0, 0);
    grid.add(schedulerCombo, 0, 1);
    grid.add(new Label("Quantum (RR)"), 1, 0);
    grid.add(quantumField, 1, 1);

    grid.getStyleClass().add("card-grid");

    VBox card = new VBox(10, cardTitle, cardSubtitle, new Separator(), grid);
    card.getStyleClass().add("card");
    return card;
  }

  private VBox createMemoryCard() {
    Label cardTitle = new Label("Memory Settings");
    cardTitle.getStyleClass().add("card-title");
    Label cardSubtitle = new Label(
      "Define la cantidad de marcos y el algoritmo de reemplazo de páginas."
    );
    cardSubtitle.getStyleClass().add("card-subtitle");

    TextField frameCount = new TextField("64");
    frameCount.getStyleClass().add("input-control");

    TextField frameSize = new TextField("4");
    frameSize.getStyleClass().add("input-control");

    ComboBox<String> replacement = new ComboBox<>();
    replacement.getItems().addAll("FIFO", "LRU", "Óptimo");
    replacement.getSelectionModel().selectFirst();
    replacement.getStyleClass().add("input-control");

    GridPane grid = new GridPane();
    grid.setHgap(14);
    grid.setVgap(12);
    ColumnConstraints col = new ColumnConstraints();
    col.setHgrow(Priority.ALWAYS);
    grid.getColumnConstraints().addAll(col, col, col);

    grid.add(new Label("Número de marcos"), 0, 0);
    grid.add(frameCount, 0, 1);
    grid.add(new Label("Tamaño de marco"), 1, 0);
    grid.add(frameSize, 1, 1);
    grid.add(new Label("Reemplazo"), 2, 0);
    grid.add(replacement, 2, 1);

    grid.getStyleClass().add("card-grid");

    VBox card = new VBox(10, cardTitle, cardSubtitle, new Separator(), grid);
    card.getStyleClass().add("card");
    return card;
  }

  private VBox createSystemCard() {
    Label cardTitle = new Label("System Settings");
    cardTitle.getStyleClass().add("card-title");
    Label cardSubtitle = new Label("Ajusta parámetros generales de la simulación.");
    cardSubtitle.getStyleClass().add("card-subtitle");

    TextField timeUnit = new TextField("1000");
    timeUnit.getStyleClass().add("input-control");

    Button toggleIO = new Button("I/O habilitado");
    toggleIO.getStyleClass().add("ghost-button");
    toggleIO.setOnAction(e -> toggleIOState(toggleIO));

    GridPane grid = new GridPane();
    grid.setHgap(14);
    grid.setVgap(12);
    ColumnConstraints col = new ColumnConstraints();
    col.setHgrow(Priority.ALWAYS);
    grid.getColumnConstraints().addAll(col, col);

    grid.add(new Label("Unidad de tiempo (ms)"), 0, 0);
    grid.add(timeUnit, 0, 1);
    grid.add(new Label("Operaciones de E/S"), 1, 0);
    grid.add(toggleIO, 1, 1);

    grid.getStyleClass().add("card-grid");

    VBox card = new VBox(10, cardTitle, cardSubtitle, new Separator(), grid);
    card.getStyleClass().add("card");
    return card;
  }

  private void toggleIOState(Button toggle) {
    boolean enabled = toggle.getUserData() == null || (boolean) toggle.getUserData();
    if (enabled) {
      toggle.setText("I/O deshabilitado");
      toggle.getStyleClass().add("ghost-button-off");
      toggle.setUserData(false);
    } else {
      toggle.setText("I/O habilitado");
      toggle.getStyleClass().remove("ghost-button-off");
      toggle.setUserData(true);
    }
  }

  private void chooseConfig(Stage stage, Label subtitle) {
    File newFile = openFile(stage);
    if (newFile != null) {
      configFile = newFile;
      subtitle.setText("Archivo de configuración: " + configFile.getName());
    }
  }

  private void chooseProcesses(Stage stage, Label subtitle) {
    File newFile = openFile(stage);
    if (newFile != null) {
      processFile = newFile;
      subtitle.setText("Archivo de procesos: " + processFile.getName());
    }
  }

  private void runSimulation(Label labelStatus) {
    if (!configFile.exists() || !processFile.exists()) {
      labelStatus.setText("Error: Los archivos no existen en las rutas especificadas");
      return;
    }

    try {
      labelStatus.setText("Ejecutando simulación...");
      SimulationRunner.runSimulation(
        configFile.getAbsolutePath(),
        processFile.getAbsolutePath()
      );
      labelStatus.setText("Simulación completada (ver consola)");
    } catch (Exception ex) {
      labelStatus.setText("Error: " + ex.getMessage());
      ex.printStackTrace();
    }
  }

  private File openFile(Stage stage) {
    FileChooser fc = new FileChooser();
    fc.getExtensionFilters().addAll(
      new FileChooser.ExtensionFilter("Archivos de texto", "*.txt"),
      new FileChooser.ExtensionFilter("Todos los archivos", "*.*")
    );
    return fc.showOpenDialog(stage);
  }
}
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
