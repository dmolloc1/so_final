package prototype;

import java.util.ArrayList;
import java.util.List;

public class Dragon extends BaseEnemy {
    private List<Treasure> treasureHoard;

    public Dragon(String name, int positionX, int positionY, int health, int attackDamage, List<Treasure> treasureHoard) {
        super(name, positionX, positionY, health, attackDamage);
        this.treasureHoard = treasureHoard;
    }

    private Dragon(Dragon other, boolean deep) {
        super(other);
        if (deep) {
            this.treasureHoard = new ArrayList<>();
            for (Treasure treasure : other.treasureHoard) {
                this.treasureHoard.add(treasure.clone());
            }
        } else {
            this.treasureHoard = other.treasureHoard;
        }
    }

    public List<Treasure> getTreasureHoard() {
        return treasureHoard;
    }

    @Override
    public Dragon clone() {
        return new Dragon(this, false);
    }

    @Override
    public Dragon deepClone() {
        return new Dragon(this, true);
    }

    @Override
    public String toString() {
        return "Dragón " + getName() + " protegiendo " + treasureHoard + " en " + describePosition();
    }
}
