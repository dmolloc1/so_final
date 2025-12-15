from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from .models import User, Role,OptometraUser

from Branch.models import Branch

# Serializer para leer roles (devuelve objetos completos)
class RoleSerializer(serializers.ModelSerializer):
    rolCod = serializers.IntegerField(source='id', read_only=True)
    
    class Meta:
        model = Role
        fields = ['rolCod', 'rolNom', 'rolDes', 'rolEstado', 'rolNivel']

class OptometraUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptometraUser
        fields = ['optCargo', 'optCMP', 'optRNE']

# Serializer para crear/actualizar usuarios
class UserSerializer(serializers.ModelSerializer):
    usuContra = serializers.CharField(write_only=True)
    optometra = OptometraUserSerializer(required=False)

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
            'optometra', 
        ]

    def create(self, validated_data):
        roles_data = validated_data.pop('roles', [])
        optometra_data = validated_data.pop('optometra', None)
        password = validated_data.pop('usuContra')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Si hay datos de optometra, creamos el perfil de optometra
        if optometra_data:
            OptometraUser.objects.create(
                user=user,
                **optometra_data
            )

        # Asignar los roles
        if user.is_staff or getattr(user, 'is_superuser', False):
            todos_roles = Role.objects.all()
            user.roles.set(todos_roles)
        else:
            user.roles.set(roles_data)

        return user

    def update(self, instance, validated_data):
        roles_data = validated_data.pop('roles', None)
        optometra_data = validated_data.pop('optometra', None)
        password = validated_data.pop('usuContra', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if optometra_data is not None:
            try:
                optometra = instance.optometra
                for attr, value in optometra_data.items():
                    setattr(optometra, attr, value)
                optometra.save()
            except ObjectDoesNotExist:
                OptometraUser.objects.create(user=instance, **optometra_data)

        # Actualización de roles
        if instance.is_staff or getattr(instance, 'is_superuser', False):
            instance.roles.set(Role.objects.all())
        elif roles_data is not None:
            instance.roles.set(roles_data)

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['roles'] = RoleSerializer(instance.roles.all(), many=True).data
        
        # Agregar los datos de optometra si existen
        try:
            representation['optometra'] = OptometraUserSerializer(instance.optometra).data
        except ObjectDoesNotExist:
            representation['optometra'] = None
        return representation

class CurrentUserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    password = serializers.CharField(default='', read_only=True)  # Frontend lo requiere vacío
    sucursal = serializers.SerializerMethodField()
    optometra = serializers.SerializerMethodField()

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

    def get_optometra(self, obj):
        try:
            return OptometraUserSerializer(obj.optometra).data
        except ObjectDoesNotExist:
            return None

