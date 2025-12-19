from rest_framework import serializers
from .models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    cli_cod = serializers.IntegerField(source='cliCod', read_only=True)
    cli_tipo_doc = serializers.CharField(source='cliTipoDoc')
    cli_dni = serializers.CharField(source='cliNumDoc')
    cli_nombre = serializers.CharField(source='cliNombre')
    cli_apellido = serializers.CharField(source='cliApellido')
    cli_direccion = serializers.CharField(source='cliDirec')
    cli_telefono = serializers.CharField(source='cliTelef')
    cli_email = serializers.EmailField(source='cliEmail')        
    cli_fecha_nac = serializers.DateField(
        source='cliFechaNac',
        required=False,
        allow_null=True
    )
    cli_ciudad = serializers.IntegerField(source='sucurCod', read_only=True)
    class Meta:
        model = Cliente
        fields = [
            'cli_cod', 'cli_tipo_doc', 'cli_dni', 'cli_nombre', 'cli_apellido',
            'cli_direccion', 'cli_telefono', 'cli_email', 'cli_fecha_nac', 'cli_ciudad'
        ]