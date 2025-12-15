from rest_framework import serializers
from .models import Cash, CashOpening

class CashSerializer(serializers.ModelSerializer):
    sucurNom = serializers.CharField(source='sucurCod.sucurNom', read_only=True)
    usuNom = serializers.CharField(source='usuCod.usuNom', read_only=True)

    class Meta:
        model = Cash
        fields = [
            'cajCod',
            'sucurCod',
            'sucurNom',
            'usuCod',
            'usuNom',
            'cajNom',
            'cajDes',
            'cajEstado',
        ]

class CashOpeningSerializer(serializers.ModelSerializer):
    cajNom = serializers.CharField(source='cajCod.cajNom', read_only=True)
    usuNom = serializers.CharField(source='usuCod.usuNom', read_only=True)

    class Meta:
        model = CashOpening
        fields = [
            'cajaAperCod',
            'cajCod',
            'cajNom',
            'usuNom',
            'cajaApertuFechHora',
            'cajaAperMontInicial',
            'cajaAperFechaHorCierre',
            'cajaAperMontCierre',
            'cajaAperMontEsperado',
            'cajaAperDiferencia',
            'cajaAperEstado',
            'cajaAperObservacio',
        ]
        read_only_fields = ['usuCod']
