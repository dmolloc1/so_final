from rest_framework import serializers
from .models import Branch, BranchUser
from User.serializers import UserSerializer
from User.models import User

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

class BranchUserSerializer(serializers.ModelSerializer):
    sucurCod = BranchSerializer(read_only=True)
    usuCod = UserSerializer(read_only=True)

    sucurCod_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='sucurCod', write_only=True
    )
    usuCod_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='usuCod', write_only=True
    )

    class Meta:
        model = BranchUser
        fields = [
            'sucUsuCod',
            'sucurCod', 'usuCod',
            'sucurCod_id', 'usuCod_id',
            'sucUsuFechAsig'
        ]