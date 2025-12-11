package prototype;

public class Treasure implements Cloneable {
    private String name;
    private int value;

    public Treasure(String name, int value) {
        this.name = name;
        this.value = value;
    }

    public Treasure(Treasure other) {
        this.name = other.name;
        this.value = other.value;
    }

    public String getName() {
        return name;
    }

    public int getValue() {
        return value;
    }

    @Override
    public Treasure clone() {
        return new Treasure(this);
    }

    @Override
    public String toString() {
        return name + " (" + value + " oro)";
    }
}
