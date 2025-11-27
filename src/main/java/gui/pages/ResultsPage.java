package gui.pages;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

public class ResultsPage extends VBox {

  public ResultsPage() {
<<<<<<< HEAD
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
=======
    setSpacing(18);
    setPadding(new Insets(10));
    getStyleClass().add("page-container");

    Label title = new Label("Resultados de la simulación");
    title.getStyleClass().add("page-title");

    Label subtitle = new Label(
      "Consulta métricas como tiempos de espera, retorno y fallos de página."
    );
    subtitle.getStyleClass().add("page-subtitle");

    VBox resultsCard = new VBox();
    resultsCard.setSpacing(10);
    resultsCard.setPadding(new Insets(16));
    resultsCard.setAlignment(Pos.TOP_LEFT);
    resultsCard.getStyleClass().add("card");

    Label metricsLabel = new Label("Panel de métricas");
    metricsLabel.getStyleClass().add("card-title");
    Label placeholder = new Label(
      "Aquí verás tablas y gráficos con los indicadores finales de la ejecución."
    );
    placeholder.getStyleClass().add("placeholder-text");

    resultsCard.getChildren().addAll(metricsLabel, placeholder);

    getChildren().addAll(title, subtitle, resultsCard);
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
  }
}
