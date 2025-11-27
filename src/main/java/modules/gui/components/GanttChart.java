package modules.gui.components;

import javafx.beans.binding.Bindings;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Group;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Line;
import javafx.scene.shape.Rectangle;

import java.util.ArrayList;
import java.util.List;

/**
 * Pequeño componente de diagrama de Gantt para visualizar el uso de CPU.
 * Permite agregar segmentos dinamicamente y se adapta al tamaño del contenedor.
 */
public class GanttChart extends VBox {

    public record Segment(String pid, double duration, Color color) {}

    private final List<Segment> segments = new ArrayList<>();
    private final Pane chartArea = new Pane();
    private final HBox timeAxis = new HBox();

    private double totalDurationHint = 100d;

    public GanttChart() {
        setSpacing(10);
        setAlignment(Pos.TOP_LEFT);
        getStyleClass().add("gantt-container");

        chartArea.setMinHeight(120);
        chartArea.getStyleClass().add("gantt-area");
        chartArea.widthProperty().addListener((obs, oldV, newV) -> drawSegments());
        chartArea.heightProperty().addListener((obs, oldV, newV) -> drawSegments());

        timeAxis.setAlignment(Pos.CENTER_LEFT);
        timeAxis.setSpacing(0);
        timeAxis.getStyleClass().add("gantt-axis");

        getChildren().addAll(chartArea, timeAxis);

        drawSegments();
        updateAxis();
    }

    public void setTotalDurationHint(double totalDurationHint) {
        this.totalDurationHint = Math.max(totalDurationHint, 1d);
        updateAxis();
        drawSegments();
    }

    public void setSegments(List<Segment> newSegments) {
        segments.clear();
        if (newSegments != null) {
            segments.addAll(newSegments);
        }
        updateAxis();
        drawSegments();
    }

    public void addSegment(Segment segment) {
        if (segment != null) {
            segments.add(segment);
            updateAxis();
            drawSegments();
        }
    }

    public void clear() {
        segments.clear();
        drawSegments();
        updateAxis();
    }

    private double getTimelineDuration() {
        double sum = segments.stream().mapToDouble(Segment::duration).sum();
        return Math.max(sum, totalDurationHint);
    }

    private void drawSegments() {
        double width = chartArea.getWidth();
        double height = chartArea.getHeight();

        chartArea.getChildren().clear();
        chartArea.setPadding(new Insets(6));

        Group gridGroup = new Group();
        double totalDuration = getTimelineDuration();
        for (int i = 0; i <= 10; i++) {
            double x = (width / 10d) * i;
            Line line = new Line(x, 8, x, height - 12);
            line.getStrokeDashArray().addAll(6d, 10d);
            line.setStroke(Color.rgb(255, 255, 255, 0.1));
            gridGroup.getChildren().add(line);
        }
        chartArea.getChildren().add(gridGroup);

        double offset = 0;
        double blockHeight = Math.max(32, height / 3);
        double centerY = height / 2 - blockHeight / 2;

        for (Segment segment : segments) {
            double startX = (offset / totalDuration) * width;
            double blockWidth = (segment.duration / totalDuration) * width;

            Rectangle rect = new Rectangle(blockWidth, blockHeight, segment.color);
            rect.setArcHeight(12);
            rect.setArcWidth(12);
            rect.getStyleClass().add("gantt-block");

            Label label = new Label(segment.pid());
            label.getStyleClass().add("gantt-label");

            StackPane block = new StackPane(rect, label);
            block.setLayoutX(startX);
            block.setLayoutY(centerY);
            block.minHeightProperty().bind(Bindings.createDoubleBinding(() -> blockHeight, chartArea.heightProperty()));

            chartArea.getChildren().add(block);
            offset += segment.duration;
        }
    }

    private void updateAxis() {
        timeAxis.getChildren().clear();
        double totalDuration = getTimelineDuration();

        for (int i = 0; i <= 10; i++) {
            double labelValue = (totalDuration / 10d) * i;
            Label tick = new Label(String.format("%dms", Math.round(labelValue)));
            tick.getStyleClass().add("gantt-axis-label");

            Region spacer = new Region();
            HBox.setHgrow(spacer, Priority.ALWAYS);

            timeAxis.getChildren().addAll(tick, spacer);
        }
    }
}
