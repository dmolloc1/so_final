package modules.gui.components;

import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;

/**
 * Chip visual para mostrar un proceso en alguna cola.
 */
public class ProcessBadge extends HBox {

    public ProcessBadge(String text, String styleClass) {
        setAlignment(Pos.CENTER_LEFT);
        setSpacing(8);
        getStyleClass().addAll("process-badge", styleClass);

        Region dot = new Region();
        dot.getStyleClass().add("process-dot");

        Label label = new Label(text);
        label.getStyleClass().add("process-text");

        getChildren().addAll(dot, label);
        HBox.setHgrow(label, Priority.ALWAYS);
    }
}
