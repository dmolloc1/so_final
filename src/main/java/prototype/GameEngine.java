package prototype;

import java.util.Arrays;

public class GameEngine {
    public static void main(String[] args) {
        EnemyRegistry registry = new EnemyRegistry();

        Dragon fireDragon = new Dragon(
                "Igneel",
                10,
                5,
                300,
                50,
                Arrays.asList(new Treasure("Cetro", 500), new Treasure("Corona", 250))
        );

        Goblin caveGoblin = new Goblin(
                "Gruñón",
                2,
                3,
                40,
                8,
                "Daga"
        );

        registry.addPrototype("dragon", fireDragon);
        registry.addPrototype("goblin", caveGoblin);

        Enemy goblinCopia = registry.createEnemy("goblin", false);
        goblinCopia.setPosition(4, 6);

        Enemy dragonProfundo = registry.createEnemy("dragon", true);
        dragonProfundo.setPosition(12, 9);

        System.out.println("Prototipos iniciales:");
        System.out.println(" - " + caveGoblin);
        System.out.println(" - " + fireDragon);

        System.out.println("\nClones generados:");
        System.out.println(" - " + goblinCopia + " -> " + ((BaseEnemy) goblinCopia).attack());
        System.out.println(" - " + dragonProfundo + " -> " + ((BaseEnemy) dragonProfundo).attack());

        System.out.println("\nVerificación de clonado profundo del tesoro:");
        Dragon originalDragon = (Dragon) fireDragon;
        Dragon clonedDragon = (Dragon) dragonProfundo;
        System.out.println("Horda original == Horda clonada? " + (originalDragon.getTreasureHoard() == clonedDragon.getTreasureHoard()));
    }
}
