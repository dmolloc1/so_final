from django.shortcuts import render
from django.contrib.auth.models import User, Group
from rest_framework import viewsets, status
from .models import Branch, BranchUser
from rest_framework.response import Response
from .serializers import BranchSerializer, BranchUserSerializer
from rest_framework import status

from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes
)


@api_view(['GET'])
#@authentication_classes([TokenAuthentication])
#@permission_classes([IsAuthenticated])
def list_branches(request):
    branches = Branch.objects.all()
    serializer = BranchSerializer(branches, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
#@authentication_classes([TokenAuthentication])
#@permission_classes([IsAuthenticated])
def new_branch(request):
    serializer = BranchSerializer(data = request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_branch(request, sucurCod):
    try:
       #Verificar si existe
       branch = Branch.objects.get(sucurCod = sucurCod) 
       serializer = BranchSerializer(branch)
       return Response (serializer.data, status = status.HTTP_200_OK)
    except Branch.DoesNotExist:
        return Response({'error': 'Sucursal no encontrada'},status = status.HTTP_404_NOT_FOUND)
    

    
@api_view(['GET','PUT'])
#@authentication_classes([TokenAuthentication])
#@permission_classes([IsAuthenticated])
def update_branch(request, sucurCod):
    try:
        branch = Branch.objects.get(sucurCod=sucurCod)
    except Branch.DoesNotExist:
        return Response({'error': 'Sucursal no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    serializer = BranchSerializer(branch, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
# @authentication_classes([TokenAuthentication])
# @permission_classes([IsAuthenticated])
def delete_branch(request, sucurCod):
    try:
        branch = Branch.objects.get(sucurCod=sucurCod)
        branch.delete()
        return Response({'message': 'Sucursal eliminada correctamente'}, status=status.HTTP_204_NO_CONTENT)
    except Branch.DoesNotExist:
        return Response({'error': 'Sucursal no encontrada'}, status=status.HTTP_404_NOT_FOUND)

# BRANCHH USER
@api_view(['POST'])
def assign_user_to_branch(request):
    """
    Crea una relación entre un usuario y una sucursal.
    Ejemplo de JSON que debes enviar:
    {
        "sucurCod_id": 1,
        "usuCod_id": 3,
        "sucUsuFechAsig": "2025-11-01"
    }
    """
    serializer = BranchUserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_users_by_branch(request, sucurCod):
    """
    Devuelve todos los usuarios asignados a una sucursal.
    """
    branch_users = BranchUser.objects.filter(sucurCod_id=sucurCod)
    serializer = BranchUserSerializer(branch_users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
def remove_user_from_branch(request, sucurCod, usuCod):
    """
    Elimina la relación entre un usuario y una sucursal específica.
    """
    try:
        relation = BranchUser.objects.get(sucurCod_id=sucurCod, usuCod_id=usuCod)
        relation.delete()
        return Response({'message': 'Relación eliminada'}, status=status.HTTP_204_NO_CONTENT)
    except BranchUser.DoesNotExist:
        return Response({'error': 'No existe relación entre usuario y sucursal'}, status=status.HTTP_404_NOT_FOUND)