package prototype;

public abstract class Enemy implements IPrototype<Enemy> {
    private String name;
    private int positionX;
    private int positionY;

    protected Enemy(String name, int positionX, int positionY) {
        this.name = name;
        this.positionX = positionX;
        this.positionY = positionY;
    }

    protected Enemy(Enemy other) {
        this.name = other.name;
        this.positionX = other.positionX;
        this.positionY = other.positionY;
    }

    public String getName() {
        return name;
    }

    public int getPositionX() {
        return positionX;
    }

    public int getPositionY() {
        return positionY;
    }

    public void setPosition(int x, int y) {
        this.positionX = x;
        this.positionY = y;
    }

    public String describePosition() {
        return "(" + positionX + ", " + positionY + ")";
    }

    @Override
    public abstract Enemy clone();

    @Override
    public abstract Enemy deepClone();
}
