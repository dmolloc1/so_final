package modules.gui.pages;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import model.DatosResultados;
import model.ResultadoProceso;

public class ResultadosPage extends VBox {

    private final Label valorEspera = crearValorPrincipal();
    private final Label valorRetorno = crearValorPrincipal();
    private final Label valorCpu = crearValorPrincipal();
    private final Label valorFallos = crearValorPrincipal();
    private final Label valorReemplazos = crearValorPrincipal();

    private final Label valorAlgPlan = crearDetalle();
    private final Label valorAlgMem = crearDetalle();
    private final Label valorTotalProcesos = crearValorPrincipal();

    private final Label valorProcesosCompletados = crearValorPrincipal();
    private final Label valorRespuestaPromedio = crearValorPrincipal();
    private final Label valorCambiosContexto = crearValorPrincipal();
    private final Label valorTiempoCpu = crearValorPrincipal();
    private final Label valorTiempoInactivo = crearValorPrincipal();

    private final Label valorCargasTotales = crearValorPrincipal();
    private final Label valorMarcosLibres = crearValorPrincipal();

    private final ProgressIndicator graficaCpu = new ProgressIndicator();
    private final Label estadoCpu = new Label();
    private final Label estadoCpuDetalle = new Label();
    private final Label esperaPromedioGrafica = new Label();
    private final VBox contenedorBarras = new VBox(8);
    private final TableView<ResultadoProceso> tablaProcesos = new TableView<>();

    public ResultadosPage() {
        this(DatosResultados.prueba());
    }

    public ResultadosPage(DatosResultados datos) {
        setSpacing(18);
        setPadding(new Insets(18, 18, 28, 18));
        getStyleClass().add("page-container");

        construirEncabezado();
        getChildren().add(crearDatosGenerales());
        getChildren().add(crearMetricasPrincipales());
        getChildren().add(crearMetricasScheduler());
        getChildren().add(crearMetricasMemoria());
        construirVisualizaciones();
        construirTabla();
        actualizarDatos(datos);
    }

    private void construirEncabezado() {
        HBox barra = new HBox(12);
        barra.setAlignment(Pos.CENTER_LEFT);
        barra.setPadding(new Insets(0, 0, 8, 0));

        VBox textos = new VBox(6);
        Label titulo = new Label("Resultados y Métricas Finales");
        titulo.getStyleClass().add("page-title");
        Label subtitulo = new Label("Un resumen detallado de las métricas de la última simulación.");
        subtitulo.getStyleClass().add("page-subtitle");
        textos.getChildren().addAll(titulo, subtitulo);

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        Button exportar = new Button("Exportar Resultados");
        exportar.getStyleClass().add("secondary-button");
        exportar.setPrefHeight(32);

        barra.getChildren().addAll(textos, spacer, exportar);
        getChildren().add(barra);
    }

    private VBox crearDatosGenerales() {
        VBox contenedor = new VBox(12);
        contenedor.getStyleClass().addAll("card", "result-card");

        Label titulo = new Label("Datos Generales de la Simulación");
        titulo.getStyleClass().add("section-title");

        GridPane grid = crearGrid(3);
        grid.add(crearItemDetalle("Algoritmo de Planificación", valorAlgPlan), 0, 0);
        grid.add(crearItemDetalle("Algoritmo de Memoria", valorAlgMem), 1, 0);
        grid.add(crearItemDetalle("Total de Procesos", valorTotalProcesos), 2, 0);

        contenedor.getChildren().addAll(titulo, grid);
        return contenedor;
    }

    private GridPane crearMetricasPrincipales() {
        GridPane grid = crearGrid(5);
        grid.getStyleClass().add("stats-grid");

        grid.add(crearTarjeta("Tiempo de espera promedio", valorEspera), 0, 0);
        grid.add(crearTarjeta("Tiempo de retorno promedio", valorRetorno), 1, 0);
        grid.add(crearTarjeta("Utilización de CPU", valorCpu), 2, 0);
        grid.add(crearTarjeta("Fallos de página", valorFallos), 3, 0);
        grid.add(crearTarjeta("Reemplazos", valorReemplazos), 4, 0);

        return grid;
    }

    private VBox crearMetricasScheduler() {
        Label titulo = new Label("Métricas del Scheduler");
        titulo.getStyleClass().add("section-title");

        GridPane grid = crearGrid(5);
        grid.getStyleClass().add("stats-grid");

        grid.add(crearTarjeta("Procesos Completados", valorProcesosCompletados), 0, 0);
        grid.add(crearTarjeta("Tiempo Promedio de Respuesta", valorRespuestaPromedio), 1, 0);
        grid.add(crearTarjeta("Cambios de Contexto", valorCambiosContexto), 2, 0);
        grid.add(crearTarjeta("Tiempo Total de CPU", valorTiempoCpu), 3, 0);
        grid.add(crearTarjeta("Tiempo Inactivo", valorTiempoInactivo), 4, 0);

        VBox wrapper = new VBox(10, titulo, grid);
        return gridWrapper(wrapper);
    }

