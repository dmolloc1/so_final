package gui.pages;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

public class ResultsPage extends VBox {

  public ResultsPage() {
    setSpacing(14);
    setPadding(new Insets(20));
    setAlignment(Pos.TOP_LEFT);
    getStyleClass().add("page-container");

    Label title = new Label("Resultados");
    title.getStyleClass().add("page-title");

    Label subtitle = new Label("Métricas y estadísticas de la simulación.");
    subtitle.getStyleClass().add("page-subtitle");

    Label placeholder = new Label(
      "Aquí se mostrarán tiempos de espera, retorno y fallos de página."
    );
    placeholder.getStyleClass().add("placeholder-text");

    getChildren().addAll(title, subtitle, placeholder);
  }
}
