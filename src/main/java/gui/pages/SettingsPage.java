package gui.pages;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

public class SettingsPage extends VBox {

  public SettingsPage() {
<<<<<<< HEAD
    setSpacing(14);
    setPadding(new Insets(20));
    setAlignment(Pos.TOP_LEFT);
=======
    setSpacing(18);
    setPadding(new Insets(10));
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
    getStyleClass().add("page-container");

    Label title = new Label("Ajustes");
    title.getStyleClass().add("page-title");

<<<<<<< HEAD
    Label subtitle = new Label("Preferencias generales del simulador.");
    subtitle.getStyleClass().add("page-subtitle");

    Label placeholder = new Label(
      "Aquí podrás configurar estilos, idioma y opciones adicionales."
    );
    placeholder.getStyleClass().add("placeholder-text");

    getChildren().addAll(title, subtitle, placeholder);
=======
    Label subtitle = new Label("Configura preferencias visuales y del simulador.");
    subtitle.getStyleClass().add("page-subtitle");

    VBox preferencesCard = new VBox();
    preferencesCard.setSpacing(10);
    preferencesCard.setPadding(new Insets(16));
    preferencesCard.setAlignment(Pos.TOP_LEFT);
    preferencesCard.getStyleClass().add("card");

    Label prefsLabel = new Label("Preferencias generales");
    prefsLabel.getStyleClass().add("card-title");
    Label placeholder = new Label(
      "Incluye opciones como idioma, tema y valores predeterminados de simulación."
    );
    placeholder.getStyleClass().add("placeholder-text");

    preferencesCard.getChildren().addAll(prefsLabel, placeholder);

    getChildren().addAll(title, subtitle, preferencesCard);
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
  }
}
