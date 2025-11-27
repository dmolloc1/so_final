package modules.gui.components;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * Vista simple de diagrama de Gantt para mostrar ejecuciones de CPU en tiempo real.
 */
public class GanttChart extends VBox {

    private static final int PX_PER_UNIT = 12;

    private final HBox track;
    private final HBox scale;
    private final Map<String, Color> palette;

    private Segment activeSegment;

    public GanttChart() {
        setSpacing(12);
        setPadding(new Insets(12));
        getStyleClass().add("gantt-card");

        palette = new HashMap<>();

        Label title = new Label("CPU Timeline (Gantt)");
        title.getStyleClass().add("card-subtitle");

        track = new HBox(6);
        track.getStyleClass().add("gantt-track");
        track.setAlignment(Pos.CENTER_LEFT);

        scale = new HBox();
        scale.setAlignment(Pos.CENTER);
        scale.setSpacing(14);
        buildScale();

        getChildren().addAll(title, track, scale);
        VBox.setVgrow(track, Priority.ALWAYS);
    }

    public void clear() {
        track.getChildren().clear();
        activeSegment = null;
    }

    public void startProcess(String pid, int startTime) {
        if (activeSegment != null && activeSegment.pid.equals(pid)) {
            return;
        }

        activeSegment = new Segment(pid, startTime, getColorForProcess(pid));
        track.getChildren().add(activeSegment.container);
    }

    public void extendRunning(String pid, int currentTime) {
        if (pid == null) {
            return;
        }

        if (activeSegment == null || !activeSegment.pid.equals(pid)) {
            startProcess(pid, currentTime);
        }

        if (activeSegment == null) {
            return;
        }

        activeSegment.updateDuration(currentTime - activeSegment.startTime + 1);
    }

    private void buildScale() {
        for (int t = 0; t <= 100; t += 10) {
            Label tick = new Label(t + "ms");
            tick.getStyleClass().add("gantt-scale");
            scale.getChildren().add(tick);
        }
    }

    private Color getColorForProcess(String pid) {
        return palette.computeIfAbsent(pid, p -> randomColor());
    }

    private Color randomColor() {
        Random random = new Random();
        return Color.hsb(random.nextInt(360), 0.65, 0.85);
    }

    private static class Segment {
        private final String pid;
        private final int startTime;
        private int duration;
        private final HBox container;
        private final Rectangle bar;
        private final Label label;

        Segment(String pid, int startTime, Color color) {
            this.pid = pid;
            this.startTime = startTime;
            this.duration = 1;
            this.container = new HBox();
            this.bar = new Rectangle();
            this.label = new Label(pid);

            container.setAlignment(Pos.CENTER);
            container.setSpacing(6);

            bar.setArcWidth(10);
            bar.setArcHeight(10);
            bar.setHeight(34);
            bar.setFill(color);

            label.getStyleClass().add("gantt-label");

            container.getChildren().addAll(bar, label);
            HBox.setHgrow(bar, Priority.NEVER);
            updateDuration(duration);
        }

        void updateDuration(int newDuration) {
            this.duration = newDuration;
            bar.setWidth(duration * PX_PER_UNIT);
        }
    }
}
