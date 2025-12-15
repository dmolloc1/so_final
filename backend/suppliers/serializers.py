from rest_framework import serializers
from .models import Supplier
import re

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields =[
            'provCod',
            'provRuc',
            'provRazSocial',
            'provDirec',
            'provTele',
            'provEmail',
            'provCiu',
            'provEstado',

        ]
        read_only_fields = ['provCod']

    def validate_provRuc(self, value):
        value = value.strip()
        
        # Comprobar si tiene exactamente 11 dígitos
        if not re.match(r'^\d{11}$', value):
            raise serializers.ValidationError(
                "El RUC debe tener exactamente 11 dígitos numéricos"
            )
        
        # Verificar unicidad al crear
        if not self.instance:
            if Supplier.objects.filter(provRuc=value).exists():
                raise serializers.ValidationError(
                    "Ya existe un proveedor con este RUC"
                )
        # Verificar unicidad en la actualización
        else:
            if Supplier.objects.filter(provRuc=value).exclude(
                provCod=self.instance.provCod
            ).exists():
                raise serializers.ValidationError(
                    "Ya existe un proveedor con este RUC"
                )
        
        return value
    
    def validate_provTele(self, value):
        value = value.strip()
        
        # Comprobar si tiene exactamente 9 dígitos
        if not re.match(r'^\d{9}$', value):
            raise serializers.ValidationError(
                "El número de teléfono debe tener exactamente 9 dígitos numéricos"
            )
        
        return value
    
    def validate_provRazSocial(self, value):
        value = ' '.join(value.split())
        #corregir la longitud del minimo
        if len(value) < 3:
            raise serializers.ValidationError(
                "Business name must be at least 3 characters long"
            )
        
        if len(value) > 255:
            raise serializers.ValidationError(
                "Business name cannot exceed 255 characters"
            )
        
        return value
    
    def validate_provEmail(self, value):
        value = value.strip().lower()
        
        # Validación básica de expresiones regulares para correo electrónicoBasic email regex validation
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError(
                "Ingrese una dirección de correo electrónico válida"
            )
        
        return value
    
    def validate_provDirec(self, value):
        value = value.strip()
        #corregir minimo de longitud 
        if len(value) < 5:
            raise serializers.ValidationError(
                "La dirección debe tener al menos 5 caracteres"
            )
        
        return value
    
    def validate_provCiu(self, value):
        value = value.strip()
        #corregir minimo de longitud 
        if len(value) < 2:
            raise serializers.ValidationError(
                "El nombre de la ciudad debe tener al menos 2 caracteres"
            )
        
        return value
    
    def validate_provEstado(self, value):
        valid_statuses = ['Active', 'Inactive']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"El estado debe ser uno de los siguientes: {', '.join(valid_statuses)}"
            )
        
        return value
    

class SupplierListSerializer(serializers.ModelSerializer):
    #Serializador simplificado para listar proveedores
    class Meta:
        model = Supplier
        fields = [
            'provCod',
            'provRuc',
            'provRazSocial',
            'provDirec',
            'provTele',
            'provEmail',
            'provCiu',
            'provEstado',
        ]