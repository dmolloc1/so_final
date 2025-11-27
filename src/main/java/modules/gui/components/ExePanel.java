package modules.gui.components;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
public class ExePanel  extends VBox {

    private final GanttChart ganttChart;

    public ExePanel() {
        setSpacing(10);
        setPadding(new Insets(16));
        getStyleClass().add("card");

        Label title = new Label("Panel de Ejecución");
        title.getStyleClass().add("card-title");

        ganttChart = new GanttChart();
        ganttChart.setMinHeight(140);
        VBox.setVgrow(ganttChart, Priority.ALWAYS);

        getChildren().addAll(title, ganttChart);
    }

    public GanttChart getGanttChart() {
        return ganttChart;
    }
}
