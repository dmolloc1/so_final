class EstadoPlato {
public:
    virtual ~EstadoPlato() {}

    virtual QString nombre() const = 0;

    virtual void iniciar(PlatoInstancia&) {}
    virtual void iniciarPreparacion(PlatoInstancia&) {}
    virtual void pasarAPreparando(PlatoInstancia&) {}
    virtual void terminar(PlatoInstancia&) {}
    virtual void entregar(PlatoInstancia&) {}
    virtual void devolver(PlatoInstancia&) {}
    virtual void cancelar(PlatoInstancia&) {}
};
