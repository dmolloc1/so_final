package modules.gui.pages;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import model.DatosResultados;
import model.ResultadoProceso;

public class ResultadosPage extends ScrollPane {

    private final VBox content = new VBox(16);

    private final Label algPlanLabel = new Label();
    private final Label algMemLabel = new Label();
    private final Label totalProcesosLabel = new Label();

    private final Label procesosCompletadosLabel = crearValorPrincipal();
    private final Label tiempoRespuestaLabel = crearValorPrincipal();
    private final Label cambiosContextoLabel = crearValorPrincipal();
    private final Label tiempoCpuLabel = crearValorPrincipal();
    private final Label tiempoOciosoLabel = crearValorPrincipal();

    private final Label cargasTotalesLabel = crearValorPrincipal();
    private final Label fallosPaginaLabel = crearValorPrincipal();
    private final Label reemplazosLabel = crearValorPrincipal();
    private final Label marcosLibresLabel = crearValorPrincipal();

    private final ProgressIndicator graficaCpu = new ProgressIndicator();
    private final Label porcentajeCpuLabel = new Label();
    private final Label estadoCpu = new Label();
    private final VBox contenedorBarras = new VBox(10);
    private final TableView<ResultadoProceso> tablaProcesos = new TableView<>();

    public ResultadosPage() {
        this(DatosResultados.prueba());
    }

    public ResultadosPage(DatosResultados datos) {
        content.setSpacing(16);
        content.setPadding(new Insets(18, 22, 22, 22));
        content.getStyleClass().add("results-page");

        setFitToWidth(true);
        setContent(content);

        content.getChildren().addAll(
                construirDatosGenerales(),
                construirMetricasScheduler(),
                construirMetricasMemoria(),
                construirVisualizaciones(),
                construirTabla()
        );
        actualizarDatos(datos);
    }

    private Node construirDatosGenerales() {
        VBox contenedor = new VBox(10);
        Label titulo = new Label("Datos Generales de la Simulación");
        titulo.getStyleClass().add("section-title");

        GridPane grid = new GridPane();
        grid.setHgap(14);
        grid.setVgap(10);

        grid.add(crearDatoResumido("Algoritmo de Planificación", algPlanLabel), 0, 0);
        grid.add(crearDatoResumido("Algoritmo de Memoria", algMemLabel), 1, 0);
        grid.add(crearDatoResumido("Total de Procesos", totalProcesosLabel), 2, 0);

        contenedor.getChildren().addAll(titulo, grid);
        return contenedor;
    }

    private Node construirMetricasScheduler() {
        VBox contenedor = new VBox(10);
        Label titulo = new Label("Métricas del Scheduler");
        titulo.getStyleClass().add("section-title");

        GridPane grid = crearGridMetricas();
        grid.add(crearTarjeta("Procesos Completados", procesosCompletadosLabel), 0, 0);
        grid.add(crearTarjeta("Tiempo Promedio de Respuesta", tiempoRespuestaLabel), 1, 0);
        grid.add(crearTarjeta("Cambios de Contexto", cambiosContextoLabel), 2, 0);
        grid.add(crearTarjeta("Tiempo Total de CPU", tiempoCpuLabel), 3, 0);
        grid.add(crearTarjeta("Tiempo Inactivo", tiempoOciosoLabel), 4, 0);

        contenedor.getChildren().addAll(titulo, grid);
        return contenedor;
    }

    private Node construirMetricasMemoria() {
        VBox contenedor = new VBox(10);
        Label titulo = new Label("Métricas de Memoria");
        titulo.getStyleClass().add("section-title");

        GridPane grid = crearGridMetricas();
        grid.add(crearTarjeta("Cargas Totales", cargasTotalesLabel), 0, 0);
        grid.add(crearTarjeta("Fallos de Página", fallosPaginaLabel), 1, 0);
        grid.add(crearTarjeta("Reemplazos Totales", reemplazosLabel), 2, 0);
        grid.add(crearTarjeta("Marcos Libres", marcosLibresLabel), 3, 0);

        contenedor.getChildren().addAll(titulo, grid);
        return contenedor;
    }

