package modules.gui.components;

import javafx.geometry.Insets;
import javafx.scene.control.Label;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;

import java.util.List;
public class ExePanel  extends VBox {

    private final GanttChart ganttChart = new GanttChart();

    public ExePanel() {
        setSpacing(10);
        setPadding(new Insets(16));
        getStyleClass().add("card");

        Label title = new Label("Panel de Ejecución");
        title.getStyleClass().add("card-title");

        Label subtitle = new Label("CPU Timeline (Gantt)");
        subtitle.getStyleClass().add("card-subtitle");

        ganttChart.setPrefHeight(160);
        ganttChart.setTotalDurationHint(100);
        ganttChart.setPadding(new Insets(6, 4, 0, 4));

        // Demostración inicial para que la UI muestre bloques de color
        ganttChart.setSegments(List.of(
                new GanttChart.Segment("P1", 20, Color.web("#725bff")),
                new GanttChart.Segment("P2", 30, Color.web("#22c55e")),
                new GanttChart.Segment("P3", 10, Color.web("#fbbf24")),
                new GanttChart.Segment("P1", 40, Color.web("#725bff"))
        ));

        Region spacer = new Region();
        spacer.setPrefHeight(6);

        getChildren().addAll(title, subtitle, ganttChart, spacer);
    }

    public void setTimeline(List<GanttChart.Segment> segments, double durationHint) {
        ganttChart.setTotalDurationHint(durationHint);
        ganttChart.setSegments(segments);
    }

    public void appendSegment(GanttChart.Segment segment) {
        ganttChart.addSegment(segment);
    }
}
