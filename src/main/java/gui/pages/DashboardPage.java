package gui.pages;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

public class DashboardPage extends VBox {

  public DashboardPage() {
    setSpacing(14);
    setPadding(new Insets(20));
    setAlignment(Pos.TOP_LEFT);
    getStyleClass().add("page-container");

    Label title = new Label("Dashboard");
    title.getStyleClass().add("page-title");

    Label subtitle = new Label("Vista general de la simulación en tiempo real.");
    subtitle.getStyleClass().add("page-subtitle");

    Label placeholder = new Label(
      "Aquí se mostrarán el diagrama de Gantt, la cola de procesos y la utilización de CPU."
    );
    placeholder.getStyleClass().add("placeholder-text");

    getChildren().addAll(title, subtitle, placeholder);
  }
}