    private VBox crearMetricasMemoria() {
        Label titulo = new Label("Métricas de Memoria");
        titulo.getStyleClass().add("section-title");

        GridPane grid = crearGrid(4);
        grid.getStyleClass().add("stats-grid");

        grid.add(crearTarjeta("Cargas Totales", valorCargasTotales), 0, 0);
        grid.add(crearTarjeta("Fallos de Página", valorFallos), 1, 0);
        grid.add(crearTarjeta("Reemplazos Totales", valorReemplazos), 2, 0);
        grid.add(crearTarjeta("Marcos Libres", valorMarcosLibres), 3, 0);

        VBox wrapper = new VBox(10, titulo, grid);
        return gridWrapper(wrapper);
    }

    private VBox gridWrapper(VBox content) {
        VBox.setMargin(content, new Insets(8, 0, 0, 0));
        return content;
    }

    private void construirVisualizaciones() {
        Label subtitulo = new Label("Visualizaciones");
        subtitulo.getStyleClass().add("section-title");

        GridPane graficas = crearGrid(2);
        graficas.setHgap(14);
        graficas.setVgap(14);

        VBox graficaCpuCard = crearContenedorGrafica("CPU Usage Breakdown");
        graficaCpu.setMinSize(140, 140);
        graficaCpu.setPrefSize(140, 140);
        graficaCpu.setMaxSize(160, 160);
        graficaCpu.getStyleClass().add("cpu-indicator");

        Label etiquetaCpu = new Label("Busy");
        etiquetaCpu.getStyleClass().add("chart-headline");
        estadoCpu.getStyleClass().add("chart-label");
        estadoCpuDetalle.getStyleClass().add("chart-helper");

        VBox datosCpu = new VBox(6, etiquetaCpu, estadoCpu, estadoCpuDetalle);
        datosCpu.setAlignment(Pos.CENTER_LEFT);

        BorderPane cpuPane = new BorderPane();
        cpuPane.setLeft(graficaCpu);
        cpuPane.setCenter(datosCpu);
        BorderPane.setMargin(graficaCpu, new Insets(0, 12, 0, 0));

        graficaCpuCard.getChildren().add(cpuPane);

        VBox graficaEspera = crearContenedorGrafica("Tiempo de espera por proceso");
        esperaPromedioGrafica.getStyleClass().add("chart-headline");
        contenedorBarras.setFillWidth(true);
        contenedorBarras.setSpacing(8);
        graficaEspera.getChildren().addAll(esperaPromedioGrafica, contenedorBarras);

        graficas.add(graficaCpuCard, 0, 0);
        graficas.add(graficaEspera, 1, 0);

        getChildren().addAll(subtitulo, graficas);
    }

    private void construirTabla() {
        Label titulo = new Label("Métricas por proceso");
        titulo.getStyleClass().add("section-title");

        Label labelProceso = new Label("Proceso");
        Label labelEspera = new Label("Espera (ms)");
        Label labelRetorno = new Label("Retorno (ms)");
        Label labelRespuesta = new Label("Respuesta (ms)");
        Label labelFallos = new Label("Fallos página");
        Label labelReemplazos = new Label("Reemplazos");

        labelProceso.getStyleClass().add("text-clear");
        labelEspera.getStyleClass().add("text-clear");
        labelRetorno.getStyleClass().add("text-clear");
        labelRespuesta.getStyleClass().add("text-clear");
        labelFallos.getStyleClass().add("text-clear");
        labelReemplazos.getStyleClass().add("text-clear");

        TableColumn<ResultadoProceso, String> pidCol = new TableColumn<>();
        pidCol.setGraphic(labelProceso);
        pidCol.setCellValueFactory(new PropertyValueFactory<>("pid"));

        TableColumn<ResultadoProceso, Integer> esperaCol = new TableColumn<>();
        esperaCol.setGraphic(labelEspera);
        esperaCol.setCellValueFactory(new PropertyValueFactory<>("tiempoEspera"));

        TableColumn<ResultadoProceso, Integer> retornoCol = new TableColumn<>();
        retornoCol.setGraphic(labelRetorno);
        retornoCol.setCellValueFactory(new PropertyValueFactory<>("tiempoRetorno"));

        TableColumn<ResultadoProceso, Integer> respuestaCol = new TableColumn<>();
        respuestaCol.setGraphic(labelRespuesta);
        respuestaCol.setCellValueFactory(new PropertyValueFactory<>("tiempoRespuesta"));

        TableColumn<ResultadoProceso, Integer> fallosCol = new TableColumn<>();
        fallosCol.setGraphic(labelFallos);
        fallosCol.setCellValueFactory(new PropertyValueFactory<>("fallosPagina"));

        TableColumn<ResultadoProceso, Integer> reemplazosCol = new TableColumn<>();
        reemplazosCol.setGraphic(labelReemplazos);
        reemplazosCol.setCellValueFactory(new PropertyValueFactory<>("reemplazos"));

        tablaProcesos.getColumns().addAll(pidCol, esperaCol, retornoCol, respuestaCol, fallosCol, reemplazosCol);
        tablaProcesos.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_ALL_COLUMNS);
        tablaProcesos.setPrefHeight(260);
        tablaProcesos.getStyleClass().add("result-table");

