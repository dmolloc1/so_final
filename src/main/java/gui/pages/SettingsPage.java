package gui.pages;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

public class SettingsPage extends VBox {

  public SettingsPage() {
    setSpacing(14);
    setPadding(new Insets(20));
    setAlignment(Pos.TOP_LEFT);
    getStyleClass().add("page-container");

    Label title = new Label("Ajustes");
    title.getStyleClass().add("page-title");

    Label subtitle = new Label("Preferencias generales del simulador.");
    subtitle.getStyleClass().add("page-subtitle");

    Label placeholder = new Label(
      "Aquí podrás configurar estilos, idioma y opciones adicionales."
    );
    placeholder.getStyleClass().add("placeholder-text");

    getChildren().addAll(title, subtitle, placeholder);
  }
}
