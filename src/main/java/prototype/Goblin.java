package prototype;

public class Goblin extends BaseEnemy {
    private String weapon;

    public Goblin(String name, int positionX, int positionY, int health, int attackDamage, String weapon) {
        super(name, positionX, positionY, health, attackDamage);
        this.weapon = weapon;
    }

    private Goblin(Goblin other) {
        super(other);
        this.weapon = other.weapon;
    }

    public String getWeapon() {
        return weapon;
    }

    @Override
    public Goblin clone() {
        return new Goblin(this);
    }

    @Override
    public Goblin deepClone() {
        return new Goblin(this);
    }

    @Override
    public String toString() {
        return "Goblin " + getName() + " con arma " + weapon + " en " + describePosition();
    }
}
