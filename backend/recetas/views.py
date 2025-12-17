from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Receta
from .serializers import RecetaSerializer, RecetaListSerializer
from rest_framework.permissions import IsAuthenticated
from User.permissions import Nivel4Permission as IsOptometra

class RecetaViewSet(viewsets.ModelViewSet):
    queryset = Receta.objects.all().select_related('cliCod', 'usuCod', 'sucurCod')
    serializer_class = RecetaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    search_fields = [
        'receCod',
        'cliCod__cliNombre',
        'cliCod__cliApellido',
        'cliCod__cliNumDoc',
        'usuCod__first_name',
        'usuCod__last_name',
        'receTipoLent',
        'sucurCod__sucurNom',
    ]
    
    filterset_fields = ['receEstado', 'receTipoLent', 'cliCod', 'usuCod', 'sucurCod']

    ordering_fields = ['receFech', 'receCod', 'receEstado']
    ordering = ['-receFech'] 
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RecetaListSerializer
        return RecetaSerializer
    
    permission_classes = [IsAuthenticated, IsOptometra]

    def perform_create(self, serializer):
        sucur = serializer.validated_data.get('sucurCod') or getattr(self.request.user, 'sucurCod', None)
        serializer.save(usuCod=self.request.user, sucurCod=sucur)
