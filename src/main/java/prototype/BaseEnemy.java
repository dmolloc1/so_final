package prototype;

public abstract class BaseEnemy extends Enemy {
    private int health;
    private int attackDamage;

    protected BaseEnemy(String name, int positionX, int positionY, int health, int attackDamage) {
        super(name, positionX, positionY);
        this.health = health;
        this.attackDamage = attackDamage;
    }

    protected BaseEnemy(BaseEnemy other) {
        super(other);
        this.health = other.health;
        this.attackDamage = other.attackDamage;
    }

    public int getHealth() {
        return health;
    }

    public int getAttackDamage() {
        return attackDamage;
    }

    public String attack() {
        return getName() + " ataca causando " + attackDamage + " de daño.";
    }

    public void takeDamage(int amount) {
        this.health = Math.max(0, this.health - amount);
    }

    @Override
    public abstract BaseEnemy clone();

    @Override
    public abstract BaseEnemy deepClone();
}
