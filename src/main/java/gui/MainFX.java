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
<<<<<<< HEAD
import javafx.stage.Stage;
import javafx.scene.Scene;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.control.Button;
import javafx.scene.control.Label;

import java.util.LinkedHashMap;
import java.util.Map;

import gui.pages.ConfigPage;
import gui.pages.DashboardPage;
import gui.pages.ResultadosPage;

public class MainFX extends Application {

    private final Map<String, VBox> pages = new LinkedHashMap<>();
    private final Map<String, Button> navButtons = new LinkedHashMap<>();
=======
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
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8

    @Override
    public void start(Stage stage) {

<<<<<<< HEAD
        BorderPane root = new BorderPane();
        root.getStyleClass().add("root");

        crearPaginas(stage);
        HBox navbar = crearNavbar();

        root.setTop(navbar);
        root.setCenter(pages.get("config"));

        Scene scene = new Scene(root, 1000, 650);
        scene.getStylesheets().add(getClass().getResource("/gui/styles.css").toExternalForm());

        stage.setTitle("Simulador de Sistema Operativo");
        stage.setScene(scene);
        stage.show();
    }

    private void crearPaginas(Stage stage) {
        pages.put("config", new ConfigPage(stage));
        pages.put("dashboard", new DashboardPage());
        pages.put("resultados", new ResultadosPage());
    }

    private HBox crearNavbar() {
        HBox navbar = new HBox(16);
        navbar.getStyleClass().add("navbar");

        Label title = new Label("Sistema Operativo");
        title.getStyleClass().add("navbar-title");

        Button configBtn = crearNavButton("Configuración", "config");
        Button dashboardBtn = crearNavButton("Dashboard", "dashboard");
        Button resultsBtn = crearNavButton("Resultados", "resultados");

        navbar.getChildren().addAll(title, configBtn, dashboardBtn, resultsBtn);

        activarBoton("config");
        return navbar;
    }

    private Button crearNavButton(String text, String pageKey) {
        Button button = new Button(text);
        button.getStyleClass().add("nav-button");
        button.setOnAction(e -> switchPage(pageKey));
        navButtons.put(pageKey, button);
        return button;
    }

    private void activarBoton(String activeKey) {
        navButtons.forEach((key, button) -> {
            button.getStyleClass().remove("nav-button-active");

            if (key.equals(activeKey)) {
                button.getStyleClass().add("nav-button-active");
            }
        });
    }

    private void switchPage(String key) {
        BorderPane root = (BorderPane) navButtons
                .values().iterator().next()
                .getScene().getRoot();

        root.setCenter(pages.get(key));
        activarBoton(key);
    }

    public static void main(String[] args) {
        launch(args);
    }
=======
    BorderPane root = new BorderPane();
    root.setPadding(new Insets(16));
    root.getStyleClass().add("app-root");

    setupPages(stage);
    HBox navbar = createNavbar();

    root.setTop(navbar);
    root.setCenter(pages.get("config"));

    Scene scene = new Scene(root, 1100, 720);
    String themePath = MainFX.class.getResource("/gui/theme.css").toExternalForm();
    scene.getStylesheets().add(themePath);
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
    HBox navbar = new HBox(12);
    navbar.setAlignment(Pos.CENTER_LEFT);
    navbar.setPadding(new Insets(14, 16, 14, 16));
    navbar.getStyleClass().add("navbar");

    Label brand = new Label("OS Simulator");
    brand.getStyleClass().add("brand");

    Button configBtn = createNavButton("Configuración", "config");
    Button dashboardBtn = createNavButton("Dashboard", "dashboard");
    Button resultsBtn = createNavButton("Resultados", "results");
    Button settingsBtn = createNavButton("Ajustes", "settings");

    HBox navButtonsRow = new HBox(8, configBtn, dashboardBtn, resultsBtn, settingsBtn);
    navButtonsRow.setAlignment(Pos.CENTER_LEFT);

    navbar.getChildren().addAll(brand, navButtonsRow);
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
    if (page != null && !navButtons.isEmpty()) {
      BorderPane root = (BorderPane) navButtons.values().iterator().next().getScene().getRoot();
      root.setCenter(page);
      highlightButton(pageKey);
    }
  }

  private void highlightButton(String activeKey) {
    navButtons.forEach((key, btn) -> {
      if (key.equals(activeKey)) {
        if (!btn.getStyleClass().contains("nav-button-active")) {
          btn.getStyleClass().add("nav-button-active");
        }
      } else {
        btn.getStyleClass().remove("nav-button-active");
      }
    });
  }

  public static void main(String[] args) {
    launch(args);
  }
>>>>>>> 3a53690cd5398857e5b463b6c0bfe923aca43fb8
}
