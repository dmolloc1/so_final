package gui;

import gui.pages.ConfigPage;
import gui.pages.DashboardPage;
import gui.pages.ResultsPage;
import gui.pages.SettingsPage;
import java.util.LinkedHashMap;
import java.util.Map;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class MainFX extends Application {

  private final Map<String, VBox> pages = new LinkedHashMap<>();
  private final Map<String, Button> navButtons = new LinkedHashMap<>();

  @Override
  public void start(Stage stage) {
    stage.setTitle("Simulador de Sistema Operativo");

    BorderPane root = new BorderPane();
    root.setPadding(new Insets(10));

    setupPages(stage);
    HBox navbar = createNavbar();

    root.setTop(navbar);
    root.setCenter(pages.get("config"));

    Scene scene = new Scene(root, 1000, 650);
    scene.getStylesheets().add(createInlineStyles());
    stage.setScene(scene);
    stage.show();
  }

  private void setupPages(Stage stage) {
    pages.put("config", new ConfigPage(stage));
    pages.put("dashboard", new DashboardPage());
    pages.put("results", new ResultsPage());
    pages.put("settings", new SettingsPage());
  }

  private HBox createNavbar() {
    HBox navbar = new HBox(10);
    navbar.setAlignment(Pos.CENTER_LEFT);
    navbar.setPadding(new Insets(10));
    navbar.getStyleClass().add("navbar");

    Label brand = new Label("OS Simulator");
    brand.getStyleClass().add("brand");

    Button configBtn = createNavButton("Configuración", "config");
    Button dashboardBtn = createNavButton("Dashboard", "dashboard");
    Button resultsBtn = createNavButton("Resultados", "results");
    Button settingsBtn = createNavButton("Ajustes", "settings");

    navbar.getChildren().addAll(
      brand,
      configBtn,
      dashboardBtn,
      resultsBtn,
      settingsBtn
    );

    highlightButton("config");
    return navbar;
  }

  private Button createNavButton(String text, String pageKey) {
    Button button = new Button(text);
    button.getStyleClass().add("nav-button");
    button.setOnAction(e -> switchPage(pageKey));
    navButtons.put(pageKey, button);
    return button;
  }

  private void switchPage(String pageKey) {
    VBox page = pages.get(pageKey);
    if (page != null) {
      BorderPane root = (BorderPane) navButtons
        .values()
        .iterator()
        .next()
        .getScene()
        .getRoot();
      root.setCenter(page);
      highlightButton(pageKey);
    }
  }

  private void highlightButton(String activeKey) {
    navButtons.forEach((key, btn) -> {
      if (key.equals(activeKey)) {
        btn.getStyleClass().add("nav-button-active");
      } else {
        btn.getStyleClass().remove("nav-button-active");
      }
    });
  }

  private String createInlineStyles() {
    String baseStyles =
      """
      .navbar {
        -fx-background-color: #101828;
        -fx-background-radius: 12;
        -fx-padding: 12;
        -fx-spacing: 10;
      }

      .brand {
        -fx-text-fill: white;
        -fx-font-size: 18px;
        -fx-font-weight: bold;
        -fx-padding: 4 14 4 6;
      }

      .nav-button {
        -fx-background-color: transparent;
        -fx-text-fill: #e4e7ec;
        -fx-font-weight: 600;
        -fx-padding: 10 14;
        -fx-background-radius: 8;
      }

      .nav-button:hover {
        -fx-background-color: #1d2939;
      }

      .nav-button-active {
        -fx-background-color: #344054;
        -fx-text-fill: white;
      }

      .page-container {
        -fx-background-color: #f8fafc;
        -fx-padding: 24;
        -fx-spacing: 12;
        -fx-border-color: #e4e7ec;
        -fx-border-radius: 12;
        -fx-background-radius: 12;
      }

      .page-title {
        -fx-font-size: 22px;
        -fx-font-weight: bold;
        -fx-text-fill: #101828;
      }

      .page-subtitle {
        -fx-font-size: 14px;
        -fx-text-fill: #475467;
      }

      .placeholder-text {
        -fx-text-fill: #667085;
        -fx-font-size: 13px;
      }

      .primary-button {
        -fx-background-color: #2563eb;
        -fx-text-fill: white;
        -fx-font-weight: bold;
        -fx-padding: 10 16;
        -fx-background-radius: 8;
      }

      .primary-button:hover {
        -fx-background-color: #1d4ed8;
      }

      .secondary-button {
        -fx-background-color: #e4e7ec;
        -fx-text-fill: #101828;
        -fx-padding: 8 12;
        -fx-background-radius: 8;
      }

      .secondary-button:hover {
        -fx-background-color: #d0d5dd;
      }
      """;

    return "data:text/css," + baseStyles.replace("\n", " ");
  }

  public static void main(String[] args) {
    launch(args);
  }
}
