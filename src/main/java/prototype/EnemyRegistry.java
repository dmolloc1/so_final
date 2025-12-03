package prototype;

import java.util.HashMap;
import java.util.Map;

public class EnemyRegistry {
    private Map<String, Enemy> prototypes = new HashMap<>();

    public void addPrototype(String key, Enemy enemy) {
        prototypes.put(key, enemy);
    }

    public Enemy getPrototype(String key) {
        Enemy prototype = prototypes.get(key);
        if (prototype == null) {
            throw new IllegalArgumentException("No existe un prototipo para la clave: " + key);
        }
        return prototype;
    }

    public Enemy createEnemy(String key, boolean deepClone) {
        Enemy prototype = getPrototype(key);
        return deepClone ? prototype.deepClone() : prototype.clone();
    }
}