        VBox.setVgrow(tablaProcesos, Priority.ALWAYS);
        getChildren().addAll(titulo, tablaProcesos);
    }

    public void actualizarDatos(DatosResultados datos) {
        valorEspera.setText(String.format("%.1f ms", datos.getTiempoEsperaPromedio()));
        valorRetorno.setText(String.format("%.1f ms", datos.getTiempoRetornoPromedio()));
        valorCpu.setText(String.format("%.1f%%", datos.getUsoCpu()));
        valorFallos.setText(String.valueOf(datos.getFallosPagina()));
        valorReemplazos.setText(String.valueOf(datos.getReemplazosPagina()));

        valorAlgPlan.setText(datos.getAlgPlanificacion());
        valorAlgMem.setText(datos.getAlgMemoria());
        valorTotalProcesos.setText(String.valueOf(datos.getTotalProcesos()));

        valorProcesosCompletados.setText(String.format("%d / %d", datos.getProcesosCompletados(), datos.getTotalProcesos()));
        valorRespuestaPromedio.setText(String.format("%.1f ms", datos.getTiempoRespuestaPromedio()));
        valorCambiosContexto.setText(String.valueOf(datos.getCambiosContexto()));
        valorTiempoCpu.setText(datos.getTiempoCpu() + " ms");
        valorTiempoInactivo.setText(datos.getTiempoOcioso() + " ms");

        valorCargasTotales.setText(String.valueOf(datos.getCargasTotales()));
        valorMarcosLibres.setText(datos.getMarcosLibres() + " / " + datos.getMarcosTotales());

        double progresoCpu = Math.min(1.0, Math.max(0, datos.getUsoCpu() / 100));
        graficaCpu.setProgress(progresoCpu);
        estadoCpu.setText(String.format("%s ocupado", valorCpu.getText()));
        estadoCpuDetalle.setText(String.format("Trabajo: %.1f%%  |  Ocioso: %.1f%%", datos.getUsoCpu(), datos.getOcioCpu()));

        esperaPromedioGrafica.setText(String.format("%.1f ms Avg", datos.getTiempoEsperaPromedio()));

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
            pid.getStyleClass().add("chart-label");

            ProgressBar barra = new ProgressBar();
            barra.setProgress(proceso.getTiempoEspera() / maxEspera);
            barra.setPrefWidth(320);
            barra.getStyleClass().add("wait-bar");

            Label valor = new Label(proceso.getTiempoEspera() + " ms");
            valor.getStyleClass().add("chart-helper");

            HBox fila = new HBox(10, pid, barra, valor);
            fila.setAlignment(Pos.CENTER_LEFT);
            contenedorBarras.getChildren().add(fila);
        }
    }

    private VBox crearTarjeta(String titulo, Label valor) {
        Label etiqueta = new Label(titulo);
        etiqueta.getStyleClass().add("card-subtitle");

        VBox tarjeta = new VBox(6);
        tarjeta.getStyleClass().add("card");
        tarjeta.getChildren().addAll(etiqueta, valor);
        return tarjeta;
    }

    private VBox crearContenedorGrafica(String titulo) {
        Label etiqueta = new Label(titulo);
        etiqueta.getStyleClass().add("card-subtitle");

        VBox contenedor = new VBox(10);
        contenedor.getStyleClass().add("card");
        contenedor.getChildren().add(etiqueta);
        return contenedor;
    }

    private GridPane crearGrid(int columns) {
        GridPane grid = new GridPane();
        grid.setHgap(12);
        grid.setVgap(12);

        for (int i = 0; i < columns; i++) {
            ColumnConstraints col = new ColumnConstraints();
            col.setPercentWidth(100.0 / columns);
            grid.getColumnConstraints().add(col);
        }
        return grid;
    }

    private VBox crearItemDetalle(String titulo, Label valor) {
        Label etiqueta = new Label(titulo);
        etiqueta.getStyleClass().add("card-subtitle");

        VBox contenedor = new VBox(4, etiqueta, valor);
        contenedor.getStyleClass().add("detail-item");
        return contenedor;
    }

    private Label crearValorPrincipal() {
        Label label = new Label("—");
        label.getStyleClass().add("metric-value");
        return label;
    }

    private Label crearDetalle() {
        Label label = new Label("—");
        label.getStyleClass().add("meta-value");
        return label;
    }
}
