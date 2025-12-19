from rest_framework import serializers
from .models import Recipe


class RecipeSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    cliente_documento = serializers.SerializerMethodField()
    cliente_tipo_doc = serializers.SerializerMethodField()
    optometra_nombre = serializers.SerializerMethodField()
    sucursal_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'recCod',
            'recFecha',
            'recTipoLente',
            'recEstado',
            'recObservaciones',
            'dpGeneral',

            'lejos_od_esf', 'lejos_od_cil', 'lejos_od_eje',
            'lejos_oi_esf', 'lejos_oi_cil', 'lejos_oi_eje',

            'cerca_od_esf', 'cerca_od_cil', 'cerca_od_eje',
            'cerca_oi_esf', 'cerca_oi_cil', 'cerca_oi_eje',

            'diagnostico',

            'cliente',
            'optometra',
            'sucurCod',

            'cliente_nombre',
            'cliente_documento',
            'cliente_tipo_doc',
            'optometra_nombre',
            'sucursal_nombre',
        ]

        read_only_fields = [
            'recCod',
            'recFecha',
            'optometra',
            'sucurCod',
        ]

    def get_cliente_nombre(self, obj):
        if obj.cliente:
            return f"{obj.cliente.cliNombre} {obj.cliente.cliApellido}"
        return None

    def get_cliente_documento(self, obj):
        return obj.cliente.cliNumDoc if obj.cliente else None

    def get_cliente_tipo_doc(self, obj):
        return obj.cliente.cliTipoDoc if obj.cliente else None

    def get_optometra_nombre(self, obj):
        if obj.optometra:
            return obj.optometra.usuNombreCom or obj.optometra.usuNom
        return None

    def get_sucursal_nombre(self, obj):
        return obj.sucurCod.sucurNom if obj.sucurCod else None


class RecipeListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    optometra_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'recCod',
            'recFecha',
            'recTipoLente',
            'recEstado',
            'cliente',
            'cliente_nombre',
            'optometra_nombre',
        ]

    def get_cliente_nombre(self, obj):
        if obj.cliente:
            return f"{obj.cliente.cliNombre} {obj.cliente.cliApellido}"
        return None

    def get_optometra_nombre(self, obj):
        if obj.optometra:
            return obj.optometra.usuNombreCom or obj.optometra.usuNom
        return None