    private Node construirVisualizaciones() {
        VBox wrapper = new VBox(8);
        Label titulo = new Label("Visualizaciones");
        titulo.getStyleClass().add("section-title");

        HBox graficas = new HBox(14);
        graficas.setAlignment(Pos.CENTER_LEFT);

        VBox cpuCard = crearContenedorGrafica("CPU Usage Breakdown");
        cpuCard.setSpacing(12);
        graficaCpu.setMinSize(120, 120);
        graficaCpu.setPrefSize(120, 120);
        graficaCpu.setMaxSize(120, 120);
        graficaCpu.setStyle("-fx-progress-color: #3b82f6;");

        porcentajeCpuLabel.getStyleClass().add("metric-value-large");
        estadoCpu.getStyleClass().add("metric-subtext");

        VBox datosCpu = new VBox(6,
                new Label("Busy"),
                porcentajeCpuLabel,
                estadoCpu
        );
        datosCpu.getChildren().get(0).getStyleClass().add("section-description");

        HBox cpuContenido = new HBox(12, graficaCpu, datosCpu);
        cpuContenido.setAlignment(Pos.CENTER_LEFT);
        cpuCard.getChildren().add(cpuContenido);

        VBox esperaCard = crearContenedorGrafica("Tiempo de espera por proceso");
        contenedorBarras.setFillWidth(true);
        contenedorBarras.setSpacing(10);
        esperaCard.getChildren().add(contenedorBarras);

        graficas.getChildren().addAll(cpuCard, esperaCard);
        wrapper.getChildren().addAll(titulo, graficas);
        return wrapper;
    }

    private Node construirTabla() {
        VBox contenedor = new VBox(10);
        Label titulo = new Label("Métricas por proceso");
        titulo.getStyleClass().add("section-title");

        TableColumn<ResultadoProceso, String> pidCol = crearColumna("Process ID", "pid");
        TableColumn<ResultadoProceso, Integer> esperaCol = crearColumna("Wait Time (ms)", "tiempoEspera");
        TableColumn<ResultadoProceso, Integer> retornoCol = crearColumna("Turnaround Time (ms)", "tiempoRetorno");
        TableColumn<ResultadoProceso, Integer> fallosCol = crearColumna("Page Faults", "fallosPagina");
        TableColumn<ResultadoProceso, Integer> reemplazosCol = crearColumna("Replacements", "reemplazos");

        tablaProcesos.getColumns().setAll(pidCol, esperaCol, retornoCol, fallosCol, reemplazosCol);
        tablaProcesos.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_ALL_COLUMNS);
        tablaProcesos.setPrefHeight(240);
        tablaProcesos.getStyleClass().add("result-table");

