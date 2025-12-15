from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Supplier
from .serializers import SupplierSerializer
from .serializers import SupplierListSerializer
from rest_framework.permissions import IsAuthenticated


class SupplierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    """
    ViewSet para operaciones CRUD en Proveedores.
    Endpoints automáticos:
    - GET /api/suppliers/ - Listar todos los proveedores
    - POST /api/suppliers/ - Crear nuevo proveedor
    - GET /api/suppliers/{id}/ - Recuperar un proveedor
    - PUT /api/suppliers/{id}/ - Actualización completa
    - DELETE /api/suppliers/{id}/ - Eliminar proveedor
    """
    
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    
    # Definimos el serializador para la acción de listar proveedores
    def get_serializer_class(self):
        """
        Usamos un serializador simplificado para la lista y el completo para el detalle.
        """
        if self.action == 'list':
            return SupplierListSerializer  # Asegúrate de tener un serializador simplificado para la lista
        return SupplierSerializer

    # Método para la lista de proveedores (GET /api/suppliers/)
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    # Método para la creación de un proveedor (POST /api/suppliers/)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {
                    'success': True,
                    'message': 'Proveedor creado exitosamente',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                'success': False,
                'message': 'No se logró crear un proveedor',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Método para la actualización de un proveedor (PUT /api/suppliers/{id}/)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(
                {
                    'success': True,
                    'message': 'Proveedor actualizado correctamente',
                    'data': serializer.data
                }
            )
        
        return Response(
            {
                'success': False,
                'message': 'No se actualizó la información del proveedor',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Método para eliminar un proveedor (DELETE /api/suppliers/{id}/)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        business_name = instance.provRazSocial
        self.perform_destroy(instance)
        
        return Response(
            {
                'success': True,
                'message': f'El proveedor "{business_name}" se eliminó correctamente'
            },
            status=status.HTTP_200_OK
        )
