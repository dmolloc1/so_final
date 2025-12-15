from django.contrib import admin
from .models import Cliente
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('cliCod', 'cliNumDoc', 'cliNombre', 'cliApellido','cliRazSocial', 'cliDirec', 'cliTelef', 'cliEmail', 'cliFechaNac')
    search_fields = ('cliNombre', 'cliApellido', 'cliRazSocial', 'cliNumDoc', 'cliEmail')
    ordering = ('cliNombre', 'cliApellido')