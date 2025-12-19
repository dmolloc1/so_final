from rest_framework import viewsets, status, filters
from rest_framework.response import Response

from .models import Cliente
from .serializers import ClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('cliNombre', 'cliApellido')
    serializer_class = ClienteSerializer
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['cliNombre', 'cliApellido', 'cliNumDoc', 'cliEmail']
    

    def get_queryset(self):
        queryset = super().get_queryset()
        tipo_doc = self.request.query_params.get('tipo_doc')

        if tipo_doc in dict(Cliente.TIPO_DOCUMENTO_CHOICES):
            queryset = queryset.filter(cliTipoDoc=tipo_doc)

        return queryset
    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(sucurCod=user.sucurCod)

    def perform_update(self, serializer):
        user = self.request.user
        serializer.save(sucurCod=user.sucurCod)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response({'success': True, 'data': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})
