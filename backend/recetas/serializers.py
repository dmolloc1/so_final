# recipes/serializers.py
from rest_framework import serializers
from .models import Receta
from clients.models import Cliente
from User.models import User
from Branch.models import Branch

class RecetaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    optometra_nombre = serializers.SerializerMethodField()
    sucursal_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Receta
        fields = [
            'receCod', 'receFech', 'receEsfeD', 'receCilinD', 'receEjeD',
            'receEsfel', 'receCilinl', 'receEjel', 'receDistPupilar',
            'receTipoLent', 'receObserva', 'receRegistro', 'receEstado',
            'cliCod', 'usuCod', 'sucurCod',
            'cliente_nombre', 'optometra_nombre', 'sucursal_nombre'
        ]
        read_only_fields = ['receCod', 'receRegistro','usuCod']
    
    def get_cliente_nombre(self, obj):
        if obj.cliCod:
            return f"{obj.cliCod.cliNombre} {obj.cliCod.cliApellido}"
        return None
    
    def get_optometra_nombre(self, obj):
        if obj.usuCod:
            return obj.usuCod.usuNombreCom
        return None
    
    def get_sucursal_nombre(self, obj):
        if obj.sucurCod:
            return obj.sucurCod.sucurNom  
        return None

class RecetaListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    optometra_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Receta
        fields = [
            'receCod', 'receFech', 'receTipoLent', 'receEstado',
            'cliCod', 'cliente_nombre', 'optometra_nombre'
        ]
    
    def get_cliente_nombre(self, obj):
        if obj.cliCod:
            return f"{obj.cliCod.cliNombre} {obj.cliCod.cliApellido}"
        return None
    
    def get_optometra_nombre(self, obj):
        if obj.usuCod:
            return obj.usuCod.usuNombreCom
        return None
    
    
