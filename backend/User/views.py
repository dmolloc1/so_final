from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from .models import User
from .serializers import UserSerializer, CurrentUserSerializer, CustomTokenObtainPairSerializer
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
from .permissions import Nivel1Permission
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('usuCod')
    serializer_class = UserSerializer


# LOGIN API no se usa
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    usuNom = request.data.get('usuNom')
    usuContra = request.data.get('usuContra')

    user = authenticate(username=usuNom, password=usuContra)
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response({
            "message": f"Bienvenido {user.usuNom}",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

# LOGOUT API no se usa
@api_view(['POST'])
def logout_user(request):
    logout(request)
    return Response({"message": "Sesión cerrada correctamente"}, status=status.HTTP_200_OK)

# Crear Usuario
@api_view(['POST'])
@permission_classes([AllowAny])
def new_Usuario(request):

    haveRegisters = User.objects.exists();
    if haveRegisters and not request.user.is_authenticated:
        return Response(
            {"error": "No tienes permiso para crear usuarios"},
            status=status.HTTP_403_FORBIDDEN
        )

    data = request.data.copy()
    serializer = UserSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Listar usuarios CON FILTRO POR SUCURSAL TESTADA FUNCIONAL
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    user = request.user
    
    # Verificar si el usuario es gerente (nivel 0) manager es gerente
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    # Obtener parámetro de sucursal de la query
    branch_param = request.query_params.get('branch')
    
    # Iniciar queryset
    users = User.objects.all().order_by('usuCod') ##Aca si el gerente en el front no le devuelve branch le pasa todas
    
    # FILTRAR SEGÚN EL TIPO DE USUARIO
    if is_manager:
        # GERENTE: Puede ver todas las sucursales o filtrar por una específica
        if branch_param:
            # Si el gerente tiene una sucursal asignada, filtrar por ella
            users = users.filter(sucurCod=branch_param)
        # Si no hay branch_param, muestra TODOS (vista central)
    else:
        # NO GERENTE: Solo puede ver usuarios de su sucursal
        if user.sucurCod:
            users = users.filter(sucurCod=user.sucurCod)
    
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

#Nueva vista cajeros pero solo para cajas
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_cashier_users(request):
    user = request.user
    is_manager = user.roles.filter(rolNivel=0).exists()
    is_supervisor = user.roles.filter(rolNom="SUPERVISOR").exists()

    # Solo GERENTE o SUPERVISOR pueden acceder
    if not (is_manager or is_supervisor):
        return Response({"detail": "No tienes permiso para ver esta lista."}, status=status.HTTP_403_FORBIDDEN)

    # Base queryset: solo usuarios con rol CAJERO
    users = User.objects.filter(roles__rolNom="CAJERO").order_by('usuCod')

    # Si tiene sucursal asignada, filtrar por ella
    if user.sucurCod:
        users = users.filter(sucurCod=user.sucurCod)
    else:
        # Solo GERENTE sin sucursal puede ver todos
        if not is_manager:
            return Response({"detail": "No tienes una sucursal asignada."}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# Obtener usuario por ID
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, usuCod):
    try:
        user = User.objects.get(usuCod=usuCod)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_authenticated: 
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)


# Editar usuario
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request, usuCod):
    try:
        user = User.objects.get(usuCod=usuCod)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_authenticated:
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()

        # Asignar roles si vienen en la petición
        data = request.data
        roles_ids = data.get('roles', [])
        if roles_ids:
            user.roles.set(roles_ids)
        user.save()

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Cambiar contraseña
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_password(request, usuCod):
    try:
        user = User.objects.get(usuCod=usuCod)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_authenticated :
        return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)

    new_password = request.data.get("new_password")
    if not new_password:
        return Response({"error": "Nueva contraseña requerida"}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Contraseña actualizada correctamente"}, status=status.HTTP_200_OK)


# Eliminar usuario
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, usuCod):
    try:
        user = User.objects.get(usuCod=usuCod)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_authenticated :
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    user.delete()
    return Response({"message": "Usuario eliminado"}, status=status.HTTP_204_NO_CONTENT)


# Obtener usuario actual
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    serializer = CurrentUserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_seller_users(request):
    # Obtener la sucursal del usuario autenticado
    user_sucursal = request.user.sucurCod
    
    # Filtrar usuarios con rol VENDEDOR de la misma sucursal
    users = User.objects.filter(
        roles__rolNom="VENDEDOR",
        sucurCod=user_sucursal
    ).order_by('usuCod')

    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)