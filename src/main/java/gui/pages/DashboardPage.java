package gui.pages;

<<<<<<< HEAD
=======
import javafx.geometry.Insets;
import javafx.geometry.Pos;
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

public class DashboardPage extends VBox {

<<<<<<< HEAD
    public DashboardPage() {
        Label title = new Label("Dashboard");

        getChildren().add(title);
    }
=======
  public DashboardPage() {
    setSpacing(18);
    setPadding(new Insets(10));
    getStyleClass().add("page-container");

    Label title = new Label("Dashboard en tiempo real");
    title.getStyleClass().add("page-title");

    Label subtitle = new Label(
      "Visualiza el diagrama de Gantt, colas de procesos y utilización del CPU."
    );
    subtitle.getStyleClass().add("page-subtitle");

    VBox realtimeCard = new VBox();
    realtimeCard.setSpacing(10);
    realtimeCard.setPadding(new Insets(16));
    realtimeCard.setAlignment(Pos.TOP_LEFT);
    realtimeCard.getStyleClass().add("card");

    Label liveLabel = new Label("Componentes en vivo");
    liveLabel.getStyleClass().add("card-title");
    Label livePlaceholder = new Label(
      "Aquí se integrarán el gráfico de Gantt, las colas y el monitor de CPU."
    );
    livePlaceholder.getStyleClass().add("placeholder-text");

    realtimeCard.getChildren().addAll(liveLabel, livePlaceholder);

    getChildren().addAll(title, subtitle, realtimeCard);
  }
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
}
