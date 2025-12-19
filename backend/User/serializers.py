from rest_framework import serializers
from .models import User, Role, OptometraUser
from Branch.models import Branch

# Serializer para leer roles (devuelve objetos completos)
class RoleSerializer(serializers.ModelSerializer):
    rolCod = serializers.IntegerField(source='id', read_only=True)
    
    class Meta:
        model = Role
        fields = ['rolCod', 'rolNom', 'rolDes', 'rolEstado', 'rolNivel']

# Serializer para crear/actualizar usuarios
class UserSerializer(serializers.ModelSerializer):
    usuContra = serializers.CharField(write_only=True)
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        required=False
    )

    sucurCod = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'usuCod',
            'usuNom',
            'usuEmail',
            'usuTel',
            'usuNombreCom',
            'usuDNI',
            'usuContra',
            'usuEstado',
            'roles',
            'sucurCod',
        ]

    def create(self, validated_data):
        roles_data = validated_data.pop('roles', [])
        password = validated_data.pop('usuContra')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if user.is_staff or getattr(user, 'is_superuser', False):
            todos_roles = Role.objects.all()
            user.roles.set(todos_roles)
        else:
            user.roles.set(roles_data)

        return user

    def update(self, instance, validated_data):
        roles_data = validated_data.pop('roles', None)
        password = validated_data.pop('usuContra', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if instance.is_staff or getattr(instance, 'is_superuser', False):
            instance.roles.set(Role.objects.all())
        elif roles_data is not None:
            instance.roles.set(roles_data)

        return instance

    # Sobrescribe to_representation para devolver roles completos
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Reemplaza los IDs de roles con objetos completos
        representation['roles'] = RoleSerializer(instance.roles.all(), many=True).data
        return representation

# Serializer específico para el usuario actual (opcional pero recomendado)
class CurrentUserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    password = serializers.CharField(default='', read_only=True)  # Frontend lo requiere vacío
    sucursal = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'usuCod',
            'usuNom',
            'usuEmail',
            'usuTel',
            'usuNombreCom',
            'usuDNI',
            'password',
            'usuEstado',
            'roles',
            'sucurCod',
            'sucursal',
            'optometra',
        ]
    
    def get_sucursal(self, obj):
        if obj.sucurCod:
            return {
                'sucurCod': obj.sucurCod.sucurCod,
                'sucurNom': obj.sucurCod.sucurNom,
            }
        return None

class OptometraUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptometraUser
        fields = ['user', 'optCargo', 'optCMP', 'optRNE']

    def validate_user(self, value):
        if not value.roles.filter(rolNom='OPTOMETRA').exists():
            raise serializers.ValidationError(
                "El usuario no tiene el rol OPTOMETRA"
            )

        if hasattr(value, 'optometra'):
            raise serializers.ValidationError(
                "Este usuario ya tiene un perfil de optómetra"
            )

        return value
