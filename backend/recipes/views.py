from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated

from .models import Recipe
from .serializers import RecipeSerializer, RecipeListSerializer
from User.permissions import Nivel4Permission as IsOptometra


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = (
        Recipe.objects
        .all()
        .select_related('cliente', 'optometra', 'sucurCod')
    )

    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated, IsOptometra]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        'cliente__cliNombre',
        'cliente__cliApellido',
        'cliente__cliNumDoc',
        'cliente__cliTipoDoc',
        'optometra__usuNombreCom',
        'optometra__usuNom',
        'recTipoLente',
    ]

    filterset_fields = [
        'recEstado',
        'recTipoLente',
        'cliente',
        'optometra',
        'sucurCod',
    ]

    ordering_fields = ['recFecha', 'recCod', 'recEstado']
    ordering = ['-recFecha']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar por sucursal (branch o sucurCod)
        branch = (
            self.request.query_params.get('branch')
            or self.request.query_params.get('sucurCod')
        )
        if branch:
            queryset = queryset.filter(sucurCod_id=branch)

        # Filtrar por cliente
        cliente_id = (
            self.request.query_params.get('cliente')
            or self.request.query_params.get('cliCod')
        )
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        return RecipeSerializer

    def perform_create(self, serializer):
        """
        - Optómetra: usuario autenticado
        - Sucursal: la enviada o la del usuario
        """
        user = self.request.user
        sucur = (
            serializer.validated_data.get('sucurCod')
            or getattr(user, 'sucurCod', None)
        )

        serializer.save(
            optometra=user,
            sucurCod=sucur
        )