        VBox.setVgrow(tablaProcesos, Priority.ALWAYS);
        contenedor.getChildren().addAll(titulo, tablaProcesos);
        return contenedor;
    }

    public void actualizarDatos(DatosResultados datos) {
        algPlanLabel.setText(datos.getAlgPlanificacion());
        algMemLabel.setText(datos.getAlgMemoria());
        totalProcesosLabel.setText(String.valueOf(datos.getTotalProcesos()));

        procesosCompletadosLabel.setText(String.format("%d / %d", datos.getProcesosCompletados(), datos.getTotalProcesos()));
        tiempoRespuestaLabel.setText(String.format("%.1f ms", datos.getTiempoRespuestaPromedio()));
        cambiosContextoLabel.setText(String.valueOf(datos.getCambiosContexto()));
        tiempoCpuLabel.setText(String.format("%d ms", datos.getTiempoCpu()));
        tiempoOciosoLabel.setText(String.format("%d ms", datos.getTiempoOcioso()));

        cargasTotalesLabel.setText(String.valueOf(datos.getCargasTotales()));
        fallosPaginaLabel.setText(String.valueOf(datos.getFallosPagina()));
        reemplazosLabel.setText(String.valueOf(datos.getReemplazosPagina()));
        marcosLibresLabel.setText(String.format("%d / %d", datos.getMarcosLibres(), datos.getMarcosTotales()));

        double progresoCpu = Math.min(1.0, Math.max(0, datos.getUsoCpu() / 100));
        graficaCpu.setProgress(progresoCpu);
        porcentajeCpuLabel.setText(String.format("%.0f%%", datos.getUsoCpu()));
        estadoCpu.setText(String.format("Trabajo: %.1f%%  |  Ocioso: %.1f%%", datos.getUsoCpu(), datos.getOcioCpu()));

        tablaProcesos.getItems().setAll(datos.getResumenProcesos());
        actualizarBarras(datos);
    }

    private void actualizarBarras(DatosResultados datos) {
        contenedorBarras.getChildren().clear();
        double maxEspera = datos.getResumenProcesos().stream()
                .mapToDouble(ResultadoProceso::getTiempoEspera)
                .max()
                .orElse(1);

        for (ResultadoProceso proceso : datos.getResumenProcesos()) {
            Label pid = new Label(proceso.getPid());
            pid.getStyleClass().add("label-light");

            double progress = proceso.getTiempoEspera() / maxEspera;
            Region track = new Region();
            track.getStyleClass().add("wait-bar-track");
            Region fill = new Region();
            fill.getStyleClass().add("wait-bar-fill");
            fill.setMaxWidth(Double.MAX_VALUE);
            fill.setPrefWidth(320 * progress);
            HBox.setHgrow(fill, Priority.NEVER);

            StackPaneWithFill bar = new StackPaneWithFill(track, fill, progress);

            Label valor = new Label(proceso.getTiempoEspera() + " ms");
            valor.getStyleClass().add("metric-subtext");

            HBox fila = new HBox(10, pid, bar, valor);
            fila.setAlignment(Pos.CENTER_LEFT);
            HBox.setHgrow(bar, Priority.ALWAYS);
            contenedorBarras.getChildren().add(fila);
        }
    }

    private VBox crearTarjeta(String titulo, Label valor) {
        Label etiqueta = new Label(titulo);
        etiqueta.getStyleClass().add("metric-title");

        VBox tarjeta = new VBox(6);
        tarjeta.getStyleClass().add("card");
        tarjeta.getChildren().addAll(etiqueta, valor);
        return tarjeta;
    }

    private VBox crearDatoResumido(String titulo, Label valor) {
        Label etiqueta = new Label(titulo);
        etiqueta.getStyleClass().add("metric-title");
        valor.getStyleClass().add("metric-value");

        VBox caja = new VBox(4, etiqueta, valor);
        caja.getStyleClass().add("card");
        return caja;
    }

    private VBox crearContenedorGrafica(String titulo) {
        Label etiqueta = new Label(titulo);
        etiqueta.getStyleClass().add("metric-title");

        VBox contenedor = new VBox(10);
        contenedor.getStyleClass().add("card");
        contenedor.getChildren().add(etiqueta);
        return contenedor;
    }

    private GridPane crearGridMetricas() {
        GridPane grid = new GridPane();
        grid.setHgap(12);
        grid.setVgap(12);
        return grid;
    }

    private Label crearValorPrincipal() {
        Label label = new Label("—");
        label.getStyleClass().add("metric-value");
        return label;
    }

    private <T> TableColumn<ResultadoProceso, T> crearColumna(String titulo, String propiedad) {
        Label header = new Label(titulo);
        header.getStyleClass().add("label-muted");

        TableColumn<ResultadoProceso, T> columna = new TableColumn<>();
        columna.setGraphic(header);
        columna.setCellValueFactory(new PropertyValueFactory<>(propiedad));
        return columna;
    }

    private static class StackPaneWithFill extends HBox {
        StackPaneWithFill(Region track, Region fill, double progress) {
            super();
            StackPane.setAlignment(fill, Pos.CENTER_LEFT);
            StackPane container = new StackPane();
            container.setPrefWidth(320);
            container.getChildren().addAll(track, fill);
            fill.maxWidthProperty().bind(container.widthProperty().multiply(progress));
            getChildren().setAll(container);
        }
    }
}
