package prototype;

public interface IPrototype<T> {
    T clone();
    T deepClone();
}
