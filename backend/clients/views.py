from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Cliente
from .serializers import ClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    # Definimos el queryset base y el ordenamiento
    queryset = Cliente.objects.all().order_by('cliNombre', 'cliApellido')
    serializer_class = ClienteSerializer
    
    # Habilitamos campos de búsqueda para que el frontend (?search=juan) funcione
    search_fields = ['cliNombre', 'cliApellido', 'cliNumDoc', 'cliEmail'] 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Respondemos con la estructura { success: true, data: ... } que espera tu frontend
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'data': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        # Filtramos (Búsqueda)
        queryset = self.filter_queryset(self.get_queryset())
        
        # Paginamos
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Si no hay paginación, devolvemos todo
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})