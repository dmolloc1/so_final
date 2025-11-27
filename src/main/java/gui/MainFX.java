package gui;

import javafx.application.Application;
import javafx.stage.Stage;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;

public class MainFX extends Application {
  @Override
  public void start(Stage stage) {
    stage.setTitle("Simulador de Sistema Operativo");
    try {
      Parent root = FXMLLoader.load(getClass().getResource("/gui/dashboard.fxml"));
      Scene scene = new Scene(root, 1200, 800);
      stage.setScene(scene);
      stage.show();
    } catch (Exception e) {
      throw new RuntimeException("No se pudo cargar la vista del dashboard", e);
    }
  }

  public static void main(String[] args) {
    launch(args);
  }
}